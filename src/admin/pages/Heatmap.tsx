import { useEffect, useMemo, useState, useRef } from 'react'
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import 'leaflet.heat'
import { X, BarChart3 } from 'lucide-react'

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

// Known Lipa City barangays for reference
const LIPA_BARANGAYS = [
  'Adya', 'Anilao', 'Anilao-Labac', 'Antipolo del Norte', 'Antipolo del Sur',
  'Bagong Pook', 'Balintawak', 'Banaybanay', 'Bolbok', 'Bugtong na Pulo',
  'Bulacnin', 'Bulaklakan', 'Calamias', 'Cumba', 'Dagatan', 'Duhatan',
  'Halang', 'Inosloban', 'Kayumanggi', 'Labac', 'Latag', 'Lodlod',
  'Lumbang', 'Mabini', 'Mataas na Lupa', 'Malagonlong', 'Malitlit',
  'Marauoy', 'Munting Pulo', 'Pagolingin Bata', 'Pagolingin East',
  'Pagolingin West', 'Pangao', 'Pinagkawitan', 'Pinagtongulan',
  'Plaridel', 'Poblacion Barangay 1', 'Poblacion Barangay 2',
  'Poblacion Barangay 3', 'Poblacion Barangay 4', 'Poblacion Barangay 5',
  'Poblacion Barangay 6', 'Poblacion Barangay 7', 'Poblacion Barangay 8',
  'Poblacion Barangay 9', 'Poblacion Barangay 9-A', 'Poblacion Barangay 10',
  'Poblacion Barangay 11', 'Poblacion Barangay 12', 'Pusil', 'Quezon',
  'Rizal', 'Sabang', 'Sampaguita', 'San Benito', 'San Carlos',
  'San Celestino', 'San Francisco', 'San Guillermo', 'San Isidro',
  'San Jose', 'San Lucas', 'San Salvador', 'San Sebastian',
  'Santo Niño', 'Santo Toribio', 'Sico', 'Talisay', 'Tambo',
  'Tangob', 'Tangway', 'Tibig'
]

const Heatmap = () => {
  const [reports, setReports] = useState<ReportDoc[]>([])
  const [dateFrom, setDateFrom] = useState<string>('')
  const [dateTo, setDateTo] = useState<string>('')
  const [filterLost, setFilterLost] = useState(true)
  const [filterFound, setFilterFound] = useState(true)
  const [filterAbuse, setFilterAbuse] = useState(true)
  const [selectedBarangay, setSelectedBarangay] = useState<string>('')
  const [applyKey, setApplyKey] = useState(0)
  const [mapCenter, setMapCenter] = useState<[number, number]>([13.9411, 121.1639])
  const [mapZoom, setMapZoom] = useState(11)
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [searchResults, setSearchResults] = useState<string[]>([])
  const [showSearchResults, setShowSearchResults] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const [showStatsModal, setShowStatsModal] = useState(false)
  const [modalPosition, setModalPosition] = useState({ x: 50, y: 50 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const modalRef = useRef<HTMLDivElement>(null)

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
        
        console.log(`📥 Loaded ${newReports.length} reports from ${collectionName}:`, newReports.map(r => ({
          id: r.id,
          type: r.type,
          location: r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation,
          createdAt: r.createdAt
        })))
        
        setReports(prevReports => {
          // Remove old reports from this collection and add new ones
          const filtered = prevReports.filter(r => !r.id?.includes(collectionName))
          const updated = [...filtered, ...newReports]
          console.log(`📊 Total reports after update: ${updated.length}`)
          return updated
        })
      })
      unsubscribers.push(unsub)
    })
    
    return () => {
      unsubscribers.forEach(unsub => unsub())
    }
  }, [])

  function getDate(v: any): Date | null {
    if (!v) return null
    if (typeof v?.toDate === 'function') return v.toDate() as Date
    if (typeof v === 'string') return new Date(v)
    return null
  }

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
    
    // Extract barangay from full address
    const locationLower = location.toLowerCase()
    const foundBarangay = LIPA_BARANGAYS.find(barangay => 
      locationLower.includes(barangay.toLowerCase())
    )
    
    if (foundBarangay) {
      // Use approximate coordinates for the barangay
      // These are rough estimates - in a real app you'd want more precise coordinates
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

  // Get approximate coordinates for barangays
  function getBarangayCoordinates(barangay: string): { lat: number; lng: number } | null {
    // Approximate coordinates for major barangays in Lipa City
    const coordinates: Record<string, { lat: number; lng: number }> = {
      'Latag': { lat: 13.9334, lng: 121.1722 },
      'Tipacan': { lat: 13.9500, lng: 121.1500 },
      'Poblacion Barangay 1': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 2': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 3': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 4': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 5': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 6': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 7': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 8': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 9': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 9-A': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 10': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 11': { lat: 13.9411, lng: 121.1639 },
      'Poblacion Barangay 12': { lat: 13.9411, lng: 121.1639 },
      'Anilao': { lat: 13.9015, lng: 121.1717 },
      'Balintawak': { lat: 13.9538, lng: 121.1585 },
      'Bolbok': { lat: 13.9238, lng: 121.1488 },
      'Cumba': { lat: 13.9074, lng: 121.1383 },
      'Dagatan': { lat: 13.9660, lng: 121.1816 },
      'Halang': { lat: 13.9524, lng: 121.0830 },
      'Inosloban': { lat: 13.9828, lng: 121.1706 },
      'Kayumanggi': { lat: 13.9258, lng: 121.1606 },
      'Lodlod': { lat: 13.9306, lng: 121.1415 },
      'Mabini': { lat: 13.8968, lng: 121.1492 },
      'Malagonlong': { lat: 13.9099, lng: 121.1563 },
      'Malitlit': { lat: 13.9178, lng: 121.2352 },
      'Marauoy': { lat: 13.9635, lng: 121.1612 },
      'Munting Pulo': { lat: 13.9545, lng: 121.1854 },
      'Pagolingin Bata': { lat: 13.8927, lng: 121.1623 },
      'San Jose': { lat: 13.9200, lng: 121.1800 },
      'San Sebastian': { lat: 13.9100, lng: 121.1900 },
      'Santo Niño': { lat: 13.9300, lng: 121.1700 },
      'Talisay': { lat: 13.9400, lng: 121.2000 },
      'Tambo': { lat: 13.9000, lng: 121.1400 },
      'Tibig': { lat: 13.9500, lng: 121.1200 }
    }
    
    return coordinates[barangay] || null
  }

  const barangays = useMemo(() => {
    return LIPA_BARANGAYS.sort()
  }, [])

  // Search functionality
  const handleSearch = (query: string) => {
    setSearchQuery(query)
    if (query.length < 2) {
      setSearchResults([])
      setShowSearchResults(false)
      return
    }
    
    const results = barangays.filter(barangay => 
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
      setApplyKey((v) => v + 1)
    }
  }

  const clearSearch = () => {
    setSearchQuery('')
    setSearchResults([])
    setShowSearchResults(false)
  }

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null
    const to = dateTo ? new Date(dateTo) : null
    const types: Record<string, boolean> = { lost: filterLost, found: filterFound, abuse: filterAbuse }
    
    return reports.filter((r) => {
      if (!types[r.type || '']) return false
      const d = getDate(r.createdAt)
      if (from && d && d < from) return false
      if (to && d && d > to) return false
      
      // Filter by barangay if selected
      if (selectedBarangay) {
        const loc = r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
        if (!loc || !loc.toLowerCase().includes(selectedBarangay.toLowerCase())) {
          return false
        }
      }
      
      return true
    })
  }, [reports, dateFrom, dateTo, filterLost, filterFound, filterAbuse, selectedBarangay, applyKey])

  // Convert filtered reports to coordinates for heatmap
  const heatmapData = useMemo(() => {
    const coordinates: Coordinate[] = []
    const locationCounts = new Map<string, { count: number; types: Set<string>; locationName: string }>()
    
    console.log('🔍 Processing filtered reports:', filtered.length)
    
    for (const r of filtered) {
      const loc = r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
      if (!loc) {
        console.log('⚠️ Report missing location:', r.type, r.id)
        continue
      }
      
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
        console.log('📍 Added report to location:', coord.location, 'Type:', r.type, 'Total at location:', locationCounts.get(key)?.count)
      } else {
        console.log('❌ Could not parse location:', loc)
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
    
    console.log('🗺️ Final heatmap data:', coordinates)
    return coordinates
  }, [filtered])

  const maxCount = useMemo(() => {
    let max = 0
    heatmapData.forEach((coord) => { if (coord.intensity > max) max = coord.intensity })
    return max
  }, [heatmapData])

  // Calculate statistics for selected barangay
  const selectedBarangayStats = useMemo(() => {
    if (!selectedBarangay) return null
    
    console.log('🏘️ Calculating stats for barangay:', selectedBarangay)
    console.log('📊 Total filtered reports:', filtered.length)
    
    const barangayReports = filtered.filter(report => {
      const location = report.type === 'lost' ? report.lastSeenLocation : 
                      report.type === 'found' ? report.foundLocation : 
                      report.incidentLocation
      
      if (!location) return false
      
      // More flexible matching - check if any known barangay is in the location
      const locationLower = location.toLowerCase()
      const barangayLower = selectedBarangay.toLowerCase()
      
      // Direct match
      if (locationLower.includes(barangayLower)) return true
      
      // Check if the location contains any barangay name that matches our selected one
      const foundBarangay = LIPA_BARANGAYS.find(b => 
        b.toLowerCase() === barangayLower && locationLower.includes(b.toLowerCase())
      )
      
      return !!foundBarangay
    })
    
    console.log('🎯 Reports found for barangay:', barangayReports.length)
    console.log('📋 Barangay reports:', barangayReports.map(r => ({
      type: r.type,
      location: r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
    })))
    
    if (barangayReports.length === 0) return null
    
    const typeCounts = {
      lost: 0,
      found: 0,
      abuse: 0
    }
    
    barangayReports.forEach(report => {
      if (report.type === 'lost') typeCounts.lost++
      else if (report.type === 'found') typeCounts.found++
      else if (report.type === 'abuse') typeCounts.abuse++
    })
    
    console.log('📈 Type counts:', typeCounts)
    console.log('🔍 Active filters:', { filterLost, filterFound, filterAbuse })
    
    const activeTypes = []
    if (filterLost && typeCounts.lost > 0) activeTypes.push('Lost')
    if (filterFound && typeCounts.found > 0) activeTypes.push('Found')
    if (filterAbuse && typeCounts.abuse > 0) activeTypes.push('Abuse')
    
    const totalCases = activeTypes.reduce((sum, type) => {
      if (type === 'Lost') return sum + typeCounts.lost
      if (type === 'Found') return sum + typeCounts.found
      if (type === 'Abuse') return sum + typeCounts.abuse
      return sum
    }, 0)
    
    console.log('✅ Final stats:', {
      barangay: selectedBarangay,
      totalCases,
      typeString: activeTypes.join(' & '),
      typeCounts
    })
    
    return {
      barangay: selectedBarangay,
      totalCases,
      typeString: activeTypes.join(' & '),
      typeCounts
    }
  }, [selectedBarangay, filtered, filterLost, filterFound, filterAbuse])

  // Drag functionality for modal
  const handleMouseDown = (e: React.MouseEvent) => {
    if (modalRef.current) {
      const rect = modalRef.current.getBoundingClientRect()
      setIsDragging(true)
      setDragStart({
        x: e.clientX - rect.left,
        y: e.clientY - rect.top
      })
    }
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      setModalPosition({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y
      })
    }
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      return () => {
        document.removeEventListener('mousemove', handleMouseMove)
        document.removeEventListener('mouseup', handleMouseUp)
      }
    }
  }, [isDragging, dragStart])

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
    setApplyKey((v) => v + 1)
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Lipa City Stray Animals Cases Heatmap</h1>

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
                  radius={30}
                  max={maxCount}
                  minOpacity={0.3}
                  gradient={{
                    0.2: '#22c55e', // green
                    0.4: '#eab308', // yellow
                    0.6: '#f97316', // orange
                    0.8: '#ef4444', // red
                    1.0: '#dc2626'  // dark red
                  }}
                />
              )}
              
              {/* Markers for each location */}
              {heatmapData.map((coord, index) => (
                <Marker key={index} position={[coord.lat, coord.lng]}>
                  <Popup>
                    <div className="text-center p-2">
                      <div className="font-bold text-gray-900 text-lg mb-2">
                        {coord.location}
                      </div>
                      <div className="text-orange-600 font-bold text-xl mb-1">
                        {coord.intensity} Cases
                      </div>
                      <div className="text-sm text-gray-600 capitalize">
                        Type: {coord.type}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))}
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
              <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
              <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2" />
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
                {barangays.map((barangay) => (
                  <option key={barangay} value={barangay}>{barangay}</option>
                ))}
              </select>
              <button onClick={handleApplyFilters} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-md">Apply Filters</button>
            </div>
          </div>

           {/* Statistics Button */}
           <div className="border border-orange-200 rounded-md mb-4">
             <button
               onClick={() => setShowStatsModal(true)}
               className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-md transition-colors duration-200"
             >
               <BarChart3 className="w-5 h-5" />
               View Statistics
             </button>
           </div>

          {/* Legend */}
          <div className="border border-orange-200 rounded-md">
            <div className="px-3 py-2 bg-white text-gray-900 font-semibold rounded-t-md">Heatmap Legend</div>
            <div className="px-3 py-3 space-y-3">
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-green-500 border border-green-600" />
                <span className="text-gray-800">Low (1-2 cases)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-yellow-500 border border-yellow-600" />
                <span className="text-gray-800">Medium (3-5 cases)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-orange-500 border border-orange-600" />
                <span className="text-gray-800">High (6-10 cases)</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-red-500 border border-red-600" />
                <span className="text-gray-800">Critical (10+ cases)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Draggable Statistics Modal */}
      {showStatsModal && (
        <div
          ref={modalRef}
          className="fixed z-50 bg-white rounded-lg shadow-xl border border-gray-200 min-w-[300px] max-w-[400px]"
          style={{
            left: `${modalPosition.x}px`,
            top: `${modalPosition.y}px`,
            cursor: isDragging ? 'grabbing' : 'grab'
          }}
          onMouseDown={handleMouseDown}
        >
          {/* Modal Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-orange-50 rounded-t-lg">
            <h3 className="text-lg font-semibold text-gray-900">Statistics</h3>
            <button
              onClick={() => setShowStatsModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Modal Content */}
          <div className="p-4 space-y-4">
            {/* Selected Barangay Stats */}
            {selectedBarangayStats && (
              <div className="bg-orange-50 rounded-lg p-4 border border-orange-200">
                <div className="text-center">
                  <div className="font-bold text-gray-900 text-lg mb-2">
                    {selectedBarangayStats.barangay}
                  </div>
                  <div className="text-orange-600 font-bold text-xl mb-1">
                    {selectedBarangayStats.totalCases} Cases
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    Type: {selectedBarangayStats.typeString}
                  </div>
                </div>
              </div>
            )}

            {/* Basic Stats */}
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-700">Total Reports:</span>
                <span className="font-semibold text-gray-900">{filtered.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Mapped Locations:</span>
                <span className="font-semibold text-gray-900">{heatmapData.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-700">Max Cases:</span>
                <span className="font-semibold text-gray-900">{maxCount}</span>
              </div>
              {selectedBarangay && (
                <div className="flex justify-between">
                  <span className="text-gray-700">Selected Barangay:</span>
                  <span className="font-semibold text-gray-900">{selectedBarangay}</span>
                </div>
              )}
            </div>

            {/* Filter Status */}
            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-md font-semibold text-gray-900 mb-3">Active Filters</h4>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${filterLost ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700">Lost Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${filterFound ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700">Found Reports</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className={`w-3 h-3 rounded-full ${filterAbuse ? 'bg-orange-500' : 'bg-gray-300'}`}></div>
                  <span className="text-sm text-gray-700">Abuse Reports</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Heatmap