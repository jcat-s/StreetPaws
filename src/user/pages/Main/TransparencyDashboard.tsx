import { useState } from 'react'
import { DollarSign, Heart, Package, Pill, TrendingUp, Users, Calendar } from 'lucide-react'

interface DonationRecord {
  id: string
  date: string
  amount: number
  donor: string
  purpose: string
  status: 'completed' | 'pending' | 'in_use'
}

interface ExpenseRecord {
  id: string
  date: string
  amount: number
  category: 'food' | 'medical' | 'shelter' | 'transport' | 'other'
  description: string
  beneficiary: string
}

// Mock data for demonstration
const MOCK_DONATIONS: DonationRecord[] = [
  { id: '1', date: '2024-01-15', amount: 5000, donor: 'Anonymous', purpose: 'General Fund', status: 'completed' },
  { id: '2', date: '2024-01-14', amount: 2500, donor: 'Maria Santos', purpose: 'Medical Care', status: 'completed' },
  { id: '3', date: '2024-01-13', amount: 1000, donor: 'Juan Dela Cruz', purpose: 'Pet Food', status: 'completed' },
  { id: '4', date: '2024-01-12', amount: 3000, donor: 'Ana Rodriguez', purpose: 'Shelter Maintenance', status: 'pending' },
  { id: '5', date: '2024-01-11', amount: 1500, donor: 'Pedro Martinez', purpose: 'Transportation', status: 'completed' },
]

const MOCK_EXPENSES: ExpenseRecord[] = [
  { id: '1', date: '2024-01-15', amount: 800, category: 'food', description: 'Dog and cat food supplies', beneficiary: 'All shelter animals' },
  { id: '2', date: '2024-01-14', amount: 1200, category: 'medical', description: 'Vaccination for 5 dogs', beneficiary: 'Rescued dogs' },
  { id: '3', date: '2024-01-13', amount: 500, category: 'shelter', description: 'Cleaning supplies and bedding', beneficiary: 'Shelter facilities' },
  { id: '4', date: '2024-01-12', amount: 300, category: 'transport', description: 'Fuel for rescue operations', beneficiary: 'Rescue team' },
  { id: '5', date: '2024-01-11', amount: 600, category: 'medical', description: 'Emergency treatment for injured cat', beneficiary: 'Found stray cat' },
]

const TransparencyDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'donations' | 'expenses'>('overview')

  const totalDonations = MOCK_DONATIONS.reduce((sum, donation) => sum + donation.amount, 0)
  const totalExpenses = MOCK_EXPENSES.reduce((sum, expense) => sum + expense.amount, 0)
  const availableFunds = totalDonations - totalExpenses

  const donationsByPurpose = MOCK_DONATIONS.reduce((acc, donation) => {
    acc[donation.purpose] = (acc[donation.purpose] || 0) + donation.amount
    return acc
  }, {} as Record<string, number>)

  const expensesByCategory = MOCK_EXPENSES.reduce((acc, expense) => {
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
                    {[...MOCK_DONATIONS.slice(0, 3), ...MOCK_EXPENSES.slice(0, 2)]
                      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                      .map((item, index) => (
                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center">
                            <div className={`p-2 rounded-full ${
                              'purpose' in item ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                            }`}>
                              {'purpose' in item ? <DollarSign className="h-4 w-4" /> : <Package className="h-4 w-4" />}
                            </div>
                            <div className="ml-3">
                              <p className="font-medium text-gray-900">
                                {'purpose' in item ? `Donation: ${item.purpose}` : `Expense: ${item.description}`}
                              </p>
                              <p className="text-sm text-gray-600">{formatDate(item.date)}</p>
                            </div>
                          </div>
                          <span className={`font-bold ${
                            'purpose' in item ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {'purpose' in item ? '+' : '-'}{formatCurrency(item.amount)}
                          </span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'donations' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Donations</h3>
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
                      {MOCK_DONATIONS.map((donation) => (
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
                              donation.status === 'completed' 
                                ? 'bg-green-100 text-green-800' 
                                : donation.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-800'
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {donation.status.replace('_', ' ')}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'expenses' && (
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">All Expenses</h3>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Category</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Beneficiary</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {MOCK_EXPENSES.map((expense) => (
                        <tr key={expense.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(expense.date)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`p-1 rounded-full ${getCategoryColor(expense.category)}`}>
                                {getCategoryIcon(expense.category)}
                              </div>
                              <span className="ml-2 text-sm text-gray-900 capitalize">{expense.category}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {expense.description}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {expense.beneficiary}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-red-600">
                            {formatCurrency(expense.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
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
              <h4 className="font-semibold text-gray-900 mb-1">Animals Rescued</h4>
              <p className="text-2xl font-bold text-orange-600">47</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Users className="h-8 w-8 text-green-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Animals Adopted</h4>
              <p className="text-2xl font-bold text-green-600">23</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-3">
                <Calendar className="h-8 w-8 text-blue-600" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">Reports Processed</h4>
              <p className="text-2xl font-bold text-blue-600">156</p>
              <p className="text-sm text-gray-600">This month</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransparencyDashboard

