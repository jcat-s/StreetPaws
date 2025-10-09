import { useEffect, useMemo, useState } from 'react'
import { 
  FileText, 
  Heart, 
  Users, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle,
  XCircle,
  MapPin,
  DollarSign,
  Mail,
  PieChart as PieChartIcon
} from 'lucide-react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts'
import { LIPA_BARANGAYS } from '../../shared/constants/barangays'

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

type DashboardMessage = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  read: boolean
  archived: boolean
  createdAt: string
}

const AdminDashboard = () => {
  const [activeTab, setActiveTab] = useState<'overview' | 'analytics' | 'geographic'>('analytics')
  
  // Data states
  const [recentReports, setRecentReports] = useState<DashboardReport[]>([])
  const [adoptions, setAdoptions] = useState<DashboardAdoption[]>([])
  const [donations, setDonations] = useState<DashboardDonation[]>([])
  const [volunteers, setVolunteers] = useState<DashboardVolunteer[]>([])
  const [animals, setAnimals] = useState<DashboardAnimal[]>([])
  const [messages, setMessages] = useState<DashboardMessage[]>([])
  
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

    const processMessageDocs = (docs: any[]) => {
      return docs.map((doc) => {
        const d: any = doc.data()
        
        return {
          id: doc.id,
          name: d?.name || 'Anonymous',
          email: d?.email || '',
          subject: d?.subject || 'No Subject',
          message: d?.message || '',
          read: d?.read || false,
          archived: d?.archived || false,
          createdAt: processTimestamp(d?.createdAt)
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
    const messagesQuery = query(collection(db, 'messages'), orderBy('createdAt', 'desc'))
    
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
      const pendingCount = allReports.filter(r => r.status === 'pending').length
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

    const unsubscribeMessages = onSnapshot(messagesQuery, (snap) => {
      const messageData = processMessageDocs(snap.docs)
      // Remove duplicates
      const uniqueMessages = messageData.reduce((acc, current) => {
        const existingIndex = acc.findIndex(item => item.id === current.id)
        if (existingIndex === -1) {
          acc.push(current)
        }
        return acc
      }, [] as DashboardMessage[])
      setMessages(uniqueMessages)
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
      unsubscribeMessages()
      if (unsubscribeAnimals) unsubscribeAnimals()
    }
  }, [])

  // Calculated metrics
  // const urgentReportsCount = useMemo(() => recentReports.filter(r => r.priority === 'urgent' || r.priority === 'high').length, [recentReports])
  
  // Message metrics
  const messageStats = useMemo(() => ({
    total: messages.length,
    unread: messages.filter(m => !m.read && !m.archived).length,
    read: messages.filter(m => m.read && !m.archived).length,
    archived: messages.filter(m => m.archived).length
  }), [messages])

  // Recent activity for the last 7 days
  // const recentActivity = useMemo(() => {
  //   const weekAgo = new Date()
  //   weekAgo.setDate(weekAgo.getDate() - 7)
  //   
  //   const recentAdoptions = adoptions.filter(a => new Date(a.submittedAt) >= weekAgo)
  //   const recentDonations = donations.filter(d => new Date(d.createdAt) >= weekAgo)
  //   const recentVolunteers = volunteers.filter(v => new Date(v.createdAt) >= weekAgo)
  //   const recentReportsActivity = recentReports.filter(r => new Date(r.date) >= weekAgo)
  //   const recentMessages = messages.filter(m => new Date(m.createdAt) >= weekAgo)
  //   
  //   return {
  //     adoptions: recentAdoptions.length,
  //     donations: recentDonations.length,
  //     volunteers: recentVolunteers.length,
  //     reports: recentReportsActivity.length,
  //     messages: recentMessages.length,
  //     totalAmount: recentDonations.filter(d => d.status === 'verified').reduce((sum, d) => sum + d.amount, 0)
  //   }
  // }, [adoptions, donations, volunteers, recentReports, messages])
  
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
  // const animalStats = useMemo(() => ({
  //   total: animals.length,
  //   available: animals.filter(a => a.status === 'available').length,
  //   adopted: animals.filter(a => a.status === 'adopted').length,
  //   pending: animals.filter(a => a.status === 'pending').length,
  //   dogs: animals.filter(a => a.type === 'dog').length,
  //   cats: animals.filter(a => a.type === 'cat').length
  // }), [animals])

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
      
      const monthVolunteers = volunteers.filter(v => {
        const volunteerDate = new Date(v.createdAt)
        return volunteerDate.getMonth() === date.getMonth() && volunteerDate.getFullYear() === date.getFullYear()
      }).length
      
      const monthDonations = donations.filter(d => {
        const donationDate = new Date(d.createdAt)
        return donationDate.getMonth() === date.getMonth() && donationDate.getFullYear() === date.getFullYear()
      }).length
      
      const monthMessages = messages.filter(m => {
        const messageDate = new Date(m.createdAt)
        return messageDate.getMonth() === date.getMonth() && messageDate.getFullYear() === date.getFullYear()
      }).length
      
      months.push({
        month: monthName,
        reports: monthReports,
        adoptions: monthAdoptions,
        volunteers: monthVolunteers,
        donations: monthDonations,
        messages: monthMessages
      })
    }
    
    return months
  }, [recentReports, adoptions, volunteers, donations, messages])

  // Geographic analytics calculations
  const geographicAnalytics = useMemo(() => {
    // Group reports by barangay
    const reportsByBarangay = new Map<string, {
      barangay: string
      total: number
      lost: number
      found: number
      abuse: number
      pending: number
      resolved: number
      investigating: number
      urgent: number
      high: number
      medium: number
      normal: number
    }>()

    // Initialize all barangays with zero counts
    LIPA_BARANGAYS.forEach(barangay => {
      reportsByBarangay.set(barangay, {
        barangay,
        total: 0,
        lost: 0,
        found: 0,
        abuse: 0,
        pending: 0,
        resolved: 0,
        investigating: 0,
        urgent: 0,
        high: 0,
        medium: 0,
        normal: 0
      })
    })

    // Count reports by barangay
    recentReports.forEach(report => {
      if (report.location && report.location !== 'Unknown Location') {
        const location = report.location.toLowerCase()
        
        // Improved matching algorithm
        const matchingBarangay = LIPA_BARANGAYS.find(barangay => {
          const barangayLower = barangay.toLowerCase()
          
          // Direct match
          if (location === barangayLower) return true
          
          // Partial match (location contains barangay name)
          if (location.includes(barangayLower)) return true
          
          // Barangay contains location (for shorter location strings)
          if (barangayLower.includes(location)) return true
          
          // Special cases for common variations
          if (barangayLower.includes('poblacion') && location.includes('poblacion')) return true
          if (barangayLower.includes('barangay') && location.includes('barangay')) {
            // Extract number from location and match with barangay
            const locationNumber = location.match(/\d+/)?.[0]
            const barangayNumber = barangayLower.match(/\d+/)?.[0]
            if (locationNumber && barangayNumber && locationNumber === barangayNumber) return true
          }
          
          return false
        })

        if (matchingBarangay) {
          const data = reportsByBarangay.get(matchingBarangay)!
          data.total++
          
          // Count by type
          if (report.type === 'lost') data.lost++
          else if (report.type === 'found') data.found++
          else if (report.type === 'abuse') data.abuse++
          
          // Count by status
          if (report.status === 'pending') data.pending++
          else if (report.status === 'resolved') data.resolved++
          else if (report.status === 'investigating') data.investigating++
          
          // Count by priority
          if (report.priority === 'urgent') data.urgent++
          else if (report.priority === 'high') data.high++
          else if (report.priority === 'medium') data.medium++
          else if (report.priority === 'normal') data.normal++
        }
      }
    })

    // Convert to arrays and sort by total reports
    const barangayData = Array.from(reportsByBarangay.values())
      .filter(data => data.total > 0)
      .sort((a, b) => b.total - a.total)

    const topBarangays = barangayData.slice(0, 10)
    const allBarangaysWithData = Array.from(reportsByBarangay.values())

    // Calculate geographic distribution (all reports should have location)
    const totalReportsWithLocation = recentReports.length

    // Calculate concentration levels (matching heatmap legend)
    const concentrationLevels = {
      high: barangayData.filter(b => b.total >= 7).length,
      medium: barangayData.filter(b => b.total >= 3 && b.total < 7).length,
      low: barangayData.filter(b => b.total >= 1 && b.total < 3).length,
      none: allBarangaysWithData.filter(b => b.total === 0).length
    }

    return {
      barangayData,
      topBarangays,
      allBarangaysWithData,
      totalReportsWithLocation,
      concentrationLevels,
      totalBarangays: LIPA_BARANGAYS.length,
      barangaysWithReports: barangayData.length
    }
  }, [recentReports])

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
    reportsByPriority: [
      { priority: 'Urgent', count: recentReports.filter(r => r.priority === 'urgent').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.priority === 'urgent').length / recentReports.length) * 100 : 0 },
      { priority: 'High', count: recentReports.filter(r => r.priority === 'high').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.priority === 'high').length / recentReports.length) * 100 : 0 },
      { priority: 'Medium', count: recentReports.filter(r => r.priority === 'medium').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.priority === 'medium').length / recentReports.length) * 100 : 0 },
      { priority: 'Normal', count: recentReports.filter(r => r.priority === 'normal').length, percentage: recentReports.length > 0 ? (recentReports.filter(r => r.priority === 'normal').length / recentReports.length) * 100 : 0 }
    ],
    animalTypes: [
      { type: 'Dogs', count: animals.filter(a => a.type === 'dog').length, percentage: animals.length > 0 ? (animals.filter(a => a.type === 'dog').length / animals.length) * 100 : 0 },
      { type: 'Cats', count: animals.filter(a => a.type === 'cat').length, percentage: animals.length > 0 ? (animals.filter(a => a.type === 'cat').length / animals.length) * 100 : 0 }
    ]
  }), [recentReports, adoptions, animals, donations])

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`
  }


  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
          <p className="text-gray-600 mt-2">Welcome back! Here's what's happening with StreetPaws today.</p>
        </div>


        {/* Recent Activity Tabs */}
        <div className="bg-white rounded-lg shadow-sm">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'analytics', name: 'Analytics', icon: PieChartIcon },
                { id: 'overview', name: 'Overview', icon: TrendingUp },
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
                {/* Overview Summary */}
                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-blue-600">Total Reports</p>
                        <p className="text-xs text-blue-500">Applications</p>
                      </div>
                      <FileText className="h-8 w-8 text-blue-600" />
                    </div>
                    <p className="text-3xl font-bold text-blue-900 mb-3">{reportCounts.total}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-blue-700">
                        <span>Approved</span>
                        <span>{reportCounts.resolved}</span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-700">
                        <span>Pending</span>
                        <span>{reportCounts.pending}</span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-700">
                        <span>Investigating</span>
                        <span>{recentReports.filter(r => r.status === 'investigating').length}</span>
                      </div>
                 
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-green-50 to-green-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-green-600">Total Adoptions</p>
                        <p className="text-xs text-green-500">Applications</p>
                      </div>
                      <Heart className="h-8 w-8 text-green-600" />
                    </div>
                    <p className="text-3xl font-bold text-green-900 mb-3">{adoptionStats.total}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-green-700">
                        <span>Approved</span>
                        <span>{adoptionStats.approved}</span>
                      </div>
                      <div className="flex justify-between text-xs text-green-700">
                        <span>Pending</span>
                        <span>{adoptionStats.pending}</span>
                      </div>
                      <div className="flex justify-between text-xs text-green-700">
                        <span>Rejected</span>
                        <span>{adoptionStats.rejected}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-purple-600">Total Volunteers</p>
                        <p className="text-xs text-purple-500">Applications</p>
                      </div>
                      <Users className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-3">{volunteerStats.total}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-purple-700">
                        <span>Approved</span>
                        <span>{volunteerStats.approved}</span>
                      </div>
                      <div className="flex justify-between text-xs text-purple-700">
                        <span>Pending</span>
                        <span>{volunteerStats.pending}</span>
                      </div>
                      <div className="flex justify-between text-xs text-purple-700">
                        <span>Rejected</span>
                        <span>{volunteerStats.rejected}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-orange-600">Total Donations</p>
                        <p className="text-xs text-orange-500">Amount</p>
                      </div>
                      <DollarSign className="h-8 w-8 text-orange-600" />
                    </div>
                    <p className="text-3xl font-bold text-orange-900 mb-3">{formatCurrency(donationStats.totalAmount)}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-orange-700">
                        <span>Verified</span>
                        <span>{donationStats.verified}</span>
                      </div>
                      <div className="flex justify-between text-xs text-orange-700">
                        <span>Pending</span>
                        <span>{donationStats.pending}</span>
                      </div>
                      <div className="flex justify-between text-xs text-orange-700">
                        <span>Rejected</span>
                        <span>{donationStats.rejected}</span>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gradient-to-r from-pink-50 to-pink-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-pink-600">Total Messages</p>
                        <p className="text-xs text-pink-500">Communications</p>
                      </div>
                      <Mail className="h-8 w-8 text-pink-600" />
                    </div>
                    <p className="text-3xl font-bold text-pink-900 mb-3">{messages.length}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-pink-700">
                        <span>Read</span>
                        <span>{messageStats.read}</span>
                      </div>
                      <div className="flex justify-between text-xs text-pink-700">
                        <span>Unread</span>
                        <span>{messageStats.unread}</span>
                      </div>
                      <div className="flex justify-between text-xs text-pink-700">
                        <span>Archived</span>
                        <span>{messageStats.archived}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Recent Reports Summary */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Reports</h3>
                  <div className="space-y-3">
                    {recentReports.length === 0 ? (
                      <p className="text-center text-gray-500">No recent reports to display.</p>
                    ) : (
                        recentReports.slice(0, 5).map((report) => (
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
                              <p className="text-xs text-gray-500 mt-1">{new Date(report.date).toLocaleDateString()}</p>
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
                        adoptions.slice(0, 5).map((adoption) => (
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

                {/* Recent Volunteers and Donations */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Recent Volunteers */}
              <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Volunteers</h3>
                    <div className="space-y-3">
                      {volunteers.length === 0 ? (
                        <p className="text-center text-gray-500">No recent volunteers.</p>
                      ) : (
                        volunteers.slice(0, 5).map((volunteer) => (
                          <div key={volunteer.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="bg-purple-100 p-2 rounded-full">
                                <Users className="h-4 w-4 text-purple-600" />
                                </div>
                              <div>
                                <p className="font-medium text-gray-900">{volunteer.name}</p>
                                <p className="text-sm text-gray-600">Volunteer Application</p>
                                </div>
                              </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(volunteer.status)}`}>
                                {volunteer.status}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(volunteer.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                </div>
              </div>

                  {/* Recent Donations */}
              <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Donations</h3>
                    <div className="space-y-3">
                      {donations.length === 0 ? (
                        <p className="text-center text-gray-500">No recent donations.</p>
                      ) : (
                        donations.slice(0, 5).map((donation) => (
                          <div key={donation.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className="bg-orange-100 p-2 rounded-full">
                                <DollarSign className="h-4 w-4 text-orange-600" />
                                </div>
                              <div>
                                <p className="font-medium text-gray-900">{donation.name}</p>
                                <p className="text-sm text-gray-600">{formatCurrency(donation.amount)} • {donation.paymentMethod}</p>
                                </div>
                              </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(donation.status)}`}>
                                {donation.status}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(donation.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Recent Messages */}
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Messages</h3>
                    <div className="space-y-3">
                      {messages.length === 0 ? (
                        <p className="text-center text-gray-500">No recent messages.</p>
                      ) : (
                        messages.slice(0, 5).map((message) => (
                          <div key={message.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center space-x-3">
                              <div className={`p-2 rounded-full ${message.read ? 'bg-green-100' : 'bg-red-100'}`}>
                                <Mail className={`h-4 w-4 ${message.read ? 'text-green-600' : 'text-red-600'}`} />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{message.name}</p>
                                <p className="text-sm text-gray-600">{message.subject}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${message.read ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                {message.read ? 'read' : 'unread'}
                              </span>
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(message.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}


            {activeTab === 'analytics' && (
              <div className="space-y-8">
                {/* Key Performance Indicators */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Key Performance Indicators</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
                    <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-purple-600">Volunteer Approval Rate</p>
                          <p className="text-3xl font-bold text-purple-900">
                            {volunteers.length > 0 ? formatPercentage((volunteers.filter(v => v.status === 'approved').length / volunteers.length) * 100) : '0%'}
                          </p>
                        </div>
                        <Users className="h-8 w-8 text-purple-600" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Visual Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                            label={({ percentage }: any) => `${percentage.toFixed(1)}%`}
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
                    <div className="flex justify-center mt-2 space-x-4 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                        <span>Lost</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span>Found</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                        <span>Abuse</span>
                      </div>
                    </div>
                  </div>

                  {/* Reports by Priority - Pie Chart */}
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Reports by Priority</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={analytics.reportsByPriority}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="count"
                            label={({ percentage }: any) => `${percentage.toFixed(1)}%`}
                          >
                            {analytics.reportsByPriority.map((entry, index) => (
                              <Cell 
                                key={`cell-${index}`} 
                                fill={
                                  entry.priority === 'Urgent' ? '#EF4444' :
                                  entry.priority === 'High' ? '#F59E0B' :
                                  entry.priority === 'Medium' ? '#3B82F6' : '#10B981'
                                } 
                              />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    <div className="flex justify-center mt-2 space-x-2 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                        <span>Urgent</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                        <span>High</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                        <span>Medium</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span>Normal</span>
                      </div>
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
                            label={({ percentage }: any) => `${percentage.toFixed(1)}%`}
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
                    <div className="flex justify-center mt-2 space-x-3 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span>Resolved</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
                        <span>Investigating</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-orange-500 rounded-full mr-1"></div>
                        <span>Pending</span>
                      </div>
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
                        <Bar dataKey="volunteers" fill="#8B5CF6" name="Volunteers" />
                        <Bar dataKey="donations" fill="#F59E0B" name="Donations" />
                        <Bar dataKey="messages" fill="#EC4899" name="Messages" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

              </div>
            )}

            {activeTab === 'geographic' && (
              <div className="space-y-8">
                {/* Geographic Overview */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="bg-gradient-to-r from-blue-50 to-blue-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                <div>
                        <p className="text-sm font-medium text-blue-600">Total Barangays</p>
                        <p className="text-xs text-blue-500">Coverage</p>
                        </div>
                      <MapPin className="h-8 w-8 text-blue-600" />
                        </div>
                    <p className="text-3xl font-bold text-blue-900 mb-3">{geographicAnalytics.totalBarangays}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-blue-700">
                        <span>With Reports</span>
                        <span>{geographicAnalytics.barangaysWithReports}</span>
                      </div>
                      <div className="flex justify-between text-xs text-blue-700">
                        <span>Coverage</span>
                        <span>{formatPercentage(geographicAnalytics.barangaysWithReports / geographicAnalytics.totalBarangays * 100)}</span>
                    </div>
                  </div>
                </div>


                  <div className="bg-gradient-to-r from-orange-50 to-orange-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                                <div>
                        <p className="text-sm font-medium text-orange-600">High Concentration</p>
                        <p className="text-xs text-orange-500">7+ Reports</p>
                                </div>
                      <AlertTriangle className="h-8 w-8 text-orange-600" />
                              </div>
                    <p className="text-3xl font-bold text-orange-900 mb-3">{geographicAnalytics.concentrationLevels.high}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-orange-700">
                        <span>Medium (3-6)</span>
                        <span>{geographicAnalytics.concentrationLevels.medium}</span>
                      </div>
                      <div className="flex justify-between text-xs text-orange-700">
                        <span>Low (1-2)</span>
                        <span>{geographicAnalytics.concentrationLevels.low}</span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-r from-purple-50 to-purple-100 p-6 rounded-lg">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-sm font-medium text-purple-600">No Reports</p>
                        <p className="text-xs text-purple-500">Quiet Areas</p>
                      </div>
                      <XCircle className="h-8 w-8 text-purple-600" />
                    </div>
                    <p className="text-3xl font-bold text-purple-900 mb-3">{geographicAnalytics.concentrationLevels.none}</p>
                    <div className="space-y-1">
                      <div className="flex justify-between text-xs text-purple-700">
                        <span>Potential Focus</span>
                        <span>Areas</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Concentration Distribution Chart */}
                <div className="grid grid-cols-1 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Concentration Distribution</h3>
                    <div className="h-80">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: 'High (7+)', value: geographicAnalytics.concentrationLevels.high, color: '#EF4444' },
                              { name: 'Medium (3-6)', value: geographicAnalytics.concentrationLevels.medium, color: '#EAB308' },
                              { name: 'Low (1-2)', value: geographicAnalytics.concentrationLevels.low, color: '#22C55E' },
                              { name: 'None (0)', value: geographicAnalytics.concentrationLevels.none, color: '#6B7280' }
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            dataKey="value"
                            label={({ name, value, percent }: any) => value > 0 ? `${name}: ${value} (${(percent * 100).toFixed(1)}%)` : ''}
                          >
                            {[
                              { name: 'High (7+)', value: geographicAnalytics.concentrationLevels.high, color: '#EF4444' },
                              { name: 'Medium (3-6)', value: geographicAnalytics.concentrationLevels.medium, color: '#EAB308' },
                              { name: 'Low (1-2)', value: geographicAnalytics.concentrationLevels.low, color: '#22C55E' },
                              { name: 'None (0)', value: geographicAnalytics.concentrationLevels.none, color: '#6B7280' }
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(value, name) => [value, name]} />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    {/* Legend */}
                    <div className="flex justify-center mt-4 space-x-4 text-xs">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-red-500 rounded-full mr-1"></div>
                        <span>High (7+)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-yellow-500 rounded-full mr-1"></div>
                        <span>Medium (3-6)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-1"></div>
                        <span>Low (1-2)</span>
                      </div>
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-gray-500 rounded-full mr-1"></div>
                        <span>None (0)</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Detailed Barangay Analysis */}
                <div className="bg-white p-6 rounded-lg shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Barangay Analysis</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Barangay</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lost</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Found</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abuse</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Pending</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Resolved</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Urgent</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {geographicAnalytics.barangayData.slice(0, 15).map((barangay) => (
                          <tr key={barangay.barangay} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {barangay.barangay}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                barangay.total >= 7 ? 'bg-red-100 text-red-800' :
                                barangay.total >= 3 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-green-100 text-green-800'
                              }`}>
                                {barangay.total}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{barangay.lost}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{barangay.found}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{barangay.abuse}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{barangay.pending}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{barangay.resolved}</td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {barangay.urgent > 0 && (
                                <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                                  {barangay.urgent}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                            </div>
                  {geographicAnalytics.barangayData.length > 15 && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-500">
                        Showing top 15 barangays. {geographicAnalytics.barangayData.length - 15} more barangays with reports.
                      </p>
                    </div>
                  )}
                </div>

                {/* Geographic Insights */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Geographic Insights</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">📍 Coverage Analysis</h4>
                        <p className="text-sm text-blue-700">
                          {geographicAnalytics.barangaysWithReports} out of {geographicAnalytics.totalBarangays} barangays ({formatPercentage(geographicAnalytics.barangaysWithReports / geographicAnalytics.totalBarangays * 100)}) have reported cases.
                        </p>
                      </div>
                      <div className="p-4 bg-orange-50 rounded-lg">
                        <h4 className="font-medium text-orange-900 mb-2">⚠️ Priority Areas</h4>
                        <p className="text-sm text-orange-700">
                          {geographicAnalytics.concentrationLevels.high} barangays have high case concentrations (7+ reports) requiring immediate attention.
                        </p>
                      </div>
                      <div className="p-4 bg-green-50 rounded-lg">
                        <h4 className="font-medium text-green-900 mb-2">✅ Data Quality</h4>
                        <p className="text-sm text-green-700">
                          All reports include location data, enabling comprehensive geographic analysis across {geographicAnalytics.totalReportsWithLocation} cases.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-white p-6 rounded-lg shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategic Recommendations</h3>
                    <div className="space-y-4">
                      <div className="p-4 bg-red-50 rounded-lg">
                        <h4 className="font-medium text-red-900 mb-2">🔴 Immediate Action Required</h4>
                        <p className="text-sm text-red-700">
                          Focus resources on {geographicAnalytics.concentrationLevels.high} high-concentration barangays with 7+ cases.
                        </p>
                      </div>
                      <div className="p-4 bg-yellow-50 rounded-lg">
                        <h4 className="font-medium text-yellow-900 mb-2">🟡 Monitor Closely</h4>
                        <p className="text-sm text-yellow-700">
                          Keep watch on {geographicAnalytics.concentrationLevels.medium} medium-concentration areas (3-6 cases) to prevent escalation.
                        </p>
                      </div>
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-blue-900 mb-2">🔵 Expand Coverage</h4>
                        <p className="text-sm text-blue-700">
                          Consider outreach programs in {geographicAnalytics.concentrationLevels.none} barangays with no reports to improve awareness.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Interactive Map Integration */}
                <div className="bg-gradient-to-r from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-6">
                  <div className="flex items-center space-x-3">
                    <MapPin className="h-8 w-8 text-orange-600" />
                    <div>
                      <h3 className="text-lg font-semibold text-orange-900">Interactive Geographic Visualization</h3>
                      <p className="text-orange-700 mt-1">
                        For detailed heatmap analysis, real-time filtering, and interactive geographic exploration, 
                        visit the dedicated <strong>Heatmap section</strong> in the admin sidebar. 
                        Access advanced mapping tools with barangay-specific filtering and concentration visualization.
                      </p>
                      <div className="mt-3 space-y-2">
                        
                        <div className="mt-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-orange-200 text-orange-800">
                            🗺️ Enhanced Mapping Available
                          </span>
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
