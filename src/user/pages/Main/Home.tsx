import { Link } from 'react-router-dom'
import { useModalStore } from '../../../stores/modalStore'
import { useAuth } from '../../../contexts/AuthContext'
const SPImage = new URL('../../../assets/images/SP.PNG', import.meta.url).href
import { Heart, MapPin } from 'lucide-react'

const Home = () => {
  const { openLoginModal, openSignUpModal, openReportModal } = useModalStore()
  const { currentUser } = useAuth()

  return (
    <div>
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
                <Link to="/our-animals" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md shadow-md transition-colors duration-200 uppercase tracking-wide flex items-center justify-center">
                  <Heart className="mr-2 h-5 w-5" /> Adopt a Pet
                </Link>
                <Link to="/lost-and-found" className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-3 rounded-md shadow-md transition-colors duration-200 uppercase tracking-wide flex items-center justify-center">
                  <MapPin className="mr-2 h-5 w-5" /> Lost and Found
                </Link>
              </div>

              {/* Sign up / Login small buttons */}
              {!currentUser && (
                <div className="flex gap-3">
                  <button onClick={openSignUpModal} className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-md transition-colors duration-200 uppercase tracking-wide">Sign Up</button>
                  <button onClick={openLoginModal} className="border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white font-semibold px-5 py-2 rounded-md transition-colors duration-200 uppercase tracking-wide">Log In</button>
                </div>
              )}
            </div>

            {/* Right column: catdog image */}
            <div className="relative h-64 md:h-96">
              <div className="absolute inset-0 flex items-center justify-center">
                <img
                  src={SPImage}
                  alt="Cat and Dog"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>
          </div>
        </div>
      </section>


    </div>
  )
}

export default Home 