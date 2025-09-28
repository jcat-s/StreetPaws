import { useState } from 'react'
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  Heart, 
  FileText, 
  MapPin,
  DollarSign,
  CheckCircle
} from 'lucide-react'

// Mock data - In production, this would come from your database
const MOCK_ANALYTICS = {
  overview: {
    totalReports: 156,
    totalAdoptions: 47,
    totalAnimals: 89,
    totalDonations: 125000,
    monthlyGrowth: 12.5,
    adoptionRate: 68.2,
    resolutionRate: 85.3
  },
  reportsByType: [
    { type: 'Lost', count: 67, percentage: 43 },
    { type: 'Found', count: 45, percentage: 29 },
    { type: 'Abuse', count: 44, percentage: 28 }
  ],
  reportsByStatus: [
    { status: 'Resolved', count: 133, percentage: 85.3 },
    { status: 'Investigating', count: 15, percentage: 9.6 },
    { status: 'Pending', count: 8, percentage: 5.1 }
  ],
  adoptionsByMonth: [
    { month: 'Jan', adoptions: 12, applications: 18 },
    { month: 'Feb', adoptions: 15, applications: 22 },
    { month: 'Mar', adoptions: 8, applications: 14 },
    { month: 'Apr', adoptions: 20, applications: 28 },
    { month: 'May', adoptions: 18, applications: 25 },
    { month: 'Jun', adoptions: 22, applications: 32 }
  ],
  topBarangays: [
    { barangay: 'Barangay 1', reports: 23, adoptions: 8 },
    { barangay: 'Barangay 3', reports: 19, adoptions: 6 },
    { barangay: 'Barangay 5', reports: 17, adoptions: 5 },
    { barangay: 'Barangay 2', reports: 15, adoptions: 4 },
    { barangay: 'Barangay 4', reports: 12, adoptions: 3 }
  ],
  animalTypes: [
    { type: 'Dogs', count: 67, percentage: 75.3 },
    { type: 'Cats', count: 22, percentage: 24.7 }
  ],
  monthlyTrends: [
    { month: 'Jan', reports: 18, adoptions: 12, donations: 15000 },
    { month: 'Feb', reports: 22, adoptions: 15, donations: 18000 },
    { month: 'Mar', reports: 15, adoptions: 8, donations: 12000 },
    { month: 'Apr', reports: 28, adoptions: 20, donations: 22000 },
    { month: 'May', reports: 25, adoptions: 18, donations: 20000 },
    { month: 'Jun', reports: 32, adoptions: 22, donations: 25000 }
  ]
}

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'adoptions' | 'geographic'>('overview')

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Comprehensive insights and analytics for StreetPaws operations.</p>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_ANALYTICS.overview.totalReports}</p>
                <p className="text-xs text-green-600">+{MOCK_ANALYTICS.overview.monthlyGrowth}% this month</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-green-100 p-3 rounded-full">
                <Heart className="h-6 w-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Adoptions</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_ANALYTICS.overview.totalAdoptions}</p>
                <p className="text-xs text-green-600">{formatPercentage(MOCK_ANALYTICS.overview.adoptionRate)} success rate</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-purple-100 p-3 rounded-full">
                <Users className="h-6 w-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Animals in Care</p>
                <p className="text-2xl font-bold text-gray-900">{MOCK_ANALYTICS.overview.totalAnimals}</p>
                <p className="text-xs text-gray-500">Currently in shelter</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Donations</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(MOCK_ANALYTICS.overview.totalDonations)}</p>
                <p className="text-xs text-green-600">+15% this month</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'reports', name: 'Reports Analytics', icon: FileText },
                { id: 'adoptions', name: 'Adoption Analytics', icon: Heart },
                { id: 'geographic', name: 'Geographic', icon: MapPin }
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
              <div className="space-y-8">
                {/* Key Metrics */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-blue-600">Resolution Rate</p>
                          <p className="text-3xl font-bold text-blue-900">{formatPercentage(MOCK_ANALYTICS.overview.resolutionRate)}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Adoption Success Rate</p>
                          <p className="text-3xl font-bold text-green-900">{formatPercentage(MOCK_ANALYTICS.overview.adoptionRate)}</p>
                        </div>
                        <Heart className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Monthly Growth</p>
                          <p className="text-3xl font-bold text-orange-900">+{formatPercentage(MOCK_ANALYTICS.overview.monthlyGrowth)}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Monthly Trends Chart */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="grid grid-cols-6 gap-4">
                      {MOCK_ANALYTICS.monthlyTrends.map((trend) => (
                        <div key={trend.month} className="text-center">
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm font-medium text-gray-900">{trend.month}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-600">Reports</span>
                                <span className="font-medium">{trend.reports}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600">Adoptions</span>
                                <span className="font-medium">{trend.adoptions}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-orange-600">Donations</span>
                                <span className="font-medium">{formatCurrency(trend.donations)}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Animal Types Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Types Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MOCK_ANALYTICS.animalTypes.map((animal) => (
                      <div key={animal.type} className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">{animal.type}</h4>
                          <span className="text-2xl font-bold text-gray-900">{animal.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${animal.type === 'Dogs' ? 'bg-blue-500' : 'bg-purple-500'}`}
                            style={{ width: `${animal.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{formatPercentage(animal.percentage)} of total animals</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="space-y-8">
                {/* Reports by Type */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Type</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {MOCK_ANALYTICS.reportsByType.map((report) => (
                      <div key={report.type} className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">{report.type}</h4>
                          <span className="text-2xl font-bold text-gray-900">{report.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              report.type === 'Lost' ? 'bg-blue-500' :
                              report.type === 'Found' ? 'bg-green-500' : 'bg-red-500'
                            }`}
                            style={{ width: `${report.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{formatPercentage(report.percentage)} of total reports</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Reports by Status */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Status</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {MOCK_ANALYTICS.reportsByStatus.map((status) => (
                      <div key={status.status} className="bg-gray-50 p-6 rounded-lg">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-gray-900">{status.status}</h4>
                          <span className="text-2xl font-bold text-gray-900">{status.count}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className={`h-2 rounded-full ${
                              status.status === 'Resolved' ? 'bg-green-500' :
                              status.status === 'Investigating' ? 'bg-blue-500' : 'bg-yellow-500'
                            }`}
                            style={{ width: `${status.percentage}%` }}
                          ></div>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">{formatPercentage(status.percentage)} of total reports</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'adoptions' && (
              <div className="space-y-8">
                {/* Adoption Trends */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adoption Trends</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="grid grid-cols-6 gap-4">
                      {MOCK_ANALYTICS.adoptionsByMonth.map((month) => (
                        <div key={month.month} className="text-center">
                          <div className="bg-white p-4 rounded-lg shadow-sm">
                            <p className="text-sm font-medium text-gray-900">{month.month}</p>
                            <div className="mt-2 space-y-1">
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-green-600">Adoptions</span>
                                <span className="font-medium">{month.adoptions}</span>
                              </div>
                              <div className="flex items-center justify-between text-xs">
                                <span className="text-blue-600">Applications</span>
                                <span className="font-medium">{month.applications}</span>
                              </div>
                              <div className="text-xs text-gray-500">
                                {formatPercentage((month.adoptions / month.applications) * 100)} success
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'geographic' && (
              <div className="space-y-8">
                {/* Top Barangays */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Top Barangays by Activity</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="space-y-4">
                      {MOCK_ANALYTICS.topBarangays.map((barangay, index) => (
                        <div key={barangay.barangay} className="flex items-center justify-between bg-white p-4 rounded-lg shadow-sm">
                          <div className="flex items-center space-x-4">
                            <div className="bg-orange-100 p-2 rounded-full">
                              <span className="text-orange-600 font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-900">{barangay.barangay}</h4>
                              <p className="text-sm text-gray-600">{barangay.reports} reports • {barangay.adoptions} adoptions</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{barangay.reports + barangay.adoptions} total</p>
                            <p className="text-xs text-gray-500">activities</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default AnalyticsDashboard
