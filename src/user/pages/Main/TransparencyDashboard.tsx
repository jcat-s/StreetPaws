import { useState, useEffect } from 'react'
import { DollarSign, Heart, Package, Pill, TrendingUp, Users, Calendar } from 'lucide-react'
import { db } from '../../../config/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

interface DonationRecord {
  id: string
  date: string
  amount: number
  donor: string
  purpose: string
  status: 'pending' | 'verified' | 'rejected'
}

interface ExpenseRecord {
  id: string
  date: string
  amount: number
  category: 'food' | 'medical' | 'shelter' | 'transport' | 'other'
  description: string
  beneficiary: string
}

// Real data from database

const TransparencyDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'expenses'>('overview')
  const [donations, setDonations] = useState<DonationRecord[]>([])
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Fetch donations from database
  useEffect(() => {
    if (!db) return

    const donationsQuery = query(collection(db, 'donations'), orderBy('createdAt', 'desc'))
    const unsubscribeDonations = onSnapshot(donationsQuery, (snapshot) => {
      const donationsData: DonationRecord[] = snapshot.docs.map((doc) => {
        const data = doc.data()
        return {
          id: doc.id,
          date: data.createdAt?.toDate ? data.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          amount: Number(data.amount || 0),
          donor: data.name || 'Anonymous',
          purpose: data.message || 'General Fund',
          status: data.status || 'pending'
        }
      })
      setDonations(donationsData)
      setLoading(false)
    })

    // For now, expenses are empty since we don't have an expenses collection
    // This can be implemented later when expenses are properly tracked
    setExpenses([])

    return () => {
      unsubscribeDonations()
    }
  }, [])

  // Calculate totals from real data
  const verifiedDonations = donations.filter(d => d.status === 'verified')
  const totalDonations = verifiedDonations.reduce((sum, donation) => sum + donation.amount, 0)
  const totalExpenses = expenses.reduce((sum, expense) => sum + expense.amount, 0)
  const availableFunds = totalDonations - totalExpenses

  const donationsByPurpose = verifiedDonations.reduce((acc, donation) => {
    acc[donation.purpose] = (acc[donation.purpose] || 0) + donation.amount
    return acc
  }, {} as Record<string, number>)

  const expensesByCategory = expenses.reduce((acc, expense) => {
    acc[expense.category] = (acc[expense.category] || 0) + expense.amount
    return acc
  }, {} as Record<string, number>)

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'food': return <Package className="h-5 w-5" />
      case 'medical': return <Pill className="h-5 w-5" />
      case 'shelter': return <Heart className="h-5 w-5" />
      case 'transport': return <TrendingUp className="h-5 w-5" />
      default: return <DollarSign className="h-5 w-5" />
    }
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'food': return 'bg-green-100 text-green-800'
      case 'medical': return 'bg-red-100 text-red-800'
      case 'shelter': return 'bg-blue-100 text-blue-800'
      case 'transport': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Transparency Dashboard</h1>
          <p className="text-lg text-gray-600">
            Real-time updates on donation allocation and usage for stray animal welfare
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalDonations)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-red-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-red-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Expenses</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(totalExpenses)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <Heart className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Available Funds</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(availableFunds)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Animals Helped</p>
                <p className="text-2xl font-bold text-gray-900">47</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: <TrendingUp className="h-5 w-5" /> },
                { id: 'donations', name: 'Donations', icon: <DollarSign className="h-5 w-5" /> },
                { id: 'expenses', name: 'Expenses', icon: <Package className="h-5 w-5" /> }
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                    activeTab === tab.id
                      ? 'border-orange-500 text-orange-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  {tab.icon}
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="space-y-8">
                {/* Donation Purpose Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Donations by Purpose</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {Object.entries(donationsByPurpose).map(([purpose, amount]) => (
                      <div key={purpose} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="font-medium text-gray-900">{purpose}</span>
                          <span className="text-lg font-bold text-orange-600">{formatCurrency(amount)}</span>
                        </div>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-orange-500 h-2 rounded-full" 
                              style={{ width: `${(amount / totalDonations) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense Category Breakdown */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Expenses by Category</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {Object.entries(expensesByCategory).map(([category, amount]) => (
                      <div key={category} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center mb-2">
                          <div className={`p-2 rounded-full ${getCategoryColor(category)}`}>
                            {getCategoryIcon(category)}
                          </div>
                          <span className="ml-2 font-medium text-gray-900 capitalize">{category}</span>
                        </div>
                        <p className="text-lg font-bold text-gray-900">{formatCurrency(amount)}</p>
                        <div className="mt-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-500 h-2 rounded-full" 
                              style={{ width: `${(amount / totalExpenses) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Activity */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {loading ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">Loading recent activity...</p>
                      </div>
                    ) : verifiedDonations.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-gray-500">No verified donations yet</p>
                      </div>
                    ) : (
                      verifiedDonations.slice(0, 5)
                        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                        .map((donation) => (
                          <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center">
                              <div className="p-2 rounded-full bg-green-100 text-green-600">
                                <DollarSign className="h-4 w-4" />
                              </div>
                              <div className="ml-3">
                                <p className="font-medium text-gray-900">
                                  Donation: {donation.purpose}
                                </p>
                                <p className="text-sm text-gray-600">{formatDate(donation.date)}</p>
                              </div>
                            </div>
                            <span className="font-bold text-green-600">
                              +{formatCurrency(donation.amount)}
                            </span>
                          </div>
                        ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'donations' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Donations</h3>
                {loading ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">Loading donations...</p>
                  </div>
                ) : donations.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-500">No donations yet</p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Donor</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Purpose</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {donations.map((donation) => (
                          <tr key={donation.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {formatDate(donation.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {donation.donor}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {donation.purpose}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                              {formatCurrency(donation.amount)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                donation.status === 'verified' 
                                  ? 'bg-green-100 text-green-800' 
                                  : donation.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800'
                                  : 'bg-red-100 text-red-800'
                              }`}>
                                {donation.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'expenses' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Expenses</h3>
                <div className="text-center py-8">
                  <p className="text-gray-500">Expense tracking will be implemented when the expenses collection is set up.</p>
                  <p className="text-sm text-gray-400 mt-2">This feature requires admin setup to track how donations are used.</p>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Impact Statement */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Our Impact</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Heart className="h-8 w-8 text-orange-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Total Donations</h4>
              <p className="text-2xl font-bold text-orange-600">{verifiedDonations.length}</p>
              <p className="text-sm text-gray-600">Verified donations</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Total Amount</h4>
              <p className="text-2xl font-bold text-green-600">{formatCurrency(totalDonations)}</p>
              <p className="text-sm text-gray-600">Raised for animals</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Available Funds</h4>
              <p className="text-2xl font-bold text-blue-600">{formatCurrency(availableFunds)}</p>
              <p className="text-sm text-gray-600">Ready to help animals</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransparencyDashboard

