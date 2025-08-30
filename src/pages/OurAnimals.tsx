import { useState } from 'react'
import { Search, Filter, } from 'lucide-react'
import { useModalStore } from '../stores/modalStore'

interface Animal {
  id: string
  name: string
  type: 'dog' | 'cat'
  breed: string
  age: string
  gender: string
  image: string
  description: string
}

const OurAnimals = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'dog' | 'cat'>('all')
  const { openSignUpModal } = useModalStore()

  // Mock data - in a real app, this would come from Firebase
  const animals: Animal[] = [
    {
      id: '1',
      name: 'Jepoy',
      type: 'dog',
      breed: 'Golden Retriever',
      age: '2 years',
      gender: 'Male',
      image: '/api/placeholder/300/300',
      description: 'Friendly and energetic dog looking for an active family.'
    },
    {
      id: '2',
      name: 'Putchi',
      type: 'cat',
      breed: 'Persian',
      age: '1 year',
      gender: 'Female',
      image: '/api/placeholder/300/300',
      description: 'Calm and affectionate cat perfect for a quiet home.'
    },
    {
      id: '3',
      name: 'Enrico',
      type: 'dog',
      breed: 'Labrador',
      age: '3 years',
      gender: 'Male',
      image: '/api/placeholder/300/300',
      description: 'Playful and loyal companion ready for adventures.'
    },
    {
      id: '4',
      name: 'Meeloo',
      type: 'cat',
      breed: 'Siamese',
      age: '2 years',
      gender: 'Female',
      image: '/api/placeholder/300/300',
      description: 'Curious and intelligent cat who loves to explore.'
    }
  ]

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesFilter = filterType === 'all' || animal.type === filterType
    return matchesSearch && matchesFilter
  })

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Animals</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Find your perfect companion from our loving animals looking for their forever homes.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Bar */}
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by name, breed, or characteristics..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                />
              </div>
            </div>

            {/* Filter Dropdown */}
            <div className="md:w-48">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value as 'all' | 'dog' | 'cat')}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Animals</option>
                  <option value="dog">Dogs</option>
                  <option value="cat">Cats</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Animals Grid */}
        {filteredAnimals.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredAnimals.map((animal) => (
              <div key={animal.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
                {/* Animal Image */}
                <div className="relative h-48 bg-gray-200">
                  <img
                    src={animal.image}
                    alt={animal.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement
                      target.src = `https://via.placeholder.com/300x300/cccccc/666666?text=${animal.name}`
                    }}
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

                {/* Animal Info */}
                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">{animal.name}</h3>
                  <div className="space-y-1 text-sm text-gray-600 mb-3">
                    <p><span className="font-medium">Breed:</span> {animal.breed}</p>
                    <p><span className="font-medium">Age:</span> {animal.age}</p>
                    <p><span className="font-medium">Gender:</span> {animal.gender}</p>
                  </div>
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">{animal.description}</p>

                  {/* Adopt Button */}
                  <button
                    onClick={(e) => {
                      e.preventDefault()
                      openSignUpModal()
                    }}
                    className="w-full btn-primary flex items-center justify-center"
                  >
                    Adopt Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No animals found</h3>
            <p className="text-gray-600">
              Try adjusting your search terms or filters to find more animals.
            </p>
          </div>
        )}

      </div>
    </div>
  )
}

export default OurAnimals