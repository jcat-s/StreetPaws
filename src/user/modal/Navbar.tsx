import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, User, LogOut } from 'lucide-react'
import LogoImage from '../../assets/images/LOGO.png'
import NotificationModal from '../components/NotificationModal'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { currentUser, logout } = useAuth()
  const location = useLocation()


  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Our Animals', href: '/our-animals' },
    { name: 'Lost & Found', href: '/lost-and-found' },
    { name: 'Join Us', href: '/join-us' },
    { name: 'About Us', href: '/about-us' },
    { name: 'Contact Us', href: '/contact-us' },
  ]

  const handleLogout = async () => {
    try {
      await logout()
      setIsProfileOpen(false)
    } catch (error) {
      console.error('Failed to log out:', error)
    }
  }

  return (
    <nav className="bg-orange-100 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link to="/" className="flex-shrink-0">
            <img src={LogoImage} alt="StreetPaws" className="h-12 w-auto" />
          </Link>

          {/* Navigation and right side buttons */}
          <div className="flex items-center space-x-8">
            {/* Desktop navigation */}
            <div className="hidden md:flex md:space-x-8">
              {navigation.map((item) => (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`inline-flex items-center px-2 pt-1 border-b-2 text-sm tracking-wide uppercase font-semibold ${location.pathname === item.href
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-orange-600 hover:border-orange-300 hover:text-orange-700'
                    }`}
                >
                  {item.name}
                </Link>
              ))}
            </div>

            {/* Right side buttons */}
            <div className="flex items-center space-x-4">
              {/* Donate button */}
              <Link
                to="/donate"
                className="hidden md:inline-flex bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-2 rounded-full transition-colors duration-200"
              >
                Donate
              </Link>

              {/* User authentication - only show if logged in */}
              {currentUser && (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileOpen(!isProfileOpen)}
                    className="flex items-center space-x-2 text-orange-600 hover:text-orange-700"
                  >
                    <User className="h-6 w-6" />
                  </button>

                  {/* Profile dropdown */}
                  {isProfileOpen && (
                    <div className="absolute right-0 mt-2 w-72 bg-orange-50 border-2 border-orange-300 rounded-xl shadow-xl py-3 z-50">
                      {/* User Info Section */}
                      <div className="px-4 pb-3 border-b border-orange-200">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-9 w-9 bg-orange-500 rounded-full flex items-center justify-center shadow">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-extrabold text-orange-700 uppercase tracking-wide">
                              {currentUser?.displayName || 'Name'}
                            </p>
                            <p className="text-[11px] text-orange-600/80 truncate">
                              {currentUser?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="px-4 pt-3 pb-1 space-y-2">
                        <NotificationModal />
                      </div>
                      <div className="px-4 pt-1">
                      <button
                        onClick={handleLogout}
                          className="flex items-center w-full justify-center rounded-full bg-white border border-orange-300 text-orange-700 font-semibold px-4 py-2 hover:bg-orange-100 transition"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                          LogOut
                      </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile menu button */}
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-orange-600 hover:text-orange-700 hover:bg-orange-50"
              >
                {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-orange-100 border-t border-orange-200">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`block px-3 py-2 rounded-md text-base font-medium ${location.pathname === item.href
                  ? 'bg-orange-200 text-orange-700'
                  : 'text-orange-600 hover:bg-orange-50 hover:text-orange-700'
                  }`}
                onClick={() => setIsMenuOpen(false)}
              >
                {item.name}
              </Link>
            ))}
            <Link
              to="/donate"
              className="block px-3 py-2 rounded-md text-base font-medium text-orange-600 hover:bg-orange-50 hover:text-orange-700"
              onClick={() => setIsMenuOpen(false)}
            >
              Donate
            </Link>
          </div>
        </div>
      )}
    </nav>
  )
}

export default Navbar