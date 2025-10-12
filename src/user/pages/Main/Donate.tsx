import { Link } from 'react-router-dom'
import { Heart, Package, Pill, DollarSign, Users, Map, MapPin } from 'lucide-react'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { useState } from 'react'
import 'leaflet/dist/leaflet.css'

// Fix for default markers in react-leaflet
import L from 'leaflet'
import icon from 'leaflet/dist/images/marker-icon.png'
import iconShadow from 'leaflet/dist/images/marker-shadow.png'

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
})

L.Marker.prototype.options.icon = DefaultIcon

// StreetPaws Animal Rescue Center - Marawoy, Lipa City, Batangas
const RESCUE_CENTER = {
  coords: [13.9411, 121.1624] as [number, number],
  address: "Marawoy, Lipa City, Batangas, Philippines",
  fullAddress: "Lipa City Veterinary Office, Marawoy, Lipa City, Batangas 4217, Philippines",
  operatingHours: "Monday - Sunday: 8:00 AM - 6:00 PM"
}

const Donate = () => {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [userLocationName, setUserLocationName] = useState<string>('')
  const [distance, setDistance] = useState<number | null>(null)
  const [locationError, setLocationError] = useState<string | null>(null)
  const [showMap, setShowMap] = useState(false)
  const [isGettingLocation, setIsGettingLocation] = useState(false)

  // Calculate distance between two coordinates using Haversine formula
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371 // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180
    const dLon = (lon2 - lon1) * Math.PI / 180
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    const distance = R * c
    return distance
  }

  // Get location name from coordinates using reverse geocoding
  const getLocationName = async (lat: number, lng: number): Promise<string> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`
      )
      const data = await response.json()
      
      if (data && data.address) {
        const { address } = data
        const parts = []
        
        // Try to get barangay/village first
        if (address.village) parts.push(address.village)
        else if (address.suburb) parts.push(address.suburb)
        else if (address.neighbourhood) parts.push(address.neighbourhood)
        
        // Add city
        if (address.city) parts.push(address.city)
        else if (address.town) parts.push(address.town)
        
        // Add state/province
        if (address.state) parts.push(address.state)
        
        // Add country
        if (address.country) parts.push(address.country)
        
        return parts.length > 0 ? parts.join(', ') : 'Unknown Location'
      }
      return 'Unknown Location'
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return 'Unknown Location'
    }
  }

  // Get user's current location manually
  const getUserLocation = () => {
    setIsGettingLocation(true)
    setLocationError(null)
    
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          setUserLocation([latitude, longitude])
          const calculatedDistance = calculateDistance(latitude, longitude, RESCUE_CENTER.coords[0], RESCUE_CENTER.coords[1])
          setDistance(calculatedDistance)
          
          // Get location name
          const locationName = await getLocationName(latitude, longitude)
          setUserLocationName(locationName)
          
          setLocationError(null)
          setIsGettingLocation(false)
        },
        (error) => {
          setLocationError('Unable to get your location. Please enable location access.')
          console.error('Geolocation error:', error)
          setIsGettingLocation(false)
        }
      )
    } else {
      setLocationError('Geolocation is not supported by your browser.')
      setIsGettingLocation(false)
    }
  }

  const donationCategories = [
    {
      icon: Package,
      title: "Pet Food & Supplies",
      description: "Dry and wet food, treats, toys, and feeding supplies",
      items: ["Dog food (dry/wet)", "Cat food (dry/wet)", "Pet treats", "Feeding bowls", "Pet toys"],
      color: "bg-orange-100 text-orange-600"
    },
    {
      icon: Pill,
      title: "Medical Supplies",
      description: "Veterinary medicines, first aid supplies, and health products",
      items: ["Vaccines", "Antibiotics", "First aid kits", "Vitamins", "Flea treatments"],
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Package,
      title: "Shelter Equipment",
      description: "Cages, bedding, and other shelter necessities",
      items: ["Pet carriers", "Cages", "Blankets", "Towels", "Cleaning supplies"],
      color: "bg-green-100 text-green-600"
    },
    {
      icon: DollarSign,
      title: "Monetary Donations",
      description: "Financial support for operational expenses",
      items: ["Emergency vet care", "Food supplies", "Shelter maintenance", "Rescue operations"],
      color: "bg-purple-100 text-purple-600"
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Help Us Make Streets Safer for Animals
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Your donations help us rescue, care for, and find homes for stray animals.
            Every contribution makes a difference in creating a more compassionate community.
          </p>

          {/* Main Donate Button */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donation-form"
              className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <Heart className="h-6 w-6 mr-2" />
              Donate Now
            </Link>
            <Link
              to="/transparency"
              className="inline-flex items-center border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-bold py-4 px-8 rounded-full text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
            >
              <DollarSign className="h-6 w-6 mr-2" />
              View Transparency
            </Link>
          </div>
        </div>

        {/* Donation Categories */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {donationCategories.map((category, index) => (
            <div key={index} className="bg-white rounded-lg p-6 shadow-sm hover:shadow-md transition-shadow">
              <div className={`${category.color} rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4`}>
                <category.icon className="h-8 w-8" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2 text-center">{category.title}</h3>
              <p className="text-gray-600 text-sm mb-4 text-center">{category.description}</p>
              <ul className="space-y-1">
                {category.items.map((item, itemIndex) => (
                  <li key={itemIndex} className="text-sm text-gray-500 flex items-center">
                    <div className="w-1 h-1 bg-gray-400 rounded-full mr-2"></div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>


        {/* Location Sections */}
        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Your Location */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              YOUR LOCATION
            </h2>
            
            {!userLocation && !isGettingLocation && !locationError && (
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <p className="text-gray-600 text-sm mb-3">Click the button below to detect your location</p>
                <button
                  onClick={getUserLocation}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <MapPin className="h-4 w-4 mr-2" />
                  Use My Location
                </button>
              </div>
            )}
            
            {isGettingLocation && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <p className="text-yellow-800 text-sm">Getting your location...</p>
              </div>
            )}
            
            {locationError && (
              <div className="bg-red-50 p-4 rounded-lg mb-4">
                <p className="text-red-800 text-sm mb-3">{locationError}</p>
                <button
                  onClick={getUserLocation}
                  className="inline-flex items-center px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors"
                >
                  <MapPin className="h-3 w-3 mr-1" />
                  Try Again
                </button>
              </div>
            )}
            
            {distance && userLocationName && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="font-semibold text-blue-900 mb-2">{userLocationName}</p>
                <p className="text-2xl font-bold text-blue-800 mb-2">({distance.toFixed(1)}) km away</p>
                <p className="text-sm text-blue-700">
                  Estimated travel time: {Math.round(distance * 2)} minutes
                </p>
              </div>
            )}
          </div>

          {/* Our Location */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">
              OUR LOCATION
            </h2>
            <div className="bg-green-50 p-4 rounded-lg">
              <p className="font-semibold text-green-800 mb-2">Marawoy, Lipa City, Batangas</p>
              <p className="text-sm text-green-700 mb-2">Lipa City Veterinary Office</p>
              <p className="text-sm text-green-700">
                Operating Hours: {RESCUE_CENTER.operatingHours}
              </p>
            </div>
          </div>
        </div>

        {/* Map Section */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              Location Map
            </h2>
            <button
              onClick={() => setShowMap(!showMap)}
              className="inline-flex items-center px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
            >
              <Map className="h-4 w-4 mr-2" />
              {showMap ? 'Hide Map' : 'Show Map'}
            </button>
          </div>

          {showMap && (
            <div className="flex justify-center">
              <div className="h-80 w-96 rounded-lg overflow-hidden border-2 border-gray-200 shadow-lg">
                <MapContainer
                  center={userLocation || RESCUE_CENTER.coords}
                  zoom={userLocation ? 12 : 15}
                  style={{ height: '100%', width: '100%' }}
                  bounds={userLocation ? [userLocation, RESCUE_CENTER.coords] : undefined}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <Marker position={RESCUE_CENTER.coords}>
                    <Popup>
                      <div className="text-center">
                        <h3 className="font-bold text-lg">StreetPaws Animal Rescue</h3>
                        <p className="text-sm text-gray-600">{RESCUE_CENTER.address}</p>
                      </div>
                    </Popup>
                  </Marker>
                  {userLocation && (
                    <Marker position={userLocation}>
                      <Popup>
                        <div className="text-center">
                          <h3 className="font-bold text-lg">Your Location</h3>
                          <p className="text-sm text-gray-600">{userLocationName}</p>
                          <p className="text-sm text-gray-600">
                            Distance: {distance?.toFixed(1)} km
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                </MapContainer>
              </div>
            </div>
          )}
        </div>

        {/* How to Donate Physical Items */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            How to Donate Physical Items
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-blue-600">1</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Prepare Your Donation</h3>
              <p className="text-gray-600">
                Gather pet food, medical supplies, or shelter equipment. Check our accepted items list above.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-green-600">2</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Visit Our Center</h3>
              <p className="text-gray-600">
                Come to our rescue center during operating hours or use the map to check your distance for pickup.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-purple-600">3</span>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Make an Impact</h3>
              <p className="text-gray-600">
                Your physical donation directly helps animals in Marawoy, Lipa City, and surrounding areas.
              </p>
            </div>
          </div>
            </div>

        {/* Accepted Items & Guidelines */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            Donation Guidelines
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-green-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                We Accept:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• Unopened pet food (dry and wet)</li>
                <li>• Pet treats and toys</li>
                <li>• Medical supplies (vaccines, medicines)</li>
                <li>• Clean blankets, towels, and bedding</li>
                <li>• Pet carriers and cages</li>
                <li>• Feeding bowls and water dishes</li>
                <li>• Cleaning supplies and disinfectants</li>
                <li>• Leashes, collars, and harnesses</li>
              </ul>
              </div>
            <div>
              <h3 className="text-lg font-semibold text-red-900 mb-4 flex items-center">
                <Package className="h-5 w-5 mr-2" />
                Please Note:
              </h3>
              <ul className="space-y-2 text-gray-700">
                <li>• All items must be clean and in good condition</li>
                <li>• Food items should not be expired</li>
                <li>• Medical supplies should be unopened</li>
                <li>• Call ahead for large donations</li>
                <li>• We appreciate advance notice for pickup requests</li>
                <li>• Receipts available upon request for tax purposes</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div className="bg-primary-50 rounded-lg p-8 text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-gray-600 mb-6">
            Contact us to arrange your donation or ask questions about our needs.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donation-form"
              className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white font-bold py-3 px-6 rounded-full transition-colors duration-200"
            >
              <Package className="h-5 w-5 mr-2" />
              Donate Now
            </Link>
            <Link
              to="/contact"
              className="inline-flex items-center border-2 border-primary-500 text-primary-500 hover:bg-primary-500 hover:text-white font-bold py-3 px-6 rounded-full transition-colors duration-200"
            >
              <Users className="h-5 w-5 mr-2" />
              Contact Us
            </Link>
          </div>
        </div>

      </div>
    </div>
  )
}

export default Donate 