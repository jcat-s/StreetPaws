import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { collection, doc, onSnapshot, orderBy, query, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { createSignedEvidenceUrl } from '../../user/utils/reportService'
import { 
  Search, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  FileText,
  Download,
  Edit,
  Trash2
} from 'lucide-react'

type AdminReport = {
  id: string
  type: 'lost' | 'found' | 'abuse' | string
  // animal info (varies by type)
  animalName?: string
  animalType?: string
  breed?: string
  age?: string
  gender?: string
  colors?: string
  size?: string
  // location/time (varies by type)
  lastSeenLocation?: string
  lastSeenDate?: string
  lastSeenTime?: string
  // reporter
  reporterName?: string
  reporterPhone?: string
  reporterEmail?: string
  // admin/meta
  additionalDetails?: string
  status: string
  priority: 'urgent' | 'high' | 'medium' | 'normal'
  createdAt: string
  assignedTo?: string | null
  attachments?: string[]
}

const ReportsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found' | 'abuse'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'normal'>('all')
  const [selectedReport, setSelectedReport] = useState<any>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reports, setReports] = useState<AdminReport[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editStatus, setEditStatus] = useState<'pending' | 'investigating' | 'resolved'>('pending')
  const [editPriority, setEditPriority] = useState<'urgent' | 'high' | 'medium' | 'normal'>('normal')
  const [editAssignedTo, setEditAssignedTo] = useState<string>('')
  const [editPublished, setEditPublished] = useState<boolean>(false)
  const [attachmentUrls, setAttachmentUrls] = useState<string[]>([])
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const location = useLocation()

  useEffect(() => {
    const path = location.pathname || ''
    if (path.includes('/lost')) setTypeFilter('lost')
    else if (path.includes('/found')) setTypeFilter('found')
    else if (path.includes('/abuse')) setTypeFilter('abuse')
    else setTypeFilter('all')
  }, [location.pathname])

  useEffect(() => {
    if (!db) return
    
    let allReports: AdminReport[] = []
    
    // Helper function to process documents from any collection
    const processDocs = (docs: any[], collectionType: string) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        const type: string = d?.type || collectionType
        const createdAtIso: string = d?.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (typeof d?.createdAt === 'string' ? d.createdAt : new Date().toISOString())
        const status: string = d?.status === 'open' ? 'pending' : (d?.status || 'pending')
        const base = {
          id: doc.id,
          type,
          reporterName: d?.contactName || 'Unknown',
          reporterPhone: d?.contactPhone || '',
          reporterEmail: d?.contactEmail || '',
          additionalDetails: d?.additionalDetails || '',
          status,
          priority: (d?.priority || 'normal') as AdminReport['priority'],
          createdAt: createdAtIso,
          assignedTo: d?.assignedTo || null,
          attachments: [] as string[]
        }

        if (type === 'lost') {
          return {
            ...base,
            animalName: d?.animalName || 'Unknown',
            animalType: d?.animalType || 'unknown',
            breed: d?.breed || '',
            age: d?.age || '',
            gender: d?.gender || '',
            colors: Array.isArray(d?.colors) ? d.colors.join(', ') : (d?.colors || ''),
            size: d?.size || '',
            lastSeenLocation: d?.lastSeenLocation || '',
            lastSeenDate: d?.lastSeenDate || '',
            lastSeenTime: d?.lastSeenTime || '',
            attachments: d?.uploadObjectKey ? [d.uploadObjectKey] : []
          }
        }
        if (type === 'found') {
          return {
            ...base,
            animalName: d?.animalName || 'Unknown',
            animalType: d?.animalType || 'unknown',
            breed: d?.breed || '',
            age: d?.estimatedAge || '',
            gender: d?.gender || '',
            colors: Array.isArray(d?.colors) ? d.colors.join(', ') : (d?.colors || ''),
            size: d?.size || '',
            lastSeenLocation: d?.foundLocation || '',
            lastSeenDate: d?.foundDate || '',
            lastSeenTime: d?.foundTime || '',
            attachments: d?.uploadObjectKey ? [d.uploadObjectKey] : []
          }
        }
        if (type === 'abuse') {
          return {
            ...base,
            animalName: 'Unknown',
            animalType: 'unknown',
            breed: '',
            age: '',
            gender: '',
            colors: '',
            size: '',
            lastSeenLocation: d?.incidentLocation || '',
            lastSeenDate: d?.incidentDate || '',
            lastSeenTime: d?.incidentTime || '',
            attachments: Array.isArray(d?.evidenceObjects) ? d.evidenceObjects : []
          }
        }
        return base as AdminReport
      })
    }
    
    // Query all report collections
    const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    const lostQuery = query(collection(db, 'lost'), orderBy('createdAt', 'desc'))
    const foundQuery = query(collection(db, 'found'), orderBy('createdAt', 'desc'))
    
    const unsubscribeReports = onSnapshot(reportsQuery, (snap) => {
      const reportsData = processDocs(snap.docs, 'abuse')
      allReports = [...reportsData]
      setReports([...allReports])
    })
    
    const unsubscribeLost = onSnapshot(lostQuery, (snap) => {
      const lostData = processDocs(snap.docs, 'lost')
      allReports = allReports.filter(r => r.type !== 'lost').concat(lostData)
      setReports([...allReports])
    })
    
    const unsubscribeFound = onSnapshot(foundQuery, (snap) => {
      const foundData = processDocs(snap.docs, 'found')
      allReports = allReports.filter(r => r.type !== 'found').concat(foundData)
      setReports([...allReports])
    })
    
    return () => {
      unsubscribeReports()
      unsubscribeLost()
      unsubscribeFound()
    }
  }, [])

  const filteredReports = reports.filter(report => {
    const matchesSearch = searchTerm === '' || 
      (report.animalName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.reporterName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (report.lastSeenLocation || '').toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || report.status === statusFilter
    const matchesType = typeFilter === 'all' || report.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || report.priority === priorityFilter

    return matchesSearch && matchesStatus && matchesType && matchesPriority
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'investigating': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800'
      case 'high': return 'bg-orange-100 text-orange-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'normal': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'lost': return <AlertTriangle className="h-4 w-4" />
      case 'found': return <CheckCircle className="h-4 w-4" />
      case 'abuse': return <XCircle className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lost': return 'bg-blue-100 text-blue-600'
      case 'found': return 'bg-green-100 text-green-600'
      case 'abuse': return 'bg-red-100 text-red-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const resolveAttachments = async (attachments: string[] | undefined): Promise<string[]> => {
    if (!attachments || attachments.length === 0) return []
    const urls: string[] = []
    for (const keyOrUrl of attachments) {
      if (typeof keyOrUrl === 'string' && /^https?:\/\//i.test(keyOrUrl)) {
        urls.push(keyOrUrl)
      } else if (typeof keyOrUrl === 'string' && keyOrUrl.length > 0) {
        try {
          const signed = await createSignedEvidenceUrl(keyOrUrl, 3600)
          urls.push(signed)
        } catch (err) {
          console.error('Failed to create signed URL for attachment', keyOrUrl, err)
          // ignore errors; no URL added
        }
      }
    }
    return urls
  }

  const handleViewReport = async (report: AdminReport, edit = false) => {
    setSelectedReport(report)
    setIsEditing(!!edit)
    setEditStatus((report.status as 'pending' | 'investigating' | 'resolved') || 'pending')
    setEditPriority((report.priority as 'urgent' | 'high' | 'medium' | 'normal') || 'normal')
    setEditAssignedTo(report.assignedTo || '')
    setEditPublished((report as any)?.published === true)
    const urls = await resolveAttachments(report.attachments)
    setAttachmentUrls(urls)
    setShowReportModal(true)
  }

  const handleSave = async () => {
    if (!db || !selectedReport) return
    // Determine the correct collection based on report type
    const collectionName = selectedReport.type === 'abuse' ? 'reports' : selectedReport.type
    const ref = doc(db, collectionName, selectedReport.id)
    await updateDoc(ref, {
      status: editStatus === 'pending' ? 'pending' : editStatus,
      priority: editPriority,
      assignedTo: editAssignedTo || null,
      published: editPublished
    })
    setShowReportModal(false)
  }

  const handleDelete = async (id: string, type: string) => {
    if (!db) return
    setDeletingId(id)
    try {
      // Determine the correct collection based on report type
      const collectionName = type === 'abuse' ? 'reports' : type
      const ref = doc(db, collectionName, id)
      await deleteDoc(ref)
    } finally {
      setDeletingId(null)
    }
  }

  const handleExportCsv = () => {
    const rows = filteredReports.map(r => ({
      id: r.id,
      type: r.type,
      animalName: r.animalName || '',
      animalType: r.animalType || '',
      breed: r.breed || '',
      age: r.age || '',
      gender: r.gender || '',
      colors: r.colors || '',
      size: r.size || '',
      location: r.lastSeenLocation || '',
      date: r.lastSeenDate || '',
      time: r.lastSeenTime || '',
      reporterName: r.reporterName || '',
      reporterPhone: r.reporterPhone || '',
      reporterEmail: r.reporterEmail || '',
      status: r.status,
      priority: r.priority,
      createdAt: r.createdAt,
      assignedTo: r.assignedTo || ''
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
    a.download = `reports_${new Date().toISOString()}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Reports Management</h1>
          <p className="text-gray-600 mt-2">Review and manage all animal reports from the public.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search reports..."
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
                <option value="investigating">Investigating</option>
                <option value="resolved">Resolved</option>
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
                <option value="lost">Lost</option>
                <option value="found">Found</option>
                <option value="abuse">Abuse</option>
              </select>
            </div>

            {/* Priority Filter */}
            <div>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Priority</option>
                <option value="urgent">Urgent</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="normal">Normal</option>
              </select>
            </div>
          </div>
        </div>

        {/* Reports Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Reports ({filteredReports.length})
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
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal Info</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReports.map((report) => (
                  <tr key={report.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${getTypeColor(report.type)}`}>
                          {getTypeIcon(report.type)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 capitalize">{report.type}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.animalName}</div>
                      <div className="text-sm text-gray-500 capitalize">{report.animalType} • {report.breed}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{report.reporterName}</div>
                      <div className="text-sm text-gray-500">{report.reporterPhone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                        {report.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(report.priority)}`}>
                        {report.priority}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>{new Date(report.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric'
                      })}</div>
                      <div className="text-gray-500">{new Date(report.createdAt).toLocaleTimeString('en-US', {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button onClick={() => handleViewReport(report, true)} className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button disabled={deletingId === report.id} onClick={() => handleDelete(report.id, report.type)} className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1">
                          <Trash2 className="h-4 w-4" />
                          <span>{deletingId === report.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report Detail Modal */}
        {showReportModal && selectedReport && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full ${getTypeColor(selectedReport.type)}`}>
                    {getTypeIcon(selectedReport.type)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900 capitalize">{selectedReport.type} Report</h2>
                    <p className="text-sm text-gray-600">#{selectedReport.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
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
                    You are editing this report's admin fields.
                  </div>
                )}

                {/* Featured Attachment (large preview at top-left) */}
                {attachmentUrls.length > 0 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-3">Attachment</h3>
                    <a href={attachmentUrls[0]} target="_blank" rel="noreferrer" className="inline-block">
                      <img
                        src={attachmentUrls[0]}
                        alt="featured-attachment"
                        className="max-w-full max-h-80 w-auto h-auto object-contain rounded-lg border border-gray-200"
                      />
                    </a>
                  </div>
                )}
                {/* Animal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedReport.animalName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedReport.animalType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Breed</label>
                      <p className="text-sm text-gray-900">{selectedReport.breed}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age</label>
                      <p className="text-sm text-gray-900">{selectedReport.age}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Gender</label>
                      <p className="text-sm text-gray-900">{selectedReport.gender}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Colors</label>
                      <p className="text-sm text-gray-900">{selectedReport.colors}</p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Location Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      <p className="text-sm text-gray-900">{selectedReport.lastSeenLocation}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Date</label>
                      <p className="text-sm text-gray-900">{selectedReport.lastSeenDate}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time</label>
                      <p className="text-sm text-gray-900">{selectedReport.lastSeenTime}</p>
                    </div>
                  </div>
                </div>

                {/* Reporter Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reporter Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedReport.reporterName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedReport.reporterPhone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedReport.reporterEmail}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Details */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Details</h3>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {selectedReport.additionalDetails}
                  </p>
                </div>

                {/* Attachments (thumbnails) */}
                {attachmentUrls.length > 1 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">More Attachments</h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {attachmentUrls.slice(1).map((url, idx) => (
                        <a key={idx} href={url} target="_blank" rel="noreferrer" className="block group">
                          <img src={url} alt={`attachment-${idx+1}`} className="w-full h-40 object-cover rounded-lg border border-gray-200 group-hover:opacity-90" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* Status Management */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Management</h3>
                  {!isEditing ? (
                  <div className="flex items-center space-x-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Current Status</label>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedReport.status)}`}>
                        {selectedReport.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getPriorityColor(selectedReport.priority)}`}>
                        {selectedReport.priority}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                      <p className="text-sm text-gray-900">{selectedReport.assignedTo || 'Unassigned'}</p>
                    </div>
                  </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                          <option value="pending">Pending</option>
                          <option value="investigating">Investigating</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                        <select value={editPriority} onChange={(e) => setEditPriority(e.target.value as any)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
                          <option value="urgent">Urgent</option>
                          <option value="high">High</option>
                          <option value="medium">Medium</option>
                          <option value="normal">Normal</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Assigned To</label>
                        <input value={editAssignedTo} onChange={(e) => setEditAssignedTo(e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500" placeholder="Name or team" />
                      </div>
                      <div className="md:col-span-3">
                        <label className="inline-flex items-center space-x-2">
                          <input type="checkbox" checked={editPublished} onChange={(e) => setEditPublished(e.target.checked)} />
                          <span className="text-sm text-gray-700">Approve for website (publish to Content Management)</span>
                        </label>
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowReportModal(false)}
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

export default ReportsManagement
