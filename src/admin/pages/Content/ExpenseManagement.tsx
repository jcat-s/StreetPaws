import { useEffect, useState } from 'react'
import { collection, onSnapshot, doc, addDoc, updateDoc, deleteDoc, serverTimestamp, query, orderBy } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  Stethoscope,
  Home,
  Truck,
  Utensils,
  DollarSign
} from 'lucide-react'

interface Expense {
  id: string
  category: 'veterinary' | 'shelter' | 'food' | 'transport' | 'medical_supplies' | 'admin' | 'other'
  amount: number
  description: string
  date: string
  createdBy: string
  createdAt: any
  status?: 'pending' | 'approved' | 'rejected'
}

// Animal linking removed

const ExpenseManagement = () => {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  // Removed status filtering per request
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [showViewModal, setShowViewModal] = useState(false)
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    category: 'veterinary' as Expense['category'],
    amount: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    receipt: null as File | null
  })

  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    // Fetch expenses
    const expensesQuery = query(collection(db, 'expenses'), orderBy('date', 'desc'))
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snap) => {
      const expenseData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as Expense))
      setExpenses(expenseData)
      setLoading(false)
    })

    return () => {
      unsubscribeExpenses()
    }
  }, [])

  const filteredExpenses = expenses.filter(expense => {
    const matchesSearch = searchTerm === '' || 
      expense.description.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesCategory = categoryFilter === 'all' || expense.category === categoryFilter
    return matchesSearch && matchesCategory
  })

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'veterinary': return <Stethoscope className="h-4 w-4" />
      case 'shelter': return <Home className="h-4 w-4" />
      case 'food': return <Utensils className="h-4 w-4" />
      case 'transport': return <Truck className="h-4 w-4" />
      case 'medical_supplies': return <FileText className="h-4 w-4" />
      case 'admin': return <DollarSign className="h-4 w-4" />
      default: return <DollarSign className="h-4 w-4" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'veterinary': return 'bg-red-100 text-red-600'
      case 'shelter': return 'bg-blue-100 text-blue-600'
      case 'food': return 'bg-green-100 text-green-600'
      case 'transport': return 'bg-orange-100 text-orange-600'
      case 'medical_supplies': return 'bg-purple-100 text-purple-600'
      case 'admin': return 'bg-gray-100 text-gray-600'
      default: return 'bg-gray-100 text-gray-600'
    }
  }

  // Status UI removed; expenses are auto-approved when created

  const handleAddExpense = async () => {
    if (!db) return

    try {
      const parsedAmount = parseFloat(formData.amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error('Invalid amount. Must be a number greater than 0')
        return
      }
      const expenseData = {
        category: formData.category,
        amount: parsedAmount,
        description: formData.description,
        date: formData.date,
        createdBy: 'admin', // In real app, get from auth context
        createdAt: serverTimestamp(),
        status: 'approved' as const // auto-approve per request
      }

      await addDoc(collection(db, 'expenses'), expenseData)
      
      // Reset form
      setFormData({
        category: 'veterinary',
        amount: '',
        description: '',
        date: new Date().toISOString().split('T')[0],
        receipt: null
      })
      setShowAddModal(false)
    } catch (error) {
      console.error('Failed to add expense:', error)
    }
  }

  const handleEditExpense = (expense: Expense) => {
    setEditingExpense(expense)
    setFormData({
      category: expense.category,
      amount: expense.amount.toString(),
      description: expense.description,
      date: expense.date,
      receipt: null
    })
    setShowEditModal(true)
  }

  const handleUpdateExpense = async () => {
    if (!db || !editingExpense) return

    try {
      const parsedAmount = parseFloat(formData.amount)
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        console.error('Invalid amount. Must be a number greater than 0')
        return
      }
      const expenseRef = doc(db, 'expenses', editingExpense.id)
      await updateDoc(expenseRef, {
        category: formData.category,
        amount: parsedAmount,
        description: formData.description,
        date: formData.date
      })

      setShowEditModal(false)
      setEditingExpense(null)
    } catch (error) {
      console.error('Failed to update expense:', error)
    }
  }

  const handleDeleteExpense = async (expenseId: string) => {
    if (!db) return

    setDeletingId(expenseId)
    try {
      await deleteDoc(doc(db, 'expenses', expenseId))
    } catch (error) {
      console.error('Failed to delete expense:', error)
    } finally {
      setDeletingId(null)
    }
  }

  const handleViewExpense = (expense: Expense) => {
    setSelectedExpense(expense)
    setShowViewModal(true)
  }

  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const categoryTotals = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading expenses...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Expense Management</h1>
              <p className="text-gray-600 mt-2">Track and manage all organizational expenses for transparency.</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-orange-600 hover:bg-orange-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Plus className="h-4 w-4" />
              <span>Add Expense</span>
            </button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-red-600">₱{totalExpenses.toLocaleString()}</p>
              </div>
              <div className="bg-red-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-red-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Veterinary Care</p>
                <p className="text-2xl font-bold text-blue-600">₱{(categoryTotals.veterinary || 0).toLocaleString()}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Stethoscope className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Shelter & Housing</p>
                <p className="text-2xl font-bold text-green-600">₱{(categoryTotals.shelter || 0).toLocaleString()}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <Home className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Food & Supplies</p>
                <p className="text-2xl font-bold text-orange-600">₱{(categoryTotals.food || 0).toLocaleString()}</p>
              </div>
              <div className="bg-orange-100 rounded-full p-3">
                <Utensils className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search expenses..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            <div>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Categories</option>
                <option value="veterinary">Veterinary Care</option>
                <option value="shelter">Shelter & Housing</option>
                <option value="food">Food & Supplies</option>
                <option value="transport">Transportation</option>
                <option value="medical_supplies">Medical Supplies</option>
                <option value="admin">Administrative</option>
                <option value="other">Other</option>
              </select>
            </div>

            
          </div>
        </div>

        {/* Expenses Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Expenses ({filteredExpenses.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                  
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className={`p-2 rounded-full ${getCategoryColor(expense.category)}`}>
                          {getCategoryIcon(expense.category)}
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900 capitalize">
                            {expense.category.replace('_', ' ')}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 max-w-xs truncate">
                        {expense.description}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">₱{expense.amount.toLocaleString()}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {new Date(expense.date).toLocaleDateString()}
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => handleViewExpense(expense)}
                          className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        <button 
                          onClick={() => handleEditExpense(expense)}
                          className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                        >
                          <Edit className="h-4 w-4" />
                          <span>Edit</span>
                        </button>
                        <button 
                          disabled={deletingId === expense.id}
                          onClick={() => handleDeleteExpense(expense.id)}
                          className="text-red-600 hover:text-red-900 disabled:opacity-50 flex items-center space-x-1"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span>{deletingId === expense.id ? 'Deleting...' : 'Delete'}</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filteredExpenses.length === 0 && (
                  <tr>
                    <td className="px-6 py-12 text-center text-gray-500" colSpan={7}>
                      {expenses.length === 0 ? 'No expenses yet.' : 'No expenses match your filters.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Expense Modal */}
        {showAddModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Add New Expense</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as Expense['category']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="veterinary">Veterinary Care</option>
                      <option value="shelter">Shelter & Housing</option>
                      <option value="food">Food & Supplies</option>
                      <option value="transport">Transportation</option>
                      <option value="medical_supplies">Medical Supplies</option>
                      <option value="admin">Administrative</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow positive numbers, no letters, no negative
                        if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                          setFormData({...formData, amount: value})
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                    {!formData.amount && (
                      <p className="text-sm text-red-600 mt-1">Amount is required</p>
                    )}
                    {formData.amount && parseFloat(formData.amount) <= 0 && (
                      <p className="text-sm text-red-600 mt-1">Amount must be greater than 0</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Describe the expense..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleAddExpense}
                    disabled={!formData.amount || !formData.description || parseFloat(formData.amount) <= 0}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Add Expense
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Edit Expense Modal */}
        {showEditModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-900">Edit Expense</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({...formData, category: e.target.value as Expense['category']})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    >
                      <option value="veterinary">Veterinary Care</option>
                      <option value="shelter">Shelter & Housing</option>
                      <option value="food">Food & Supplies</option>
                      <option value="transport">Transportation</option>
                      <option value="medical_supplies">Medical Supplies</option>
                      <option value="admin">Administrative</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount *</label>
                    <input
                      type="number"
                      value={formData.amount}
                      onChange={(e) => {
                        const value = e.target.value
                        // Only allow positive numbers, no letters, no negative
                        if (value === '' || (parseFloat(value) >= 0 && !isNaN(parseFloat(value)))) {
                          setFormData({...formData, amount: value})
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                    {!formData.amount && (
                      <p className="text-sm text-red-600 mt-1">Amount is required</p>
                    )}
                    {formData.amount && parseFloat(formData.amount) <= 0 && (
                      <p className="text-sm text-red-600 mt-1">Amount must be greater than 0</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <input
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({...formData, date: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    />
                  </div>

                  
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    rows={3}
                    placeholder="Describe the expense..."
                  />
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleUpdateExpense}
                    disabled={!formData.amount || !formData.description || parseFloat(formData.amount) <= 0}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors disabled:opacity-50"
                  >
                    Update Expense
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* View Expense Modal */}
        {showViewModal && selectedExpense && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className={`p-3 rounded-full ${getCategoryColor(selectedExpense.category)}`}>
                    {getCategoryIcon(selectedExpense.category)}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Expense Details</h2>
                    <p className="text-sm text-gray-600">#{selectedExpense.id}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <Trash2 className="h-6 w-6" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                    <div className="flex items-center">
                      <div className={`p-2 rounded-full ${getCategoryColor(selectedExpense.category)}`}>
                        {getCategoryIcon(selectedExpense.category)}
                      </div>
                      <span className="ml-3 text-sm text-gray-900 capitalize">
                        {selectedExpense.category.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Amount</label>
                    <p className="text-2xl font-bold text-red-600">₱{selectedExpense.amount.toLocaleString()}</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                    <p className="text-sm text-gray-900">{new Date(selectedExpense.date).toLocaleDateString()}</p>
                  </div>

                  

                  

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Created By</label>
                    <p className="text-sm text-gray-900">{selectedExpense.createdBy}</p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <p className="text-sm text-gray-900 bg-gray-50 p-4 rounded-lg">
                    {selectedExpense.description}
                  </p>
                </div>

                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowViewModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setShowViewModal(false)
                      handleEditExpense(selectedExpense)
                    }}
                    className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-lg transition-colors"
                  >
                    Edit Expense
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

export default ExpenseManagement
