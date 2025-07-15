import { Link } from 'react-router-dom'
import { useModalStore } from '../stores/modalStore'
import { Heart, Search, MapPin, Users } from 'lucide-react'

const Home = () => {
  const { openReportModal } = useModalStore()

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-primary-50 to-primary-100 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6">
              StreetPaws
            </h1>
            <p className="text-xl md:text-2xl text-gray-700 mb-8">
              Promoting Safe and Compassionate Communities
            </p>
            
            {/* Call to Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
              <button
                onClick={openReportModal}
                className="btn-primary text-lg px-8 py-3 flex items-center"
              >
                <Search className="mr-2 h-5 w-5" />
                Submit a Report
              </button>
              
              <Link
                to="/adopt"
                className="btn-outline text-lg px-8 py-3 flex items-center"
              >
                <Heart className="mr-2 h-5 w-5" />
                Adopt a Pet
              </Link>
              
              <Link
                to="/lost-and-found"
                className="btn-secondary text-lg px-8 py-3 flex items-center"
              >
                <MapPin className="mr-2 h-5 w-5" />
                Lost and Found
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              How We Help Animals
            </h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              StreetPaws is dedicated to improving the lives of stray animals through rescue, 
              rehabilitation, and community education.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rescue & Care</h3>
              <p className="text-gray-600">
                We rescue abandoned and injured animals, providing them with medical care 
                and a safe place to recover.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Adoption Services</h3>
              <p className="text-gray-600">
                We help animals find their forever homes through our comprehensive 
                adoption program and matching process.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-primary-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Search className="h-8 w-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Lost & Found</h3>
              <p className="text-gray-600">
                We help reunite lost pets with their families and assist in finding 
                homes for found animals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Join us in our mission to create a safer, more compassionate world for animals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donate"
              className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Donate Now
            </Link>
            <Link
              to="/join-us"
              className="border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Volunteer
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default Home 