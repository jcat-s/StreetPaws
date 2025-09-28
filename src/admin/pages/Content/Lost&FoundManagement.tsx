import { useEffect, useState } from 'react'
import { Search, Edit, Trash2, Plus, AlertTriangle, CheckCircle, Download, Eye, EyeOff } from 'lucide-react'
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { createSignedEvidenceUrl, submitReport } from '../../../user/utils/reportService'
import { LIPA_BARANGAYS } from '../../../shared/constants/barangays'
import { supabase } from '../../../config/supabase'

type LostFoundItem = {
  id: string;
  type: 'lost' | 'found';
  animalName: string;
  animalType: string;
  breed: string;
  age: string;
  gender: string;
  colors: string;
  size: string;
  location: string;
  date: string;
  reporterName: string;
  reporterPhone: string;
  reporterEmail: string;
  createdAt: string;
  published: boolean;
  imageUrl?: string;
  description?: string;
  additionalDetails?: string;
};

const ContentHome = () => {
  const [items, setItems] = useState<LostFoundItem[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState<'all' | 'lost' | 'found'>('all')
  const [publishedFilter, setPublishedFilter] = useState<'all' | 'published' | 'unpublished'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null)
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState<LostFoundItem | null>(null);
  const [showAddModal, setShowAddModal] = useState(false)
  const [newItemType, setNewItemType] = useState<'lost' | 'found'>('found')
  const [newForm, setNewForm] = useState({
    animalType: 'dog',
    animalName: '',
    breed: '',
    colors: '',
    age: '',
    gender: '',
    location: '',
    date: '',
    time: '',
    contactName: '',
    contactPhone: '',
    contactEmail: '',
    additionalDetails: ''
  })
  const [newImageFile, setNewImageFile] = useState<File | null>(null)
  const [newImagePreview, setNewImagePreview] = useState<string | null>(null)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: string, animalName: string} | null>(null)
  const [deletedItems, setDeletedItems] = useState<LostFoundItem[]>([])
  const [showUndo, setShowUndo] = useState(false)

  useEffect(() => {
    if (!db) return
    
    // Test Supabase connection
    if (supabase) {
      console.log('Supabase client available:', !!supabase)
      // Test bucket access
      supabase.storage.from('report-uploads').list('lostandfound', { limit: 1 })
        .then(({ data, error }) => {
          if (error) {
            console.error('Supabase storage bucket access error:', error)
          } else {
            console.log('Supabase storage bucket accessible:', data?.length || 0, 'items found')
          }
        })
        .catch(err => console.error('Supabase storage test failed:', err))
    } else {
      console.warn('Supabase client not available')
    }
    
    let allItems: LostFoundItem[] = []
    
    // Helper function to process documents
    const processDocs = (docs: any[], collectionType: 'lost' | 'found'): (LostFoundItem | null)[] => {
      return docs.map((doc) => {
        const d: any = doc.data()
        
        // Handle serverTimestamp properly - it might be pending when first read
        let createdAtIso: string
        if (d?.createdAt?.toDate) {
          // Timestamp is resolved
          createdAtIso = d.createdAt.toDate().toISOString()
        } else if (d?.createdAt && typeof d.createdAt === 'string') {
          // Already a string
          createdAtIso = d.createdAt
        } else if (d?.createdAt && d.createdAt.seconds) {
          // Firestore timestamp with seconds
          createdAtIso = new Date(d.createdAt.seconds * 1000).toISOString()
        } else if (d?.createdAt && typeof d.createdAt === 'object' && d.createdAt._methodName === 'serverTimestamp') {
          // Pending serverTimestamp - use current time as fallback
          console.log('Pending serverTimestamp detected for lost/found item:', doc.id, 'using current time as fallback')
          createdAtIso = new Date().toISOString()
        } else {
          // No valid timestamp found
          createdAtIso = 'Invalid Date'
          console.log('Invalid date found for lost/found item:', doc.id, 'Raw createdAt:', d?.createdAt, 'Type:', typeof d?.createdAt)
        }
        
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
          published: d?.published === true,
          description: d?.description || '',
          additionalDetails: d?.additionalDetails || '',
          imageUrl: undefined
        }
      })
    }
    
    // Query both collections
    const lostQuery = query(collection(db, 'lost'), orderBy('createdAt', 'desc'))
    const foundQuery = query(collection(db, 'found'), orderBy('createdAt', 'desc'))
    
    const unsubscribeLost = onSnapshot(lostQuery, async (snap) => {
      const lostItems = processDocs(snap.docs, 'lost').filter((item): item is LostFoundItem => item !== null)
      const lostWithImages = await Promise.all(
        lostItems.map(async (item) => {
          // Get image URL if available
          const docData = snap.docs.find(d => d.id === item.id)?.data()
          let imageUrl: string | undefined
          
          // Check for direct image URL first (for lost/found reports)
          if (docData?.image) {
            imageUrl = docData.image
            console.log('Using direct image URL for lost item:', item.id, imageUrl)
          }
          // Fallback to uploadObjectKey (for abuse reports)
          else if (docData?.uploadObjectKey) {
            try {
              imageUrl = await createSignedEvidenceUrl(docData.uploadObjectKey, 3600)
              console.log('Successfully created signed URL for lost item:', item.id, imageUrl)
            } catch (error) {
              console.error('Failed to create signed URL for lost item:', item.id, error)
            }
          } else {
            console.log('No image or uploadObjectKey found for lost item:', item.id)
          }
          return { ...item, imageUrl }
        })
      )
      
      allItems = [...allItems.filter(item => item.type === 'found'), ...lostWithImages]
      setItems(allItems.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()))
    })
    
    const unsubscribeFound = onSnapshot(foundQuery, async (snap) => {
      const foundItems = processDocs(snap.docs, 'found').filter((item): item is LostFoundItem => item !== null)
      const foundWithImages = await Promise.all(
        foundItems.map(async (item) => {
          // Get image URL if available
          const docData = snap.docs.find(d => d.id === item.id)?.data()
          let imageUrl: string | undefined
          
          // Check for direct image URL first (for lost/found reports)
          if (docData?.image) {
            imageUrl = docData.image
            console.log('Using direct image URL for found item:', item.id, imageUrl)
          }
          // Fallback to uploadObjectKey (for abuse reports)
          else if (docData?.uploadObjectKey) {
            try {
              imageUrl = await createSignedEvidenceUrl(docData.uploadObjectKey, 3600)
              console.log('Successfully created signed URL for found item:', item.id, imageUrl)
            } catch (error) {
              console.error('Failed to create signed URL for found item:', item.id, error)
            }
          } else {
            console.log('No image or uploadObjectKey found for found item:', item.id)
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
    
    const matchesType = typeFilter === 'all' || item.type === typeFilter
    const matchesPublished = publishedFilter === 'all' || 
      (publishedFilter === 'published' && item.published) ||
      (publishedFilter === 'unpublished' && !item.published)
    
    return matchesSearch && matchesType && matchesPublished
  })


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

  const handleDeleteClick = (item: LostFoundItem) => {
    setItemToDelete({
      id: item.id,
      type: item.type,
      animalName: item.animalName
    })
    setShowDeleteConfirm(true)
  }

  const handleDelete = async () => {
    if (!db || !itemToDelete) return
    
    // Store the item for potential undo
    const itemToUndo = items.find(i => i.id === itemToDelete.id)
    if (itemToUndo) {
      setDeletedItems(prev => [...prev, itemToUndo])
      setShowUndo(true)
      // Auto-hide undo after 10 seconds
      setTimeout(() => setShowUndo(false), 10000)
    }
    
    setDeletingId(itemToDelete.id)
    setShowDeleteConfirm(false)
    
    try {
      await deleteDoc(doc(db, itemToDelete.type, itemToDelete.id))
    } finally {
      setDeletingId(null)
      setItemToDelete(null)
    }
  }

  const handleUndoDelete = async () => {
    if (!db || deletedItems.length === 0) return
    
    const lastDeleted = deletedItems[deletedItems.length - 1]
    
    try {
      // Restore the item by adding it back to the appropriate collection
      const itemData = {
        ...lastDeleted,
        createdAt: serverTimestamp(),
        id: undefined // Let Firestore generate new ID
      }
      delete itemData.id
      
      // Determine the correct collection based on item type
      const collectionName = lastDeleted.type === 'lost' ? 'lost' : 'found'
      await addDoc(collection(db, collectionName), itemData)
      
      // Remove from deleted items
      setDeletedItems(prev => prev.slice(0, -1))
      setShowUndo(false)
    } catch (error) {
      console.error('Failed to undo delete:', error)
    }
  }

  const handleAddNew = () => {
    setShowAddModal(true)
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
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal Info</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Published</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted Date</th>
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
                    {item.imageUrl ? (
                      <img 
                        src={item.imageUrl} 
                        alt="Animal photo" 
                        className="w-12 h-12 object-cover rounded-lg border border-gray-200"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none'
                        }}
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
                        <span className="text-gray-400 text-xs">No image</span>
                      </div>
                    )}
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
                      <button onClick={() => setSelectedItem(item)} className="text-orange-600 hover:text-orange-900 flex items-center space-x-1">
                        <Eye className="h-4 w-4" />
                        <span>View</span>
                      </button>
                      <button onClick={() => handleTogglePublish(item)} className={`${item.published ? 'text-orange-600 hover:text-orange-900' : 'text-green-600 hover:text-green-900'} flex items-center space-x-1`}>
                        {item.published ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        <span>{item.published ? 'Unpublish' : 'Publish'}</span>
                      </button>
                      <button onClick={() => handleEdit(item)} className="text-blue-600 hover:text-blue-900 flex items-center space-x-1">
                        <Edit className="h-4 w-4" />
                        <span>Edit</span>
                      </button>
                      <button disabled={deletingId === item.id} onClick={() => handleDeleteClick(item)} className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1">
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
      {selectedItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => { setSelectedItem(null); setEditMode(false); setEditData(null); }} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl mx-auto p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editMode ? (
                  <input
                    className="border-b border-gray-300 focus:outline-none focus:border-orange-500 text-2xl font-bold w-full"
                    value={editData?.animalName || ''}
                    onChange={e => setEditData(editData ? { ...editData, animalName: e.target.value } : null)}
                  />
                ) : (
                  selectedItem.animalName || `Unknown ${selectedItem.breed}`
                )}
              </h2>
              <div className="flex gap-2">
                {!editMode && (
                  <button onClick={() => { setEditMode(true); setEditData({ ...selectedItem }); }} className="text-blue-600 hover:text-blue-900">Edit</button>
                )}
                {editMode && (
                  <button onClick={async () => {
                    if (!editData || !db) return;
                    await updateDoc(doc(db, editData.type, editData.id), {
                      animalName: editData.animalName,
                      breed: editData.breed,
                      colors: editData.colors,
                      age: editData.age,
                      gender: editData.gender,
                      ...(editData.type === 'lost' ? { lastSeenDate: editData.date, lastSeenLocation: editData.location } : { foundDate: editData.date, foundLocation: editData.location }),
                      additionalDetails: editData.additionalDetails,
                      reporterName: editData.reporterName,
                      reporterPhone: editData.reporterPhone,
                      reporterEmail: editData.reporterEmail
                    });
                    setSelectedItem({ ...selectedItem, ...editData });
                    setEditMode(false);
                    setEditData(null);
                  }} className="text-green-600 hover:text-green-900">Save</button>
                )}
                <button onClick={() => { setSelectedItem(null); setEditMode(false); setEditData(null); }} className="text-gray-400 hover:text-gray-600">✕</button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col items-center">
                <img
                  src={selectedItem.imageUrl || `https://via.placeholder.com/400x300/ffd6e0/8a2be2?text=${selectedItem.animalType === 'dog' ? '🐕' : '🐱'}`}
                  alt={selectedItem.animalName || `${selectedItem.breed} ${selectedItem.type}`}
                  className="w-full h-64 object-contain bg-gray-100 rounded-lg"
                  onLoad={() => console.log('Modal image loaded successfully:', selectedItem.imageUrl)}
                  onError={e => {
                    console.log('Modal image failed to load:', selectedItem.imageUrl)
                    ;(e.target as HTMLImageElement).src = `https://via.placeholder.com/400x300/ffd6e0/8a2be2?text=${selectedItem.animalType === 'dog' ? '🐕' : '🐱'}`
                  }}
                />
                <div className="w-full mt-4 bg-gray-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">Contact Information:</h4>
                  <div className="space-y-1">
                    <div className="flex items-center">
                      <span className="font-medium">Name:</span>
                      {editMode ? (
                        <input className="ml-2 border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editData?.reporterName || ''} onChange={e => setEditData(editData ? { ...editData, reporterName: e.target.value } : null)} />
                      ) : (
                        <span className="ml-2">{selectedItem.reporterName}</span>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Phone:</span>
                      {editMode ? (
                        <input className="ml-2 border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editData?.reporterPhone || ''} onChange={e => setEditData(editData ? { ...editData, reporterPhone: e.target.value } : null)} />
                      ) : (
                        <a href={`tel:${selectedItem.reporterPhone}`} className="ml-2 text-orange-600 hover:text-orange-700">{selectedItem.reporterPhone}</a>
                      )}
                    </div>
                    <div className="flex items-center">
                      <span className="font-medium">Email:</span>
                      {editMode ? (
                        <input className="ml-2 border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editData?.reporterEmail || ''} onChange={e => setEditData(editData ? { ...editData, reporterEmail: e.target.value } : null)} />
                      ) : (
                        <a href={`mailto:${selectedItem.reporterEmail}`} className="ml-2 text-orange-600 hover:text-orange-700">{selectedItem.reporterEmail}</a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedItem.type === 'lost' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                    {selectedItem.type === 'lost' ? '🔍 LOST' : '🏠 FOUND'}
                  </span>
                  <span className={`px-3 py-1 text-sm font-medium rounded-full ${selectedItem.animalType === 'dog' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'}`}>
                    {selectedItem.animalType === 'dog' ? '🐕 Dog' : '🐱 Cat'}
                  </span>
                </div>
                <div className="space-y-2">
                  <div><span className="font-medium">Breed:</span> {editMode ? (<input className="ml-2 border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editData?.breed || ''} onChange={e => setEditData(editData ? { ...editData, breed: e.target.value } : null)} />) : selectedItem.breed}</div>
                  <div><span className="font-medium">Colors:</span> {editMode ? (<input className="ml-2 border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editData?.colors || ''} onChange={e => setEditData(editData ? { ...editData, colors: e.target.value } : null)} />) : selectedItem.colors}</div>
                  <div><span className="font-medium">Age:</span> {editMode ? (<input className="ml-2 border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editData?.age || ''} onChange={e => setEditData(editData ? { ...editData, age: e.target.value } : null)} />) : selectedItem.age}</div>
                  <div><span className="font-medium">Gender:</span> {editMode ? (
                    <select className="ml-2 border rounded px-2 py-1 focus:outline-none focus:border-orange-500" value={editData?.gender || ''} onChange={e => setEditData(editData ? { ...editData, gender: e.target.value } : null)}>
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  ) : selectedItem.gender}</div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Date:</span>
                    {editMode ? (<input className="border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editData?.date || ''} onChange={e => setEditData(editData ? { ...editData, date: e.target.value } : null)} />) : <span>{selectedItem.date}</span>}
                  </div>
                  <div className="flex items-center">
                    <span className="font-medium mr-2">Location:</span>
                    {editMode ? (
                      <select className="border rounded px-2 py-1 focus:outline-none focus:border-orange-500" value={editData?.location || ''} onChange={e => setEditData(editData ? { ...editData, location: e.target.value } : null)}>
                        <option value="">Select barangay</option>
                        {LIPA_BARANGAYS.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </select>
                    ) : (
                      <span>{selectedItem.location}</span>
                    )}
                  </div>
                </div>
                {editMode ? (
                  <div>
                    <h4 className="font-medium mb-2">Additional Details:</h4>
                    <input className="w-full border-b border-gray-300 focus:outline-none focus:border-orange-500" value={editData?.additionalDetails || ''} onChange={e => setEditData(editData ? { ...editData, additionalDetails: e.target.value } : null)} />
                  </div>
                ) : (
                  selectedItem.additionalDetails && (
                    <div>
                      <h4 className="font-medium mb-2">Additional Details:</h4>
                      <p className="text-gray-700">{selectedItem.additionalDetails}</p>
                    </div>
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowAddModal(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-2xl mx-auto p-6 shadow-2xl z-10 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-gray-900">Add New Report</h2>
              <button onClick={() => setShowAddModal(false)} className="text-gray-400 hover:text-gray-600">✕</button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Report Type</label>
                <select value={newItemType} onChange={(e) => setNewItemType(e.target.value as 'lost' | 'found')} className="w-full border rounded px-3 py-2">
                  <option value="found">Found</option>
                  <option value="lost">Lost</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type</label>
                <select value={newForm.animalType} onChange={(e) => setNewForm({ ...newForm, animalType: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="dog">Dog</option>
                  <option value="cat">Cat</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (optional)</label>
                <input value={newForm.animalName} onChange={(e) => setNewForm({ ...newForm, animalName: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Breed</label>
                <input value={newForm.breed} onChange={(e) => setNewForm({ ...newForm, breed: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Colors</label>
                <input value={newForm.colors} onChange={(e) => setNewForm({ ...newForm, colors: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age</label>
                <input value={newForm.age} onChange={(e) => setNewForm({ ...newForm, age: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Gender</label>
                <select value={newForm.gender} onChange={(e) => setNewForm({ ...newForm, gender: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="unknown">Unknown</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Location (Barangay)</label>
                <select value={newForm.location} onChange={(e) => setNewForm({ ...newForm, location: e.target.value })} className="w-full border rounded px-3 py-2">
                  <option value="">Select barangay</option>
                  {LIPA_BARANGAYS.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={newForm.date} onChange={(e) => setNewForm({ ...newForm, date: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time</label>
                <input type="time" value={newForm.time} onChange={(e) => setNewForm({ ...newForm, time: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                <textarea value={newForm.additionalDetails} onChange={(e) => setNewForm({ ...newForm, additionalDetails: e.target.value })} className="w-full border rounded px-3 py-2" rows={3} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name</label>
                <input value={newForm.contactName} onChange={(e) => setNewForm({ ...newForm, contactName: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone</label>
                <input value={newForm.contactPhone} onChange={(e) => setNewForm({ ...newForm, contactPhone: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email</label>
                <input value={newForm.contactEmail} onChange={(e) => setNewForm({ ...newForm, contactEmail: e.target.value })} className="w-full border rounded px-3 py-2" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
                <input type="file" accept="image/*" onChange={(e) => { const f = e.target.files?.[0] || null; setNewImageFile(f); if (f) { const r = new FileReader(); r.onload = () => setNewImagePreview(r.result as string); r.readAsDataURL(f) } }} />
                {newImagePreview && <img src={newImagePreview} alt="Preview" className="mt-2 h-40 object-contain bg-gray-100 rounded" />}
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2 rounded bg-gray-100 text-gray-700">Cancel</button>
              <button onClick={async () => {
                const data = newItemType === 'lost' ? {
                  type: 'lost' as const,
                  animalType: newForm.animalType,
                  animalName: newForm.animalName,
                  breed: newForm.breed,
                  colors: newForm.colors,
                  age: newForm.age,
                  gender: newForm.gender,
                  lastSeenLocation: newForm.location,
                  lastSeenDate: newForm.date,
                  lastSeenTime: newForm.time,
                  contactName: newForm.contactName,
                  contactPhone: newForm.contactPhone,
                  contactEmail: newForm.contactEmail,
                  additionalDetails: newForm.additionalDetails
                } : {
                  type: 'found' as const,
                  animalType: newForm.animalType,
                  animalName: newForm.animalName || undefined,
                  breed: newForm.breed,
                  colors: newForm.colors,
                  estimatedAge: newForm.age,
                  gender: newForm.gender,
                  foundLocation: newForm.location,
                  foundDate: newForm.date,
                  foundTime: newForm.time,
                  contactName: newForm.contactName,
                  contactPhone: newForm.contactPhone,
                  contactEmail: newForm.contactEmail,
                  additionalDetails: newForm.additionalDetails
                }
                await submitReport(data as any, newImageFile, null)
                setShowAddModal(false)
              }} className="px-4 py-2 rounded bg-orange-600 text-white hover:bg-orange-700">Save</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && itemToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setShowDeleteConfirm(false)} />
          <div className="relative bg-white rounded-2xl w-full max-w-md mx-auto p-6 shadow-2xl z-10">
            <div className="flex items-center space-x-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <Trash2 className="h-6 w-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Delete {itemToDelete.type === 'lost' ? 'Lost' : 'Found'} Report</h3>
                <p className="text-sm text-gray-600">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="mb-6">
              <p className="text-gray-700">
                Are you sure you want to delete the {itemToDelete.type} report for <span className="font-medium">{itemToDelete.animalName}</span>?
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
                disabled={deletingId === itemToDelete.id}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center space-x-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{deletingId === itemToDelete.id ? 'Deleting...' : 'Delete Report'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Undo Notification */}
      {showUndo && deletedItems.length > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className="bg-white rounded-lg shadow-lg border border-gray-200 p-4 max-w-sm">
            <div className="flex items-start space-x-3">
              <div className="p-1 bg-green-100 rounded-full">
                {deletedItems[deletedItems.length - 1]?.type === 'lost' ? 
                  <AlertTriangle className="h-5 w-5 text-green-600" /> : 
                  <CheckCircle className="h-5 w-5 text-green-600" />
                }
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{deletedItems[deletedItems.length - 1]?.type === 'lost' ? 'Lost' : 'Found'} report deleted</p>
                <p className="text-xs text-gray-600 mt-1">
                  {deletedItems[deletedItems.length - 1]?.animalName}'s report has been deleted.
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
  )
}

export default ContentHome


