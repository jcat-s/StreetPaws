import { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../../contexts/AuthContext'
import { Menu, X, User, Bell, LogOut } from 'lucide-react'
import LogoImage from '../../assets/images/LOGO.png'
// toast removed per new notification UX
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
  const [processedNotifications, setProcessedNotifications] = useState<Set<string>>(new Set())
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState<Set<string>>(() => new Set())
  const [lastDeleted, setLastDeleted] = useState<{ id: string, item: any } | null>(null)
  
  // Listen for adoption notifications for the logged-in user (by uid OR email)
  useEffect(() => {
    const database = db
    if (!database || (!currentUser?.uid && !currentUser?.email)) return
    
    // Reset processed notifications when user changes
    setProcessedNotifications(new Set())
    // Load hidden notifications from localStorage per-user
    try {
      const key = `hiddenNotifications:${currentUser?.uid || currentUser?.email || 'guest'}`
      const stored = localStorage.getItem(key)
      if (stored) setHiddenNotificationIds(new Set(JSON.parse(stored)))
      else setHiddenNotificationIds(new Set())
    } catch {}
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
        const notificationId = d.id
        // Track processed to avoid repeated work
        if (!processedNotifications.has(notificationId)) {
          setProcessedNotifications(prev => new Set([...prev, notificationId]))
        }
        // Mark as read to avoid repeated processing
        try { await updateDoc(doc(database, 'notifications', d.id), { read: true, readAt: new Date().toISOString() }) } catch {}
      }
    })
    return () => { unsubAll(); unsubUnread() }
  }, [currentUser?.email, db])

  // Helpers to persist hidden notifications per-user
  const persistHidden = (next: Set<string>) => {
    try {
      const key = `hiddenNotifications:${currentUser?.uid || currentUser?.email || 'guest'}`
      localStorage.setItem(key, JSON.stringify(Array.from(next)))
    } catch {}
  }

  const handleHideNotification = (id: string) => {
    const item = notifications.find(n => n.id === id)
    const next = new Set(hiddenNotificationIds)
    next.add(id)
    setHiddenNotificationIds(next)
    setLastDeleted(item ? { id, item } : null)
    persistHidden(next)
  }

  const handleUndoLastDelete = () => {
    if (!lastDeleted) return
    const next = new Set(hiddenNotificationIds)
    next.delete(lastDeleted.id)
    setHiddenNotificationIds(next)
    setLastDeleted(null)
    persistHidden(next)
  }

  const visibleNotifications = notifications.filter(n => !hiddenNotificationIds.has(n.id))


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
                      <div className="relative px-4 pt-3 pb-1 space-y-2">
                        <button
                          onClick={() => setNotifOpen(!notifOpen)}
                          className="flex items-center justify-between w-full rounded-full bg-white border border-orange-300 text-orange-700 font-semibold px-4 py-2 hover:bg-orange-100 transition"
                        >
                          <span className="inline-flex items-center">
                            <Bell className="h-4 w-4 mr-2" />
                            Notification
                          </span>
                          <span className="relative inline-flex items-center">
                            <span className="bg-orange-500 text-white text-[11px] px-2 py-0.5 rounded-full shadow">
                                {unreadCount}
                              </span>
                          </span>
                        </button>
                        {notifOpen && (
                          <div className="absolute right-4 mt-2 w-80 max-h-80 overflow-auto bg-white border border-orange-200 rounded-lg shadow-xl z-50">
                            <div className="p-3 text-xs font-semibold text-orange-600 border-b border-orange-100">Recent</div>
                            {visibleNotifications.length === 0 ? (
                              <div className="p-4 text-sm text-orange-700">No notifications</div>
                            ) : (
                              visibleNotifications.map((n) => {
                                // Determine notification title based on type in a friendly sentence
                                const status = String(n.status || 'update').toLowerCase()
                                const StatusWord = ({ s }: { s: string }) => (
                                  <span className={s === 'rejected' ? 'text-red-600 font-semibold' : s === 'approved' || s === 'verified' || s === 'published' ? 'text-green-600 font-semibold' : ''}>{s}</span>
                                )
                                let titleNode: any = null
                                if (n.adoptionId) {
                                  const name = n.animalName || 'your selected pet'
                                  if (status === 'approved') titleNode = (<span>Your adoption application to adopt {name} is <StatusWord s="approved" /></span>)
                                  else if (status === 'rejected') titleNode = (<span>Your adoption application to adopt {name} was <StatusWord s="rejected" /></span>)
                                  else titleNode = (<span>There is an update to your adoption application for {name}</span>)
                                } else if (n.donationId) {
                                  if (status === 'verified') titleNode = (<span>Your donation has been <StatusWord s="verified" /> — thank you so much!</span>)
                                  else if (status === 'rejected') titleNode = (<span>Your donation could not be <StatusWord s="verified" /> (<StatusWord s="rejected" />)</span>)
                                  else titleNode = (<span>There is an update to your donation</span>)
                                } else if (n.volunteerId) {
                                  if (status === 'approved') titleNode = (<span>Your volunteer application is <StatusWord s="approved" /></span>)
                                  else if (status === 'rejected') titleNode = (<span>Your volunteer application was <StatusWord s="rejected" /></span>)
                                  else titleNode = (<span>There is an update to your volunteer application</span>)
                                } else if (n.reportId) {
                                  const type = (n.reportType || 'report').toString().toLowerCase()
                                  if (status === 'published') titleNode = (<span>Your {type} has been <StatusWord s="published" /></span>)
                                  else titleNode = (<span>There is an update to your {type}</span>)
                                } else {
                                  titleNode = (<span>{n.reason || 'You have a new notification'}</span>)
                                }
                                
                                return (
                                  <div key={n.id} className="px-4 py-3 hover:bg-orange-50 text-sm text-gray-800 border-b border-orange-100 last:border-b-0">
                                    <div className="flex items-start justify-between">
                                      <div className="pr-3">
                                        <div className="font-medium">{titleNode}</div>
                                    {n.reason && <div className="text-gray-600 mt-0.5">{n.reason}</div>}
                                    {n.createdAt?.seconds && (
                                      <div className="text-xs text-gray-400 mt-1">{new Date(n.createdAt.seconds * 1000).toLocaleString()}</div>
                                    )}
                                      </div>
                                      <button
                                        className="text-xs text-orange-500 hover:text-red-600"
                                        onClick={() => handleHideNotification(n.id)}
                                        aria-label="Delete notification"
                                      >
                                        Delete
                                      </button>
                                    </div>
                                  </div>
                                )
                              })
                            )}
                            {lastDeleted && (
                              <div className="flex items-center justify-between px-4 py-2 bg-orange-50 text-xs text-orange-700">
                                <span>Notification deleted.</span>
                                <button className="font-semibold hover:underline" onClick={handleUndoLastDelete}>Undo</button>
                              </div>
                            )}
                          </div>
                        )}
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