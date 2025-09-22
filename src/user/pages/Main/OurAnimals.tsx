import { useEffect, useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { useModalStore } from '../../../stores/modalStore'
import AnimalProfileModal from '../../modal/AnimalProfileModal'
import { listPublishedAnimals, type AnimalRecord } from '../../../shared/utils/animalsService'

type Animal = {
  id: string
  name: string
  type: 'dog' | 'cat'
  breed?: string
  age?: string
  gender?: string
  image: string
  description?: string
  status?: string
  adoptionFee?: number
}

export default function OurAnimals() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'dog' | 'cat'>('all')
  const [animals, setAnimals] = useState<Animal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { openAnimalProfile } = useModalStore()

  useEffect(() => {
    let isMounted = true
    async function fetchAnimals() {
      try {
        setLoading(true)
        const records: AnimalRecord[] = await listPublishedAnimals(100)
        if (!isMounted) return
        const mapped: Animal[] = (records || []).map((r) => ({
          id: r.id || `${Math.random()}`,
          name: r.name,
          type: r.type,
          breed: r.breed,
          age: r.age,
          gender: r.gender,
          image: (r.images && r.images[0]) || `https://via.placeholder.com/400x400/ffd6e0/8a2be2?text=${encodeURIComponent(r.name)}`,
          description: r.description,
          status: r.status,
          adoptionFee: r.adoptionFee
        }))
        setAnimals(mapped)
      } catch (e: any) {
        if (isMounted) {
          setError(e?.message || 'Failed to load animals')
          setAnimals([])
        }
      } finally {
        if (isMounted) setLoading(false)
      }
    }
    fetchAnimals()
    return () => { isMounted = false }
  }, [])

  const filtered = animals.filter((a) => {
    const q = searchTerm.trim().toLowerCase()
    const matchesSearch = q === '' || a.name.toLowerCase().includes(q) || (a.breed || '').toLowerCase().includes(q)
    const matchesFilter = filterType === 'all' || a.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Animals</h1>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg"
              />
            </div>

            <div className="w-44">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select value={filterType} onChange={(e) => setFilterType(e.target.value as any)} className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg">
                  <option value="all">All Animals</option>
                  <option value="dog">Dogs</option>
                  <option value="cat">Cats</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Animals Grid: show picture, name, status pill and fee; click opens modal */}
        {loading ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4"><Search className="h-16 w-16 mx-auto animate-pulse" /></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">Loading animals…</h3>
            {error && <p className="text-sm text-red-600">{error}</p>}
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filtered.map((animal) => (
              <button
                key={animal.id}
                onClick={() => openAnimalProfile(animal)}
                className="group relative bg-gradient-to-br from-white to-primary-50 hover:from-primary-50/80 hover:to-white/80 rounded-2xl overflow-hidden shadow-md hover:shadow-lg transform transition hover:-translate-y-1 focus:outline-none"
              >
                <div className="relative h-52 bg-pink-50">
                  <img
                    src={animal.image}
                    alt={animal.name}
                    className="w-full h-full object-cover rounded-t-2xl"
                    onError={(e) => { (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x400/ffd6e0/8a2be2?text=${animal.name}` }}
                  />

                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${animal.type === 'dog'
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-purple-100 text-purple-800'
                      }`}>
                      {animal.type === 'dog' ? '🐕' : '🐱'} {animal.type.charAt(0).toUpperCase() + animal.type.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-white">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="text-sm font-medium text-gray-900 truncate">{animal.name}</h4>
                    {animal.status && (
                      <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full capitalize ${
                        animal.status === 'available' ? 'bg-green-100 text-green-800' :
                        animal.status === 'adopted' ? 'bg-blue-100 text-blue-800' :
                        animal.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'
                      }`}>{animal.status}</span>
                    )}
                  </div>
                  
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4"><Search className="h-16 w-16 mx-auto" /></div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No animals found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters to find more animals.</p>
          </div>
        )}

        <AnimalProfileModal />
      </div>
    </div>
  )
}