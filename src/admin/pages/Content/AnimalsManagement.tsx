import { useState } from 'react'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  XCircle
} from 'lucide-react'

// Mock data - In production, this would come from your database
const MOCK_ANIMALS = [
  {
    id: '1',
    name: 'Jepoy',
    type: 'dog',
    breed: 'Golden Retriever',
    age: '2 years',
    gender: 'Male',
    size: 'Large',
    colors: 'Golden brown',
    description: 'Jepoy is a sweet, playful pup with a heart full of love and a tail that never stops wagging. Curious, cuddly, and always ready for belly rubs, Jepoy is the perfect companion for cozy afternoons and fun-filled adventures.',
    images: ['jepoy1.jpg', 'jepoy2.jpg'],
    status: 'available',
    healthStatus: 'Healthy',
    vaccinationStatus: 'Up to date',
    spayNeuterStatus: 'Neutered',
    microchipId: 'MC001234567',
    intakeDate: '2024-01-10',
    intakeReason: 'Found as stray',
    location: 'Barangay 1',
    specialNeeds: 'None',
    behaviorNotes: 'Very friendly, good with children and other dogs',
    medicalHistory: 'Routine checkup completed, all vaccinations current',
    adoptionFee: 2000,
    fosterFamily: null,
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-15T10:30:00Z'
  },
  {
    id: '2',
    name: 'Putchi',
    type: 'cat',
    breed: 'Persian',
    age: '1 year',
    gender: 'Female',
    size: 'Medium',
    colors: 'White and gray',
    description: 'Calm and affectionate cat perfect for a quiet home. Putchi loves to cuddle and is very gentle with people.',
    images: ['putchi1.jpg'],
    status: 'adopted',
    healthStatus: 'Healthy',
    vaccinationStatus: 'Up to date',
    spayNeuterStatus: 'Spayed',
    microchipId: 'MC001234568',
    intakeDate: '2024-01-05',
    intakeReason: 'Owner surrender',
    location: 'Barangay 3',
    specialNeeds: 'None',
    behaviorNotes: 'Calm, prefers quiet environments',
    medicalHistory: 'Spayed, all vaccinations current',
    adoptionFee: 1500,
    fosterFamily: null,
    createdAt: '2024-01-05T14:20:00Z',
    updatedAt: '2024-01-14T16:45:00Z'
  },
  {
    id: '3',
    name: 'Josh',
    type: 'dog',
    breed: 'Labrador',
    age: '3 years',
    gender: 'Male',
    size: 'Large',
    colors: 'Black',
    description: 'Playful and loyal companion ready for adventures. Josh loves to play fetch and is great with kids.',
    images: ['josh1.jpg', 'josh2.jpg'],
    status: 'available',
    healthStatus: 'Healthy',
    vaccinationStatus: 'Up to date',
    spayNeuterStatus: 'Neutered',
    microchipId: 'MC001234569',
    intakeDate: '2024-01-12',
    intakeReason: 'Rescue from abuse case',
    location: 'Barangay 5',
    specialNeeds: 'Needs patient owner due to past trauma',
    behaviorNotes: 'Initially shy but warms up quickly, very loyal once bonded',
    medicalHistory: 'Recovered from minor injuries, all treatments completed',
    adoptionFee: 2000,
    fosterFamily: 'Maria Santos',
    createdAt: '2024-01-12T11:15:00Z',
    updatedAt: '2024-01-15T09:20:00Z'
  },
  {
    id: '4',
    name: 'Meeloo',
    type: 'cat',
    breed: 'Siamese',
    age: '2 years',
    gender: 'Female',
    size: 'Medium',
    colors: 'Cream and brown',
    description: 'Curious and intelligent cat who loves to explore. Meeloo is very social and enjoys interactive play.',
    images: ['meeloo1.jpg'],
    status: 'pending',
    healthStatus: 'Healthy',
    vaccinationStatus: 'Up to date',
    spayNeuterStatus: 'Spayed',
    microchipId: 'MC001234570',
    intakeDate: '2024-01-08',
    intakeReason: 'Found as stray',
    location: 'Barangay 2',
    specialNeeds: 'None',
    behaviorNotes: 'Very active, needs lots of stimulation',
    medicalHistory: 'All vaccinations current, spayed',
    adoptionFee: 1500,
    fosterFamily: null,
    createdAt: '2024-01-08T16:30:00Z',
    updatedAt: '2024-01-15T14:10:00Z'
  }
]

const AnimalsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'adopted' | 'pending'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'dog' | 'cat'>('all')
  const [selectedAnimal, setSelectedAnimal] = useState<any>(null)
  const [showAnimalModal, setShowAnimalModal] = useState(false)
  const [showAddModal, setShowAddModal] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [animalToDelete, setAnimalToDelete] = useState<{id: string, name: string, type: string} | null>(null)
  const [deletedAnimals, setDeletedAnimals] = useState<any[]>([])
  const [showUndo, setShowUndo] = useState(false)
  const [animals, setAnimals] = useState<any[]>(MOCK_ANIMALS)

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = searchTerm === '' || 
      animal.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.breed.toLowerCase().includes(searchTerm.toLowerCase()) ||
      animal.microchipId.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || animal.status === statusFilter
    const matchesType = typeFilter === 'all' || animal.type === typeFilter

    return matchesSearch && matchesStatus && matchesType
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'available': return 'bg-green-100 text-green-800'
      case 'adopted': return 'bg-blue-100 text-blue-800'
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getHealthColor = (health: string) => {
    switch (health) {
      case 'Healthy': return 'bg-green-100 text-green-800'
      case 'Under Treatment': return 'bg-yellow-100 text-yellow-800'
      case 'Critical': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewAnimal = (animal: any) => {
    setSelectedAnimal(animal)
    setShowAnimalModal(true)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const handleDeleteClick = (animal: any) => {
    setAnimalToDelete({
      id: animal.id,
      name: animal.name,
      type: animal.type
    })
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!animalToDelete) return
    
    // Store the animal for potential undo
    const animalToUndo = animals.find(a => a.id === animalToDelete.id)
    if (animalToUndo) {
      setDeletedAnimals(prev => [...prev, animalToUndo])
      setShowUndo(true)
      // Auto-hide undo after 10 seconds
      setTimeout(() => setShowUndo(false), 10000)
    }
    
    setDeletingId(animalToDelete.id)
    setShowDeleteConfirm(false)
    
    // Simulate async operation
    setTimeout(() => {
      setAnimals(prev => prev.filter(animal => animal.id !== animalToDelete.id))
      setDeletingId(null)
      setAnimalToDelete(null)
    }, 1000)
  }

  const handleUndoDelete = () => {
    if (deletedAnimals.length === 0) return
    
    const lastDeleted = deletedAnimals[deletedAnimals.length - 1]
    
    // Restore the animal
    setAnimals(prev => [...prev, lastDeleted])
    
    // Remove from deleted animals
    setDeletedAnimals(prev => prev.slice(0, -1))
    setShowUndo(false)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Animals Management</h1>
              <p className="text-gray-600 mt-2">Manage all animals in the shelter system.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-5 w-5" />
              <span>Add Animal</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search animals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="available">Available</option>
                <option value="adopted">Adopted</option>
                <option value="pending">Pending</option>
              </select>
            </div>

            {/* Type Filter */}
            <div>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Types</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
              </select>
            </div>
          </div>
        </div>

        {/* Animals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAnimals.map((animal) => (
            <div key={animal.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
              {/* Animal Image */}
              <div className="h-48 bg-gray-200 relative">
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="bg-orange-100 p-4 rounded-full w-16 h-16 mx-auto mb-2">
                      {animal.type === 'dog' ? (
                        <span className="text-2xl">🐕</span>
                      ) : (
                        <span className="text-2xl">🐱</span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">No image available</p>
                  </div>
                </div>
                <div className="absolute top-2 right-2">
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>
                    {animal.status}
                  </span>
                </div>
              </div>

              {/* Animal Info */}
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">{animal.name}</h3>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${getHealthColor(animal.healthStatus)}`}>
                    {animal.healthStatus}
                  </span>
                </div>
                
                <div className="space-y-1 text-sm text-gray-600">
                  <p><strong>Breed:</strong> {animal.breed}</p>
                  <p><strong>Age:</strong> {animal.age}</p>
                  <p><strong>Gender:</strong> {animal.gender}</p>
                  <p><strong>Size:</strong> {animal.size}</p>
                  <p><strong>Microchip:</strong> {animal.microchipId}</p>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <div className="text-sm text-gray-500">
                    <p>Intake: {formatDate(animal.intakeDate)}</p>
                    <p>Fee: {formatCurrency(animal.adoptionFee)}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleViewAnimal(animal)}
                      className="text-orange-600 hover:text-orange-700 p-1"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    <button className="text-blue-600 hover:text-blue-700 p-1">
                      <Edit className="h-4 w-4" />
                    </button>
                    <button 
                      disabled={deletingId === animal.id}
                      onClick={() => handleDeleteClick(animal)} 
                      className="text-red-600 hover:text-red-700 disabled:opacity-50 p-1"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Animal Detail Modal */}
        {showAnimalModal && selectedAnimal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-3 rounded-full">
                    {selectedAnimal.type === 'dog' ? (
                      <span className="text-2xl">🐕</span>
                    ) : (
                      <span className="text-2xl">🐱</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedAnimal.name}</h2>
                    <p className="text-sm text-gray-600">#{selectedAnimal.id} • {selectedAnimal.breed}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAnimalModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedAnimal.type}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Breed</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.breed}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.age}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.gender}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Size</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.size}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Colors</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.colors}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Microchip ID</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.microchipId}</p>
                    </div>
                  </div>
                </div>

                {/* Health Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Health Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Health Status</label>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getHealthColor(selectedAnimal.healthStatus)}`}>
                        {selectedAnimal.healthStatus}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Vaccination Status</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.vaccinationStatus}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Spay/Neuter Status</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.spayNeuterStatus}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adoption Fee</label>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedAnimal.adoptionFee)}</p>
                    </div>
                  </div>
                </div>

                {/* Intake Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Intake Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Intake Date</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedAnimal.intakeDate)}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Intake Reason</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.intakeReason}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.location}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Foster Family</label>
                      <p className="text-sm text-gray-900">{selectedAnimal.fosterFamily || 'None'}</p>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Description</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {selectedAnimal.description}
                  </p>
                </div>

                {/* Special Needs */}
                {selectedAnimal.specialNeeds && selectedAnimal.specialNeeds !== 'None' && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Special Needs</h3>
                    <p className="text-sm text-gray-900 bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                      {selectedAnimal.specialNeeds}
                    </p>
                  </div>
                )}

                {/* Behavior Notes */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Behavior Notes</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {selectedAnimal.behaviorNotes}
                  </p>
                </div>

                {/* Medical History */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Medical History</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {selectedAnimal.medicalHistory}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowAnimalModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Edit Animal
                  </button>
                  <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                    Update Status
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Animal Modal Placeholder */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Add New Animal</h2>
                <p className="text-gray-600 mb-6">This feature will be implemented to add new animals to the system.</p>
                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                    Add Animal
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && animalToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Animal</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete <span className="font-medium">{animalToDelete.name}</span>, the {animalToDelete.type}?
                </p>
                <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-sm text-yellow-800">
                    <strong>Note:</strong> You'll have 10 seconds to undo this action after deletion.
                  </p>
                </div>
              </div>
              
              <div className="flex items-center justify-end space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deletingId === animalToDelete.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deletingId === animalToDelete.id ? 'Deleting...' : 'Delete Animal'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Notification */}
        {showUndo && deletedAnimals.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-green-100 rounded-full">
                  <span className="text-lg">{deletedAnimals[deletedAnimals.length - 1]?.type === 'dog' ? '🐕' : '🐱'}</span>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Animal deleted</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {deletedAnimals[deletedAnimals.length - 1]?.name} has been removed from the system.
                  </p>
                </div>
                <div className="flex flex-col space-y-1">
                  <button
                    onClick={handleUndoDelete}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    Undo
                  </button>
                  <button
                    onClick={() => setShowUndo(false)}
                    className="text-sm text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AnimalsManagement
