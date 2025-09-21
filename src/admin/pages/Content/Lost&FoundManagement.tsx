import { useEffect, useState } from 'react'
import { Search, Edit, Trash2, Plus, AlertTriangle, CheckCircle, Download, Eye, EyeOff } from 'lucide-react'
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { createSignedEvidenceUrl } from '../../../user/utils/reportService'

type LostFoundItem = {
  id: string
  type: 'lost' | 'found'
  animalName: string
  animalType: string
  breed: string
  age: string
  gender: string
  colors: string
  size: string
  location: string
  date: string
  reporterName: string
  reporterPhone: string
  reporterEmail: string
  createdAt: string
  status: string
  priority: string
  published: boolean
  imageUrl?: string
}

const ContentHome = () => {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'investigating' | 'resolved'>('all')
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all')
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'urgent' | 'high' | 'medium' | 'normal'>('all')
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'unpublished'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  useEffect(() => {
    if (!db) return
    
    let allItems: LostFoundItem[] = []
    
    // Helper function to process documents
    const processDocs = (docs: any[], collectionType: 'lost' | 'found') => {
      return docs.map((doc) => {
        const d: any = doc.data()
        const createdAtIso: string = d?.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (typeof d?.createdAt === 'string' ? d.createdAt : new Date().toISOString())
        
        return {
          id: doc.id,
          type: collectionType,
          animalName: d?.animalName || 'Unknown',
          animalType: d?.animalType || 'unknown',
          breed: d?.breed || '',
          age: d?.age || d?.estimatedAge || '',
          gender: d?.gender || '',
          colors: Array.isArray(d?.colors) ? d.colors.join(', ') : (d?.colors || ''),
          size: d?.size || '',
          location: collectionType === 'lost' ? (d?.lastSeenLocation || '') : (d?.foundLocation || ''),
          date: collectionType === 'lost' ? (d?.lastSeenDate || '') : (d?.foundDate || ''),
          reporterName: d?.contactName || 'Unknown',
          reporterPhone: d?.contactPhone || '',
          reporterEmail: d?.contactEmail || '',
          createdAt: createdAtIso,
          status: d?.status === 'open' ? 'pending' : (d?.status || 'pending'),
          priority: d?.priority || 'normal',
          published: d?.published === true
        }
      })
    }
    
    // Query both collections
    const lostQuery = query(collection(db, 'lost'), orderBy('createdAt', 'desc'))
    const foundQuery = query(collection(db, 'found'), orderBy('createdAt', 'desc'))
    
    const unsubscribeLost = onSnapshot(lostQuery, async (snap) => {
      const lostItems = processDocs(snap.docs, 'lost')
      const lostWithImages = await Promise.all(
        lostItems.map(async (item) => {
          // Get image URL if available
          const docData = snap.docs.find(d => d.id === item.id)?.data()
          let imageUrl: string | undefined
          if (docData?.uploadObjectKey) {
            try {
              imageUrl = await createSignedEvidenceUrl(docData.uploadObjectKey, 3600)
            } catch {}
          }
          return { ...item, imageUrl }
        })
      )
      
      allItems = [...allItems.filter(item => item.type === 'found'), ...lostWithImages]
      setItems(allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })
    
    const unsubscribeFound = onSnapshot(foundQuery, async (snap) => {
      const foundItems = processDocs(snap.docs, 'found')
      const foundWithImages = await Promise.all(
        foundItems.map(async (item) => {
          // Get image URL if available
          const docData = snap.docs.find(d => d.id === item.id)?.data()
          let imageUrl: string | undefined
          if (docData?.uploadObjectKey) {
            try {
              imageUrl = await createSignedEvidenceUrl(docData.uploadObjectKey, 3600)
            } catch {}
          }
          return { ...item, imageUrl }
        })
      )
      
      allItems = [...allItems.filter(item => item.type === 'lost'), ...foundWithImages]
      setItems(allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })
    
    return () => {
      unsubscribeLost()
      unsubscribeFound()
    }
  }, [])

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.animalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.reporterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    const matchesPriority = priorityFilter === 'all' || item.priority === priorityFilter
    const matchesPublished = publishedFilter === 'all' || 
      (publishedFilter === 'published' && item.published) ||
      (publishedFilter === 'unpublished' && !item.published)
    
    return matchesSearch && matchesStatus && matchesType && matchesPriority && matchesPublished
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
      default: return <AlertTriangle className="h-4 w-4" />
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lost': return 'bg-blue-100 text-blue-600'
      case 'found': return 'bg-green-100 text-green-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  const handleDelete = async (id: string, type: string) => {
    if (!db) return
    setDeletingId(id)
    try {
      await deleteDoc(doc(db, type, id))
    } finally {
      setDeletingId(null)
    }
  }

  const handleAddNew = () => {
    // TODO: Implement add new item functionality
    console.log('Add new item clicked')
  }

  const handleEdit = (item: LostFoundItem) => {
    // TODO: Implement edit functionality
    console.log('Edit item clicked:', item)
  }

  const handleTogglePublish = async (item: LostFoundItem) => {
    if (!db) return
    try {
      const ref = doc(db, item.type, item.id)
      await updateDoc(ref, {
        published: !item.published
      })
    } catch (error) {
      console.error('Error toggling publish status:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Lost & Found Management</h1>
        <p className="text-gray-600 mt-2">Manage lost and found animal reports from the public.</p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
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

          {/* Published Filter */}
          <div>
            <select
              value={publishedFilter}
              onChange={(e) => setPublishedFilter(e.target.value as any)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
            >
              <option value="all">All Items</option>
              <option value="published">Published</option>
              <option value="unpublished">Unpublished</option>
            </select>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">
              Lost & Found Items ({filteredItems.length})
            </h2>
            <div className="flex items-center space-x-4">
              <button onClick={handleAddNew} className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
                <Plus className="h-4 w-4" />
                <span>Add New</span>
              </button>
              <button className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${getTypeColor(item.type)}`}>
                        {getTypeIcon(item.type)}
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900 capitalize">{item.type}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.animalName}</div>
                    <div className="text-sm text-gray-500 capitalize">{item.animalType} • {item.breed}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.location || '—'}</div>
                    <div className="text-sm text-gray-500">{item.date || '—'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.reporterName}</div>
                    <div className="text-sm text-gray-500">{item.reporterPhone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(item.status)}`}>
                      {item.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(item.priority)}`}>
                      {item.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.published ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.published ? 'Published' : 'Unpublished'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    <div>{new Date(item.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}</div>
                    <div className="text-gray-500">{new Date(item.createdAt).toLocaleTimeString('en-US', {
                      hour: '2-digit',
                      minute: '2-digit'
                    })}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button onClick={() => handleTogglePublish(item)} className={`${item.published ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} flex items-center space-x-1`}>
                        {item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span>{item.published ? 'Unpublish' : 'Publish'}</span>
                      </button>
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button disabled={deletingId === item.id} onClick={() => handleDelete(item.id, item.type)} className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1">
                        <Trash2 className="h-4 w-4" />
                        <span>{deletingId === item.id ? 'Deleting...' : 'Delete'}</span>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default ContentHome


