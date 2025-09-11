import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { db, storage } from '../../config/firebase'
import { supabase } from '../../config/supabase'

// type ReportType = 'lost' | 'found' | 'abuse'

export interface BaseContactInfo {
	contactName: string
	contactPhone: string
	contactEmail: string
}

export interface LostReportData extends BaseContactInfo {
	type: 'lost'
	animalType: string
	animalName: string
	breed?: string
	colors?: string | string[]
	age?: string
	gender?: string
	size?: string
	lastSeenLocation: string
	lastSeenDate?: string
	lastSeenTime?: string
	additionalDetails?: string
}

export interface FoundReportData extends BaseContactInfo {
	type: 'found'
	animalType: string
	breed?: string
	colors?: string | string[]
	estimatedAge?: string
	gender?: string
	size?: string
	wearing?: string
	condition?: string
	foundLocation: string
	foundDate?: string
	foundTime?: string
	additionalDetails?: string
}

export type SubmitReportData = LostReportData | FoundReportData

async function uploadImage(file: File, userId: string | null): Promise<string> {
	const PROVIDER = ((import.meta.env.VITE_UPLOAD_PROVIDER as string | undefined) || 'imgur').toLowerCase()
	const CLOUDINARY_CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME as string | undefined
	const CLOUDINARY_UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET as string | undefined
	const IMGUR_CLIENT_ID = import.meta.env.VITE_IMGUR_CLIENT_ID as string | undefined

	switch (PROVIDER) {
		case 'supabase': {
			if (!supabase) {
				throw new Error('Supabase not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
			}
			const bucket = 'report-uploads'
			const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
			const ext = safeName.includes('.') ? safeName.split('.').pop() : 'bin'
			const key = `${userId || 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
			const { error: uploadError } = await supabase.storage.from(bucket).upload(key, file, {
				cacheControl: '3600',
				contentType: file.type,
				upsert: false
			})
			if (uploadError) {
				throw new Error(`Upload failed: ${uploadError.message}`)
			}
			// Return the object key; keep private until admin approval
			return key
		}
		case 'imgur': {
			if (!IMGUR_CLIENT_ID) {
				throw new Error('Imgur not configured: set VITE_IMGUR_CLIENT_ID in .env')
			}
			// Imgur has a practical 10MB limit for anonymous uploads; enforce early
			if (file.size > 10 * 1024 * 1024) {
				throw new Error('Image too large for Imgur (max ~10MB). Please use a smaller image.')
			}
			const formData = new FormData()
			formData.append('image', file)
			const res = await fetch('https://api.imgur.com/3/image', {
				method: 'POST',
				headers: { Authorization: `Client-ID ${IMGUR_CLIENT_ID}` },
				body: formData
			})
			const json = await res.json() as { data?: { link?: string }; success?: boolean; status?: number; errors?: any }
			if (!res.ok || json?.success === false) {
				const detail = (json as any)?.data?.error || (json as any)?.errors || `HTTP ${res.status}`
				throw new Error(`Imgur upload failed: ${typeof detail === 'string' ? detail : JSON.stringify(detail)}`)
			}
			return json?.data?.link || ''
		}
		case 'cloudinary': {
			if (!CLOUDINARY_CLOUD_NAME || !CLOUDINARY_UPLOAD_PRESET) {
				throw new Error('Cloudinary not configured: set VITE_CLOUDINARY_CLOUD_NAME and VITE_CLOUDINARY_UPLOAD_PRESET in .env')
			}
			const formData = new FormData()
			formData.append('file', file)
			formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
			const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/upload`, {
				method: 'POST',
				body: formData
			})
			if (!res.ok) {
				throw new Error('Cloudinary upload failed')
			}
			const json = await res.json() as { secure_url?: string; url?: string }
			return json.secure_url || json.url || ''
		}
		case 'firebase': {
			if (!storage) {
				throw new Error('Firebase Storage not available')
			}
			const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
			const storageRef = ref(storage, `reports/${Date.now()}-${safeName}`)
			await uploadBytes(storageRef, file, { contentType: file.type })
			return await getDownloadURL(storageRef)
		}
		default:
			throw new Error('Unknown VITE_UPLOAD_PROVIDER. Use "imgur", "cloudinary", or "firebase"')
	}
}

function omitUndefinedDeep(value: any): any {
	if (Array.isArray(value)) {
		return value.map(omitUndefinedDeep)
	}
	if (value && typeof value === 'object') {
		const result: Record<string, any> = {}
		for (const [k, v] of Object.entries(value)) {
			if (v !== undefined) {
				result[k] = omitUndefinedDeep(v)
			}
		}
		return result
	}
	return value
}

export async function submitReport(data: SubmitReportData, file: File | null, userId: string | null): Promise<string> {
	if (!db) {
		throw new Error('Firebase Firestore not initialized')
	}

	let uploadObjectKey: string | undefined
	if (file) {
		uploadObjectKey = await uploadImage(file, userId)
	}

	const basePayload = {
		contactName: data.contactName,
		contactPhone: data.contactPhone,
		contactEmail: data.contactEmail,
		additionalDetails: data.additionalDetails || undefined,
		uploadObjectKey: uploadObjectKey || undefined,
		status: 'open' as const,
		createdAt: serverTimestamp(),
		createdBy: userId || null
	}

	let payload: Record<string, unknown>
	if (data.type === 'lost') {
		payload = {
			type: 'lost',
			animalType: data.animalType,
			animalName: data.animalName,
			breed: data.breed || undefined,
			colors: Array.isArray(data.colors) ? data.colors : (data.colors ? [data.colors] : []),
			age: data.age || undefined,
			gender: data.gender || 'unknown',
			size: data.size || undefined,
			lastSeenLocation: data.lastSeenLocation,
			lastSeenDate: data.lastSeenDate || undefined,
			lastSeenTime: data.lastSeenTime || undefined,
			...basePayload
		}
	} else {
		payload = {
			type: 'found',
			animalType: data.animalType,
			breed: data.breed || undefined,
			colors: Array.isArray(data.colors) ? data.colors : (data.colors ? [data.colors] : []),
			estimatedAge: data.estimatedAge || undefined,
			gender: data.gender || 'unknown',
			size: data.size || undefined,
			wearing: data.wearing || undefined,
			condition: data.condition || undefined,
			foundLocation: data.foundLocation,
			foundDate: data.foundDate || undefined,
			foundTime: data.foundTime || undefined,
			...basePayload
		}
	}

	const cleaned = omitUndefinedDeep(payload)
	const docRef = await addDoc(collection(db, 'reports'), cleaned)
	return docRef.id
}


