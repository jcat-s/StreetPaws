import React, { useState, useCallback, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

interface LocationPickerProps {
  label?: string
  value?: string
  onChange: (location: { lat: number; lon: number; address: string }) => void
  placeholder?: string
  required?: boolean
  error?: string
}

interface MapClickHandlerProps {
  onLocationSelect: (lat: number, lon: number) => void
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onLocationSelect }) => {
  useMapEvents({
    click: (e) => {
      onLocationSelect(e.latlng.lat, e.latlng.lng)
    },
  })
  return null
}

const LocationPicker: React.FC<LocationPickerProps> = ({
  label = "Location",
  value = "",
  onChange,
  placeholder = "e.g., Barangay 1, Lipa City, Batangas",
  required = false,
  error
}) => {
  const [showMap, setShowMap] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [address, setAddress] = useState(value)
  const [coordinates, setCoordinates] = useState<{ lat: number; lon: number } | null>(null)
  const [mapCenter, setMapCenter] = useState<[number, number]>([14.0048, 121.1631]) // Default to Lipa City
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  // Reverse geocoding function
  const reverseGeocode = useCallback(async (lat: number, lon: number): Promise<string> => {
    try {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const params = new URLSearchParams({
        lat: String(lat),
        lon: String(lon),
        format: 'jsonv2',
        addressdetails: '1'
      })

      const response = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LipaStrayAnimalGIS/1.0 (education project)'
        }
      })

      if (!response.ok) throw new Error('Failed to reverse geocode')

      const data = await response.json()
      return data?.display_name || `${lat.toFixed(6)}, ${lon.toFixed(6)}`
    } catch (err: any) {
      if (err.name === 'AbortError') return ''
      throw new Error('Failed to get address')
    }
  }, [])

  // Forward geocoding function
  const forwardGeocode = useCallback(async (query: string): Promise<{ lat: number; lon: number; address: string } | null> => {
    try {
      abortControllerRef.current?.abort()
      const controller = new AbortController()
      abortControllerRef.current = controller

      const params = new URLSearchParams({
        q: query,
        format: 'jsonv2',
        limit: '1',
        addressdetails: '1'
      })

      const response = await fetch(`https://nominatim.openstreetmap.org/search?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'LipaStrayAnimalGIS/1.0 (education project)'
        }
      })

      if (!response.ok) throw new Error('Failed to geocode')

      const data = await response.json()
      if (data && data.length > 0) {
        const result = data[0]
        return {
          lat: parseFloat(result.lat),
          lon: parseFloat(result.lon),
          address: result.display_name
        }
      }
      return null
    } catch (err: any) {
      if (err.name === 'AbortError') return null
      throw new Error('Failed to search location')
    }
  }, [])

  // Get current location
  const getCurrentLocation = useCallback(() => {
    setIsLoading(true)
    setErrorMsg(null)

    if (!navigator.geolocation) {
      setErrorMsg('Geolocation is not supported by this browser')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(async (position) => {
      const { latitude, longitude } = position.coords
      setMapCenter([latitude, longitude])
      
      try {
        const addressResult = await reverseGeocode(latitude, longitude)
        setAddress(addressResult)
        setCoordinates({ lat: latitude, lon: longitude })
        onChange({ lat: latitude, lon: longitude, address: addressResult })
        setShowMap(true)
      } catch (err) {
        setErrorMsg('Failed to get address for current location')
      } finally {
        setIsLoading(false)
      }
    }, (err) => {
      setErrorMsg(err.message || 'Unable to retrieve your location')
      setIsLoading(false)
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000
    })
  }, [reverseGeocode, onChange])

  // Handle address search
  const handleSearch = useCallback(async () => {
    if (!address.trim()) return

    setIsLoading(true)
    setErrorMsg(null)

    try {
      const result = await forwardGeocode(address)
      if (result) {
        setCoordinates({ lat: result.lat, lon: result.lon })
        setMapCenter([result.lat, result.lon])
        onChange(result)
        setShowMap(true)
      } else {
        setErrorMsg('Location not found. Please try a different address.')
      }
    } catch (err) {
      setErrorMsg('Failed to search location')
    } finally {
      setIsLoading(false)
    }
  }, [address, forwardGeocode, onChange])

  // Handle map click
  const handleMapClick = useCallback(async (lat: number, lon: number) => {
    setIsLoading(true)
    setErrorMsg(null)

    try {
      const addressResult = await reverseGeocode(lat, lon)
      setAddress(addressResult)
      setCoordinates({ lat, lon })
      onChange({ lat, lon, address: addressResult })
    } catch (err) {
      setErrorMsg('Failed to get address for selected location')
    } finally {
      setIsLoading(false)
    }
  }, [reverseGeocode, onChange])

  // Clear location
  const clearLocation = useCallback(() => {
    setAddress('')
    setCoordinates(null)
    onChange({ lat: 0, lon: 0, address: '' })
  }, [onChange])

  // Handle input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setAddress(e.target.value)
  }, [])

  // Handle enter key
  const handleKeyPress = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSearch()
    }
  }, [handleSearch])

  // Update address when value prop changes
  useEffect(() => {
    setAddress(value)
  }, [value])

  return (
    <div className="space-y-4">
      {/* Label */}
      <label className="block text-sm font-medium text-gray-700">
        {label} {required && '*'}
      </label>

      {/* Input and Search */}
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={handleInputChange}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          className="input-field flex-1"
          disabled={isLoading}
        />
        <button
          type="button"
          onClick={handleSearch}
          disabled={isLoading || !address.trim()}
          className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => setShowMap(!showMap)}
          className="flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          {showMap ? 'Hide Map' : 'Show Map'}
        </button>

        <button
          type="button"
          onClick={getCurrentLocation}
          disabled={isLoading}
          className="flex items-center gap-2 px-4 py-2 bg-orange-400 text-white rounded-lg hover:bg-orange-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200 shadow-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          {isLoading ? 'Locating...' : 'Use My Location'}
        </button>

        {coordinates && (
          <button
            type="button"
            onClick={clearLocation}
            className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200 shadow-sm"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear Location
          </button>
        )}
      </div>

      {/* Tips */}
      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
        <p className="text-sm text-orange-800">
          <span className="font-medium text-orange-700">Tips:</span> You can search for an address, click on the map, or use your current location.
        </p>
        <p className="text-sm text-orange-700 mt-1">
          If location access is denied, try refreshing the page and allowing location permissions.
        </p>
      </div>

      {/* Map */}
      {showMap && (
        <div className="bg-white border border-orange-200 rounded-xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-semibold text-gray-900">Select Location on Map</h3>
            <button
              type="button"
              onClick={() => setShowMap(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <div className="h-96 rounded-lg overflow-hidden border border-gray-200 shadow-sm">
            <MapContainer
              center={mapCenter}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <MapClickHandler onLocationSelect={handleMapClick} />
              {coordinates && (
                <Marker position={[coordinates.lat, coordinates.lon]} />
              )}
            </MapContainer>
          </div>
          
          <p className="text-sm text-gray-600 mt-3 text-center">
            Click on the map to select a location, or search for an address above.
          </p>
        </div>
      )}

      {/* Location Selected Display */}
      {coordinates && address && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="font-semibold text-orange-800">Location Selected</span>
          </div>
          <p className="text-sm text-orange-700 mb-2 font-medium">{address}</p>
          <p className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded">
            Coordinates: {coordinates.lat.toFixed(6)}, {coordinates.lon.toFixed(6)}
          </p>
        </div>
      )}

      {/* Error Messages */}
      {error && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{error}</p>}
      {errorMsg && <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">{errorMsg}</p>}
    </div>
  )
}

export default LocationPicker
