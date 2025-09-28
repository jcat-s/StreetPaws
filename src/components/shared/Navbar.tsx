import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, User, Bell, LogOut } from 'lucide-react'
import LogoImage from '../../assets/images/LOGO.png'
import toast from 'react-hot-toast'
import { collection, onSnapshot, query, where, updateDoc, doc, orderBy, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const { currentUser, logout } = useAuth()
  const location = useLocation()
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState<any[]>([])
  // Listen for adoption notifications for the logged-in user (by uid OR email)
  useEffect(() => {
    const database = db
    if (!database || (!currentUser?.uid && !currentUser?.email)) return
    const emailFilter = currentUser?.email ? where('recipientEmail', '==', currentUser.email) : null
    const uidFilter = currentUser?.uid ? where('recipientUid', '==', currentUser.uid) : null
    const constraints = [] as any[]
    if (uidFilter) constraints.push(uidFilter)
    else if (emailFilter) constraints.push(emailFilter)
    const qAll = query(collection(database, 'notifications'), ...constraints, orderBy('createdAt', 'desc'), limit(20))
    const qUnread = query(collection(database, 'notifications'), ...constraints, where('read', '==', false))
    const unsubAll = onSnapshot(qAll, async (snap) => {
      const list = snap.docs.map(d => ({ id: d.id, ...(d.data() as any) }))
      setNotifications(list)
    })
    const unsubUnread = onSnapshot(qUnread, async (snap) => {
      setUnreadCount(snap.size)
      for (const d of snap.docs) {
        const data: any = d.data()
        const status = String(data?.status || '').toLowerCase()
        const animal = data?.animalName || 'your selected pet'
        const reason = data?.reason ? ` Reason: ${data.reason}` : ''
        if (status === 'approved') {
          toast.success(`Adoption approved for ${animal}.${reason}`)
        } else if (status === 'rejected') {
          toast.error(`Adoption rejected for ${animal}.${reason}`)
        } else {
          toast(`Update on adoption for ${animal}.${reason}`)
        }
        // mark as read to avoid repeated toasts
        try { await updateDoc(doc(database, 'notifications', d.id), { read: true, readAt: new Date().toISOString() }) } catch {}
      }
    })
    return () => { unsubAll(); unsubUnread() }
  }, [currentUser?.email, db])

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
                    <div className="absolute right-0 mt-2 w-64 bg-white rounded-md shadow-lg py-1 z-50">
                      {/* User Info Section */}
                      <div className="px-4 py-3 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="h-8 w-8 bg-orange-500 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-white" />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {currentUser?.displayName || 'User'}
                            </p>
                            <p className="text-xs text-gray-500 truncate">
                              {currentUser?.email}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Menu Items */}
                      <div className="relative">
                        <button onClick={() => setNotifOpen(!notifOpen)} className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">
                          <div className="relative mr-2">
                            <Bell className="h-4 w-4" />
                            {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] leading-none px-1.5 py-0.5 rounded-full">
                                {unreadCount}
                              </span>
                            )}
                          </div>
                          Notifications
                        </button>
                        {notifOpen && (
                          <div className="absolute right-4 mt-1 w-80 max-h-80 overflow-auto bg-white border border-gray-200 rounded-lg shadow-lg z-50">
                            <div className="p-2 text-xs text-gray-500 border-b">Recent</div>
                            {notifications.length === 0 ? (
                              <div className="p-4 text-sm text-gray-600">No notifications</div>
                            ) : (
                              notifications.map((n) => (
                                <div key={n.id} className="px-4 py-3 hover:bg-gray-50 text-sm text-gray-800 border-b last:border-b-0">
                                  <div className="font-medium capitalize">{n.status || 'update'}: {n.animalName || ''}</div>
                                  {n.reason && <div className="text-gray-600 mt-0.5">{n.reason}</div>}
                                  {n.createdAt?.seconds && (
                                    <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt.seconds * 1000).toLocaleString()}</div>
                                  )}
                                </div>
                              ))
                            )}
                          </div>
                        )}
                      </div>

                      <button
                        onClick={handleLogout}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <LogOut className="h-4 w-4 mr-2" />
                        Logout
                      </button>
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
