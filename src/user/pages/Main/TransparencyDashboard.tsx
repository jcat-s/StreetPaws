import { useEffect, useState, useMemo } from 'react'
import { DollarSign, TrendingUp, Calendar, BarChart3 } from 'lucide-react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, LineChart, Line } from 'recharts'

interface DonationData {
  id: string
  name: string
  email: string
  phone?: string
  amount: number
  paymentMethod: string
  reference?: string
  message?: string
  isAnonymous?: boolean
  status: 'pending' | 'verified' | 'rejected'
  userId?: string
  createdAt: any
}

interface AdoptionData {
  id: string
  animalName: string
  animalType: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: any
}

interface ReportData {
  id: string
  type: 'lost' | 'found' | 'abuse'
  createdAt: any
}

interface ExpenseData {
  id: string
  category: 'veterinary' | 'shelter' | 'food' | 'transport' | 'medical_supplies' | 'admin' | 'other'
  amount: number
  description: string
  date: string
  animalName?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: any
}

const TransparencyDashboard = () => {
  const [donations, setDonations] = useState<DonationData[]>([])
  const [adoptions, setAdoptions] = useState<AdoptionData[]>([])
  const [reports, setReports] = useState<ReportData[]>([])
  const [expenses, setExpenses] = useState<ExpenseData[]>([])
  const [loading, setLoading] = useState(true)

  // Custom dot that colors green for donations (delta >= 0) and red for expenses (delta < 0)
  const RenderCashFlowDot = (props: any) => {
    const { cx, cy, payload } = props
    const color = (payload?.delta ?? 0) >= 0 ? '#22c55e' : '#ef4444'
    return (
      <g>
        <circle cx={cx} cy={cy} r={5} fill={color} stroke="#ffffff" strokeWidth={1} />
      </g>
    )
  }

  // Fetch real data from Firebase
  useEffect(() => {
    if (!db) {
      setLoading(false)
      return
    }

    // Set a timeout to prevent infinite loading
    const loadingTimeout = setTimeout(() => {
      setLoading(false)
    }, 10000) // 10 second timeout

    let dataLoadedCount = 0
    const totalDataSources = 4 // donations, adoptions, reports, expenses

    const checkIfAllDataLoaded = () => {
      dataLoadedCount++
      if (dataLoadedCount >= totalDataSources) {
        clearTimeout(loadingTimeout)
        setLoading(false)
      }
    }

    // Fetch donations - simplified without orderBy to avoid index issues
    const donationsQuery = collection(db, 'donations')
    const unsubscribeDonations = onSnapshot(donationsQuery, (snap) => {
      const donationData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as DonationData))
      setDonations(donationData)
      checkIfAllDataLoaded()
    }, (error) => {
      console.error('Error fetching donations:', error)
      console.warn('Donations will not be displayed')
      setDonations([])
      checkIfAllDataLoaded()
    })

    // Fetch adoptions - simplified without orderBy to avoid index issues
    const adoptionsQuery = collection(db, 'adoptions')
    const unsubscribeAdoptions = onSnapshot(adoptionsQuery, (snap) => {
      const adoptionData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as AdoptionData))
      setAdoptions(adoptionData)
      checkIfAllDataLoaded()
    }, (error) => {
      console.error('Error fetching adoptions:', error)
      console.warn('Adoptions will not be displayed.')
      setAdoptions([])
      checkIfAllDataLoaded()
    })

    // Fetch reports from all three collections - much simpler approach
    const fetchReports = async () => {
      try {
        const collections = ['reports-lost', 'reports-found', 'reports-abuse']
        const allReports: ReportData[] = []

        for (const collectionName of collections) {
          try {
            if (!db) continue
            const reportsQuery = collection(db, collectionName)
            const snapshot = await new Promise((resolve, reject) => {
              const unsubscribe = onSnapshot(reportsQuery, (snap) => {
                unsubscribe()
                resolve(snap)
              }, reject)
            }) as any

            const collectionReports = snapshot.docs.map((doc: any) => ({
              id: doc.id,
              type: collectionName.replace('reports-', '') as 'lost' | 'found' | 'abuse',
              ...doc.data()
            }))
            allReports.push(...collectionReports)
          } catch (collectionError) {
            console.error(`Error fetching ${collectionName}:`, collectionError)
            console.warn(`${collectionName} will not be displayed.`)
            // Continue with other collections even if one fails
          }
        }

        setReports(allReports)
        checkIfAllDataLoaded()
      } catch (error) {
        console.error('Error in fetchReports:', error)
        setReports([])
        checkIfAllDataLoaded()
      }
    }

    fetchReports()

    // Fetch expenses
    const expensesQuery = collection(db, 'expenses')
    const unsubscribeExpenses = onSnapshot(expensesQuery, (snap) => {
      const expenseData = snap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      } as ExpenseData))
      setExpenses(expenseData)
      checkIfAllDataLoaded()
    }, (error) => {
      console.error('Error fetching expenses:', error)
      console.warn('Expenses will not be displayed')
      setExpenses([])
      checkIfAllDataLoaded()
    })

    return () => {
      clearTimeout(loadingTimeout)
      unsubscribeDonations()
      unsubscribeAdoptions()
      unsubscribeExpenses()
    }
  }, [])

  // Process data for visualization
  const processedData = useMemo(() => {
    // Only include verified donations
    const verifiedDonations = donations.filter(d => d.status === 'verified')
    
    // Calculate total verified donations
    const totalDonations = verifiedDonations.reduce((sum, d) => sum + d.amount, 0)
    
    // Calculate total expenses to deduct (non-rejected: pending + approved)
    const nonRejectedExpenses = expenses.filter(e => e.status !== 'rejected')
    const totalExpenses = nonRejectedExpenses.reduce((sum, expense) => sum + expense.amount, 0)
    
    // Net funds available (donations - expenses)
    const netFunds = totalDonations - totalExpenses
    
    // Get successful adoptions
    const successfulAdoptions = adoptions.filter(a => a.status === 'approved')
    
    // Calculate animals helped (successful adoptions + found reports)
    const foundReports = reports.filter(r => r.type === 'found').length
    const animalsHelped = successfulAdoptions.length + foundReports
    
    // Group donations by month
    const monthlyDonations = verifiedDonations.reduce((acc, donation) => {
      const date = donation.createdAt?.toDate ? donation.createdAt.toDate() : new Date(donation.createdAt)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, amount: 0, count: 0 }
      }
      acc[monthKey].amount += donation.amount
      acc[monthKey].count += 1
      
      return acc
    }, {} as Record<string, { month: string; amount: number; count: number }>)

    // Group expenses by month (using non-rejected)
    const monthlyExpenses = nonRejectedExpenses.reduce((acc, expense) => {
      const date = new Date(expense.date)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      if (!acc[monthKey]) {
        acc[monthKey] = { month: monthKey, amount: 0 }
      }
      acc[monthKey].amount += expense.amount
      return acc
    }, {} as Record<string, { month: string; amount: number }>)

    // Convert to array and sort by month
    const monthlyData = Object.values(monthlyDonations)
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-6) // Last 6 months
      .map(item => ({
        month: new Date(item.month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' }),
        donations: item.amount,
        count: item.count
      }))

    // Payment method breakdown
    const paymentMethods = verifiedDonations.reduce((acc, donation) => {
      const method = donation.paymentMethod || 'unknown'
      if (!acc[method]) {
        acc[method] = { method, amount: 0, count: 0 }
      }
      acc[method].amount += donation.amount
      acc[method].count += 1
      return acc
    }, {} as Record<string, { method: string; amount: number; count: number }>)

    const paymentMethodData = Object.values(paymentMethods).map(item => ({
      name: item.method.charAt(0).toUpperCase() + item.method.slice(1),
      value: item.amount,
      count: item.count
    }))

    // Recent donations
    const recentDonations = verifiedDonations
      .slice(0, 5)
      .map(donation => ({
        id: donation.id,
        donor: (donation as any).isAnonymous || donation.name === 'Anonymous' ? 'Anonymous' : donation.name,
        amount: donation.amount,
        method: donation.paymentMethod,
        date: donation.createdAt?.toDate ? donation.createdAt.toDate().toLocaleDateString() : new Date(donation.createdAt).toLocaleDateString(),
        message: donation.message
      }))

    // Real fund usage breakdown from expenses (using non-rejected)
    const expenseCategories = nonRejectedExpenses.reduce((acc, expense) => {
      const categoryName = expense.category === 'veterinary' ? 'Veterinary Care' :
                          expense.category === 'shelter' ? 'Shelter & Housing' :
                          expense.category === 'food' ? 'Food & Supplies' :
                          expense.category === 'transport' ? 'Transportation' :
                          expense.category === 'medical_supplies' ? 'Medical Supplies' :
                          expense.category === 'admin' ? 'Administrative' : 'Other'
      
      if (!acc[categoryName]) {
        acc[categoryName] = { amount: 0, category: expense.category }
      }
      acc[categoryName].amount += expense.amount
      return acc
    }, {} as Record<string, { amount: number; category: string }>)

    const fundUsageBreakdown = Object.entries(expenseCategories).map(([categoryName, data]) => {
      const percentage = totalExpenses > 0 ? Math.round((data.amount / totalExpenses) * 100) : 0
      const icon = data.category === 'veterinary' ? 'Stethoscope' :
                   data.category === 'shelter' ? 'Home' :
                   data.category === 'food' ? 'Utensils' :
                   data.category === 'transport' ? 'Truck' :
                   data.category === 'medical_supplies' ? 'Stethoscope' :
                   data.category === 'admin' ? 'DollarSign' : 'DollarSign'
      
      const color = data.category === 'veterinary' ? '#ef4444' :
                    data.category === 'shelter' ? '#3b82f6' :
                    data.category === 'food' ? '#22c55e' :
                    data.category === 'transport' ? '#f97316' :
                    data.category === 'medical_supplies' ? '#a855f7' :
                    data.category === 'admin' ? '#6b7280' : '#6b7280'

      return {
        category: categoryName,
        amount: data.amount,
        percentage,
        icon,
        color
      }
    }).sort((a, b) => b.amount - a.amount)

    // Enhanced impact metrics
    const impactMetrics = {
      totalRescues: reports.filter(r => r.type === 'found').length,
      totalAdoptions: successfulAdoptions.length,
      totalTreatments: Math.round(animalsHelped * 1.2), // Estimated treatments per animal
      totalVaccinations: Math.round(animalsHelped * 0.8), // Estimated vaccinations
      animalsSpayedNeutered: Math.round(animalsHelped * 0.6) // Estimated spay/neuter
    }

    // Build running balance transactions (per transaction, not aggregated)
    const donationTransactions = verifiedDonations.map(d => {
      const dt = d.createdAt?.toDate ? d.createdAt.toDate() : new Date(d.createdAt)
      return { ts: dt.getTime(), dateKey: dt.toISOString(), delta: d.amount }
    })
    const expenseTransactions = nonRejectedExpenses.map(e => {
      const dt = new Date(e.date)
      return { ts: dt.getTime(), dateKey: dt.toISOString(), delta: -Math.abs(e.amount) }
    })
    const allTransactions = [...donationTransactions, ...expenseTransactions]
      .sort((a, b) => a.ts - b.ts)
      .slice(-100) // keep last 100 transactions for performance

    let running = 0
    const runningBalanceData = allTransactions.map(t => {
      running += t.delta
      const d = new Date(t.dateKey)
      const label = d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' })
      return { date: label, balance: running, delta: t.delta }
    })

    return {
      totalDonations,
      totalExpenses,
      netFunds,
      totalAnimals: animalsHelped,
      totalAdoptions: successfulAdoptions.length,
      monthlyData,
      paymentMethodData,
      recentDonations,
      verifiedDonations,
      fundUsageBreakdown,
      impactMetrics,
      runningBalanceData
    }
  }, [donations, adoptions, reports, expenses])

  const COLORS = ['#f97316', '#ef4444', '#22c55e', '#3b82f6', '#a855f7']

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-orange-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading transparency data...</p>
          <p className="text-sm text-gray-500 mt-2">This may take a moment on first load</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
           Transparency Dashboard
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Real-time data showing how your donations are helping animals in our community. 
            All amounts shown are from verified donations only.
          </p>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Verified Donations</p>
                <p className="text-3xl font-bold text-green-600">₱{processedData.totalDonations.toLocaleString()}</p>
                <p className="text-xs text-gray-500 mt-1">{processedData.verifiedDonations.length} donations</p>
              </div>
              <div className="bg-green-100 rounded-full p-3">
                <DollarSign className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Net Funds Available</p>
                <p className={`text-3xl font-bold ${processedData.netFunds >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                  ₱{processedData.netFunds.toLocaleString()}
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  ₱{processedData.totalExpenses.toLocaleString()} spent
                </p>
              </div>
              <div className={`rounded-full p-3 ${processedData.netFunds >= 0 ? 'bg-blue-100' : 'bg-red-100'}`}>
                <DollarSign className={`h-6 w-6 ${processedData.netFunds >= 0 ? 'text-blue-600' : 'text-red-600'}`} />
              </div>
            </div>
          </div>

          {/* Removed Animals Helped card */}
        </div>

        {/* Charts Grid */}
        <div className="grid lg:grid-cols-2 gap-8 mb-12">
          {/* Monthly Donations Chart */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Monthly Donations
            </h2>
            {processedData.monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={processedData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip 
                    formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Amount']}
                    labelFormatter={(label) => `Month: ${label}`}
                  />
                  <Bar dataKey="donations" fill="#f97316" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No donation data available yet</p>
              </div>
            )}
          </div>

          {/* Payment Methods Chart */}
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <TrendingUp className="h-6 w-6 mr-2" />
              Payment Methods
            </h2>
            {processedData.paymentMethodData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={processedData.paymentMethodData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {processedData.paymentMethodData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [`₱${value.toLocaleString()}`, 'Amount']} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-64 text-gray-500">
                <p>No payment data available yet</p>
              </div>
            )}
          </div>
        </div>

        {/* Fund Usage Breakdown */}
        {processedData.fundUsageBreakdown.length > 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <BarChart3 className="h-6 w-6 mr-2" />
              Fund Usage Breakdown
            </h2>
            <p className="text-gray-600 mb-6">
              How your donations are allocated to help animals in need. Every peso is accounted for.
            </p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              {processedData.fundUsageBreakdown.map((item, index) => (
                <div key={index} className="bg-gray-50 rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="p-3 rounded-full" style={{ backgroundColor: `${item.color}20` }}>
                      <DollarSign className="h-6 w-6" style={{ color: item.color }} />
                    </div>
                    <span className="text-2xl font-bold" style={{ color: item.color }}>
                      {item.percentage}%
                    </span>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{item.category}</h3>
                  <p className="text-lg font-bold text-gray-700">₱{item.amount.toLocaleString()}</p>
                  <div className="mt-3 bg-gray-200 rounded-full h-2">
                    <div 
                      className="h-2 rounded-full" 
                      style={{ 
                        width: `${item.percentage}%`, 
                        backgroundColor: item.color 
                      }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-blue-50 rounded-lg p-6">
              <div className="flex items-center mb-4">
                <BarChart3 className="h-6 w-6 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-blue-900">Financial Accountability</h3>
              </div>
              <p className="text-blue-800 text-sm">
                All fund allocations are tracked and verified. We maintain detailed records of every expense 
                to ensure complete transparency in how your donations are used to help animals.
              </p>
            </div>
          </div>
        )}

        {/* Recent Donations */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <Calendar className="h-6 w-6 mr-2" />
            Recent Verified Donations
          </h2>
          {processedData.recentDonations.length > 0 ? (
            <div className="space-y-4">
              {processedData.recentDonations.map((donation) => (
                <div key={donation.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{donation.donor}</p>
                    <p className="text-sm text-gray-600">{donation.method.charAt(0).toUpperCase() + donation.method.slice(1)}</p>
                    <p className="text-xs text-gray-500">{donation.date}</p>
                    {donation.message && (
                      <p className="text-xs text-gray-600 mt-1 italic">"{donation.message}"</p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-green-600">₱{donation.amount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <p>No verified donations yet</p>
            </div>
          )}
        </div>

        {/* Running Balance (Cumulative Cash Flow) */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Running Balance</h2>
          <p className="text-sm text-gray-500 mb-6">One line, dots per transaction. 🟢 donations increase, 🔴 expenses decrease.</p>
          {processedData.runningBalanceData && processedData.runningBalanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={processedData.runningBalanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number, _name: string, p: any) => {
                    const delta = p?.payload?.delta as number
                    const direction = delta >= 0 ? 'Donation (+)' : 'Expense (-)'
                    return [`₱${value.toLocaleString()}`, direction]
                  }}
                  labelFormatter={(label) => `Date: ${label}`}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#94a3b8" 
                  strokeWidth={2} 
                  dot={<RenderCashFlowDot />} 
                  activeDot={{ r: 6 }}
                  name="Balance"
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-64 text-gray-500">
              <p>No cash flow data available yet</p>
            </div>
          )}
        </div>


        {/* Data Last Updated */}
        <div className="text-center mt-8 text-sm text-gray-500">
          <p>Verified donations increase Net Funds; pending/approved expenses decrease it.</p>
          <p className="mt-1">Data updated in real-time • Last updated: {new Date().toLocaleString()}</p>
        </div>
      </div>
    </div>
  )
}

export default TransparencyDashboard