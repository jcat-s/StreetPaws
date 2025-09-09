import { useState } from 'react'
import { Search, Filter } from 'lucide-react'
import { useModalStore } from '../../../stores/modalStore'
import AnimalProfileModal from '../../components/AnimalProfileModal'

// Import actual images
import JepoyImage from '../../../assets/images/Animals/Jepoy.jpg'
import PutchiImage from '../../../assets/images/Animals/Putchi.jpg'
import JoshImage from '../../../assets/images/Animals/Josh.jpg'
import MeelooImage from '../../../assets/images/Animals/Meeloo.jpg'

type Animal = {
  id: string
  name: string
  type: 'dog' | 'cat'
  breed?: string
  age?: string
  gender?: string
  image: string
  description?: string
}

const MOCK_ANIMALS: Animal[] = [
  { id: '1', name: 'Jepoy', type: 'dog', breed: 'Golden Retriever', age: '2 years', gender: 'Male', image: JepoyImage, description: 'Jepoy is a sweet, playful pup with a heart full of love and a tail that never stops wagging. Curious, cuddly, and always ready for belly rubs, Jepoy is the perfect companion for cozy afternoons and fun-filled adventures.' },
  { id: '2', name: 'Putchi', type: 'cat', breed: 'Persian', age: '1 year', gender: 'Female', image: PutchiImage, description: 'Calm and affectionate cat perfect for a quiet home.' },
  { id: '3', name: 'Josh', type: 'dog', breed: 'Labrador', age: '3 years', gender: 'Male', image: JoshImage, description: 'Playful and loyal companion ready for adventures.' },
  { id: '4', name: 'Meeloo', type: 'cat', breed: 'Siamese', age: '2 years', gender: 'Female', image: MeelooImage, description: 'Curious and intelligent cat who loves to explore.' }
]

export default function OurAnimals() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'dog' | 'cat'>('all')
  const { openAnimalProfile } = useModalStore()

  const filtered = MOCK_ANIMALS.filter((a) => {
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

        {/* Animals Grid: only picture + name; clicking opens profile modal */}
        {filtered.length > 0 ? (
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

                <div className="p-3 text-center bg-white">
                  <h4 className="text-sm font-medium text-gray-900 truncate">{animal.name}</h4>
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