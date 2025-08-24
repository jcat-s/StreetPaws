import { Link } from 'react-router-dom'
import { useModalStore } from '../stores/modalStore'
import { Heart, MapPin, Users } from 'lucide-react'

const Home = () => {
  const { openLoginModal, openSignUpModal, openReportModal } = useModalStore()

  return (
    <div className="min-h-screen">
      {/* Hero Section redesigned */}
      <section className="relative bg-white py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            {/* Left column: Heading + tiles */}
            <div>
              <h1 className="text-3xl md:text-4xl font-extrabold text-orange-600 leading-tight mb-4 uppercase drop-shadow-sm">
                Promoting Safe and
                <br /> Compassionate
                <br /> Communities
              </h1>

              {/* Tiles row */}
              <div className="flex flex-col sm:flex-row gap-3 mb-6">
                <button
                  onClick={openReportModal}
                  className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md shadow-md transition-colors duration-200 uppercase tracking-wide flex items-center justify-center"
                >
                  Submit a Report
                </button>
                <Link to="/adopt" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md shadow-md transition-colors duration-200 uppercase tracking-wide flex items-center justify-center">
                  <Heart className="mr-2 h-5 w-5" /> Adopt a Pet
                </Link>
                <Link to="/lost-and-found" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md shadow-md transition-colors duration-200 uppercase tracking-wide flex items-center justify-center">
                  <MapPin className="mr-2 h-5 w-5" /> Lost and Found
                </Link>
              </div>

              {/* Sign up / Login small buttons */}
              <div className="flex gap-3">
                <button onClick={openSignUpModal} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-md transition-colors duration-200 uppercase tracking-wide">Sign Up</button>
                <button onClick={openLoginModal} className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold px-5 py-2 rounded-md transition-colors duration-200 uppercase tracking-wide">Log In</button>
              </div>
            </div>

            {/* Right column: catdog image */}
            <div className="relative h-64 md:h-96">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src="/images/SP.png"
                  alt="Cat and Dog"
                  className="w-full h-full object-contain"
                />
              </div>
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
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Heart className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Rescue & Care</h3>
              <p className="text-gray-600">
                We rescue abandoned and injured animals, providing them with medical care
                and a safe place to recover.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Adoption Services</h3>
              <p className="text-gray-600">
                We help animals find their forever homes through our comprehensive
                adoption program and matching process.
              </p>
            </div>

            <div className="text-center">
              <div className="bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                <MapPin className="h-8 w-8 text-orange-600" />
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
      <section className="py-16 bg-orange-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-orange-100 mb-8">
            Join us in our mission to create a safer, more compassionate world for animals.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              to="/donate"
              className="bg-white text-orange-500 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
            >
              Donate Now
            </Link>
            <Link
              to="/join-us"
              className="border-2 border-white text-white hover:bg-white hover:text-orange-500 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
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