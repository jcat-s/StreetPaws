import React, { useState, useEffect, useMemo } from 'react'
import { MapPin, AlertCircle } from 'lucide-react'
import MapContainer from '../components/heatmap/MapContainer'
import FiltersPanel from '../components/heatmap/FiltersPanel'
import Legend from '../components/heatmap/Legend'
import { useHeatmapData } from '../hooks/useHeatmapData'
import { barangayData } from '../../data/lipa-city-barangays'

const Heatmap: React.FC = () => {
  // State for filters
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterLost, setFilterLost] = useState(true)
  const [filterFound, setFilterFound] = useState(true)
  const [filterAbuse, setFilterAbuse] = useState(true)
  const [selectedBarangay, setSelectedBarangay] = useState<string>('')
  const [hoveredBarangay, setHoveredBarangay] = useState<string | null>(null)
  const [hoveredActivityData, setHoveredActivityData] = useState<{ cases: number, percentage: number, level: string } | null>(null)

  // Custom hook for data fetching
  const { reports, isLoading, error, fetchReports, clearError } = useHeatmapData()

  // Extract barangay names from GeoJSON
  const barangayOptions = useMemo(() => {
    return barangayData.features.map((feature: any) => feature.properties.name).sort()
  }, [])

  // On mount, fetch an initial dataset (all types) for Lipa City
  useEffect(() => {
    const initialFilters: ('lost' | 'found' | 'abuse')[] = ['lost', 'found', 'abuse']
    // fetch all types initially
    fetchReports({ dateFrom: undefined, dateTo: undefined, types: initialFilters, barangay: selectedBarangay || undefined }, barangayData)
  }, [fetchReports])

  // Handle filter application
  const handleApplyFilters = () => {
    // Basic validation: at least one type should be selected
    const types: ('lost' | 'found' | 'abuse')[] = []
    if (filterLost) types.push('lost')
    if (filterFound) types.push('found')
    if (filterAbuse) types.push('abuse')

    if (types.length === 0) {
      // No types selected -> clear results and do nothing
      // fetchReports expects types array; passing empty means "no results"
      fetchReports({ dateFrom: undefined, dateTo: undefined, types: [], barangay: undefined }, barangayData)
      return
    }

    // Validate date range
    if (dateFrom && dateTo) {
      const from = new Date(dateFrom)
      const to = new Date(dateTo)
      if (from > to) {
        // Show a simple browser alert for now
        // This prevents running an invalid query
        // You can replace this with a styled UI notification later
        window.alert('Invalid date range: "From" must be before "To".')
        return
      }
    }

    const filters = {
      dateFrom: dateFrom || undefined,
      dateTo: dateTo || undefined,
      types,
      barangay: selectedBarangay || undefined
    }

    fetchReports(filters, barangayData)
  }

  // Calculate statistics
  const stats = useMemo(() => {
    const totalReports = reports.length
    const lostCount = reports.filter(r => r.type === 'lost').length
    const foundCount = reports.filter(r => r.type === 'found').length
    const abuseCount = reports.filter(r => r.type === 'abuse').length

    return {
      total: totalReports,
      lost: lostCount,
      found: foundCount,
      abuse: abuseCount
    }
  }, [reports])

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Stray Animals Cases Heatmap</h1>
              <p className="text-sm text-gray-600 mt-1">
                Visualize report density across Lipa City barangays
              </p>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-600">
              <div className="flex items-center space-x-1">
                <MapPin className="h-4 w-4" />
                <span>{stats.total} Total Reports</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {/* Error Display */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">Error loading data</span>
            </div>
            <p className="text-red-700 text-sm mt-1">{error}</p>
            <button
              onClick={clearError}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Statistics Cards */}
        <div className="heatmap-stats mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 stat-card">
            <div className="stat-number font-bold text-gray-900">{stats.total}</div>
            <div className="stat-label text-gray-600">Total Reports</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 stat-card">
            <div className="stat-number font-bold text-blue-600">{stats.lost}</div>
            <div className="stat-label text-gray-600">Lost Animals</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 stat-card">
            <div className="stat-number font-bold text-green-600">{stats.found}</div>
            <div className="stat-label text-gray-600">Found Animals</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 stat-card">
            <div className="stat-number font-bold text-red-600">{stats.abuse}</div>
            <div className="stat-label text-gray-600">Abuse Reports</div>
          </div>
        </div>

        {/* Main Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Filters Panel */}
          <div className="lg:col-span-1 heatmap-filters">
            <FiltersPanel
              dateFrom={dateFrom}
              dateTo={dateTo}
              onDateFromChange={setDateFrom}
              onDateToChange={setDateTo}
              filterLost={filterLost}
              filterFound={filterFound}
              filterAbuse={filterAbuse}
              onFilterLostChange={setFilterLost}
              onFilterFoundChange={setFilterFound}
              onFilterAbuseChange={setFilterAbuse}
              selectedBarangay={selectedBarangay}
              onBarangayChange={setSelectedBarangay}
              barangayOptions={barangayOptions}
              onApplyFilters={handleApplyFilters}
              isLoading={isLoading}
            />
          </div>

          {/* Map Container */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
              <div className="h-[600px] relative heatmap-container">
                <MapContainer
                  reports={reports}
                  barangayData={barangayData}
                  selectedBarangay={selectedBarangay}
                  onBarangayHover={(barangay, activityData) => {
                    setHoveredBarangay(barangay)
                    setHoveredActivityData(activityData || null)
                  }}
                />

                {/* Legend positioned in bottom-right corner of map */}
                <div className="absolute bottom-4 right-4 z-[1000]">
                  <Legend />
                </div>

                {/* Loading overlay */}
                {isLoading && (
                  <div className="absolute inset-0 bg-white bg-opacity-75 flex items-center justify-center z-[999]">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-orange-600"></div>
                      <span className="text-gray-700">Loading reports...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Hovered Barangay Info */}
            {hoveredBarangay && hoveredActivityData && (
              <div className="mt-4 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <h3 className="font-semibold text-gray-900 mb-2">Barangay Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Barangay</p>
                    <p className="font-medium text-gray-900">{hoveredBarangay}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Cases</p>
                    <p className="font-medium text-gray-900">{hoveredActivityData.cases}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Activity Level</p>
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900">{hoveredActivityData.percentage}%</span>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${hoveredActivityData.level === 'High' ? 'bg-red-100 text-red-800' :
                        hoveredActivityData.level === 'Medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-green-100 text-green-800'
                        }`}>
                        {hoveredActivityData.level}
                      </span>
                    </div>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Activity percentage is calculated relative to the highest density area in the current dataset
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Heatmap
