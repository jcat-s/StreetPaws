import { useEffect, useMemo, useState } from 'react'
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
  MapPin,
  DollarSign,
  User,
  PieChart
} from 'lucide-react'
import { collection, onSnapshot, orderBy, query, collectionGroup } from 'firebase/firestore'
import { db } from '../../config/firebase'

// Dashboard data types
type DashboardReport = {
  id: string
  type: 'lost' | 'found' | 'abuse' | string
  animalName?: string
  animalType?: string
  location?: string
  reporter?: string
  date: string
  status: string
  priority: 'urgent' | 'high' | 'medium' | 'normal'
}

type DashboardAdoption = {
  id: string
  animalName: string
  animalType: 'dog' | 'cat'
  applicantName: string
  status: 'pending' | 'approved' | 'rejected'
  submittedAt: string
}

type DashboardDonation = {
  id: string
  name: string
  amount: number
  paymentMethod: string
  status: 'pending' | 'verified' | 'rejected'
  createdAt: string
}

type DashboardVolunteer = {
  id: string
  name: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

type DashboardAnimal = {
  id: string
  name: string
  type: 'dog' | 'cat'
  status: 'available' | 'pending' | 'adopted' | 'archived'
  createdAt: string
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'adoptions'>('overview')
  
  // Data states
  const [recentReports, setRecentReports] = useState<DashboardReport[]>([])
  const [adoptions, setAdoptions] = useState<DashboardAdoption[]>([])
  const [donations, setDonations] = useState<DashboardDonation[]>([])
  const [volunteers, setVolunteers] = useState<DashboardVolunteer[]>([])
  const [animals, setAnimals] = useState<DashboardAnimal[]>([])
  
  // Counts
  const [reportCounts, setReportCounts] = useState({ total: 0, pending: 0, resolved: 0 })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      case 'investigating': return 'bg-blue-100 text-blue-800'
      case 'resolved': return 'bg-green-100 text-green-800'
      case 'verified': return 'bg-green-100 text-green-800'
      case 'available': return 'bg-green-100 text-green-800'
      case 'adopted': return 'bg-blue-100 text-blue-800'
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

  // Format currency helper
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount)
  }

  useEffect(() => {
    if (!db) return
    
    // Helper function to process documents
    const processReportDocs = (docs: any[], collectionType: string) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        const type: string = (d?.type || collectionType) as string
        // Normalize createdAt: support Timestamp.toDate, {seconds}, string, number; pending serverTimestamp -> mark invalid
        let createdAtIso: string
        if (d?.createdAt?.toDate) {
          createdAtIso = d.createdAt.toDate().toISOString()
        } else if (d?.createdAt && typeof d.createdAt === 'object' && typeof d.createdAt.seconds === 'number') {
          createdAtIso = new Date(d.createdAt.seconds * 1000).toISOString()
        } else if (typeof d?.createdAt === 'string') {
          const parsed = new Date(d.createdAt)
          createdAtIso = isNaN(parsed.getTime()) ? 'Invalid Date' : parsed.toISOString()
        } else if (typeof d?.createdAt === 'number') {
          const parsed = new Date(d.createdAt)
          createdAtIso = isNaN(parsed.getTime()) ? 'Invalid Date' : parsed.toISOString()
        } else if (d?.createdAt && typeof d.createdAt === 'object' && (d.createdAt._methodName === 'serverTimestamp' || d.createdAt.__type__ === 'serverTimestamp')) {
          createdAtIso = 'Invalid Date'
        } else {
          createdAtIso = 'Invalid Date'
        }

        const rawStatus: string = (d?.status || 'pending').toString().toLowerCase()
        const status: string = rawStatus === 'open' ? 'pending' : rawStatus

        return {
          id: doc.id,
          type: type as any,
          animalName: d?.animalName || 'Unknown',
          animalType: d?.animalType || 'unknown',
          location: d?.lastSeenLocation || d?.foundLocation || d?.incidentLocation || '',
          reporter: d?.contactName || d?.reporterName || 'Unknown',
          date: createdAtIso,
          status,
          priority: (d?.priority || 'normal') as DashboardReport['priority']
        }
      })
    }

    const processAdoptionDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        const createdAtIso: string = d?.submittedAt?.toDate ? d.submittedAt.toDate().toISOString() : 
                                   d?.createdAt?.toDate ? d.createdAt.toDate().toISOString() : 
                                   (typeof d?.submittedAt === 'string' ? d.submittedAt : 
                                    typeof d?.createdAt === 'string' ? d.createdAt : 'Invalid Date')
        
        return {
          id: doc.id,
          animalName: d?.animalName || 'Unknown',
          animalType: (d?.animalType || 'dog') as 'dog' | 'cat',
          applicantName: d?.applicantName || 'Unknown',
          status: (d?.status || 'pending') as 'pending' | 'approved' | 'rejected',
          submittedAt: createdAtIso
        }
      })
    }

    const processDonationDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        const createdAtIso: string = d?.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (typeof d?.createdAt === 'string' ? d.createdAt : 'Invalid Date')
        
        return {
          id: doc.id,
          name: d?.name || 'Anonymous',
          amount: Number(d?.amount || 0),
          paymentMethod: d?.paymentMethod || 'unknown',
          status: (d?.status || 'pending') as 'pending' | 'verified' | 'rejected',
          createdAt: createdAtIso
        }
      })
    }

    const processVolunteerDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        const createdAtIso: string = d?.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (typeof d?.createdAt === 'string' ? d.createdAt : 'Invalid Date')
        
        return {
          id: doc.id,
          name: d?.name || 'Unknown',
          status: (d?.status || 'pending') as 'pending' | 'approved' | 'rejected',
          createdAt: createdAtIso
        }
      })
    }

    const processAnimalDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        const createdAtIso: string = d?.createdAt?.toDate ? d.createdAt.toDate().toISOString() : (typeof d?.createdAt === 'string' ? d.createdAt : 'Invalid Date')
        
        return {
          id: doc.id,
          name: d?.name || 'Unknown',
          type: (d?.type || 'dog') as 'dog' | 'cat',
          status: (d?.status || 'available') as 'available' | 'pending' | 'adopted' | 'archived',
          createdAt: createdAtIso
        }
      })
    }
    
    // Use collectionGroup to read nested subcollections under reports/*
    const lostGroup = collectionGroup(db, 'lost')
    const foundGroup = collectionGroup(db, 'found')
    const abuseGroup = collectionGroup(db, 'abuse')
    const adoptionsQuery = query(collection(db, 'adoptions'))
    const donationsQuery = query(collection(db, 'donations'))
    const volunteersQuery = query(collection(db, 'volunteers'))
    
    let allReports: DashboardReport[] = []
    
    const unsubscribeAbuse = onSnapshot(query(abuseGroup), (snap) => {
      const reportsData = processReportDocs(snap.docs, 'abuse')
      allReports = allReports.filter(r => r.type !== 'abuse').concat(reportsData)
      updateReportCounts()
    })

    const unsubscribeLost = onSnapshot(query(lostGroup), (snap) => {
      const lostData = processReportDocs(snap.docs, 'lost')
      allReports = allReports.filter(r => r.type !== 'lost').concat(lostData)
      updateReportCounts()
    })
    
    const unsubscribeFound = onSnapshot(query(foundGroup), (snap) => {
      const foundData = processReportDocs(snap.docs, 'found')
      allReports = allReports.filter(r => r.type !== 'found').concat(foundData)
      updateReportCounts()
    })

    const unsubscribeAdoptions = onSnapshot(adoptionsQuery, (snap) => {
      setAdoptions(processAdoptionDocs(snap.docs))
    })

    const unsubscribeDonations = onSnapshot(donationsQuery, (snap) => {
      setDonations(processDonationDocs(snap.docs))
    })

    const unsubscribeVolunteers = onSnapshot(volunteersQuery, (snap) => {
      setVolunteers(processVolunteerDocs(snap.docs))
    })

    // For animals, we need to check if they exist in Firebase or use Supabase
    // For now, let's try Firebase first
    try {
      const animalsQuery = query(collection(db, 'animals'), orderBy('createdAt', 'desc'))
      const unsubscribeAnimals = onSnapshot(animalsQuery, (snap) => {
        setAnimals(processAnimalDocs(snap.docs))
      })
      
      return () => {
        unsubscribeAbuse()
        unsubscribeLost()
        unsubscribeFound()
        unsubscribeAdoptions()
        unsubscribeDonations()
        unsubscribeVolunteers()
        unsubscribeAnimals()
      }
    } catch (error) {
      // If animals collection doesn't exist in Firebase, just return other unsubscribes
      console.log('Animals collection not found in Firebase, using empty array')
      setAnimals([])
      
      return () => {
        unsubscribeAbuse()
        unsubscribeLost()
        unsubscribeFound()
        unsubscribeAdoptions()
        unsubscribeDonations()
        unsubscribeVolunteers()
      }
    }
    
    const updateReportCounts = () => {
      const totalCount = allReports.length
      const pendingCount = allReports.filter(r => r.status === 'pending' || r.status === 'investigating').length
      const resolvedCount = allReports.filter(r => r.status === 'resolved').length
      
      setReportCounts({ total: totalCount, pending: pendingCount, resolved: resolvedCount })
      setRecentReports([...allReports])
    }
  }, [])

  // Calculated metrics
  const urgentReportsCount = useMemo(() => recentReports.filter(r => r.priority === 'urgent' || r.priority === 'high').length, [recentReports])
  
  // Adoption metrics
  const adoptionStats = useMemo(() => ({
    total: adoptions.length,
    pending: adoptions.filter(a => a.status === 'pending').length,
    approved: adoptions.filter(a => a.status === 'approved').length,
    rejected: adoptions.filter(a => a.status === 'rejected').length,
    dogs: adoptions.filter(a => a.animalType === 'dog').length,
    cats: adoptions.filter(a => a.animalType === 'cat').length
  }), [adoptions])

  // Donation metrics
  const donationStats = useMemo(() => {
    const verified = donations.filter(d => d.status === 'verified')
    const totalAmount = verified.reduce((sum, d) => sum + d.amount, 0)
    const pendingAmount = donations.filter(d => d.status === 'pending').reduce((sum, d) => sum + d.amount, 0)
    
    return {
      total: donations.length,
      verified: verified.length,
      pending: donations.filter(d => d.status === 'pending').length,
      rejected: donations.filter(d => d.status === 'rejected').length,
      totalAmount,
      pendingAmount,
      averageAmount: verified.length > 0 ? totalAmount / verified.length : 0
    }
  }, [donations])

  // Volunteer metrics
  const volunteerStats = useMemo(() => ({
    total: volunteers.length,
    pending: volunteers.filter(v => v.status === 'pending').length,
    approved: volunteers.filter(v => v.status === 'approved').length,
    rejected: volunteers.filter(v => v.status === 'rejected').length
  }), [volunteers])

  // Animal metrics
  const animalStats = useMemo(() => ({
    total: animals.length,
    available: animals.filter(a => a.status === 'available').length,
    adopted: animals.filter(a => a.status === 'adopted').length,
    pending: animals.filter(a => a.status === 'pending').length,
    dogs: animals.filter(a => a.type === 'dog').length,
    cats: animals.filter(a => a.type === 'cat').length
  }), [animals])

  // Monthly trends (last 6 months)
  const monthlyTrends = useMemo(() => {
    const now = new Date()
    const months = []
    
    for (let i = 5; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1)
      const monthName = date.toLocaleDateString('en-US', { month: 'short' }).toUpperCase()
      
      const monthReports = recentReports.filter(r => {
        const reportDate = new Date(r.date)
        return reportDate.getMonth() === date.getMonth() && reportDate.getFullYear() === date.getFullYear()
      }).length
      
      const monthAdoptions = adoptions.filter(a => {
        const adoptionDate = new Date(a.submittedAt)
        return adoptionDate.getMonth() === date.getMonth() && adoptionDate.getFullYear() === date.getFullYear()
      }).length
      
      months.push({
        month: monthName,
        reports: monthReports,
        adoptions: monthAdoptions
      })
    }
    
    return months
  }, [recentReports, adoptions])

  // Recent activity for the last 7 days
  const recentActivity = useMemo(() => {
    const weekAgo = new Date()
    weekAgo.setDate(weekAgo.getDate() - 7)
    
    const recentAdoptions = adoptions.filter(a => new Date(a.submittedAt) >= weekAgo)
    const recentDonations = donations.filter(d => new Date(d.createdAt) >= weekAgo)
    const recentVolunteers = volunteers.filter(v => new Date(v.createdAt) >= weekAgo)
    
    return {
      adoptions: recentAdoptions.length,
      donations: recentDonations.length,
      volunteers: recentVolunteers.length,
      totalAmount: recentDonations.filter(d => d.status === 'verified').reduce((sum, d) => sum + d.amount, 0)
    }
  }, [adoptions, donations, volunteers])

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with StreetPaws today.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 mb-8">
          {/* Reports Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 p-3 rounded-full">
                <FileText className="h-6 w-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Reports</p>
                <p className="text-2xl font-bold text-gray-900">{reportCounts.total}</p>
                <p className="text-xs text-gray-500">{reportCounts.pending} pending • {reportCounts.resolved} resolved</p>
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
                <p className="text-2xl font-bold text-gray-900">{adoptionStats.total}</p>
                <p className="text-xs text-gray-500">{adoptionStats.pending} pending • {adoptionStats.approved} approved</p>
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
                <p className="text-2xl font-bold text-gray-900">{animalStats.total}</p>
                <p className="text-xs text-gray-500">{animalStats.dogs} dogs • {animalStats.cats} cats</p>
              </div>
            </div>
          </div>

          {/* Donations Stats */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center">
              <div className="bg-orange-100 p-3 rounded-full">
                <DollarSign className="h-6 w-6 text-orange-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Donations</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(donationStats.totalAmount)}</p>
                <p className="text-xs text-gray-500">{donationStats.verified} verified • {donationStats.pending} pending</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Urgent Reports</p>
                <p className="text-sm text-gray-600">{urgentReportsCount} items need attention</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Pending Adoptions</p>
                <p className="text-sm text-gray-600">{adoptionStats.pending} adoption applications</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <User className="h-5 w-5 text-blue-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Pending Volunteers</p>
                <p className="text-sm text-gray-600">{volunteerStats.pending} volunteer applications</p>
              </div>
            </button>
            <button className="flex items-center space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <DollarSign className="h-5 w-5 text-green-600" />
              <div className="text-left">
                <p className="font-medium text-gray-900">Pending Donations</p>
                <p className="text-sm text-gray-600">{donationStats.pending} donations to verify</p>
              </div>
            </button>
          </div>
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Monthly Trends Chart */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Monthly Trends</h3>
              <TrendingUp className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-4">
              {monthlyTrends.map((trend, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 text-sm font-medium text-gray-600">{trend.month}</div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <div className="w-16 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-orange-500 h-2 rounded-full" 
                            style={{ width: `${Math.min(100, (trend.reports / Math.max(1, Math.max(...monthlyTrends.map(t => t.reports)))) * 100)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm text-gray-600">{trend.reports}</span>
                      </div>
                      <div className="text-xs text-gray-500 mt-1">Reports</div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-16 bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-green-500 h-2 rounded-full" 
                        style={{ width: `${Math.min(100, (trend.adoptions / Math.max(1, Math.max(...monthlyTrends.map(t => t.adoptions)))) * 100)}%` }}
                      ></div>
                    </div>
                    <span className="text-sm text-gray-600">{trend.adoptions}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Animal Distribution */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Animal Distribution</h3>
              <PieChart className="h-5 w-5 text-orange-600" />
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Dogs</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{animalStats.dogs}</div>
                  <div className="text-xs text-gray-500">
                    {animalStats.total > 0 ? Math.round((animalStats.dogs / animalStats.total) * 100) : 0}% of total
                  </div>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-4 h-4 bg-orange-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-900">Cats</span>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-gray-900">{animalStats.cats}</div>
                  <div className="text-xs text-gray-500">
                    {animalStats.total > 0 ? Math.round((animalStats.cats / animalStats.total) * 100) : 0}% of total
                  </div>
                </div>
              </div>
              <div className="pt-4 border-t border-gray-200">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <div className="text-lg font-bold text-green-600">{animalStats.available}</div>
                    <div className="text-xs text-gray-500">Available</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-blue-600">{animalStats.adopted}</div>
                    <div className="text-xs text-gray-500">Adopted</div>
                  </div>
                  <div>
                    <div className="text-lg font-bold text-yellow-600">{animalStats.pending}</div>
                    <div className="text-xs text-gray-500">Pending</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Recent Activity Summary */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity (Last 7 Days)</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{recentActivity.adoptions}</div>
              <div className="text-sm text-gray-600">New Adoptions</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">{recentActivity.volunteers}</div>
              <div className="text-sm text-gray-600">New Volunteers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{recentActivity.donations}</div>
              <div className="text-sm text-gray-600">New Donations</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">{formatCurrency(recentActivity.totalAmount)}</div>
              <div className="text-sm text-gray-600">Donation Amount</div>
            </div>
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
                    {recentReports.length === 0 ? (
                      <p className="text-center text-gray-500">No recent reports to display.</p>
                    ) : (
                      recentReports.slice(0, 3).map((report) => (
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
                      ))
                    )}
                  </div>
                </div>

                {/* Recent Adoptions Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Adoptions</h3>
                  <div className="space-y-3">
                    {adoptions.length === 0 ? (
                      <p className="text-center text-gray-500">No recent adoptions.</p>
                    ) : (
                      adoptions.slice(0, 3).map((adoption) => (
                        <div key={adoption.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center space-x-3">
                            <div className="bg-orange-100 p-2 rounded-full">
                              <Heart className="h-4 w-4 text-orange-600" />
                            </div>
                            <div>
                              <p className="font-medium text-gray-900">{adoption.animalName} ({adoption.animalType})</p>
                              <p className="text-sm text-gray-600">by {adoption.applicantName}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adoption.status)}`}>
                              {adoption.status}
                            </span>
                            <p className="text-xs text-gray-500 mt-1">
                              {new Date(adoption.submittedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
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
                      {recentReports.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="px-6 py-8 text-center text-sm text-gray-500">No reports found.</td>
                        </tr>
                      ) : (
                        recentReports.map((report) => (
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
                        ))
                      )}
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
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {adoptions.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-8 text-center text-sm text-gray-500">No adoption data available.</td>
                        </tr>
                      ) : (
                        adoptions.map((adoption) => (
                          <tr key={adoption.id}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center">
                                <div className="p-2 rounded-full bg-orange-100 text-orange-600">
                                  <Heart className="h-4 w-4" />
                                </div>
                                <div className="ml-3">
                                  <div className="text-sm font-medium text-gray-900">{adoption.animalName}</div>
                                  <div className="text-sm text-gray-500 capitalize">{adoption.animalType}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{adoption.applicantName}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {new Date(adoption.submittedAt).toLocaleDateString()}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adoption.status)}`}>
                                {adoption.status}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                              <button className="text-orange-600 hover:text-orange-900 flex items-center space-x-1">
                                <Eye className="h-4 w-4" />
                                <span>View</span>
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
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
