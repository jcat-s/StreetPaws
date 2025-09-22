import { collection, getDocs, query, where, orderBy, limit, addDoc, updateDoc, deleteDoc, doc, serverTimestamp, getDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'

export type AnimalType = 'dog' | 'cat'
export type AnimalStatus = 'available' | 'pending' | 'adopted' | 'archived'

export interface AnimalRecord {
  id?: string
  name: string
  type: AnimalType
  breed?: string
  age?: string
  gender?: string
  size?: string
  colors?: string
  description?: string
  images?: string[]
  status: AnimalStatus
  healthStatus?: 'Healthy' | 'Under Treatment' | 'Critical'
  vaccinationStatus?: string
  spayNeuterStatus?: string
  microchipId?: string
  intakeDate?: string
  intakeReason?: string
  location?: string
  specialNeeds?: string
  behaviorNotes?: string
  medicalHistory?: string
  adoptionFee?: number
  fosterFamily?: string | null
  isPublished?: boolean
  createdAt?: any
  updatedAt?: any
}

function assertDb() {
  if (!db) throw new Error('Firebase Firestore not initialized')
}

export async function listPublishedAnimals(max: number = 100): Promise<AnimalRecord[]> {
  assertDb()
  const animalsCol = collection(db!, 'animals')
  // Avoid orderBy to prevent composite index requirements in dev
  const qy = query(animalsCol, where('isPublished', '==', true), limit(max))
  const snap = await getDocs(qy)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AnimalRecord) }))
}

export async function listAllAnimalsForAdmin(max: number = 200): Promise<AnimalRecord[]> {
  assertDb()
  const animalsCol = collection(db!, 'animals')
  const qy = query(animalsCol, orderBy('updatedAt', 'desc'), limit(max))
  const snap = await getDocs(qy)
  return snap.docs.map((d) => ({ id: d.id, ...(d.data() as AnimalRecord) }))
}

export async function getAnimalById(animalId: string): Promise<AnimalRecord | null> {
  assertDb()
  const ref = doc(db!, 'animals', animalId)
  const d = await getDoc(ref)
  if (!d.exists()) return null
  return { id: d.id, ...(d.data() as AnimalRecord) }
}

export async function createAnimal(record: Omit<AnimalRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<string> {
  assertDb()
  const animalsCol = collection(db!, 'animals')
  const payload = {
    ...record,
    isPublished: record.isPublished ?? false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp()
  }
  const res = await addDoc(animalsCol, payload)
  return res.id
}

export async function updateAnimal(animalId: string, updates: Partial<AnimalRecord>): Promise<void> {
  assertDb()
  const ref = doc(db!, 'animals', animalId)
  const payload: Partial<AnimalRecord> = { ...updates, updatedAt: serverTimestamp() }
  await updateDoc(ref, payload as any)
}

export async function deleteAnimal(animalId: string): Promise<void> {
  assertDb()
  const ref = doc(db!, 'animals', animalId)
  await deleteDoc(ref)
}

export async function setAnimalStatus(animalId: string, status: AnimalStatus): Promise<void> {
  await updateAnimal(animalId, { status })
}


