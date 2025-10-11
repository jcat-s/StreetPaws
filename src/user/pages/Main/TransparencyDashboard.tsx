import { DollarSign, TrendingUp, Users, Heart, Calendar, BarChart3 } from 'lucide-react'

const TransparencyDashboard = () => {
  const monthlyStats = [
    { month: 'January', donations: 12500, animals: 23, adoptions: 18 },
    { month: 'February', donations: 15200, animals: 31, adoptions: 25 },
    { month: 'March', donations: 18900, animals: 28, adoptions: 22 },
    { month: 'April', donations: 22100, animals: 35, adoptions: 29 },
    { month: 'May', donations: 19800, animals: 27, adoptions: 24 },
    { month: 'June', donations: 25600, animals: 42, adoptions: 38 }
  ]

  const totalDonations = monthlyStats.reduce((sum, month) => sum + month.donations, 0)
  const totalAnimals = monthlyStats.reduce((sum, month) => sum + month.animals, 0)
  const totalAdoptions = monthlyStats.reduce((sum, month) => sum + month.adoptions, 0)

  const recentTransactions = [
    { id: 1, date: '2024-06-15', donor: 'Anonymous', amount: 5000, purpose: 'Medical Care' },
    { id: 2, date: '2024-06-14', donor: 'Maria Santos', amount: 2500, purpose: 'Pet Food' },
    { id: 3, date: '2024-06-13', donor: 'John Doe', amount: 1500, purpose: 'Shelter Equipment' },
    { id: 4, date: '2024-06-12', donor: 'Anonymous', amount: 3000, purpose: 'Veterinary Care' },
    { id: 5, date: '2024-06-11', donor: 'Anna Cruz', amount: 1000, purpose: 'Pet Food' }
  ]

  const expenseBreakdown = [
    { category: 'Medical Care', amount: 45000, percentage: 35 },
    { category: 'Pet Food', amount: 32000, percentage: 25 },
    { category: 'Shelter Maintenance', amount: 26000, percentage: 20 },
    { category: 'Staff Salaries', amount: 19000, percentage: 15 },
    { category: 'Administrative', amount: 6000, percentage: 5 }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Financial Transparency Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            We believe in complete transparency. Here's how your donations are being used to help animals in our community.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Donations (6 months)</p>
                <p className="text-3xl font-bold text-green-600">₱{totalDonations.toLocaleString()}</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Animals Helped</p>
                <p className="text-3xl font-bold text-blue-600">{totalAnimals}</p>
              </div>
              <div className="bg-blue-100 rounded-full p-3">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Successful Adoptions</p>
                <p className="text-3xl font-bold text-purple-600">{totalAdoptions}</p>
              </div>
              <div className="bg-purple-100 rounded-full p-3">
                <Heart className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Monthly Statistics */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <BarChart3 className="h-6 w-6 mr-2" />
            Monthly Statistics
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Month
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Donations (₱)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Animals Helped
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Adoptions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {monthlyStats.map((stat, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {stat.month}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-green-600 font-semibold">
                      ₱{stat.donations.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.animals}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {stat.adoptions}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Expense Breakdown */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Expense Breakdown
            </h2>
            <div className="space-y-4">
              {expenseBreakdown.map((expense, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex justify-between text-sm font-medium text-gray-900 mb-1">
                      <span>{expense.category}</span>
                      <span>₱{expense.amount.toLocaleString()}</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                        style={{ width: `${expense.percentage}%` }}
                      ></div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">{expense.percentage}%</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Calendar className="h-6 w-6 mr-2" />
              Recent Donations
            </h2>
            <div className="space-y-4">
              {recentTransactions.map((transaction) => (
                <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{transaction.donor}</p>
                    <p className="text-sm text-gray-600">{transaction.purpose}</p>
                    <p className="text-xs text-gray-500">{transaction.date}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₱{transaction.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Impact Statement */}
        <div className="bg-primary-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Your Donations Make a Real Difference
          </h2>
          <p className="text-gray-600 mb-6 max-w-3xl mx-auto">
            Every peso donated goes directly to helping animals in need. We maintain complete transparency 
            in our financial operations and provide regular updates on how your contributions are being used 
            to create a more compassionate community.
          </p>
          <div className="grid md:grid-cols-3 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">₱{Math.round(totalDonations / totalAnimals)}</div>
              <p className="text-sm text-gray-600">Average cost per animal helped</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">{Math.round((totalAdoptions / totalAnimals) * 100)}%</div>
              <p className="text-sm text-gray-600">Success rate for adoptions</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary-600 mb-2">₱{Math.round(totalDonations / 6).toLocaleString()}</div>
              <p className="text-sm text-gray-600">Average monthly donations</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransparencyDashboard