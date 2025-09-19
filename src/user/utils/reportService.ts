import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
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
	size?: string
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
	}

	const cleaned = omitUndefinedDeep(payload)
	const docRef = await addDoc(collection(db, 'reports'), cleaned)
	return docRef.id
}


