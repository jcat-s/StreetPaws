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
  PieChart as PieChartIcon
} from 'lucide-react'
import { collection, onSnapshot, orderBy, query, collectionGroup } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'

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
  const [activeTab, setActiveTab] = useState<'overview' | 'reports' | 'adoptions' | 'analytics'>('overview')
  
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
    
    // Helper function to safely process timestamps
    const processTimestamp = (timestamp: any): string => {
      if (!timestamp) return new Date().toISOString()
      
      if (timestamp.toDate && typeof timestamp.toDate === 'function') {
        return timestamp.toDate().toISOString()
      }
      
      if (timestamp.seconds && typeof timestamp.seconds === 'number') {
        return new Date(timestamp.seconds * 1000).toISOString()
      }
      
      if (typeof timestamp === 'string') {
        const parsed = new Date(timestamp)
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
      }
      
      if (typeof timestamp === 'number') {
        const parsed = new Date(timestamp)
        return isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString()
      }
      
      return new Date().toISOString()
    }

    // Helper function to process documents with better data normalization
    const processReportDocs = (docs: any[], collectionType: string) => {
      return docs.map((doc) => {
        const d: any = doc.data()

        // Normalize createdAt similar to ReportsManagement
        let createdAtIso: string
        if (d?.createdAt?.toDate) {
          createdAtIso = d.createdAt.toDate().toISOString()
        } else if (d?.createdAt && typeof d.createdAt === 'object' && typeof d.createdAt.seconds === 'number') {
          createdAtIso = new Date(d.createdAt.seconds * 1000).toISOString()
        } else if (typeof d?.createdAtMs === 'number') {
          createdAtIso = new Date(d.createdAtMs).toISOString()
        } else if (typeof d?.submissionId === 'string' && /^\d+\-/.test(d.submissionId)) {
          const ms = Number(d.submissionId.split('-')[0])
          createdAtIso = isNaN(ms) ? 'Invalid Date' : new Date(ms).toISOString()
        } else if (typeof d?.createdAt === 'string') {
          const parsed = new Date(d.createdAt)
          createdAtIso = isNaN(parsed.getTime()) ? 'Invalid Date' : parsed.toISOString()
        } else if (d?.submittedAt) {
          createdAtIso = processTimestamp(d.submittedAt)
        } else {
          createdAtIso = 'Invalid Date'
        }

        const rawStatus: string = (d?.status || 'pending').toString().toLowerCase()
        const status: string = rawStatus === 'open' ? 'pending' : rawStatus

        return {
          id: doc.id,
          type: collectionType,
          animalName: d?.animalName || d?.name || 'Unknown Animal',
          animalType: d?.animalType || d?.type || 'unknown',
          location: d?.lastSeenLocation || d?.foundLocation || d?.incidentLocation || d?.location || 'Unknown Location',
          reporter: d?.contactName || d?.reporterName || d?.name || 'Anonymous',
          date: createdAtIso,
          status,
          priority: (d?.priority || 'normal').toLowerCase()
        }
      })
    }

    const processAdoptionDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        
        return {
          id: doc.id,
          animalName: d?.animalName || d?.name || 'Unknown Animal',
          animalType: (d?.animalType || d?.type || 'dog') as 'dog' | 'cat',
          applicantName: d?.applicantName || d?.name || 'Anonymous',
          status: (d?.status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected',
          submittedAt: processTimestamp(d?.submittedAt || d?.createdAt)
        }
      })
    }

    const processDonationDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        
        return {
          id: doc.id,
          name: d?.name || d?.donorName || 'Anonymous',
          amount: Number(d?.amount || d?.donationAmount || 0),
          paymentMethod: d?.paymentMethod || d?.paymentType || 'unknown',
          status: (d?.status || 'pending').toLowerCase() as 'pending' | 'verified' | 'rejected',
          createdAt: processTimestamp(d?.createdAt || d?.donationDate)
        }
      })
    }

    const processVolunteerDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        
        return {
          id: doc.id,
          name: d?.name || d?.fullName || 'Anonymous',
          status: (d?.status || 'pending').toLowerCase() as 'pending' | 'approved' | 'rejected',
          createdAt: processTimestamp(d?.createdAt || d?.applicationDate)
        }
      })
    }

    const processAnimalDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        
        return {
          id: doc.id,
          name: d?.name || d?.animalName || 'Unknown',
          type: (d?.type || d?.animalType || 'dog') as 'dog' | 'cat',
          status: (d?.status || 'available').toLowerCase() as 'available' | 'pending' | 'adopted' | 'archived',
          createdAt: processTimestamp(d?.createdAt || d?.admissionDate)
        }
      })
    }
    
    // Initialize data containers
    let allReports: DashboardReport[] = []
    let reportsByType: { [key: string]: DashboardReport[] } = { lost: [], found: [], abuse: [] }
    
    // Read from new top-level collections after migration
    const lostCollection = collection(db, 'reports-lost')
    const foundCollection = collection(db, 'reports-found')
    const abuseCollection = collection(db, 'reports-abuse')
    const adoptionsQuery = query(collection(db, 'adoptions'), orderBy('submittedAt', 'desc'))
    const donationsQuery = query(collection(db, 'donations'), orderBy('createdAt', 'desc'))
    const volunteersQuery = query(collection(db, 'volunteers'), orderBy('createdAt', 'desc'))
    
    // Function to update reports without duplicates
    const updateReports = () => {
      allReports = [...reportsByType.lost, ...reportsByType.found, ...reportsByType.abuse]
      // Remove duplicates based on ID
      const uniqueReports = allReports.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.id === current.id)
        if (existingIndex === -1) {
          acc.push(current)
        } else {
          // Keep the most recent version
          if (new Date(current.date) > new Date(acc[existingIndex].date)) {
            acc[existingIndex] = current
          }
        }
        return acc
      }, [] as DashboardReport[])
      
      allReports = uniqueReports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      
      const totalCount = allReports.length
      const pendingCount = allReports.filter(r => r.status === 'pending' || r.status === 'investigating').length
      const resolvedCount = allReports.filter(r => r.status === 'resolved').length
      
      setReportCounts({ total: totalCount, pending: pendingCount, resolved: resolvedCount })
      setRecentReports([...allReports])
    }
    
    const unsubscribeAbuse = onSnapshot(query(abuseCollection, orderBy('createdAt', 'desc')), (snap) => {
      reportsByType.abuse = processReportDocs(snap.docs, 'abuse')
      updateReports()
    })

    const unsubscribeLost = onSnapshot(query(lostCollection, orderBy('createdAt', 'desc')), (snap) => {
      reportsByType.lost = processReportDocs(snap.docs, 'lost')
      updateReports()
    })
    
    const unsubscribeFound = onSnapshot(query(foundCollection, orderBy('createdAt', 'desc')), (snap) => {
      reportsByType.found = processReportDocs(snap.docs, 'found')
      updateReports()
    })

    const unsubscribeAdoptions = onSnapshot(adoptionsQuery, (snap) => {
      const adoptionData = processAdoptionDocs(snap.docs)
      // Remove duplicates
      const uniqueAdoptions = adoptionData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.id === current.id)
        if (existingIndex === -1) {
          acc.push(current)
        }
        return acc
      }, [] as DashboardAdoption[])
      setAdoptions(uniqueAdoptions)
    })

    const unsubscribeDonations = onSnapshot(donationsQuery, (snap) => {
      const donationData = processDonationDocs(snap.docs)
      // Remove duplicates
      const uniqueDonations = donationData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.id === current.id)
        if (existingIndex === -1) {
          acc.push(current)
        }
        return acc
      }, [] as DashboardDonation[])
      setDonations(uniqueDonations)
    })

    const unsubscribeVolunteers = onSnapshot(volunteersQuery, (snap) => {
      const volunteerData = processVolunteerDocs(snap.docs)
      // Remove duplicates
      const uniqueVolunteers = volunteerData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.id === current.id)
        if (existingIndex === -1) {
          acc.push(current)
        }
        return acc
      }, [] as DashboardVolunteer[])
      setVolunteers(uniqueVolunteers)
    })

    // Try to fetch animals from Firebase
    let unsubscribeAnimals: (() => void) | null = null
    try {
      const animalsQuery = query(collection(db, 'animals'), orderBy('createdAt', 'desc'))
      unsubscribeAnimals = onSnapshot(animalsQuery, (snap) => {
        const animalData = processAnimalDocs(snap.docs)
        // Remove duplicates
        const uniqueAnimals = animalData.reduce((acc, current) => {
          const existingIndex = acc.findIndex(item => item.id === current.id)
          if (existingIndex === -1) {
            acc.push(current)
          }
          return acc
        }, [] as DashboardAnimal[])
        setAnimals(uniqueAnimals)
      })
    } catch (error) {
      console.log('Animals collection not found in Firebase, using empty array')
      setAnimals([])
    }
    
    return () => {
      unsubscribeAbuse()
      unsubscribeLost()
      unsubscribeFound()
      unsubscribeAdoptions()
      unsubscribeDonations()
      unsubscribeVolunteers()
      if (unsubscribeAnimals) unsubscribeAnimals()
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

  // Analytics calculations
  const analytics = useMemo(() => ({
    overview: {
      totalReports: recentReports.length,
      totalAdoptions: adoptions.filter(a => a.status === 'approved').length,
      totalAnimals: animals.length,
      totalDonations: donations.filter(d => d.status === 'verified').reduce((sum, d) => sum + d.amount, 0),
      adoptionRate: adoptions.length > 0 ? (adoptions.filter(a => a.status === 'approved').length / adoptions.length) * 100 : 0,
      resolutionRate: recentReports.length > 0 ? (recentReports.filter(r => r.status === 'resolved').length / recentReports.length) * 100 : 0
    },
    reportsByType: [
      { type: 'Lost', count: recentReports.filter(r => r.type === 'lost').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.type === 'lost').length / recentReports.length) * 100 : 0 },
      { type: 'Found', count: recentReports.filter(r => r.type === 'found').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.type === 'found').length / recentReports.length) * 100 : 0 },
      { type: 'Abuse', count: recentReports.filter(r => r.type === 'abuse').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.type === 'abuse').length / recentReports.length) * 100 : 0 }
    ],
    reportsByStatus: [
      { status: 'Resolved', count: recentReports.filter(r => r.status === 'resolved').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.status === 'resolved').length / recentReports.length) * 100 : 0 },
      { status: 'Investigating', count: recentReports.filter(r => r.status === 'investigating').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.status === 'investigating').length / recentReports.length) * 100 : 0 },
      { status: 'Pending', count: recentReports.filter(r => r.status === 'pending').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.status === 'pending').length / recentReports.length) * 100 : 0 }
    ],
    animalTypes: [
      { type: 'Dogs', count: animals.filter(a => a.type === 'dog').length, percentage: animals.length > 0 ? (animals.filter(a => a.type === 'dog').length / animals.length) * 100 : 0 },
      { type: 'Cats', count: animals.filter(a => a.type === 'cat').length, percentage: animals.length > 0 ? (animals.filter(a => a.type === 'cat').length / animals.length) * 100 : 0 }
    ]
  }), [recentReports, adoptions, animals, donations])

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }

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
                { id: 'adoptions', name: 'Recent Adoptions', icon: Heart },
                { id: 'analytics', name: 'Analytics', icon: PieChartIcon }
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

            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Key Performance Indicators */}
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
                          <p className="text-sm font-medium text-orange-600">Total Donations</p>
                          <p className="text-3xl font-bold text-orange-900">{formatCurrency(analytics.overview.totalDonations)}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-orange-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Reports by Type - Pie Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Type</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.reportsByType}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="count"
                            label={({ type, percentage }: any) => `${type}: ${percentage.toFixed(1)}%`}
                          >
                            {analytics.reportsByType.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={
                                  entry.type === 'Lost' ? '#3B82F6' :
                                  entry.type === 'Found' ? '#10B981' : '#EF4444'
                                } 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Reports by Status - Pie Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Status</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.reportsByStatus}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="count"
                            label={({ status, percentage }: any) => `${status}: ${percentage.toFixed(1)}%`}
                          >
                            {analytics.reportsByStatus.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={
                                  entry.status === 'Resolved' ? '#10B981' :
                                  entry.status === 'Investigating' ? '#3B82F6' : '#F59E0B'
                                } 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Monthly Trends - Bar Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Activity Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={monthlyTrends}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="reports" fill="#3B82F6" name="Reports" />
                        <Bar dataKey="adoptions" fill="#10B981" name="Adoptions" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Animal Distribution - Pie Chart */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Type Distribution</h3>
                  <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.animalTypes}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="count"
                            label={({ type, percentage }: any) => `${type}: ${percentage.toFixed(1)}%`}
                          >
                            {analytics.animalTypes.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={entry.type === 'Dogs' ? '#3B82F6' : '#8B5CF6'} 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                  </div>
                </div>

                {/* Detailed Analytics Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Adoption Analytics */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Adoption Analytics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total Applications</span>
                        <span className="text-lg font-bold text-green-600">{adoptions.length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Approved</span>
                        <span className="text-lg font-bold text-blue-600">{adoptions.filter(a => a.status === 'approved').length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Pending</span>
                        <span className="text-lg font-bold text-yellow-600">{adoptions.filter(a => a.status === 'pending').length}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Rejected</span>
                        <span className="text-lg font-bold text-red-600">{adoptions.filter(a => a.status === 'rejected').length}</span>
                      </div>
                    </div>
                  </div>

                  {/* Donation Analytics */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Donation Analytics</h3>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Verified Donations</span>
                        <span className="text-lg font-bold text-green-600">{formatCurrency(donationStats.totalAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Pending Verification</span>
                        <span className="text-lg font-bold text-yellow-600">{formatCurrency(donationStats.pendingAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Average Donation</span>
                        <span className="text-lg font-bold text-blue-600">{formatCurrency(donationStats.averageAmount)}</span>
                      </div>
                      <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-700">Total Donors</span>
                        <span className="text-lg font-bold text-purple-600">{donations.length}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Geographic Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Distribution</h3>
                  <div className="bg-gray-50 p-6 rounded-lg">
                    <div className="text-center">
                      <p className="text-gray-600 mb-4">Geographic analytics based on report locations</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Reports with Location</p>
                          <p className="text-2xl font-bold text-blue-600">{recentReports.filter(r => r.location && r.location !== 'Unknown Location').length}</p>
                        </div>
                        <div className="bg-white p-4 rounded-lg shadow-sm">
                          <p className="text-sm font-medium text-gray-900">Total Reports</p>
                          <p className="text-2xl font-bold text-green-600">{recentReports.length}</p>
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

export default AdminDashboard
