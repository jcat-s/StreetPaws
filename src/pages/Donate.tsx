import { Link } from 'react-router-dom'
import { Heart, Package, Pill, DollarSign } from 'lucide-react'

const Donate = () => {
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
          <Link
            to="/donation-form"
            className="inline-flex items-center bg-primary-500 hover:bg-primary-600 text-white font-bold py-4 px-8 rounded-full text-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
          >
            <Heart className="h-6 w-6 mr-2" />
            Donate Now
          </Link>
        </div>

        {/* How Donations Help */}
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="bg-red-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Package className="h-8 w-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pet Food</h3>
            <p className="text-gray-600">
              Provide nutritious meals for rescued animals while they wait for their forever homes.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <Pill className="h-8 w-8 text-blue-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Medical Care</h3>
            <p className="text-gray-600">
              Cover veterinary expenses, vaccinations, and emergency medical treatments.
            </p>
          </div>

          <div className="bg-white rounded-lg p-6 text-center shadow-sm">
            <div className="bg-green-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Shelter Support</h3>
            <p className="text-gray-600">
              Maintain our facilities and provide safe, comfortable spaces for animals.
            </p>
          </div>
        </div>

        {/* Donation Items Gallery */}
        <div className="bg-white rounded-lg shadow-sm p-8 mb-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
            What We Need
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="bg-gray-200 rounded-lg h-32 mb-4 flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900">Pet Food</h3>
              <p className="text-sm text-gray-600">Dry and wet food</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gray-200 rounded-lg h-32 mb-4 flex items-center justify-center">
                <Pill className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900">Medicine</h3>
              <p className="text-sm text-gray-600">Vaccines and treatments</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gray-200 rounded-lg h-32 mb-4 flex items-center justify-center">
                <Package className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900">Cages</h3>
              <p className="text-sm text-gray-600">Transport and housing</p>
            </div>
            
            <div className="text-center">
              <div className="bg-gray-200 rounded-lg h-32 mb-4 flex items-center justify-center">
                <DollarSign className="h-12 w-12 text-gray-400" />
              </div>
              <h3 className="font-semibold text-gray-900">Monetary</h3>
              <p className="text-sm text-gray-600">Financial support</p>
            </div>
          </div>
        </div>

        {/* Impact Statistics */}
        <div className="bg-primary-600 rounded-lg p-8 mb-12 text-white">
          <h2 className="text-2xl font-bold mb-6 text-center">Our Impact</h2>
          <div className="grid md:grid-cols-4 gap-6 text-center">
            <div>
              <div className="text-3xl font-bold mb-2">500+</div>
              <div className="text-primary-100">Animals Rescued</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">300+</div>
              <div className="text-primary-100">Successful Adoptions</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">50+</div>
              <div className="text-primary-100">Volunteers</div>
            </div>
            <div>
              <div className="text-3xl font-bold mb-2">24/7</div>
              <div className="text-primary-100">Emergency Response</div>
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Ready to Make a Difference?
            </h2>
            <p className="text-lg text-gray-600 mb-6">
              Every donation, no matter the size, helps us continue our mission of helping animals in need.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/donation-form"
                className="btn-primary text-lg px-8 py-3"
              >
                Donate Now
              </Link>
              <Link
                to="/join-us"
                className="btn-outline text-lg px-8 py-3"
              >
                Volunteer Instead
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Donate 