import { useEffect, useMemo, useState, useRef } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { LIPA_BARANGAYS, LIPA_BARANGAY_COORDINATES } from '../../shared/constants/barangays'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Custom HeatmapLayer component using native leaflet.heat
interface HeatmapLayerProps {
  points: Array<{ lat: number; lng: number; intensity: number }>
  radius?: number
  max?: number
  minOpacity?: number
  gradient?: Record<number, string>
}

const HeatmapLayer: React.FC<HeatmapLayerProps> = ({ 
  points, 
  radius = 30, 
  max = 1, 
  minOpacity = 0.3,
  gradient 
}) => {
  const map = useMap()
  const heatmapRef = useRef<any>(null)

  useEffect(() => {
    if (!map || points.length === 0) return

    // Convert points to the format expected by leaflet.heat
    const heatPoints = points.map(point => [point.lat, point.lng, point.intensity] as [number, number, number])

    // Create heatmap layer
    const heatmap = (L as any).heatLayer(heatPoints, {
      radius,
      max,
      minOpacity,
      gradient
    })

    // Add to map
    heatmap.addTo(map)
    heatmapRef.current = heatmap

    // Cleanup function
    return () => {
      if (heatmapRef.current) {
        map.removeLayer(heatmapRef.current)
        heatmapRef.current = null
      }
    }
  }, [map, points, radius, max, minOpacity, gradient])

  // Update heatmap when points change
  useEffect(() => {
    if (heatmapRef.current && points.length > 0) {
      const heatPoints = points.map(point => [point.lat, point.lng, point.intensity] as [number, number, number])
      if (heatmapRef.current.setLatLngs) {
        heatmapRef.current.setLatLngs(heatPoints)
      }
    }
  }, [points])

  return null
}

type ReportDoc = {
  id?: string
  type?: 'lost' | 'found' | 'abuse'
  createdAt?: any
  lastSeenLocation?: string
  foundLocation?: string
  incidentLocation?: string
  // Additional fields that might be present
  animalType?: string
  caseTitle?: string
  status?: string
  published?: boolean
}

type Coordinate = {
  lat: number
  lng: number
  intensity: number
  type: string
  location: string
}


const Heatmap = () => {
  const [reports, setReports] = useState<ReportDoc[]>([])
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterLost, setFilterLost] = useState(true)
  const [filterFound, setFilterFound] = useState(true)
  const [filterAbuse, setFilterAbuse] = useState(true)
  const [selectedBarangay, setSelectedBarangay] = useState<string>('')
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.9411, 121.1639])
  const [mapZoom, setMapZoom] = useState(11)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [showAllCases, setShowAllCases] = useState(false)

  useEffect(() => {
    if (!db) return
    
    // Listen to all three report collections
    const collections = ['reports-lost', 'reports-found', 'reports-abuse']
    const unsubscribers: (() => void)[] = []
    
    collections.forEach(collectionName => {
      if (!db) return
      
      const q = query(collection(db, collectionName), orderBy('createdAt', 'desc'))
      const unsub = onSnapshot(q, (snap) => {
        const newReports = snap.docs.map((d) => ({ ...d.data(), id: d.id } as ReportDoc))
        
        
        setReports(prevReports => {
          // Remove old reports from this collection and add new ones
          const filtered = prevReports.filter(r => !r.id?.includes(collectionName))
          const updated = [...filtered, ...newReports]
          return updated
        })
      })
      unsubscribers.push(unsub)
    })
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [])


  // Parse location string to coordinates and extract barangay
  function parseLocation(location: string): Coordinate | null {
    if (!location) return null
    
    // Try to parse as "lat,lng" format first
    const coords = location.split(',').map(s => s.trim())
    if (coords.length === 2) {
      const lat = parseFloat(coords[0])
      const lng = parseFloat(coords[1])
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, intensity: 1, type: '', location }
      }
    }
    
    // Extract barangay from full address with improved matching
    const locationLower = location.toLowerCase()
    
    // Sort barangays by length (longest first) to match more specific names first
    const sortedBarangays = [...LIPA_BARANGAYS].sort((a, b) => b.length - a.length)
    
    const foundBarangay = sortedBarangays.find(barangay => {
      const barangayLower = barangay.toLowerCase()
      return locationLower.includes(barangayLower) || 
             // Also check for common variations
             locationLower.includes(barangayLower.replace(/\s+/g, '')) ||
             // Check for abbreviated forms like "Poblacion Barangay 1" -> "Poblacion"
             (barangayLower.includes('poblacion') && locationLower.includes('poblacion'))
    })
    
    if (foundBarangay) {
      const barangayCoords = getBarangayCoordinates(foundBarangay)
      if (barangayCoords) {
        return {
          lat: barangayCoords.lat,
          lng: barangayCoords.lng,
          intensity: 1,
          type: '',
          location: foundBarangay
        }
      }
    }
    
    return null
  }

  // Get coordinates for barangays using centralized coordinates
  function getBarangayCoordinates(barangay: string): { lat: number; lng: number } | null {
    const coordinates = LIPA_BARANGAY_COORDINATES[barangay as keyof typeof LIPA_BARANGAY_COORDINATES]
    
    if (coordinates && 'lat' in coordinates && 'lng' in coordinates && coordinates.lat && coordinates.lng) {
      return { lat: coordinates.lat, lng: coordinates.lng }
    }
    
    // Fallback coordinates for missing barangays (center of Lipa City)
    return { lat: 13.9411, lng: 121.1639 }
  }

  const barangays = useMemo(() => {
    return [...LIPA_BARANGAYS].sort()
  }, [])

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    
    const results = barangays.filter((barangay: string) => 
      barangay.toLowerCase().includes(query.toLowerCase())
    )
    setSearchResults(results)
    setShowSearchResults(true)
  }

  const handleSearchResultClick = (barangay: string) => {
    setSelectedBarangay(barangay)
    setSearchQuery(barangay)
    setShowSearchResults(false)
    
    // Center map on selected barangay
    const barangayCoords = getBarangayCoordinates(barangay)
    if (barangayCoords) {
      setMapCenter([barangayCoords.lat, barangayCoords.lng])
      setMapZoom(15)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  // Filter reports based on user selections
  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null
    const to = dateTo ? new Date(dateTo) : null
    const types: Record<string, boolean> = { lost: filterLost, found: filterFound, abuse: filterAbuse }
    
    return reports.filter((r) => {
      if (!types[r.type || '']) return false
      
      // Filter by date
      if (from || to) {
        const createdAt = r.createdAt
        let reportDate: Date | null = null
        
        if (createdAt) {
          if (typeof createdAt?.toDate === 'function') {
            reportDate = createdAt.toDate() as Date
          } else if (typeof createdAt === 'string') {
            reportDate = new Date(createdAt)
          } else if (typeof createdAt === 'object' && createdAt.seconds) {
            reportDate = new Date(createdAt.seconds * 1000)
          }
        }
        
        // If we have date filters but no report date, exclude this report
        if (!reportDate) {
          return false
        }
        
        // Normalize dates to compare only date part (ignore time)
        const reportDateOnly = new Date(reportDate.getFullYear(), reportDate.getMonth(), reportDate.getDate())
        
        if (from) {
          const fromDateOnly = new Date(from.getFullYear(), from.getMonth(), from.getDate())
          if (reportDateOnly < fromDateOnly) return false
        }
        
        if (to) {
          const toDateOnly = new Date(to.getFullYear(), to.getMonth(), to.getDate())
          if (reportDateOnly > toDateOnly) return false
        }
      }
      
      // Filter by barangay if selected
      if (selectedBarangay) {
        const loc = r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
        if (!loc || !loc.toLowerCase().includes(selectedBarangay.toLowerCase())) {
          return false
        }
      }
      
      return true
    })
  }, [reports, dateFrom, dateTo, filterLost, filterFound, filterAbuse, selectedBarangay])

  // Use filtered reports for heatmap OR all reports if showAllCases is true
  const allReportsForHeatmap = useMemo(() => {
    return showAllCases ? reports : filtered
  }, [showAllCases, reports, filtered])


  // Convert ALL reports to coordinates for heatmap (always show all cases)
  const heatmapData = useMemo(() => {
    const coordinates: Coordinate[] = []
    const locationCounts = new Map<string, { count: number; types: Set<string>; locationName: string }>()
    
    for (const r of allReportsForHeatmap) {
      const loc = r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
      if (!loc) continue
      
      const coord = parseLocation(loc)
      if (coord) {
        const key = `${coord.lat},${coord.lng}`
        const existing = locationCounts.get(key)
        if (existing) {
          existing.count++
          existing.types.add(r.type || 'unknown')
        } else {
          locationCounts.set(key, { 
            count: 1, 
            types: new Set([r.type || 'unknown']),
            locationName: coord.location
          })
        }
      }
    }
    
    // Convert to heatmap format
    locationCounts.forEach(({ count, types, locationName }, key) => {
      const [lat, lng] = key.split(',').map(Number)
      coordinates.push({
        lat,
        lng,
        intensity: count,
        type: Array.from(types).join(', '),
        location: locationName
      })
    })
    
    return coordinates
  }, [allReportsForHeatmap])

  const maxCount = useMemo(() => {
    let max = 0
    heatmapData.forEach((coord) => { if (coord.intensity > max) max = coord.intensity })
    return max
  }, [heatmapData])


  useEffect(() => {
    if (!selectedBarangay && barangays.length > 0) {
      setSelectedBarangay(barangays[0])
    }
  }, [barangays, selectedBarangay])

  // Close search results when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Default center (Lipa City, Philippines) - used in initial state

  // Handle barangay selection and map centering
  const handleApplyFilters = () => {
    if (selectedBarangay) {
      const barangayCoords = getBarangayCoordinates(selectedBarangay)
      if (barangayCoords) {
        setMapCenter([barangayCoords.lat, barangayCoords.lng])
        setMapZoom(15)
      }
    }
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold text-gray-900">Lipa City Stray Animals Cases Heatmap</h1>
        <button
          onClick={() => setShowAllCases(!showAllCases)}
          className={`px-4 py-2 rounded-lg font-semibold transition-colors duration-200 ${
            showAllCases 
              ? 'bg-orange-600 text-white hover:bg-orange-700' 
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          {showAllCases ? 'Show Filtered Cases' : 'Show All Cases'}
        </button>
      </div>
      
      {/* Cases Summary */}
      <div className="mb-6 p-4 bg-orange-50 rounded-lg border border-orange-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{showAllCases ? reports.length : filtered.length}</div>
              <div className="text-sm text-gray-600">{showAllCases ? 'All Cases' : 'Filtered Cases'}</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-orange-600">{heatmapData.length}</div>
              <div className="text-sm text-gray-600">Locations</div>
            </div>
            {heatmapData.length > 0 && (
              <div className="text-center">
                <div className="text-lg font-bold text-orange-600">
                  {heatmapData.reduce((max, point) => point.intensity > max.intensity ? point : max).location}
                </div>
                <div className="text-sm text-gray-600">Most Cases ({maxCount})</div>
              </div>
            )}
          </div>
          {reports.length === 0 && (
            <div className="text-red-600 font-medium">
              ❌ No reports found
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map / Heat area */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-2">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md border border-gray-200">
            <MapContainer
              center={mapCenter}
              zoom={mapZoom}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
              key={`${mapCenter[0]}-${mapCenter[1]}-${mapZoom}`}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Heatmap Layer */}
              {heatmapData.length > 0 && (
                <HeatmapLayer
                  points={heatmapData}
                  radius={40}
                  max={Math.max(maxCount, 1)}
                  minOpacity={0.4}
                  gradient={{
                    0.1: '#22c55e', // green - 1-2 cases
                    0.3: '#84cc16', // lime green - 3-4 cases  
                    0.5: '#eab308', // yellow - 5-6 cases
                    0.7: '#f97316', // orange - 7-8 cases
                    0.9: '#ef4444', // red - 9-10 cases
                    1.0: '#dc2626'  // dark red - 10+ cases
                  }}
                />
              )}
              
              {/* Markers for each location */}
              {heatmapData.map((coord, index) => {
                // Determine color based on intensity
                let markerColor = '#22c55e' // green for low (1-2 cases)
                if (coord.intensity >= 10) markerColor = '#dc2626' // dark red for severe (10+ cases)
                else if (coord.intensity >= 9) markerColor = '#ef4444' // red for critical (9-10 cases)
                else if (coord.intensity >= 7) markerColor = '#f97316' // orange for very high (7-8 cases)
                else if (coord.intensity >= 5) markerColor = '#eab308' // yellow for high (5-6 cases)
                else if (coord.intensity >= 3) markerColor = '#84cc16' // lime green for medium (3-4 cases)
                
                // Create custom icon with color
                const customIcon = L.divIcon({
                  className: 'custom-marker',
                  html: `<div style="
                    background-color: ${markerColor};
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 3px solid white;
                    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    color: white;
                    font-weight: bold;
                    font-size: 12px;
                  ">${coord.intensity}</div>`,
                  iconSize: [20, 20],
                  iconAnchor: [10, 10]
                })
                
                return (
                  <Marker key={index} position={[coord.lat, coord.lng]} icon={customIcon}>
                  <Popup>
                      <div className="text-center p-3 min-w-[200px]">
                        <div className="font-bold text-gray-900 text-lg mb-2 border-b pb-2">
                          📍 {coord.location}
                        </div>
                        <div className="flex items-center justify-center mb-2">
                          <div className={`inline-flex items-center px-3 py-1 rounded-full text-white font-bold text-lg ${
                            coord.intensity >= 10 ? 'bg-red-700' : 
                            coord.intensity >= 9 ? 'bg-red-500' : 
                            coord.intensity >= 7 ? 'bg-orange-500' : 
                            coord.intensity >= 5 ? 'bg-yellow-500' : 
                            coord.intensity >= 3 ? 'bg-lime-500' : 'bg-green-500'
                          }`}>
                            {coord.intensity} {coord.intensity === 1 ? 'Case' : 'Cases'}
                      </div>
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                          <span className="font-semibold">Types:</span> {coord.type}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          Click to view more details
                      </div>
                    </div>
                  </Popup>
                </Marker>
                )
              })}
            </MapContainer>
          </div>
        </div>

        {/* Filters & Stats */}
        <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-4">
          {/* Search */}
          <div className="border border-orange-200 rounded-md mb-4">
            <div className="px-3 py-2 bg-orange-100 text-orange-800 font-semibold rounded-t-md">Search Location</div>
            <div className="px-3 py-3 space-y-2">
              <div className="relative" ref={searchRef}>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  placeholder="Search barangay..."
                  className="w-full border border-gray-300 rounded-md px-3 py-2 pr-8"
                />
                {searchQuery && (
                  <button 
                    onClick={clearSearch}
                    className="absolute right-2 top-2 text-gray-400 hover:text-gray-600"
                  >
                    ✕
                  </button>
                )}
                {showSearchResults && searchResults.length > 0 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {searchResults.map((barangay) => (
                      <button
                        key={barangay}
                        onClick={() => handleSearchResultClick(barangay)}
                        className="w-full text-left px-3 py-2 hover:bg-orange-50 border-b border-gray-100 last:border-b-0"
                      >
                        {barangay}
                      </button>
                    ))}
                  </div>
                )}
                {showSearchResults && searchResults.length === 0 && searchQuery.length >= 2 && (
                  <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg p-3 text-gray-500">
                    No barangays found
                  </div>
                )}
              </div>
            </div>
          </div>



          {/* Date */}
          <div className="border border-orange-200 rounded-md mb-4">
            <div className="px-3 py-2 bg-orange-100 text-orange-800 font-semibold rounded-t-md">Filter by Date</div>
            <div className="px-3 py-3 space-y-2">
              <div>
                <label className="block text-xs text-gray-600 mb-1">From Date</label>
                <input 
                  type="date" 
                  value={dateFrom} 
                  onChange={(e) => setDateFrom(e.target.value)} 
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                />
              </div>
              <div>
                <label className="block text-xs text-gray-600 mb-1">To Date</label>
                <input 
                  type="date" 
                  value={dateTo} 
                  onChange={(e) => setDateTo(e.target.value)} 
                  min={dateFrom || undefined}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full border border-gray-300 rounded-md px-3 py-2" 
                />
              </div>
              {(dateFrom && dateTo && new Date(dateFrom) > new Date(dateTo)) && (
                <div className="text-red-600 text-xs mt-1">
                  ⚠️ From date cannot be after To date
                </div>
              )}
              <button 
                onClick={() => {
                  setDateFrom('')
                  setDateTo('')
                }}
                className="w-full mt-2 px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors duration-200"
              >
                Clear Date Filters
              </button>
            </div>
          </div>

          {/* Type */}
          <div className="border border-orange-200 rounded-md mb-4">
            <div className="px-3 py-2 bg-orange-100 text-orange-800 font-semibold rounded-t-md">Filter by Report Type</div>
            <div className="px-3 py-3 grid grid-cols-3 gap-2 text-sm">
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={filterLost} onChange={(e) => setFilterLost(e.target.checked)} />
                <span>Lost</span>
              </label>
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={filterFound} onChange={(e) => setFilterFound(e.target.checked)} />
                <span>Found</span>
              </label>
              <label className="inline-flex items-center space-x-2">
                <input type="checkbox" checked={filterAbuse} onChange={(e) => setFilterAbuse(e.target.checked)} />
                <span>Abuse</span>
              </label>
            </div>
          </div>

          {/* Barangay */}
          <div className="border border-orange-200 rounded-md mb-4">
            <div className="px-3 py-2 bg-orange-100 text-orange-800 font-semibold rounded-t-md">Filter by Barangay</div>
            <div className="px-3 py-3 space-y-3">
              <select value={selectedBarangay} onChange={(e) => setSelectedBarangay(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                <option value="">All Barangays</option>
                {barangays.map((barangay: string) => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
              <button onClick={handleApplyFilters} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-md mb-2">Apply Filters</button>
               <button 
                 onClick={() => {
                   setDateFrom('')
                   setDateTo('')
                   setFilterLost(true)
                   setFilterFound(true)
                   setFilterAbuse(true)
                   setSelectedBarangay('')
                   setSearchQuery('')
                   setShowSearchResults(false)
                   setShowAllCases(false)
                 }}
                 className="w-full bg-gray-500 hover:bg-gray-600 text-white font-semibold py-2 rounded-md"
               >
                 Clear All Filters
               </button>
            </div>
          </div>


          {/* Legend */}
          <div className="border border-orange-200 rounded-md">
            <div className="px-3 py-2 bg-white text-gray-900 font-semibold rounded-t-md">Heatmap Legend</div>
            <div className="px-3 py-3 space-y-2">
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-green-500 border border-green-600" />
                <span className="text-gray-800 text-sm">Low (1-2 cases)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-lime-500 border border-lime-600" />
                <span className="text-gray-800 text-sm">Medium (3-4 cases)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-yellow-500 border border-yellow-600" />
                <span className="text-gray-800 text-sm">High (5-6 cases)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-orange-500 border border-orange-600" />
                <span className="text-gray-800 text-sm">Very High (7-8 cases)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-red-500 border border-red-600" />
                <span className="text-gray-800 text-sm">Critical (9-10 cases)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-red-700 border border-red-800" />
                <span className="text-gray-800 text-sm">Severe (10+ cases)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}

export default Heatmap