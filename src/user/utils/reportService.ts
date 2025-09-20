import { collection, addDoc, serverTimestamp, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
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
	lastSeenLocation: string
	lastSeenDate?: string
	lastSeenTime?: string
	additionalDetails?: string
}

export interface FoundReportData extends BaseContactInfo {
	type: 'found'
	animalType: string
	animalName?: string
	breed?: string
	colors?: string | string[]
	estimatedAge?: string
	gender?: string
	foundLocation: string
	foundDate?: string
	foundTime?: string
	additionalDetails?: string
}

export type SubmitReportData = LostReportData | FoundReportData

async function uploadImage(file: File, userId: string | null): Promise<string> {
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
	return key
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

	// Add a unique submission ID to prevent duplicates
	const submissionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

	// 1. Prepare the payload WITHOUT the image key
	const basePayload = {
		contactName: data.contactName,
		contactPhone: data.contactPhone,
		contactEmail: data.contactEmail,
		additionalDetails: data.additionalDetails || undefined,
		status: 'open' as const,
		createdAt: serverTimestamp(),
		createdBy: userId || null,
		submissionId // Add unique identifier
	}

	let payload: Record<string, unknown>
	let collectionName = 'reports'
	if (data.type === 'lost') {
		payload = {
			type: 'lost',
			animalType: data.animalType,
			animalName: data.animalName,
			breed: data.breed || undefined,
			colors: Array.isArray(data.colors) ? data.colors : (data.colors ? [data.colors] : []),
			age: data.age || undefined,
			gender: data.gender || 'unknown',
			lastSeenLocation: data.lastSeenLocation,
			lastSeenDate: data.lastSeenDate || undefined,
			lastSeenTime: data.lastSeenTime || undefined,
			...basePayload
		}
		collectionName = 'lost'
	} else if (data.type === 'found') {
		payload = {
			type: 'found',
			animalType: data.animalType,
			animalName: data.animalName || undefined,
			breed: data.breed || undefined,
			colors: Array.isArray(data.colors) ? data.colors : (data.colors ? [data.colors] : []),
			estimatedAge: data.estimatedAge || undefined,
			gender: data.gender || 'unknown',
			foundLocation: data.foundLocation,
			foundDate: data.foundDate || undefined,
			foundTime: data.foundTime || undefined,
			...basePayload
		}
		collectionName = 'found'
	} else {
		throw new Error('Unknown report type');
	}

	const cleaned = omitUndefinedDeep(payload)
	
	try {
		const docRef = await addDoc(collection(db, collectionName), cleaned)

		if (file) {
			try {
				const uploadObjectKey = await uploadImage(file, userId)
				await updateDoc(doc(db, collectionName, docRef.id), { uploadObjectKey })
			} catch (err) {
				// If image upload fails, clean up the document
				await deleteDoc(doc(db, collectionName, docRef.id))
				throw new Error('Image upload failed, report not saved.')
			}
		}

		return docRef.id
	} catch (error) {
		// Log the error for debugging
		console.error('Report submission failed:', error)
		throw error
	}
}


