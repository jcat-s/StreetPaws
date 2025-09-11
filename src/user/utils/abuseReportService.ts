import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { supabase } from '../../config/supabase'

export interface AbuseReportData {
    incidentLocation: string
    incidentDate: string
    incidentTime: string
    abuseType: string
    animalDescription: string
    perpetratorDescription?: string
    witnessDetails?: string
    contactName: string
    contactPhone: string
    contactEmail: string
    additionalDetails?: string
}

export interface CreatedAbuseReportResult {
    id: string
}

async function uploadEvidenceFiles(userId: string | null, files: File[]): Promise<string[]> {
    const bucket = 'report-uploads'
    const uploaded: string[] = []

    for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
        const ext = safeName.includes('.') ? safeName.split('.').pop() : undefined
        const key = `${userId || 'anon'}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext || 'bin'}`

        const { error } = await supabase
            .storage
            .from(bucket)
            .upload(key, file, {
                cacheControl: '3600',
                contentType: file.type,
                upsert: false
            })

        if (error) {
            throw new Error(`Failed to upload ${safeName}: ${error.message}`)
        }

        uploaded.push(key)
    }

    return uploaded
}

export async function submitAbuseReport(payload: AbuseReportData, files: File[], userId: string | null): Promise<CreatedAbuseReportResult> {
    if (!db) {
        throw new Error('Firebase Firestore not initialized')
    }

    if (!supabase) {
        throw new Error('Supabase not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.')
    }

    const objectKeys = await uploadEvidenceFiles(userId, files)

    const docPayload = {
        type: 'abuse' as const,
        incidentLocation: payload.incidentLocation,
        incidentDate: payload.incidentDate,
        incidentTime: payload.incidentTime,
        abuseType: payload.abuseType,
        animalDescription: payload.animalDescription,
        perpetratorDescription: payload.perpetratorDescription || undefined,
        witnessDetails: payload.witnessDetails || undefined,
        contactName: payload.contactName,
        contactPhone: payload.contactPhone,
        contactEmail: payload.contactEmail,
        additionalDetails: payload.additionalDetails || undefined,
        evidenceObjects: objectKeys,
        status: 'open' as const,
        createdAt: serverTimestamp(),
        createdBy: userId || null
    }

    const cleaned = Object.fromEntries(Object.entries(docPayload).filter(([, v]) => v !== undefined))
    const docRef = await addDoc(collection(db, 'reports'), cleaned)
    return { id: docRef.id }
}

export function createSignedEvidenceUrl(objectKey: string, expiresInSeconds = 3600): Promise<string> {
    const bucket = 'report-uploads'
    if (!supabase) {
        return Promise.reject(new Error('Supabase not configured'))
    }
    return supabase
        .storage
        .from(bucket)
        .createSignedUrl(objectKey, expiresInSeconds)
        .then(({ data, error }) => {
            if (error || !data?.signedUrl) {
                throw new Error(error?.message || 'Failed to create signed URL')
            }
            return data.signedUrl
        })
}


