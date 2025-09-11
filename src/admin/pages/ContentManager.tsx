import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { createSignedEvidenceUrl } from '../../user/utils/abuseReportService'

type ContentType = 'lost' | 'found'

type ContentCard = {
  id: string
  title: string
  subtitle: string
  imageUrl?: string
}

const ContentManager = ({ type }: { type: ContentType }) => {
  const [items, setItems] = useState<ContentCard[]>([])
  const heading = useMemo(() => (type === 'lost' ? 'Lost Animals' : 'Found Animals'), [type])

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, async (snap) => {
      const mapped: ContentCard[] = []
      for (const d of snap.docs) {
        const data: any = d.data()
        // Only include admin-approved content
        if (data?.type !== type || data?.published !== true) continue
        let url: string | undefined
        const key = data?.uploadObjectKey as string | undefined
        if (key) {
          try { url = await createSignedEvidenceUrl(key, 3600) } catch {}
        }
        mapped.push({
          id: d.id,
          title: data?.animalName || data?.animalType || 'Unknown',
          subtitle: (type === 'lost' ? data?.lastSeenLocation : data?.foundLocation) || '—',
          imageUrl: url
        })
      }
      setItems(mapped)
    })
    return () => unsub()
  }, [type])

  const handleDelete = async (id: string) => {
    if (!db) return
    await deleteDoc(doc(db, 'reports', id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{heading}</h1>
          <button className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2">
            <Plus className="h-5 w-5" />
            <span>Add</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((card) => (
            <div key={card.id} className="bg-white rounded-lg shadow-sm overflow-hidden">
              <div className="relative h-40 bg-gray-200">
                {card.imageUrl ? (
                  <img src={card.imageUrl} alt={card.title} className="absolute inset-0 w-full h-full object-cover" />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400">No image</div>
                )}
                <div className="absolute bottom-2 right-2 flex items-center space-x-2">
                  <button className="bg-white/90 hover:bg-white text-blue-600 p-2 rounded shadow">
                    <Edit className="h-4 w-4" />
                  </button>
                  <button onClick={() => handleDelete(card.id)} className="bg-white/90 hover:bg-white text-red-600 p-2 rounded shadow">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              <div className="p-4">
                <div className="font-semibold text-gray-900">{card.title}</div>
                <div className="text-sm text-gray-600">{card.subtitle}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default ContentManager


