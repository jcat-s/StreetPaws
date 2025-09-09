import { useState } from 'react'
import { 
  FileText, 
  Heart, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MapPin
} from 'lucide-react'

// Mock data - In production, this would come from your database
const MOCK_STATS = {
  totalReports: 156,
  pendingReports: 23,
  resolvedReports: 133,
  totalAdoptions: 47,
  pendingAdoptions: 8,
  approvedAdoptions: 39,
  totalAnimals: 89,
  availableAnimals: 42,
  adoptedAnimals: 47,
  totalVolunteers: 34,
  activeVolunteers: 28,
  totalDonations: 125000,
  monthlyDonations: 15000
}

const MOCK_RECENT_REPORTS = [
  {
    id: '1',
    type: 'lost',
    animalName: 'Buddy',
    animalType: 'dog',
    location: 'Barangay 1',
    reporter: 'Maria Santos',
    date: '2024-01-15',
    status: 'pending',
    priority: 'high'
  },
  {
    id: '2',
    type: 'abuse',
    animalName: 'Unknown',
    animalType: 'cat',
    location: 'Barangay 5',
    reporter: 'Juan Dela Cruz',
    date: '2024-01-15',
    status: 'investigating',
    priority: 'urgent'
  },
  {
    id: '3',
    type: 'found',
    animalName: 'Luna',
    animalType: 'dog',
    location: 'Barangay 3',
    reporter: 'Ana Rodriguez',
    date: '2024-01-14',
    status: 'resolved',
    priority: 'medium'
  }
]

const MOCK_RECENT_ADOPTIONS = [
  {
    id: '1',
    animalName: 'Jepoy',
    animalType: 'dog',
    applicantName: 'Pedro Martinez',
    date: '2024-01-15',
    status: 'pending',
    priority: 'normal'
  },
  {
    id: '2',
    animalName: 'Putchi',
    animalType: 'cat',
    applicantName: 'Sofia Garcia',
    date: '2024-01-14',
    status: 'approved',
    priority: 'normal'
  },
  {
    id: '3',
    animalName: 'Josh',
    animalType: 'dog',
    applicantName: 'Miguel Torres',
    date: '2024-01-13',
    status: 'rejected',
    priority: 'normal'
  }
]

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'adoptions'>('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
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

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with StreetPaws today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Reports Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_STATS.totalReports}</p>
                <p className="text-xs text-gray-500">{MOCK_STATS.pendingReports} pending</p>
              </div>
            </div>
          </div>

          {/* Adoptions Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Adoptions</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_STATS.totalAdoptions}</p>
                <p className="text-xs text-gray-500">{MOCK_STATS.pendingAdoptions} pending</p>
              </div>
            </div>
          </div>

          {/* Animals Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Animals</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_STATS.totalAnimals}</p>
                <p className="text-xs text-gray-500">{MOCK_STATS.availableAnimals} available</p>
              </div>
            </div>
          </div>

          {/* Donations Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <TrendingUp className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Donations</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(MOCK_STATS.totalDonations)}</p>
                <p className="text-xs text-gray-500">{formatCurrency(MOCK_STATS.monthlyDonations)} this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Urgent Reports</p>
                <p className="text-sm text-gray-600">3 items need attention</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Pending Reviews</p>
                <p className="text-sm text-gray-600">8 adoption applications</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Users className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">New Animals</p>
                <p className="text-sm text-gray-600">5 animals added today</p>
              </div>
            </button>
          </div>
        </div>

        {/* Recent Activity Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: TrendingUp },
                { id: 'reports', name: 'Recent Reports', icon: FileText },
                { id: 'adoptions', name: 'Recent Adoptions', icon: Heart }
              ].map((tab) => {
                const Icon = tab.icon
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                      activeTab === tab.id
                        ? 'border-orange-500 text-orange-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span>{tab.name}</span>
                  </button>
                )
              })}
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Reports Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
                  <div className="space-y-3">
                    {MOCK_RECENT_REPORTS.slice(0, 3).map((report) => (
                      <div key={report.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className={`p-2 rounded-full ${
                            report.type === 'lost' ? 'bg-blue-100 text-blue-600' :
                            report.type === 'found' ? 'bg-green-100 text-green-600' :
                            'bg-red-100 text-red-600'
                          }`}>
                            {report.type === 'lost' ? <AlertTriangle className="h-4 w-4" /> :
                             report.type === 'found' ? <CheckCircle className="h-4 w-4" /> :
                             <XCircle className="h-4 w-4" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{report.animalName} ({report.animalType})</p>
                            <p className="text-sm text-gray-600">{report.location} • {report.reporter}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(report.status)}`}>
                            {report.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{report.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Adoptions Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Adoptions</h3>
                  <div className="space-y-3">
                    {MOCK_RECENT_ADOPTIONS.slice(0, 3).map((adoption) => (
                      <div key={adoption.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="bg-orange-100 p-2 rounded-full">
                            <Heart className="h-4 w-4 text-orange-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{adoption.animalName} ({adoption.animalType})</p>
                            <p className="text-sm text-gray-600">{adoption.applicantName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adoption.status)}`}>
                            {adoption.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{adoption.date}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Recent Reports</h3>
                  <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                    View All Reports
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Report</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Location</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reporter</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {MOCK_RECENT_REPORTS.map((report) => (
                        <tr key={report.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`p-2 rounded-full ${
                                report.type === 'lost' ? 'bg-blue-100 text-blue-600' :
                                report.type === 'found' ? 'bg-green-100 text-green-600' :
                                'bg-red-100 text-red-600'
                              }`}>
                                {report.type === 'lost' ? <AlertTriangle className="h-4 w-4" /> :
                                 report.type === 'found' ? <CheckCircle className="h-4 w-4" /> :
                                 <XCircle className="h-4 w-4" />}
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{report.animalName}</div>
                                <div className="text-sm text-gray-500 capitalize">{report.animalType} • {report.type}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center text-sm text-gray-900">
                              <MapPin className="h-4 w-4 text-gray-400 mr-1" />
                              {report.location}
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{report.reporter}</td>
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-orange-600 hover:text-orange-900 flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>View</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === 'adoptions' && (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-900">All Recent Adoptions</h3>
                  <button className="text-orange-600 hover:text-orange-700 text-sm font-medium">
                    View All Adoptions
                  </button>
                </div>
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Priority</th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {MOCK_RECENT_ADOPTIONS.map((adoption) => (
                        <tr key={adoption.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="bg-orange-100 p-2 rounded-full">
                                <Heart className="h-4 w-4 text-orange-600" />
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{adoption.animalName}</div>
                                <div className="text-sm text-gray-500 capitalize">{adoption.animalType}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{adoption.applicantName}</td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{adoption.date}</td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adoption.status)}`}>
                              {adoption.status}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(adoption.priority)}`}>
                              {adoption.priority}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <button className="text-orange-600 hover:text-orange-900 flex items-center space-x-1">
                              <Eye className="h-4 w-4" />
                              <span>Review</span>
                            </button>
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
      </div>
    </div>
  )
}

export default AdminDashboard
