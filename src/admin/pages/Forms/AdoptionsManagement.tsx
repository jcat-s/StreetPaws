import { useEffect, useState } from 'react'
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Heart,
  Trash2
} from 'lucide-react'

import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { getAnimalById } from '../../../shared/utils/animalsService'

type Adoption = any

const AdoptionsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [animalFilter, setAnimalFilter] = useState<'all' | 'dog' | 'cat'>('all')
  const [selectedAdoption, setSelectedAdoption] = useState<any>(null)
  const [items, setItems] = useState<Adoption[]>([])

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'adoptions'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const mapped = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Adoption[]
      setItems(mapped)
    })
    return () => unsub()
  }, [])

  // Enrich items with animal image if missing
  useEffect(() => {
    let cancelled = false
    async function enrich() {
      const toFetch = items.filter((it: any) => !it.animalImage && it.animalId)
      for (const it of toFetch) {
        try {
          const animal = await getAnimalById(it.animalId)
          if (cancelled || !animal) continue
          const image = (animal.images && animal.images[0]) || null
          if (!image) continue
          setItems((prev: any[]) => prev.map(p => p.id === it.id ? { ...p, animalImage: image } : p))
        } catch (_) {
          // ignore
        }
      }
    }
    if (items.length > 0) enrich()
    return () => { cancelled = true }
  }, [items])
  const [showAdoptionModal, setShowAdoptionModal] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve')
  const [decisionReason, setDecisionReason] = useState('')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [adoptionToDelete, setAdoptionToDelete] = useState<{id: string, applicantName: string, animalName: string} | null>(null)
  const [deletedAdoptions, setDeletedAdoptions] = useState<Adoption[]>([])
  const [showUndo, setShowUndo] = useState(false)

  const filteredAdoptions = items.filter((adoption: any) => {
    const matchesSearch = searchTerm === '' || 
      adoption.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adoption.animalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adoption.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || adoption.status === statusFilter
    const matchesAnimal = animalFilter === 'all' || adoption.animalType === animalFilter

    return matchesSearch && matchesStatus && matchesAnimal
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const toDateSafe = (value: any): Date | null => {
    if (!value) return null
    if (value && typeof value.toDate === 'function') {
      try { return value.toDate() } catch {}
    }
    if (value && typeof value.seconds === 'number') {
      try { return new Date(value.seconds * 1000) } catch {}
    }
    if (typeof value === 'string') {
      try { return new Date(value) } catch {}
    }
    return null
  }

  const handleViewAdoption = (adoption: any) => {
    setSelectedAdoption(adoption)
    setShowAdoptionModal(true)
  }

  const handleMakeDecision = (adoption: any, type: 'approve' | 'reject') => {
    setSelectedAdoption(adoption)
    setDecisionType(type)
    setDecisionReason(adoption?.decisionReason || '')
    setShowDecisionModal(true)
  }

  const handleSubmitDecision = async () => {
    if (!db || !selectedAdoption) return
    
    try {
      const ref = doc(db, 'adoptions', selectedAdoption.id)
      await updateDoc(ref, {
        status: decisionType === 'approve' ? 'approved' : 'rejected',
        decisionReason,
        reviewedBy: 'Admin', // In production, use actual admin name
        reviewedAt: new Date().toISOString()
      })
      try {
        await addDoc(collection(db, 'notifications'), {
          adoptionId: selectedAdoption.id,
          recipientUid: selectedAdoption.userId || null,
          recipientEmail: selectedAdoption.applicantEmail || null,
          status: decisionType === 'approve' ? 'approved' : 'rejected',
          reason: decisionReason,
          animalName: selectedAdoption.animalName,
          createdAt: serverTimestamp(),
          read: false
        })
      } catch {}
    } catch (error) {
      console.error('Failed to update adoption status:', error)
    }
    
    setShowDecisionModal(false)
    setShowAdoptionModal(false)
  }

  const handleDeleteClick = (adoption: Adoption) => {
    setAdoptionToDelete({
      id: adoption.id,
      applicantName: adoption.applicantName,
      animalName: adoption.animalName
    })
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!db || !adoptionToDelete) return
    
    // Store the adoption for potential undo
    const adoptionToUndo = items.find(a => a.id === adoptionToDelete.id)
    if (adoptionToUndo) {
      setDeletedAdoptions(prev => [...prev, adoptionToUndo])
      setShowUndo(true)
      // Auto-hide undo after 10 seconds
      setTimeout(() => setShowUndo(false), 10000)
    }
    
    setDeletingId(adoptionToDelete.id)
    setShowDeleteConfirm(false)
    
    try {
      const ref = doc(db, 'adoptions', adoptionToDelete.id)
      await deleteDoc(ref)
    } finally {
      setDeletingId(null)
      setAdoptionToDelete(null)
    }
  }

  const handleUndoDelete = async () => {
    if (!db || deletedAdoptions.length === 0) return
    
    const lastDeleted = deletedAdoptions[deletedAdoptions.length - 1]
    
    try {
      // Restore the adoption by adding it back to the database
      const adoptionData = {
        ...lastDeleted,
        submittedAt: serverTimestamp(),
        id: undefined // Let Firestore generate new ID
      }
      delete adoptionData.id
      
      await addDoc(collection(db, 'adoptions'), adoptionData)
      
      // Remove from deleted adoptions
      setDeletedAdoptions(prev => prev.slice(0, -1))
      setShowUndo(false)
    } catch (error) {
      console.error('Failed to undo delete:', error)
    }
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Adoption Management</h1>
          <p className="text-gray-600 mt-2">Review and manage adoption applications from potential pet owners.</p>
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
                  placeholder="Search applications..."
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
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Animal Type Filter */}
            <div>
              <select
                value={animalFilter}
                onChange={(e) => setAnimalFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Animals</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
              </select>
            </div>
          </div>
        </div>

        {/* Adoptions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Adoption Applications ({filteredAdoptions.length})
              </h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdoptions.map((adoption) => (
                  <tr key={adoption.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-12 h-12 rounded bg-gray-100 overflow-hidden flex items-center justify-center">
                          {adoption.animalImage ? (
                            <img src={adoption.animalImage} alt={adoption.animalName} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xl">{adoption.animalType === 'dog' ? '🐕' : '🐱'}</span>
                          )}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{adoption.animalName}</div>
                          <div className="text-sm text-gray-500 capitalize">{adoption.animalType} • {adoption.animalBreed || '—'}</div>
                          {adoption.animalAdoptionFee != null && (
                            <div className="text-xs text-gray-600">Fee: ₱{Number(adoption.animalAdoptionFee).toLocaleString('en-PH')}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{adoption.applicantName}</div>
                      <div className="text-sm text-gray-500">{adoption.applicantEmail}</div>
                      <div className="text-sm text-gray-500">{adoption.applicantPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adoption.status)}`}>
                        {adoption.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{(toDateSafe(adoption.submittedAt) || new Date(NaN)).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</div>
                      <div className="text-gray-500">{(toDateSafe(adoption.submittedAt) || new Date(NaN)).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewAdoption(adoption)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <>
                          <button
                            onClick={() => handleMakeDecision(adoption, 'approve')}
                            className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                          >
                            <CheckCircle className="h-4 w-4" />
                            <span>{adoption.status === 'approved' ? 'Change to Approve' : 'Approve'}</span>
                          </button>
                          <button
                            onClick={() => handleMakeDecision(adoption, 'reject')}
                            className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                          >
                            <XCircle className="h-4 w-4" />
                            <span>{adoption.status === 'rejected' ? 'Change to Reject' : 'Reject'}</span>
                          </button>
                        </>
                        <button 
                          disabled={deletingId === adoption.id} 
                          onClick={() => handleDeleteClick(adoption)} 
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{deletingId === adoption.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adoption Detail Modal */}
        {showAdoptionModal && selectedAdoption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Heart className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Adoption Application</h2>
                    <p className="text-sm text-gray-600">#{selectedAdoption.id} • {selectedAdoption.animalName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdoptionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Animal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.animalName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedAdoption.animalType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Breed</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.animalBreed}</p>
                    </div>
                  </div>
                </div>

                {/* Applicant Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantAge} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupation</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantOccupation}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantPhone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Barangay</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantBarangay}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Home Environment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Home Environment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Home Type</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.homeType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Has Yard</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.hasYard}</p>
                    </div>
                    {selectedAdoption.yardSize && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Yard Size</label>
                        <p className="text-sm text-gray-900">{selectedAdoption.yardSize}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Other Pets</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.hasOtherPets}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Children</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.hasChildren}</p>
                    </div>
                    {selectedAdoption.otherPetsDetails && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Other Pets Details</label>
                        <p className="text-sm text-gray-900">{selectedAdoption.otherPetsDetails}</p>
                      </div>
                    )}
                    {selectedAdoption.childrenAges && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Children Ages</label>
                        <p className="text-sm text-gray-900">{selectedAdoption.childrenAges}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experience & Knowledge */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience & Knowledge</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pet Experience</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.petExperience}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Veterinary Knowledge</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.vetKnowledge}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time Commitment</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.timeCommitment}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Exercise Plan</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.exercisePlan}</p>
                    </div>
                  </div>
                </div>

                {/* References */}
                <div>
            
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Reference</h4>
                      <p className="text-sm text-gray-900"><strong>Name:</strong> {selectedAdoption.reference1Name}</p>
                      <p className="text-sm text-gray-900"><strong>Phone:</strong> {selectedAdoption.reference1Phone}</p>
                      <p className="text-sm text-gray-900"><strong>Relation:</strong> {selectedAdoption.reference1Relation}</p>
                    </div>
                    {/* Only one reference is collected in the form; removed Reference 2 */}
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adoption Reason</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.adoptionReason}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Plan</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.emergencyPlan}</p>
                    </div>
                    {selectedAdoption.specialNeeds && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Special Needs</label>
                        <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.specialNeeds}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Status</label>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedAdoption.status)}`}>
                        {selectedAdoption.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                      <p className="text-sm text-gray-900">{(toDateSafe(selectedAdoption.submittedAt) || new Date(NaN)).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</p>
                    </div>
                    {selectedAdoption.reviewedBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reviewed By</label>
                        <p className="text-sm text-gray-900">{selectedAdoption.reviewedBy}</p>
                      </div>
                    )}
                    {selectedAdoption.reviewedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reviewed At</label>
                        <p className="text-sm text-gray-900">{(toDateSafe(selectedAdoption.reviewedAt) || new Date(NaN)).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}</p>
                      </div>
                    )}
                  </div>
                  {selectedAdoption.decisionReason && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Decision Reason</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.decisionReason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowAdoptionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  {selectedAdoption.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleMakeDecision(selectedAdoption, 'approve')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleMakeDecision(selectedAdoption, 'reject')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Decision Modal */}
        {showDecisionModal && selectedAdoption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-full ${decisionType === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {decisionType === 'approve' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {decisionType === 'approve' ? 'Approve' : 'Reject'} Adoption
                  </h2>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {decisionType === 'approve' 
                    ? `Are you sure you want to approve ${selectedAdoption.applicantName}'s adoption application for ${selectedAdoption.animalName}?`
                    : `Are you sure you want to reject ${selectedAdoption.applicantName}'s adoption application for ${selectedAdoption.animalName}?`
                  }
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {decisionType === 'approve' ? 'Approval' : 'Rejection'} Reason
                  </label>
                  <textarea
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder={`Enter the reason for ${decisionType === 'approve' ? 'approval' : 'rejection'}...`}
                  />
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowDecisionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitDecision}
                    disabled={!decisionReason.trim()}
                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                      decisionType === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
                        : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    }`}
                  >
                    {decisionType === 'approve' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>{decisionType === 'approve' ? 'Approve' : 'Reject'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && adoptionToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Adoption</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete the adoption application from <span className="font-medium">{adoptionToDelete.applicantName}</span> for <span className="font-medium">{adoptionToDelete.animalName}</span>?
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
                  disabled={deletingId === adoptionToDelete.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deletingId === adoptionToDelete.id ? 'Deleting...' : 'Delete Adoption'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Notification */}
        {showUndo && deletedAdoptions.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-green-100 rounded-full">
                  <Heart className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Adoption deleted</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {deletedAdoptions[deletedAdoptions.length - 1]?.applicantName}'s adoption application has been deleted.
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

export default AdoptionsManagement
