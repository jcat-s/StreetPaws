import { useEffect, useMemo, useState } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import { collection, deleteDoc, doc, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { createSignedEvidenceUrl } from '../../../user/utils/reportService'

const ContentHome = () => {
  const [type, setType] = useState<'lost' | 'found'>('lost')
  const [items, setItems] = useState<Array<{ id: string; title: string; subtitle: string; imageUrl?: string }>>([])
  const heading = useMemo(() => (type === 'lost' ? 'Lost Animals' : 'Found Animals'), [type])

  useEffect(() => {
    if (!db) return
    const collectionName = type === 'lost' ? 'lost' : 'found'
    const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, async (snap) => {
      const mapped: Array<{ id: string; title: string; subtitle: string; imageUrl?: string }> = []
      for (const d of snap.docs) {
        const data: any = d.data()
        if (data?.published !== true) continue
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
    const collectionName = type === 'lost' ? 'lost' : 'found'
    await deleteDoc(doc(db, collectionName, id))
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Lost & Found Management</h1>
          <div className="inline-flex rounded-lg border border-gray-200 overflow-hidden">
            <button
              onClick={() => setType('lost')}
              className={`px-4 py-2 text-sm font-medium ${type === 'lost' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Lost
            </button>
            <button
              onClick={() => setType('found')}
              className={`px-4 py-2 text-sm font-medium border-l border-gray-200 ${type === 'found' ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50'}`}
            >
              Found
            </button>
          </div>
        </div>

        <div className="min-h-screen">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">{heading}</h2>
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
    </div>
  )
}

export default ContentHome


