import { useEffect, useMemo, useState } from 'react'
import { collection, onSnapshot } from 'firebase/firestore'
import { db } from '../../config/firebase'

type ReportDoc = {
  type?: 'lost' | 'found' | 'abuse'
  createdAt?: any
  lastSeenLocation?: string
  foundLocation?: string
  incidentLocation?: string
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

  const countsByLocation = useMemo(() => {
    const map = new Map<string, number>()
    for (const r of filtered) {
      const loc = r.type === 'lost' ? r.lastSeenLocation : r.type === 'found' ? r.foundLocation : r.incidentLocation
      if (!loc) continue
      map.set(loc, (map.get(loc) || 0) + 1)
    }
    return map
  }, [filtered])

  const maxCount = useMemo(() => {
    let max = 0
    countsByLocation.forEach((v) => { if (v > max) max = v })
    return max
  }, [countsByLocation])

  useEffect(() => {
    if (!selectedLocation && locations.length > 0) {
      setSelectedLocation(locations[0])
    }
  }, [locations, selectedLocation])

  const currentCount = countsByLocation.get(selectedLocation || '') || 0
  const intensity = maxCount > 0 ? currentCount / maxCount : 0
  const intensityClass = intensity > 0.66 ? 'from-red-500 via-orange-400 to-yellow-300' : intensity > 0.33 ? 'from-orange-400 via-yellow-300 to-lime-200' : 'from-lime-300 via-lime-200 to-transparent'

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-4">Stray Animals Cases</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Map / Heat area */}
        <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-2">
          <div className="relative w-full aspect-[4/3] overflow-hidden rounded-md border border-gray-200">
            {/* Simple map-like background */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_25%_25%,#eef2ff,transparent_60%),radial-gradient(circle_at_75%_75%,#f1f5f9,transparent_60%)]" />

            {/* Heat blob representing selected location intensity */}
            <div className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full opacity-60 blur-2xl bg-gradient-to-br ${intensityClass}`} />

            {/* Location popup */}
            {selectedLocation && (
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="bg-white shadow-lg rounded-xl px-6 py-4 text-center border border-gray-200">
                  <div className="text-2xl font-extrabold text-gray-900 mb-1">{selectedLocation}</div>
                  <div className="text-gray-800 font-semibold">{currentCount} Cases</div>
                  <div className="text-xs text-gray-500">Type: {[
                    filterLost ? 'Lost' : null,
                    filterFound ? 'Found' : null,
                    filterAbuse ? 'Abuse' : null
                  ].filter(Boolean).join(', ') || 'None'}</div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="bg-orange-50 rounded-lg shadow-sm border border-orange-200 p-4">
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
              <button onClick={() => setApplyKey((v) => v + 1)} className="w-full bg-orange-600 hover:bg-orange-700 text-white font-semibold py-2 rounded-md">Apply</button>
            </div>
          </div>

          {/* Legend */}
          <div className="border border-orange-200 rounded-md">
            <div className="px-3 py-2 bg-white text-gray-900 font-semibold rounded-t-md">Legend</div>
            <div className="px-3 py-3 space-y-3">
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-lime-400 border border-lime-600" />
                <span className="text-gray-800">Low</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-yellow-400 border border-yellow-600" />
                <span className="text-gray-800">Medium</span>
              </div>
              <div className="flex items-center space-x-3">
                <span className="inline-block w-5 h-5 rounded bg-red-500 border border-red-700" />
                <span className="text-gray-800">High</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Heatmap


