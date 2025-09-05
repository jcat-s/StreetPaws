import { X } from 'lucide-react'
import { useModalStore } from '../stores/modalStore'

const AnimalProfileModal = () => {
  const { isAnimalProfileOpen, selectedAnimal, closeAnimalProfile } = useModalStore()

  if (!isAnimalProfileOpen || !selectedAnimal) return null

  const handleAdopt = () => {
    closeAnimalProfile()
    // Temporarily navigate directly to adoption form without signup
    window.location.href = `/adoption-form/${selectedAnimal.id}`
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={closeAnimalProfile} />
      <div className="relative bg-white rounded-2xl w-full max-w-md sm:max-w-xl md:max-w-2xl mx-auto p-4 sm:p-6 shadow-2xl z-10 border border-pink-50">
        <button onClick={closeAnimalProfile} className="absolute top-4 right-4 p-2 rounded-full bg-white shadow-sm hover:bg-pink-50">
          <X className="h-5 w-5 text-gray-700" />
        </button>

        <div className="max-h-[85vh] overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1">
              <img
                src={selectedAnimal.image || 'https://via.placeholder.com/400x400'}
                alt={selectedAnimal.name}
                className="w-full h-48 md:h-64 object-cover rounded-lg shadow-sm"
              />
            </div>

            <div className="md:col-span-2">
              <h2 className="text-2xl font-bold mb-2">{selectedAnimal.name}</h2>

              <div className="flex flex-wrap gap-3 items-center mb-4">
                {selectedAnimal.breed && <div className="px-3 py-1 bg-pink-50 rounded text-sm">Breed: {selectedAnimal.breed}</div>}
                {selectedAnimal.age && <div className="px-3 py-1 bg-pink-50 rounded text-sm">Age: {selectedAnimal.age}</div>}
                {selectedAnimal.gender && <div className="px-3 py-1 bg-pink-50 rounded text-sm">Sex: {selectedAnimal.gender}</div>}
              </div>

              <div className="text-gray-700 mb-4 whitespace-pre-line">{selectedAnimal.description || 'No additional details provided.'}</div>

              {/* extra optional fields if present on the object */}
              {((selectedAnimal as any).location) && (
                <div className="mb-3 text-sm text-gray-600">Location: {(selectedAnimal as any).location}</div>
              )}
              {((selectedAnimal as any).status) && (
                <div className="mb-3 text-sm text-gray-600">Status: {(selectedAnimal as any).status}</div>
              )}

              <div className="flex gap-3 mt-4">
                <button onClick={handleAdopt} className="btn-primary">Adopt Now</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnimalProfileModal
