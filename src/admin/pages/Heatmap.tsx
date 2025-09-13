import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
// @ts-ignore - No type definitions available for this package
import { HeatmapLayer } from 'react-leaflet-heatmap-layer-v3'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

type ReportDoc = {
  type?: 'lost' | 'found' | 'abuse'
  createdAt?: any
  lastSeenLocation?: string
  foundLocation?: string
  incidentLocation?: string
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
  const [selectedLocation, setSelectedLocation] = useState<string>('')
  const [applyKey, setApplyKey] = useState(0)

  useEffect(() => {
    if (!db) return
    const unsub = onSnapshot(collection(db, 'reports'), (snap) => {
      const list = snap.docs.map((d) => d.data() as ReportDoc)
      setReports(list)
    })
    return () => unsub()
  }, [])

  function getDate(v: any): Date | null {
    if (!v) return null
    if (typeof v?.toDate === 'function') return v.toDate() as Date
    if (typeof v === 'string') return new Date(v)
    return null
  }

  // Parse location string to coordinates
  function parseLocation(location: string): Coordinate | null {
    if (!location) return null
    
    // Try to parse as "lat,lng" format
    const coords = location.split(',').map(s => s.trim())
    if (coords.length === 2) {
      const lat = parseFloat(coords[0])
      const lng = parseFloat(coords[1])
      if (!isNaN(lat) && !isNaN(lng) && lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180) {
        return { lat, lng, intensity: 1, type: '', location }
      }
    }
    
    // For now, return null for non-coordinate strings
    // In a real app, you might want to geocode these addresses
    return null
  }

  const locations = useMemo(() => {
    const set = new Set<string>()
    for (const r of reports) {
      const loc = r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
      if (loc) set.add(loc)
    }
    return Array.from(set).sort()
  }, [reports])

  const filtered = useMemo(() => {
    const from = dateFrom ? new Date(dateFrom) : null
    const to = dateTo ? new Date(dateTo) : null
    const types: Record<string, boolean> = { lost: filterLost, found: filterFound, abuse: filterAbuse }
    return reports.filter((r) => {
      if (!types[r.type || '']) return false
      const d = getDate(r.createdAt)
      if (from && d && d < from) return false
      if (to && d && d > to) return false
      return true
    })
  }, [reports, dateFrom, dateTo, filterLost, filterFound, filterAbuse, applyKey])

  // Convert filtered reports to coordinates for heatmap
  const heatmapData = useMemo(() => {
    const coordinates: Coordinate[] = []
    const locationCounts = new Map<string, { count: number; type: string }>()
    
    for (const r of filtered) {
      const loc = r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
      if (!loc) continue
      
      const coord = parseLocation(loc)
      if (coord) {
        const key = `${coord.lat},${coord.lng}`
        const existing = locationCounts.get(key)
        if (existing) {
          existing.count++
          existing.type = r.type || 'unknown'
        } else {
          locationCounts.set(key, { count: 1, type: r.type || 'unknown' })
        }
      }
    }
    
    // Convert to heatmap format
    locationCounts.forEach(({ count, type }, key) => {
      const [lat, lng] = key.split(',').map(Number)
      coordinates.push({
        lat,
        lng,
        intensity: count,
        type,
        location: key
      })
    })
    
    return coordinates
  }, [filtered])

  // const countsByLocation = useMemo(() => {
  //   const map = new Map<string, number>()
  //   for (const r of filtered) {
  //     const loc = r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
  //     if (!loc) continue
  //     map.set(loc, (map.get(loc) || 0) + 1)
  //   }
  //   return map
  // }, [filtered])

  const maxCount = useMemo(() => {
    let max = 0
    heatmapData.forEach((coord) => { if (coord.intensity > max) max = coord.intensity })
    return max
  }, [heatmapData])

  useEffect(() => {
    if (!selectedLocation && locations.length > 0) {
      setSelectedLocation(locations[0])
    }
  }, [locations, selectedLocation])

  // const currentCount = countsByLocation.get(selectedLocation || '') || 0

  // Default center (Manila, Philippines - adjust as needed)
  const defaultCenter: [number, number] = [14.5995, 120.9842]
  const defaultZoom = 11

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Stray Animals Cases Heatmap</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map / Heat area */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-2">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md border border-gray-200">
            <MapContainer
              center={defaultCenter}
              zoom={defaultZoom}
              style={{ height: '100%', width: '100%' }}
              className="z-0"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              {/* Heatmap Layer */}
              {heatmapData.length > 0 && (
                <HeatmapLayer
                  points={heatmapData}
                  longitudeExtractor={(point: Coordinate) => point.lng}
                  latitudeExtractor={(point: Coordinate) => point.lat}
                  intensityExtractor={(point: Coordinate) => point.intensity}
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
                    <div className="text-center">
                      <div className="font-semibold text-gray-900 mb-1">
                        {coord.location}
                      </div>
                      <div className="text-orange-600 font-bold text-lg">
                        {coord.intensity} Cases
                      </div>
                      <div className="text-xs text-gray-500 capitalize">
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
          {/* Statistics */}
          <div className="border border-orange-200 rounded-md mb-4">
            <div className="px-3 py-2 bg-orange-100 text-orange-800 font-semibold rounded-t-md">Statistics</div>
            <div className="px-3 py-3 space-y-2 text-sm">
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

          {/* Location */}
          <div className="border border-orange-200 rounded-md mb-4">
            <div className="px-3 py-2 bg-orange-100 text-orange-800 font-semibold rounded-t-md">Filter by Location</div>
            <div className="px-3 py-3 space-y-3">
              <select value={selectedLocation} onChange={(e) => setSelectedLocation(e.target.value)} className="w-full border border-gray-300 rounded-md px-3 py-2">
                {locations.map((loc) => (
                  <option key={loc} value={loc}>{loc}</option>
                ))}
              </select>
              <button onClick={() => setApplyKey((v) => v + 1)} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-md">Apply Filters</button>
            </div>
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
    </div>
  )
}

export default Heatmap


