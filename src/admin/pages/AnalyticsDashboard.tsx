import { useState, useEffect } from 'react'
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
import { db } from '../../config/firebase'
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore'

// Real data from database

const AnalyticsDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'adoptions' | 'geographic'>('overview')
  const [reports, setReports] = useState<any[]>([])
  const [adoptions, setAdoptions] = useState<any[]>([])
  const [donations, setDonations] = useState<any[]>([])
  const [animals, setAnimals] = useState<any[]>([])

  // Fetch data from database
  useEffect(() => {
    if (!db) return

    const unsubscribeFunctions: (() => void)[] = []

    // Fetch reports
    const reportsQuery = query(collection(db, 'reports'), orderBy('createdAt', 'desc'))
    const unsubscribeReports = onSnapshot(reportsQuery, (snapshot) => {
      const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setReports(reportsData)
    })
    unsubscribeFunctions.push(unsubscribeReports)

    // Fetch adoptions
    const adoptionsQuery = query(collection(db, 'adoptions'), orderBy('createdAt', 'desc'))
    const unsubscribeAdoptions = onSnapshot(adoptionsQuery, (snapshot) => {
      const adoptionsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAdoptions(adoptionsData)
    })
    unsubscribeFunctions.push(unsubscribeAdoptions)

    // Fetch donations
    const donationsQuery = query(collection(db, 'donations'), orderBy('createdAt', 'desc'))
    const unsubscribeDonations = onSnapshot(donationsQuery, (snapshot) => {
      const donationsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setDonations(donationsData)
    })
    unsubscribeFunctions.push(unsubscribeDonations)

    // Fetch animals
    const animalsQuery = query(collection(db, 'animals'), orderBy('createdAt', 'desc'))
    const unsubscribeAnimals = onSnapshot(animalsQuery, (snapshot) => {
      const animalsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))
      setAnimals(animalsData)
    })
    unsubscribeFunctions.push(unsubscribeAnimals)


    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
  }, [])

  // Calculate analytics from real data
  const analytics = {
    overview: {
      totalReports: reports.length,
      totalAdoptions: adoptions.filter(a => a.status === 'approved').length,
      totalAnimals: animals.length,
      totalDonations: donations.filter(d => d.status === 'verified').reduce((sum, d) => sum + (d.amount || 0), 0),
      monthlyGrowth: 0, // Would need historical data to calculate
      adoptionRate: adoptions.length > 0 ? (adoptions.filter(a => a.status === 'approved').length / adoptions.length) * 100 : 0,
      resolutionRate: reports.length > 0 ? (reports.filter(r => r.status === 'resolved').length / reports.length) * 100 : 0
    },
    reportsByType: [
      { type: 'Lost', count: reports.filter(r => r.type === 'lost').length, percentage: reports.length > 0 ? (reports.filter(r => r.type === 'lost').length / reports.length) * 100 : 0 },
      { type: 'Found', count: reports.filter(r => r.type === 'found').length, percentage: reports.length > 0 ? (reports.filter(r => r.type === 'found').length / reports.length) * 100 : 0 },
      { type: 'Abuse', count: reports.filter(r => r.type === 'abuse').length, percentage: reports.length > 0 ? (reports.filter(r => r.type === 'abuse').length / reports.length) * 100 : 0 }
    ],
    reportsByStatus: [
      { status: 'Resolved', count: reports.filter(r => r.status === 'resolved').length, percentage: reports.length > 0 ? (reports.filter(r => r.status === 'resolved').length / reports.length) * 100 : 0 },
      { status: 'Investigating', count: reports.filter(r => r.status === 'investigating').length, percentage: reports.length > 0 ? (reports.filter(r => r.status === 'investigating').length / reports.length) * 100 : 0 },
      { status: 'Pending', count: reports.filter(r => r.status === 'pending').length, percentage: reports.length > 0 ? (reports.filter(r => r.status === 'pending').length / reports.length) * 100 : 0 }
    ],
    animalTypes: [
      { type: 'Dogs', count: animals.filter(a => a.animalType === 'dog').length, percentage: animals.length > 0 ? (animals.filter(a => a.animalType === 'dog').length / animals.length) * 100 : 0 },
      { type: 'Cats', count: animals.filter(a => a.animalType === 'cat').length, percentage: animals.length > 0 ? (animals.filter(a => a.animalType === 'cat').length / animals.length) * 100 : 0 }
    ]
  }

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
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalReports}</p>
                <p className="text-xs text-gray-500">Total reports received</p>
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
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalAdoptions}</p>
                <p className="text-xs text-green-600">{formatPercentage(analytics.overview.adoptionRate)} success rate</p>
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
                <p className="text-2xl font-bold text-gray-900">{analytics.overview.totalAnimals}</p>
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
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics.overview.totalDonations)}</p>
                <p className="text-xs text-gray-500">Verified donations</p>
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
                          <p className="text-3xl font-bold text-blue-900">{formatPercentage(analytics.overview.resolutionRate)}</p>
                        </div>
                        <CheckCircle className="h-8 w-8 text-blue-600" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-green-600">Adoption Success Rate</p>
                          <p className="text-3xl font-bold text-green-900">{formatPercentage(analytics.overview.adoptionRate)}</p>
                        </div>
                        <Heart className="h-8 w-8 text-green-600" />
                      </div>
                    </div>
                    <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-orange-600">Monthly Growth</p>
                          <p className="text-3xl font-bold text-orange-900">N/A</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Current Data Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Data Summary</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Historical trends will be available as more data is collected.</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Total Reports</p>
                          <p className="text-2xl font-bold text-blue-600">{analytics.overview.totalReports}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Total Adoptions</p>
                          <p className="text-2xl font-bold text-green-600">{analytics.overview.totalAdoptions}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Total Donations</p>
                          <p className="text-2xl font-bold text-orange-600">{formatCurrency(analytics.overview.totalDonations)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Animal Types Distribution */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Types Distribution</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {analytics.animalTypes.map((animal) => (
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
                    {analytics.reportsByType.map((report) => (
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
                    {analytics.reportsByStatus.map((status) => (
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
                {/* Adoption Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Adoption Summary</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Historical adoption trends will be available as more data is collected.</p>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Total Applications</p>
                          <p className="text-2xl font-bold text-blue-600">{adoptions.length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Approved Adoptions</p>
                          <p className="text-2xl font-bold text-green-600">{adoptions.filter(a => a.status === 'approved').length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Success Rate</p>
                          <p className="text-2xl font-bold text-orange-600">{formatPercentage(analytics.overview.adoptionRate)}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'geographic' && (
              <div className="space-y-8">
                {/* Geographic Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Geographic analytics will be available when location data is properly tracked in reports.</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Reports with Location</p>
                          <p className="text-2xl font-bold text-blue-600">{reports.filter(r => r.barangay || r.location).length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Total Reports</p>
                          <p className="text-2xl font-bold text-green-600">{reports.length}</p>
                        </div>
                      </div>
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
