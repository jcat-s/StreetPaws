import { Link } from 'react-router-dom'
import { Facebook, Mail } from 'lucide-react'

const Footer = () => {
  return (
    <footer className="bg-orange-100 shadow-lg mt-auto rounded-t-[30px]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* About Section */}
          <div className="col-span-1 md:col-span-2">
            <h3 className="text-base font-semibold mb-2 text-orange-600">StreetPaws</h3>
            <p className="text-orange-600 mb-3 text-sm">
              A community initiative partnering with Lipa City Veterinary Office to rescue,
              rehabilitate, and rehome stray animals.
            </p>
            <div className="flex space-x-3">
              <a href="https://fb.com/CityVeterinaryOfficeLipa" target="_blank" rel="noopener noreferrer"
                className="bg-orange-500 p-1.5 rounded-full text-white hover:bg-orange-600 transition-colors duration-200">
                <Facebook className="h-4 w-4" />
              </a>
              <a href="mailto:contact@streetpaws.com"
                className="bg-orange-500 p-1.5 rounded-full text-white hover:bg-orange-600 transition-colors duration-200">
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-base font-semibold mb-2 text-orange-600">Quick Links</h3>
            <ul className="space-y-1.5 text-sm">
              <li>
                <Link to="/about-us" className="text-orange-600 hover:text-orange-700 transition-colors duration-200">About Us</Link>
              </li>
              <li>
                <Link to="/our-animals" className="text-orange-600 hover:text-orange-700 transition-colors duration-200">Our Animals</Link>
              </li>
              <li>
                <Link to="/donate" className="text-orange-600 hover:text-orange-700 transition-colors duration-200">Donate</Link>
              </li>
              <li>
                <Link to="/join-us" className="text-orange-600 hover:text-orange-700 transition-colors duration-200">Join Us</Link>
              </li>
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h3 className="text-base font-semibold mb-2 text-orange-600">Contact Us</h3>
            <ul className="text-orange-600 space-y-1.5 text-sm">
              <li>📍 Lipa City Veterinary Office</li>
              <li>🗺️ Marawoy, Lipa City, Batangas</li>
              <li>📞 0966 871 0191 / 043-740-0638</li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-orange-200 mt-4 pt-4 text-center text-orange-600 text-sm">
          <p>© {new Date().getFullYear()} StreetPaws. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}

export default Footer
