import { useEffect, useState } from 'react'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  XCircle
} from 'lucide-react'

import { listAllAnimalsForAdmin, deleteAnimal, createAnimal, updateAnimal, setAnimalStatus, type AnimalRecord, type AnimalType, type AnimalStatus } from '../../../shared/utils/animalsService'
import { supabase } from '../../../config/supabase'

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
  const [animals, setAnimals] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [addError, setAddError] = useState<string | null>(null)
  const [addWarning, setAddWarning] = useState<string | null>(null)
  const [newAnimal, setNewAnimal] = useState<Partial<AnimalRecord>>({
    name: '',
    type: 'dog',
    status: 'available',
    isPublished: false
  })
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [editing, setEditing] = useState(false)
  const [editValues, setEditValues] = useState<Partial<AnimalRecord>>({})
  const [editImageFile, setEditImageFile] = useState<File | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      try {
        setLoading(true)
        const rows: AnimalRecord[] = await listAllAnimalsForAdmin(200)
        if (!mounted) return
        setAnimals(rows)
      } catch (e: any) {
        if (mounted) setError(e?.message || 'Failed to load animals')
      } finally {
        if (mounted) setLoading(false)
      }
    }
    load()
    return () => { mounted = false }
  }, [])

  const filteredAnimals = animals.filter(animal => {
    const matchesSearch = searchTerm === '' || 
      (animal.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animal.breed || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (animal.microchipId || '').toLowerCase().includes(searchTerm.toLowerCase())
    
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
    if (!dateString) return '—'
    const dt = new Date(dateString)
    if (isNaN(dt.getTime())) return '—'
    return dt.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })
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
      setTimeout(() => setShowUndo(false), 10000)
    }
    
    setDeletingId(animalToDelete.id)
    setShowDeleteConfirm(false)
    
    try {
      await deleteAnimal(animalToDelete.id)
      setAnimals(prev => prev.filter(animal => animal.id !== animalToDelete.id))
    } catch (e) {
      // If deletion fails, revert undo notification
      setShowUndo(false)
    } finally {
      setDeletingId(null)
      setAnimalToDelete(null)
    }
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

        {/* Animals Table - matches Lost&Found layout style */}
        {loading ? (
          <div className="text-center py-16 text-gray-600">Loading animals…</div>
        ) : error ? (
          <div className="text-center py-16 text-red-600">{error}</div>
        ) : (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fee</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Updated</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredAnimals.map((animal: any) => (
                    <tr key={animal.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                            {animal.images && animal.images.length > 0 ? (
                              <img src={animal.images[0]} alt={animal.name} className="w-full h-full object-cover" />
                            ) : (
                              <span className="text-xl">{animal.type === 'dog' ? '🐕' : '🐱'}</span>
                            )}
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">{animal.name}</div>
                            <div className="text-sm text-gray-500 capitalize">{animal.type} • {animal.breed || '—'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(animal.status)}`}>{animal.status}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">{animal.type}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{animal.adoptionFee != null ? formatCurrency(animal.adoptionFee) : '—'}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatDate(animal.updatedAt)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button onClick={() => handleViewAnimal(animal)} className="text-orange-600 hover:text-orange-700 flex items-center space-x-1">
                            <Eye className="h-4 w-4" /><span>View</span>
                          </button>
                          <button onClick={() => { setSelectedAnimal(animal); setEditValues(animal); setShowAnimalModal(true); setEditing(true) }} className="text-blue-600 hover:text-blue-700 flex items-center space-x-1">
                            <Edit className="h-4 w-4" /><span>Edit</span>
                          </button>
                          <button disabled={deletingId === animal.id} onClick={() => handleDeleteClick(animal)} className="text-red-600 hover:text-red-700 disabled:opacity-50 flex items-center space-x-1">
                            <Trash2 className="h-4 w-4" /><span>{deletingId === animal.id ? 'Deleting...' : 'Delete'}</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Animal Detail Modal */}
        {showAnimalModal && selectedAnimal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 rounded-lg overflow-hidden bg-orange-100 flex items-center justify-center">
                    {selectedAnimal.images && selectedAnimal.images.length > 0 ? (
                      <img src={selectedAnimal.images[0]} alt={selectedAnimal.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-xl">{selectedAnimal.type === 'dog' ? '🐕' : '🐱'}</span>
                    )}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">{selectedAnimal.name || 'Untitled'}</h2>
                    <p className="text-sm text-gray-600">#{selectedAnimal.id} {selectedAnimal.breed ? `• ${selectedAnimal.breed}` : ''}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {editing ? (
                <button
                      onClick={async () => {
                        await updateAnimal(selectedAnimal.id, editValues)
                        setAnimals((prev: any[]) => prev.map(a => a.id === selectedAnimal.id ? { ...a, ...editValues } : a))
                        setSelectedAnimal((prev: any) => ({ ...prev, ...editValues }))
                        setEditing(false)
                      }}
                      className="text-green-600 hover:text-green-700 font-medium"
                    >
                      Save
                    </button>
                  ) : (
                    <button onClick={() => { setEditing(true); setEditValues(selectedAnimal) }} className="text-blue-600 hover:text-blue-700 font-medium">Edit</button>
                  )}
                  <button onClick={() => { setShowAnimalModal(false); setEditing(false) }} className="text-gray-400 hover:text-gray-600">
                  <XCircle className="h-6 w-6" />
                </button>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Compact view like user modal when not editing */}
                {/* Single layout with inline edit controls like Lost&Found */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="md:col-span-1 flex flex-col items-center">
                    <div className="w-full h-48 md:h-64 rounded-lg overflow-hidden bg-gray-100">
                      {selectedAnimal.images && selectedAnimal.images.length > 0 ? (
                        <img src={editImageFile ? URL.createObjectURL(editImageFile) : selectedAnimal.images[0]} alt={selectedAnimal.name} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">{selectedAnimal.type === 'dog' ? '🐕' : '🐱'}</div>
                      )}
                    </div>
                    {editing && (
                      <div className="w-full mt-3">
                        <input type="file" accept="image/*" onChange={(e) => setEditImageFile(e.target.files?.[0] || null)} />
                      </div>
                    )}
                  </div>
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex flex-wrap gap-3 items-center">
                      {editing ? (
                        <input className="border-b border-gray-300 focus:outline-none focus:border-orange-500 text-2xl font-bold" value={editValues.name || ''} onChange={(e) => setEditValues((v) => ({...v, name: e.target.value}))} />
                      ) : (
                        <h2 className="text-2xl font-bold">{selectedAnimal.name || 'Untitled'}</h2>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-3 items-center">
                      <div className="px-3 py-1 bg-pink-50 rounded text-sm">
                        Breed: {editing ? (
                          <input className="ml-2 border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editValues.breed || ''} onChange={(e) => setEditValues((v) => ({...v, breed: e.target.value}))} />
                        ) : (selectedAnimal.breed || '—')}
                      </div>
                      <div className="px-3 py-1 bg-pink-50 rounded text-sm">
                        Age: {editing ? (
                          <input className="ml-2 border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editValues.age || ''} onChange={(e) => setEditValues((v) => ({...v, age: e.target.value}))} />
                        ) : (selectedAnimal.age || '—')}
                      </div>
                      <div className="px-3 py-1 bg-pink-50 rounded text-sm">
                        Sex: {editing ? (
                          <select className="ml-2 border rounded px-2 py-1 focus:outline-none focus:border-orange-500" value={editValues.gender || ''} onChange={(e) => setEditValues((v) => ({...v, gender: e.target.value}))}>
                            <option value="">Select</option>
                            <option value="Male">Male</option>
                            <option value="Female">Female</option>
                          </select>
                        ) : (selectedAnimal.gender || '—')}
                      </div>
                    </div>
                    <div className="text-gray-700 whitespace-pre-line">
                      {editing ? (
                        <textarea className="w-full border rounded px-3 py-2" rows={4} value={editValues.description || ''} onChange={(e) => setEditValues((v) => ({...v, description: e.target.value}))} />
                      ) : (
                        selectedAnimal.description || '—'
                      )}
                    </div>
                  </div>
                </div>
                {/* Adoption Fee (kept minimal) */}
                {editing ? (
                <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Adoption Fee</h3>
                    <input type="number" className="text-sm w-full px-3 py-2 border rounded-lg" value={editValues.adoptionFee ?? ''} onChange={(e) => setEditValues((s) => ({...s, adoptionFee: Number(e.target.value)}))} />
                    </div>
                ) : (
                  selectedAnimal.adoptionFee != null && (
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 mb-2">Adoption Fee</h3>
                      <p className="text-sm text-gray-900">{formatCurrency(selectedAnimal.adoptionFee)}</p>
                    </div>
                  )
                )}

                {/* Removed Intake/Description/Behavior/Medical sections per UX simplification */}
                )

                {/* Publish & Status Controls */}
                <div className="flex items-center justify-between py-4">
                  <div className="flex items-center space-x-2">
                    <input
                      id="modalPublish"
                      type="checkbox"
                      checked={Boolean(editing ? editValues.isPublished : selectedAnimal.isPublished)}
                      onChange={async (e) => {
                        const next = e.target.checked
                        if (editing) {
                          setEditValues((s) => ({...s, isPublished: next}))
                        } else {
                          await updateAnimal(selectedAnimal.id, { isPublished: next })
                          setSelectedAnimal((prev: any) => ({...prev, isPublished: next}))
                          setAnimals((prev: any[]) => prev.map(a => a.id === selectedAnimal.id ? {...a, isPublished: next} : a))
                        }
                      }}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                    />
                    <label htmlFor="modalPublish" className="text-sm text-gray-700">Published</label>
                  </div>
                  <div>
                    <label className="text-sm text-gray-700 mr-2">Status</label>
                    <select
                      className="text-sm px-3 py-2 border rounded-lg"
                      value={(editing ? (editValues.status as any) : selectedAnimal.status) || 'available'}
                      onChange={async (e) => {
                        const newStatus = e.target.value as AnimalStatus
                        if (!editing) {
                          await setAnimalStatus(selectedAnimal.id, newStatus)
                          setSelectedAnimal((prev: any) => ({...prev, status: newStatus}))
                          setAnimals((prev: any[]) => prev.map(a => a.id === selectedAnimal.id ? {...a, status: newStatus} : a))
                        } else {
                          setEditValues((s) => ({...s, status: newStatus}))
                        }
                      }}
                    >
                      <option value="available">Available</option>
                      <option value="pending">Pending</option>
                      <option value="adopted">Adopted</option>
                    </select>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => { setShowAnimalModal(false); setEditing(false) }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  {!editing ? (
                    <button onClick={() => { setEditing(true); setEditValues(selectedAnimal) }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                    Edit Animal
                  </button>
                  ) : (
                    <>
                      <button onClick={() => { setEditing(false); setEditValues({}) }} className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                        Cancel
                      </button>
                      <button
                        onClick={async () => {
                          await updateAnimal(selectedAnimal.id, editValues)
                          setAnimals((prev: any[]) => prev.map(a => a.id === selectedAnimal.id ? {...a, ...editValues} : a))
                          setSelectedAnimal((prev: any) => ({...prev, ...editValues}))
                          setEditing(false)
                        }}
                        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                      >
                        Save Changes
                  </button>
                    </>
                  )}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      value={newAnimal.name || ''}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, name: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Jepoy"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Type</label>
                    <select
                      value={(newAnimal.type as AnimalType) || 'dog'}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, type: e.target.value as AnimalType }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="dog">Dog</option>
                      <option value="cat">Cat</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Breed</label>
                    <input
                      value={newAnimal.breed || ''}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, breed: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., Labrador"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Age</label>
                    <input
                      value={newAnimal.age || ''}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, age: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., 2 years"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Gender</label>
                    <select
                      value={newAnimal.gender || ''}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, gender: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="">Select gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      value={(newAnimal.status as AnimalStatus) || 'available'}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, status: e.target.value as AnimalStatus }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="available">Available</option>
                      <option value="pending">Pending</option>
                      <option value="adopted">Adopted</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Adoption Fee (PHP)</label>
                    <input
                      type="number"
                      value={newAnimal.adoptionFee ?? ''}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, adoptionFee: Number(e.target.value) }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="e.g., 2000"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Description</label>
                    <textarea
                      value={newAnimal.description || ''}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, description: e.target.value }))}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      rows={3}
                      placeholder="Short description"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700">Image</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setNewImageFile(e.target.files && e.target.files[0] ? e.target.files[0] : null)}
                      className="mt-1 w-full"
                    />
                  </div>
                  <div className="flex items-center space-x-2 md:col-span-2">
                    <input
                      id="isPublished"
                      type="checkbox"
                      checked={Boolean(newAnimal.isPublished)}
                      onChange={(e) => setNewAnimal((s) => ({ ...s, isPublished: e.target.checked }))}
                      className="h-4 w-4 text-orange-600 border-gray-300 rounded"
                    />
                    <label htmlFor="isPublished" className="text-sm text-gray-700">Published (visible to public)</label>
                  </div>
                </div>

                <div className="flex items-center justify-end space-x-4">
                  {addError && (
                    <div className="w-full mb-3 p-3 rounded-lg bg-red-50 text-red-700 text-sm border border-red-200">{addError}</div>
                  )}
                  {addWarning && (
                    <div className="w-full mb-3 p-3 rounded-lg bg-yellow-50 text-yellow-800 text-sm border border-yellow-200">{addWarning}</div>
                  )}
                  <button
                    onClick={() => { setShowAddModal(false); setNewAnimal({ name: '', type: 'dog', status: 'available', isPublished: false }) }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    disabled={saving}
                  >
                    Close
                  </button>
                  <button
                    onClick={async () => {
                      if (!newAnimal.name || !newAnimal.type || !newAnimal.status) return
                      try {
                        setSaving(true)
                        setAddError(null)
                        setAddWarning(null)
                        let images: string[] | undefined = undefined
                        if (newImageFile && supabase) {
                          try {
                            const bucket = 'report-uploads'
                            const safeName = newImageFile.name.replace(/[^a-zA-Z0-9_.-]/g, '_')
                            const key = `animals/${Date.now()}-${Math.random().toString(36).slice(2)}-${safeName}`
                            const { error: uploadError } = await supabase.storage.from(bucket).upload(key, newImageFile, {
                              upsert: false,
                              cacheControl: '3600',
                              contentType: newImageFile.type
                            })
                            if (uploadError) throw new Error(uploadError.message)
                            const { data, error: urlError } = await supabase.storage.from(bucket).createSignedUrl(key, 60 * 60 * 24 * 365)
                            if (urlError || !data?.signedUrl) throw new Error(urlError?.message || 'No signed URL')
                            images = [data.signedUrl]
                          } catch (e: any) {
                            setAddWarning('Image upload failed. Saved without image. (Check Supabase config/rules)')
                          }
                        }
                        const id = await createAnimal({
                          name: newAnimal.name!,
                          type: newAnimal.type as AnimalType,
                          status: newAnimal.status as AnimalStatus,
                          isPublished: Boolean(newAnimal.isPublished),
                          breed: newAnimal.breed,
                          age: newAnimal.age,
                          gender: newAnimal.gender,
                          description: newAnimal.description,
                          adoptionFee: newAnimal.adoptionFee,
                          images
                        })
                        setAnimals((prev) => [{ id, ...newAnimal, images } as any, ...prev])
                        setShowAddModal(false)
                        setNewAnimal({ name: '', type: 'dog', status: 'available', isPublished: false })
                        setNewImageFile(null)
                      } catch (e: any) {
                        const msg = e?.message || 'Failed to save. Are you logged in as an admin?'
                        setAddError(msg)
                      } finally {
                        setSaving(false)
                      }
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                    disabled={saving || !newAnimal.name}
                  >
                    {saving ? 'Saving…' : 'Add Animal'}
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
