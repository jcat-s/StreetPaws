import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { Bell } from 'lucide-react'
import { collection, onSnapshot, query, where, updateDoc, doc, orderBy, limit } from 'firebase/firestore'
import { db } from '../../config/firebase'

const NotificationModal = () => {
  const { currentUser } = useAuth()
  const [notifOpen, setNotifOpen] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [notifications, setNotifications] = useState<any[]>([])
  const [hiddenNotificationIds, setHiddenNotificationIds] = useState<Set<string>>(() => new Set())
  const [lastDeleted, setLastDeleted] = useState<{ id: string, item: any } | null>(null)

  // Listen for notifications for the logged-in user (by uid OR email)
  useEffect(() => {
    const database = db
    console.log('👤 Current user:', currentUser)
    if (!database || (!currentUser?.uid && !currentUser?.email)) {
      console.log('❌ No database or user info available')
      return
    }
    
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
      console.log('🔔 All notifications for user:', list)
      setNotifications(list)
    })
    
    const unsubUnread = onSnapshot(qUnread, async (snap) => {
      console.log('📊 Unread notifications count:', snap.size)
      console.log('📊 Unread notifications:', snap.docs.map(d => ({ id: d.id, ...d.data() })))
      setUnreadCount(snap.size)
      // Don't auto-mark as read - let users manually mark them as read when they view them
    })
    
    return () => { unsubAll(); unsubUnread() }
  }, [currentUser?.email, currentUser?.uid])

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

  const handleMarkAsRead = async (notificationId: string) => {
    if (!db) {
      console.error('❌ Database not available')
      return
    }
    try {
      console.log('📖 Marking notification as read:', notificationId)
      const updateData = { 
        read: true, 
        readAt: new Date().toISOString() 
      }
      console.log('📝 Update data:', updateData)
      
      await updateDoc(doc(db, 'notifications', notificationId), updateData)
      console.log('✅ Successfully marked notification as read')
      
      // Force a small delay to see if the update sticks
      setTimeout(() => {
        console.log('🔄 Checking notification status after 1 second...')
      }, 1000)
      
    } catch (error) {
      console.error('❌ Failed to mark notification as read:', error)
      console.error('❌ Error details:', error)
    }
  }

  const visibleNotifications = notifications.filter(n => !hiddenNotificationIds.has(n.id))
  const visibleUnreadCount = visibleNotifications.filter(n => !n.read).length
  
  // Debug logging
  console.log('🔍 Notification debugging:')
  console.log('  - Total notifications:', notifications.length)
  console.log('  - Hidden notification IDs:', Array.from(hiddenNotificationIds))
  console.log('  - Visible notifications:', visibleNotifications.length)
  console.log('  - Visible unread count:', visibleUnreadCount)
  console.log('  - Original unread count:', unreadCount)
  console.log('  - Notification details:', visibleNotifications.map(n => ({ id: n.id, read: n.read, status: n.status })))

  return (
    <div className="relative">
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
            {visibleUnreadCount}
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
                <div 
                  key={n.id} 
                  className={`px-4 py-3 hover:bg-orange-50 text-sm text-gray-800 border-b border-orange-100 last:border-b-0 cursor-pointer ${!n.read ? 'bg-white border-l-4 border-l-orange-500' : 'bg-gray-50'}`}
                  onClick={() => handleMarkAsRead(n.id)}
                >
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
                      onClick={(e) => {
                        e.stopPropagation()
                        handleHideNotification(n.id)
                      }}
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
  )
}

export default NotificationModal
