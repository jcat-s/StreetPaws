import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { Search, Filter, MapPin, Calendar, Phone, Mail } from 'lucide-react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { createSignedEvidenceUrl } from '../../utils/abuseReportService'

// Import actual images
import JepoyImage from '../../../assets/images/Animals/Jepoy.jpg'
import PutchiImage from '../../../assets/images/Animals/Putchi.jpg'
import JoshImage from '../../../assets/images/Animals/Josh.jpg'
import MeelooImage from '../../../assets/images/Animals/Meeloo.jpg'

interface LostFoundAnimal {
  id: string
  type: 'lost' | 'found'
  animalType: 'dog' | 'cat'
  name?: string
  breed: string
  colors: string
  age: string
  gender: string
  size: string
  location: string
  date: string
  time: string
  contactName: string
  contactPhone: string
  contactEmail: string
  description: string
  image: string
  additionalDetails?: string
}

const MOCK_LOST_FOUND: LostFoundAnimal[] = []

const LostAndFound = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState<'all' | 'lost' | 'found'>('all')
  const [filterAnimalType, setFilterAnimalType] = useState<'all' | 'dog' | 'cat'>('all')
  const [selectedItem, setSelectedItem] = useState<LostFoundAnimal | null>(null)
  const [items, setItems] = useState<LostFoundAnimal[]>([])
  const { search } = useLocation()
  const params = new URLSearchParams(search)
  const justSubmitted = params.get('submitted') === '1'

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, async (snap) => {
      const mapped: LostFoundAnimal[] = []
      for (const d of snap.docs) {
        const data: any = d.data()
        if ((data?.type !== 'lost' && data?.type !== 'found') || data?.published !== true) continue
        let imageUrl = ''
        const key = data?.uploadObjectKey as string | undefined
        if (key) {
          try { imageUrl = await createSignedEvidenceUrl(key, 3600) } catch {}
        }
        mapped.push({
          id: d.id,
          type: data.type,
          animalType: (data?.animalType === 'dog' || data?.animalType === 'cat') ? data.animalType : 'dog',
          name: data?.animalName,
          breed: data?.breed || '',
          colors: Array.isArray(data?.colors) ? data.colors.join(', ') : (data?.colors || ''),
          age: (data?.age || data?.estimatedAge || '') as string,
          gender: data?.gender || '',
          size: data?.size || '',
          location: (data?.lastSeenLocation || data?.foundLocation || ''),
          date: (data?.lastSeenDate || data?.foundDate || ''),
          time: (data?.lastSeenTime || data?.foundTime || ''),
          contactName: data?.contactName || '',
          contactPhone: data?.contactPhone || '',
          contactEmail: data?.contactEmail || '',
          description: data?.additionalDetails || '',
          image: imageUrl || JepoyImage,
          additionalDetails: data?.additionalDetails || ''
        })
      }
      setItems(mapped)
    })
    return () => unsub()
  }, [])

  const filtered = items.filter((item) => {
    const matchesSearch = searchTerm === '' || 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.colors.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesType = filterType === 'all' || item.type === filterType
    const matchesAnimalType = filterAnimalType === 'all' || item.animalType === filterAnimalType
    
    return matchesSearch && matchesType && matchesAnimalType
  })

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatTime = (timeString: string) => {
    return new Date(`2000-01-01T${timeString}`).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Lost and Found</h1>
          <p className="text-lg text-gray-600 mb-8">
            Browse categorized listings of animals reported as lost or found in our community.
          </p>
          {justSubmitted && (
            <div className="mx-auto max-w-3xl mb-4 rounded-lg border border-green-200 bg-green-50 p-3 text-green-800">
              Your report was submitted successfully and will appear once approved.
            </div>
          )}
        </div>

        {/* Search and Filter */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, breed, color, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              />
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select 
                value={filterType} 
                onChange={(e) => setFilterType(e.target.value as any)} 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Reports</option>
                <option value="lost">Lost Animals</option>
                <option value="found">Found Animals</option>
              </select>
            </div>

            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <select 
                value={filterAnimalType} 
                onChange={(e) => setFilterAnimalType(e.target.value as any)} 
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Animals</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
              </select>
            </div>
          </div>
        </div>

        {/* Results */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((item) => (
              <div 
                key={item.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedItem(item)}
              >
                <div className="relative">
                  <img
                    src={item.image}
                    alt={item.name || `${item.breed} ${item.type}`}
                    className="w-full h-48 object-cover"
                    onError={(e) => { 
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300/ffd6e0/8a2be2?text=${item.animalType === 'dog' ? '🐕' : '🐱'}` 
                    }}
                  />
                  <div className="absolute top-2 left-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.type === 'lost' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.type === 'lost' ? '🔍 LOST' : '🏠 FOUND'}
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                      item.animalType === 'dog' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {item.animalType === 'dog' ? '🐕 Dog' : '🐱 Cat'}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    {item.name || `Unknown ${item.breed}`}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center">
                      <span className="font-medium">Breed:</span>
                      <span className="ml-2">{item.breed}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Colors:</span>
                      <span className="ml-2">{item.colors}</span>
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Age:</span>
                      <span className="ml-2">{item.age}</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-1" />
                      <span>{item.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>{formatDate(item.date)} at {formatTime(item.time)}</span>
                    </div>
                  </div>

                  <p className="text-sm text-gray-700 mt-3 line-clamp-2">
                    {item.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-gray-200">
                    <div className="flex items-center text-sm text-gray-600">
                      <span className="font-medium">Contact:</span>
                      <span className="ml-2">{item.contactName}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <Search className="h-16 w-16 mx-auto" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-600">Try adjusting your search terms or filters to find more reports.</p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedItem && (
          <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
            <div className="absolute inset-0 bg-black/40" onClick={() => setSelectedItem(null)} />
            <div className="relative bg-white rounded-2xl w-full max-w-2xl mx-auto p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {selectedItem.name || `Unknown ${selectedItem.breed}`}
                </h2>
                <button 
                  onClick={() => setSelectedItem(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ✕
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <img
                    src={selectedItem.image}
                    alt={selectedItem.name || `${selectedItem.breed} ${selectedItem.type}`}
                    className="w-full h-64 object-cover rounded-lg"
                    onError={(e) => { 
                      (e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300/ffd6e0/8a2be2?text=${selectedItem.animalType === 'dog' ? '🐕' : '🐱'}` 
                    }}
                  />
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      selectedItem.type === 'lost' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {selectedItem.type === 'lost' ? '🔍 LOST' : '🏠 FOUND'}
                    </span>
                    <span className={`px-3 py-1 text-sm font-medium rounded-full ${
                      selectedItem.animalType === 'dog' 
                        ? 'bg-blue-100 text-blue-800' 
                        : 'bg-purple-100 text-purple-800'
                    }`}>
                      {selectedItem.animalType === 'dog' ? '🐕 Dog' : '🐱 Cat'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div><span className="font-medium">Breed:</span> {selectedItem.breed}</div>
                    <div><span className="font-medium">Colors:</span> {selectedItem.colors}</div>
                    <div><span className="font-medium">Age:</span> {selectedItem.age}</div>
                    <div><span className="font-medium">Gender:</span> {selectedItem.gender}</div>
                    <div><span className="font-medium">Size:</span> {selectedItem.size}</div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{selectedItem.location}</span>
                    </div>
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                      <span>{formatDate(selectedItem.date)} at {formatTime(selectedItem.time)}</span>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-medium mb-2">Description:</h4>
                    <p className="text-gray-700">{selectedItem.description}</p>
                  </div>

                  {selectedItem.additionalDetails && (
                    <div>
                      <h4 className="font-medium mb-2">Additional Details:</h4>
                      <p className="text-gray-700">{selectedItem.additionalDetails}</p>
                    </div>
                  )}

                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium mb-2">Contact Information:</h4>
                    <div className="space-y-1">
                      <div className="flex items-center">
                        <span className="font-medium">Name:</span>
                        <span className="ml-2">{selectedItem.contactName}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="h-4 w-4 mr-2 text-gray-500" />
                        <a href={`tel:${selectedItem.contactPhone}`} className="text-orange-600 hover:text-orange-700">
                          {selectedItem.contactPhone}
                        </a>
                      </div>
                      <div className="flex items-center">
                        <Mail className="h-4 w-4 mr-2 text-gray-500" />
                        <a href={`mailto:${selectedItem.contactEmail}`} className="text-orange-600 hover:text-orange-700">
                          {selectedItem.contactEmail}
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default LostAndFound 