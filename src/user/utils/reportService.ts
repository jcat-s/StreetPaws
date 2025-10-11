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

export interface AbuseReportData extends BaseContactInfo {
	type: 'abuse'
  caseTitle: string
  animalType: string
	incidentLocation: string
	incidentDate: string
	incidentTime: string
	abuseType: string
	animalDescription: string
	perpetratorDescription?: string
	witnessDetails?: string
	additionalDetails?: string
}

export type SubmitReportData = LostReportData | FoundReportData | AbuseReportData

async function uploadImage(file: File, userId: string | null, type?: 'lost' | 'found' | 'abuse'): Promise<{ key: string, signedUrl: string }> {
	if (type === 'abuse') {
		// For abuse reports, use Supabase storage (supports videos)
		if (!supabase) {
			const errorMsg = 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
			console.error('🚨', errorMsg)
			throw new Error(errorMsg)
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
		const { data, error: urlError } = await supabase.storage.from(bucket).createSignedUrl(key, 60 * 60 * 24 * 365)
		if (urlError || !data?.signedUrl) throw new Error(urlError?.message || 'No signed URL')
		return { key, signedUrl: data.signedUrl }
	} else {
		// For lost/found reports, use base64 (no Supabase needed)
		return new Promise((resolve, reject) => {
			const reader = new FileReader()
			reader.onload = () => {
				const dataUrl = reader.result as string
				const key = `${type}/${Date.now()}-${Math.random().toString(36).slice(2)}`
				resolve({ key, signedUrl: dataUrl })
			}
			reader.onerror = () => {
				reject(new Error('Failed to read image file'))
			}
			reader.readAsDataURL(file)
		})
	}
}

async function uploadMultipleFiles(files: File[], userId: string | null): Promise<string[]> {
	if (!supabase) {
		const errorMsg = 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
		console.error('🚨', errorMsg)
		throw new Error(errorMsg)
	}
	const uploadedKeys: string[] = []
	
	for (const file of files) {
		const { key } = await uploadImage(file, userId, 'abuse')
		uploadedKeys.push(key)
	}
	
	return uploadedKeys
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
		published: false, // Default to unpublished - admin must approve
		createdAt: serverTimestamp(),
		createdAtMs: Date.now(),
		createdBy: userId || null,
		submissionId // Add unique identifier
	}

  let payload: Record<string, unknown> = {}
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
	} else if (data.type === 'abuse') {
		payload = {
			type: 'abuse',
      caseTitle: (data as AbuseReportData).caseTitle,
      animalType: (data as AbuseReportData).animalType,
			incidentLocation: data.incidentLocation,
			incidentDate: data.incidentDate,
			incidentTime: data.incidentTime,
			abuseType: data.abuseType,
			animalDescription: data.animalDescription,
			perpetratorDescription: data.perpetratorDescription || undefined,
			witnessDetails: data.witnessDetails || undefined,
			...basePayload
		}
	}

	const cleaned = omitUndefinedDeep(payload)
	
	try {
    // Use simple collection names: reports-lost, reports-found, reports-abuse
    const collectionName = `reports-${cleaned.type}`
    const docRef = await addDoc(collection(db, collectionName), cleaned)

    if (file) {
			try {
        const { signedUrl } = await uploadImage(file, userId, cleaned.type as 'lost' | 'found' | 'abuse')
        await updateDoc(doc(db, collectionName, docRef.id), { image: signedUrl })
			} catch (err) {
        await deleteDoc(doc(db, collectionName, docRef.id))
        throw new Error('Image upload failed, report not saved.')
			}
		}

    return docRef.id
	} catch (error) {
		console.error('Report submission failed:', error)
		throw error
	}
}

export async function submitAbuseReport(data: AbuseReportData, files: File[], userId: string | null): Promise<string> {
	if (!db) {
		throw new Error('Firebase Firestore not initialized')
	}

	if (files.length === 0) {
		throw new Error('At least one evidence file is required for abuse reports')
	}

	// Add a unique submission ID to prevent duplicates
	const submissionId = `${Date.now()}-${Math.random().toString(36).slice(2)}`

	const basePayload = {
		contactName: data.contactName,
		contactPhone: data.contactPhone,
		contactEmail: data.contactEmail,
		additionalDetails: data.additionalDetails || undefined,
		status: 'open' as const,
		published: false, // Default to unpublished - admin must approve
		createdAt: serverTimestamp(),
		createdAtMs: Date.now(),
		createdBy: userId || null,
		submissionId
	}

	const payload = {
		type: 'abuse',
    caseTitle: data.caseTitle,
    animalType: data.animalType,
		incidentLocation: data.incidentLocation,
		incidentDate: data.incidentDate,
		incidentTime: data.incidentTime,
		abuseType: data.abuseType,
		animalDescription: data.animalDescription,
		perpetratorDescription: data.perpetratorDescription || undefined,
		witnessDetails: data.witnessDetails || undefined,
		...basePayload
	}

	const cleaned = omitUndefinedDeep(payload)
	
  try {
		// First upload all files
		const uploadedKeys = await uploadMultipleFiles(files, userId)
		
		// Use simple collection name: reports-abuse
    const docRef = await addDoc(collection(db, 'reports-abuse'), {
      ...cleaned,
      evidenceObjects: uploadedKeys
    })

		return docRef.id
  } catch (error) {
		console.error('Abuse report submission failed:', error)
		throw error
	}
}

/**
 * Creates a signed URL for accessing evidence files from Supabase storage
 * @param objectKey - The storage key/path of the file
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Promise<string> - The signed URL
 */
export async function createSignedEvidenceUrl(objectKey: string, expiresIn: number = 3600): Promise<string> {
	console.log('🔗 Creating signed URL for:', objectKey)
	
	if (!supabase) {
		const errorMsg = 'Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
		console.error('🚨', errorMsg)
		throw new Error(errorMsg)
	}

	try {
		// Test Supabase connection first
		console.log('🔍 Testing Supabase connection...')
		
		const { data, error } = await supabase.storage
			.from('report-uploads')
			.createSignedUrl(objectKey, expiresIn)

		if (error) {
			console.error('❌ Supabase signed URL error:', error)
			console.error('Error details:', {
				message: error.message,
				name: error.name
			})
			
			// Check if it's a bucket/permission issue
			if (error.message.includes('Bucket not found')) {
				throw new Error('Storage bucket "report-uploads" not found. Please create it in your Supabase dashboard.')
			} else if (error.message.includes('permission') || error.message.includes('auth')) {
				throw new Error('Permission denied. Check your Supabase storage policies.')
			}
			
			throw new Error(`Failed to create signed URL: ${error.message}`)
		}

		if (!data?.signedUrl) {
			console.error('❌ No signed URL returned from Supabase')
			throw new Error('No signed URL returned from Supabase')
		}

		console.log('✅ Signed URL created successfully:', data.signedUrl.substring(0, 100) + '...')
		return data.signedUrl
	} catch (error) {
		console.error('❌ Error creating signed evidence URL:', error)
		throw error
	}
}


