import { useCallback, useEffect, useRef, useState } from 'react'

export interface GeolocationAddressResult {
  lat: number | null
  lon: number | null
  displayAddress: string
  isLoading: boolean
  error: string | null
  getCurrentLocation: () => void
}

// Simple cache to avoid repeated reverse geocoding for the same coords during a session
const lastCoordsKey = 'geo:last'

export function useGeolocationAddress(): GeolocationAddressResult {
  const [lat, setLat] = useState<number | null>(null)
  const [lon, setLon] = useState<number | null>(null)
  const [displayAddress, setDisplayAddress] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortRef = useRef<AbortController | null>(null)

  const reverseGeocode = useCallback(async (latitude: number, longitude: number) => {
    try {
      abortRef.current?.abort()
      const controller = new AbortController()
      abortRef.current = controller
      // Nominatim open API (fair-use). Consider adding a dedicated backend proxy for production traffic.
      const params = new URLSearchParams({
        lat: String(latitude),
        lon: String(longitude),
        format: 'jsonv2',
      })
      const res = await fetch(`https://nominatim.openstreetmap.org/reverse?${params.toString()}`, {
        signal: controller.signal,
        headers: {
          'Accept': 'application/json',
          // Provide an app-identifying header per Nominatim usage policy
          'User-Agent': 'LipaStrayAnimalGIS/1.0 (education project)'
        }
      })
      if (!res.ok) throw new Error('Failed to reverse geocode location')
      const data = await res.json()
      const address = data?.display_name || ''
      setDisplayAddress(address)
      return address
    } catch (e: any) {
      if (e?.name === 'AbortError') return ''
      setError(e?.message || 'Reverse geocoding failed')
      return ''
    }
  }, [])

  const getCurrentLocation = useCallback(() => {
    setIsLoading(true)
    setError(null)

    if (!navigator.geolocation) {
      setError('Geolocation is not supported by this browser')
      setIsLoading(false)
      return
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      const { latitude, longitude } = pos.coords
      setLat(latitude)
      setLon(longitude)
      try {
        const display = await reverseGeocode(latitude, longitude)
        // Cache last successful lookup
        try {
          sessionStorage.setItem(lastCoordsKey, JSON.stringify({ latitude, longitude, display }))
        } catch (_) { /* ignore */ }
      } finally {
        setIsLoading(false)
      }
    }, (err) => {
      setError(err?.message || 'Unable to retrieve your location')
      setIsLoading(false)
    }, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
    })
  }, [reverseGeocode])

  useEffect(() => {
    // load last cached location if available
    try {
      const raw = sessionStorage.getItem(lastCoordsKey)
      if (raw) {
        const parsed = JSON.parse(raw)
        if (parsed?.latitude && parsed?.longitude) {
          setLat(parsed.latitude)
          setLon(parsed.longitude)
          if (parsed?.display) setDisplayAddress(parsed.display)
        }
      }
    } catch (_) { /* ignore */ }
  }, [])

  return { lat, lon, displayAddress, isLoading, error, getCurrentLocation }
}


