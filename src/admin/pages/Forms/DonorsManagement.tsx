import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, doc, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  DollarSign,
  Download,
  Edit,
  Trash2,
  Eye
} from 'lucide-react'

type Donation = {
  id: string
  name: string
  email: string
  phone?: string | null
  amount: number
  paymentMethod: string
  reference?: string | null
  message?: string | null
  status: 'pending' | 'verified' | 'rejected'
  createdAt: string
}

const Donors = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'verified' | 'rejected'>('all')
  const [paymentFilter, setPaymentFilter] = useState<'all' | 'gcash' | 'maya' | 'bank'>('all')
  const [selectedDonation, setSelectedDonation] = useState<Donation | null>(null)
  const [showDonationModal, setShowDonationModal] = useState(false)
  const [items, setItems] = useState<Donation[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editStatus, setEditStatus] = useState<'pending' | 'verified' | 'rejected'>('pending')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'donations'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const mapped: Donation[] = snap.docs.map((d) => {
        const data: any = d.data()
        const createdAt = data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        return {
          id: d.id,
          name: data?.name || '',
          email: data?.email || '',
          phone: data?.phone || null,
          amount: Number(data?.amount || 0),
          paymentMethod: data?.paymentMethod || '',
          reference: data?.reference || null,
          message: data?.message || null,
          status: (data?.status || 'pending') as Donation['status'],
          createdAt
        }
      })
      setItems(mapped)
    })
    return () => unsub()
  }, [])

  const filteredDonations = items.filter(donation => {
    const matchesSearch = searchTerm === '' || 
      donation.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      donation.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (donation.reference && donation.reference.toLowerCase().includes(searchTerm.toLowerCase()))
    
    const matchesStatus = statusFilter === 'all' || donation.status === statusFilter
    const matchesPayment = paymentFilter === 'all' || donation.paymentMethod.toLowerCase() === paymentFilter

    return matchesSearch && matchesStatus && matchesPayment
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'verified': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPaymentIcon = (method: string) => {
    switch (method.toLowerCase()) {
      case 'gcash': return '💳'
      case 'maya': return '📱'
      case 'bank': return '🏦'
      default: return '💰'
    }
  }

  const handleViewDonation = (donation: Donation, edit = false) => {
    setSelectedDonation(donation)
    setIsEditing(!!edit)
    setEditStatus(donation.status)
    setShowDonationModal(true)
  }

  const handleSave = async () => {
    if (!db || !selectedDonation) return
    const ref = doc(db, 'donations', selectedDonation.id)
    await updateDoc(ref, {
      status: editStatus
    })
    setShowDonationModal(false)
  }

  const handleDelete = async (id: string) => {
    if (!db) return
    setDeletingId(id)
    try {
      const ref = doc(db, 'donations', id)
      await deleteDoc(ref)
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportCsv = () => {
    const rows = filteredDonations.map(d => ({
      id: d.id,
      name: d.name,
      email: d.email,
      phone: d.phone || '',
      amount: d.amount,
      paymentMethod: d.paymentMethod,
      reference: d.reference || '',
      message: d.message || '',
      status: d.status,
      createdAt: d.createdAt
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
    a.download = `donations_${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Donations Management</h1>
          <p className="text-gray-600 mt-2">Review and manage donation records and verification status.</p>
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
                  placeholder="Search donations..."
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
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Payment Method Filter */}
            <div>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Methods</option>
                <option value="gcash">GCash</option>
                <option value="maya">Maya</option>
                <option value="bank">Bank Transfer</option>
              </select>
            </div>
          </div>
        </div>

        {/* Donations Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Donations ({filteredDonations.length})
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredDonations.map((donation) => (
                  <tr key={donation.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="p-2 rounded-full bg-green-100 text-green-600">
                          <DollarSign className="h-4 w-4" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{donation.name}</div>
                          <div className="text-sm text-gray-500">{donation.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₱{donation.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <span className="text-lg mr-2">{getPaymentIcon(donation.paymentMethod)}</span>
                        <div>
                          <div className="text-sm font-medium text-gray-900 capitalize">{donation.paymentMethod}</div>
                          {donation.reference && (
                            <div className="text-sm text-gray-500">Ref: {donation.reference}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(donation.status)}`}>
                        {donation.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(donation.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</div>
                      <div className="text-gray-500">{new Date(donation.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleViewDonation(donation)} className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button onClick={() => handleViewDonation(donation, true)} className="text-orange-600 hover:text-orange-900 flex items-center space-x-1">
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button disabled={deletingId === donation.id} onClick={() => handleDelete(donation.id)} className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1">
                          <Trash2 className="h-4 w-4" />
                          <span>{deletingId === donation.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredDonations.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center text-gray-500" colSpan={6}>
                      {items.length === 0 ? 'No donations yet.' : 'No donations match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Donation Detail Modal */}
        {showDonationModal && selectedDonation && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="p-3 rounded-full bg-green-100 text-green-600">
                    <DollarSign className="h-6 w-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Donation Details</h2>
                    <p className="text-sm text-gray-600">#{selectedDonation.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDonationModal(false)}
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
                    You are editing this donation's verification status.
                  </div>
                )}

                {/* Donor Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Donor Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedDonation.name}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedDonation.email}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedDonation.phone || 'Not provided'}</p>
                    </div>
                  </div>
                </div>

                {/* Donation Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Amount</label>
                      <p className="text-2xl font-bold text-green-600">₱{selectedDonation.amount.toLocaleString()}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Payment Method</label>
                      <div className="flex items-center">
                        <span className="text-2xl mr-2">{getPaymentIcon(selectedDonation.paymentMethod)}</span>
                        <p className="text-sm text-gray-900 capitalize">{selectedDonation.paymentMethod}</p>
                      </div>
                    </div>
                    {selectedDonation.reference && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reference Number</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedDonation.reference}</p>
                      </div>
                    )}
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Donation Date</label>
                      <p className="text-sm text-gray-900">{new Date(selectedDonation.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                </div>

                {/* Message */}
                {selectedDonation.message && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Donor Message</h3>
                    <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                      {selectedDonation.message}
                    </p>
                  </div>
                )}

                {/* Status Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
                  {!isEditing ? (
                    <div className="flex items-center space-x-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                        <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedDonation.status)}`}>
                          {selectedDonation.status}
                        </span>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Donation Date</label>
                        <p className="text-sm text-gray-900">{new Date(selectedDonation.createdAt).toLocaleDateString()}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                          <option value="pending">Pending</option>
                          <option value="verified">Verified</option>
                          <option value="rejected">Rejected</option>
                        </select>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowDonationModal(false)}
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
      </div>
    </div>
  )
}

export default Donors


