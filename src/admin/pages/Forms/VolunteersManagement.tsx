import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { 
  Search, 
  XCircle, 
  User,
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

type Volunteer = {
  id: string
  name: string
  email: string
  phone: string
  barangay: string
  skills?: string
  availability?: string
  preferredRoles?: string[]
  experience?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const Volunteers = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null)
  const [showVolunteerModal, setShowVolunteerModal] = useState(false)
  const [items, setItems] = useState<Volunteer[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editStatus, setEditStatus] = useState<'pending' | 'approved' | 'rejected'>('pending')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [volunteerToDelete, setVolunteerToDelete] = useState<{id: string, name: string, email: string} | null>(null)
  const [deletedVolunteers, setDeletedVolunteers] = useState<Volunteer[]>([])
  const [showUndo, setShowUndo] = useState(false)

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'volunteers'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const mapped: Volunteer[] = snap.docs.map((d) => {
        const data: any = d.data()
        const createdAt = data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : (typeof data?.createdAt === 'string' ? data.createdAt : 'Invalid Date')
        return {
          id: d.id,
          name: data?.name || '',
          email: data?.email || '',
          phone: data?.phone || '',
          barangay: data?.barangay || '',
          skills: data?.skills || '',
          availability: data?.availability || '',
          preferredRoles: Array.isArray(data?.preferredRoles) ? data.preferredRoles : [],
          experience: data?.experience || '',
          status: (data?.status || 'pending') as Volunteer['status'],
          createdAt
        }
      })
      setItems(mapped)
    })
    return () => unsub()
  }, [])

  const filteredVolunteers = items.filter(volunteer => {
    const matchesSearch = searchTerm === '' || 
      volunteer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      volunteer.barangay.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || volunteer.status === statusFilter

    return matchesSearch && matchesStatus
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleViewVolunteer = (volunteer: Volunteer, edit = false) => {
    setSelectedVolunteer(volunteer)
    setIsEditing(!!edit)
    setEditStatus(volunteer.status)
    setShowVolunteerModal(true)
  }

  const handleSave = async () => {
    if (!db || !selectedVolunteer) return
    const ref = doc(db, 'volunteers', selectedVolunteer.id)
    await updateDoc(ref, {
      status: editStatus
    })
    setShowVolunteerModal(false)
  }

  const handleDeleteClick = (volunteer: Volunteer) => {
    setVolunteerToDelete({
      id: volunteer.id,
      name: volunteer.name,
      email: volunteer.email
    })
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!db || !volunteerToDelete) return
    
    // Store the volunteer for potential undo
    const volunteerToUndo = items.find(v => v.id === volunteerToDelete.id)
    if (volunteerToUndo) {
      setDeletedVolunteers(prev => [...prev, volunteerToUndo])
      setShowUndo(true)
      // Auto-hide undo after 10 seconds
      setTimeout(() => setShowUndo(false), 10000)
    }
    
    setDeletingId(volunteerToDelete.id)
    setShowDeleteConfirm(false)
    
    try {
      const ref = doc(db, 'volunteers', volunteerToDelete.id)
      await deleteDoc(ref)
    } finally {
      setDeletingId(null)
      setVolunteerToDelete(null)
    }
  }

  const handleUndoDelete = async () => {
    if (!db || deletedVolunteers.length === 0) return
    
    const lastDeleted = deletedVolunteers[deletedVolunteers.length - 1]
    
    try {
      // Restore the volunteer by adding it back to the database
      const volunteerData = {
        ...lastDeleted,
        createdAt: new Date(),
        id: undefined // Let Firestore generate new ID
      }
      delete volunteerData.id
      
      await addDoc(collection(db, 'volunteers'), volunteerData)
      
      // Remove from deleted volunteers
      setDeletedVolunteers(prev => prev.slice(0, -1))
      setShowUndo(false)
    } catch (error) {
      console.error('Failed to undo delete:', error)
    }
  }

  const handleExportCsv = () => {
    const rows = filteredVolunteers.map(v => ({
      id: v.id,
      name: v.name,
      email: v.email,
      phone: v.phone,
      barangay: v.barangay,
      skills: v.skills || '',
      availability: v.availability || '',
      preferredRoles: (v.preferredRoles || []).join(', '),
      experience: v.experience || '',
      status: v.status,
      createdAt: v.createdAt
    }))
    const header = Object.keys(rows[0] || { id: 'id' }).join(',')
    const body = rows.map(obj => Object.values(obj).map(v => {
      const s = String(v ?? '')
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
    }).join(',')).join('\n')
    const csv = [header, body].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `volunteers_${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Volunteers Management</h1>
          <p className="text-gray-600 mt-2">Review and manage volunteer applications and information.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search volunteers..."
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
          </div>
        </div>

        {/* Volunteers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Volunteers ({filteredVolunteers.length})
              </h2>
              <button onClick={handleExportCsv} className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Volunteer</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVolunteers.map((volunteer) => (
                  <tr key={volunteer.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-blue-100 text-blue-600">
                          <User className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{volunteer.name}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{volunteer.email}</div>
                      <div className="text-sm text-gray-500">{volunteer.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(volunteer.status)}`}>
                        {volunteer.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(volunteer.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</div>
                      <div className="text-gray-500">{new Date(volunteer.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleViewVolunteer(volunteer)} className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button onClick={() => handleViewVolunteer(volunteer, true)} className="text-orange-600 hover:text-orange-900 flex items-center space-x-1">
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button disabled={deletingId === volunteer.id} onClick={() => handleDeleteClick(volunteer)} className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1">
                          <Trash2 className="h-4 w-4" />
                          <span>{deletingId === volunteer.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredVolunteers.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center text-gray-500" colSpan={5}>
                      {items.length === 0 ? 'No volunteers yet.' : 'No volunteers match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Volunteer Detail Modal */}
        {showVolunteerModal && selectedVolunteer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Volunteer Profile</h2>
                    <p className="text-sm text-gray-600">#{selectedVolunteer.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowVolunteerModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Edit Toggle */}
                {isEditing && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
                    You are editing this volunteer's status.
                  </div>
                )}

                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedVolunteer.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedVolunteer.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedVolunteer.phone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Barangay</label>
                      <p className="text-sm text-gray-900">{selectedVolunteer.barangay}</p>
                    </div>
                  </div>
                </div>

                {/* Volunteer Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Volunteer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Availability</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedVolunteer.availability || 'Not specified'}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Preferred Roles</label>
                      <p className="text-sm text-gray-900">{(selectedVolunteer.preferredRoles || []).join(', ') || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Skills</label>
                      <p className="text-sm text-gray-900">{selectedVolunteer.skills || 'Not specified'}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Experience</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                        {selectedVolunteer.experience || 'No experience provided'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Status Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
                  {!isEditing ? (
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedVolunteer.status)}`}>
                          {selectedVolunteer.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Application Date</label>
                        <p className="text-sm text-gray-900">{new Date(selectedVolunteer.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                          <option value="pending">Pending</option>
                          <option value="approved">Approved</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowVolunteerModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  {isEditing ? (
                    <button onClick={handleSave} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                      Save Changes
                    </button>
                  ) : (
                    <button onClick={() => setIsEditing(true)} className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors">
                      Edit Status
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteConfirm && volunteerToDelete && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 bg-red-100 rounded-full">
                  <Trash2 className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">Delete Volunteer</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete the volunteer application from <span className="font-medium">{volunteerToDelete.name}</span>?
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
                  disabled={deletingId === volunteerToDelete.id}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
                >
                  <Trash2 className="h-4 w-4" />
                  <span>{deletingId === volunteerToDelete.id ? 'Deleting...' : 'Delete Volunteer'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Undo Notification */}
        {showUndo && deletedVolunteers.length > 0 && (
          <div className="fixed bottom-4 right-4 z-50">
            <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
              <div className="flex items-start space-x-3">
                <div className="p-1 bg-green-100 rounded-full">
                  <User className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Volunteer deleted</p>
                  <p className="text-xs text-gray-600 mt-1">
                    {deletedVolunteers[deletedVolunteers.length - 1]?.name}'s application has been deleted.
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

export default Volunteers


