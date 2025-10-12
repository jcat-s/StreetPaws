import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { signOut, User, signInWithEmailAndPassword, onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import { auth } from '../../config/firebase'
import { securityService } from '../../shared/utils/securityService'
import toast from 'react-hot-toast'

interface AdminUser {
  uid: string
  email: string
  role: 'admin' | 'super_admin'
  name: string
  department: string
}

interface AdminAuthContextType {
  adminUser: AdminUser | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  isAdmin: boolean
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined)

// We now rely on Firebase custom claims instead of a hardcoded allowlist.

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setIsLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth, async (user: User | null) => {
      if (user) {
        const token = await getIdTokenResult(user)
        const role = (token?.claims?.role as string) || 'user'
        if (role === 'admin' || role === 'super_admin') {
          const adminData: AdminUser = {
            uid: user.uid,
            email: user.email || '',
            role: role as 'admin' | 'super_admin',
            name: user.displayName || 'Admin',
            department: 'Administration'
          }
          setAdminUser(adminData)
          securityService.generateAuditLog('ADMIN_LOGIN_SUCCESS', user.email || '', true)
        } else {
          if (auth) {
            await signOut(auth)
          }
          setAdminUser(null)
          securityService.generateAuditLog('ADMIN_UNAUTHORIZED_ACCESS', user.email || '', false)
        }
      } else {
        setAdminUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }

    // Check rate limiting
    const ipAddress = securityService.getClientIP()
    const rateLimitCheck = securityService.checkRateLimit(ipAddress)
    if (!rateLimitCheck.allowed) {
      throw new Error(`Too many requests. Please wait ${rateLimitCheck.remainingTime} seconds before trying again.`)
    }

    // Check if account is locked
    if (securityService.isAccountLocked(email)) {
      const remainingTime = securityService.getRemainingLockoutTime(email)
      throw new Error(`Account is temporarily locked due to too many failed attempts. Please try again in ${remainingTime} seconds.`)
    }

    try {
      // Use Firebase Authentication for admin login
      await signInWithEmailAndPassword(auth, email, password)
      // Verify admin claim after login
      const currentUser = auth.currentUser
      if (currentUser) {
        const token = await getIdTokenResult(currentUser, true)
        const role = (token?.claims?.role as string) || 'user'
        if (!(role === 'admin' || role === 'super_admin')) {
          await signOut(auth)
          securityService.generateAuditLog('ADMIN_LOGIN_UNAUTHORIZED_EMAIL', email, false)
          throw new Error('Unauthorized admin access attempt')
        }
      }
      
      // Record successful login
      securityService.recordLoginAttempt(email, true, ipAddress)
      securityService.generateAuditLog('ADMIN_LOGIN_SUCCESS', email, true)
      
      toast.success('Admin login successful!')
    } catch (error: any) {
      // Record failed login
      securityService.recordLoginAttempt(email, false, ipAddress)
      securityService.generateAuditLog('ADMIN_LOGIN_FAILED', email, false, { error: error.code })
      
      // Provide user-friendly error messages
      let errorMessage = 'Invalid admin credentials'
      if (typeof error?.message === 'string' && error.message.includes('Unauthorized admin access attempt')) {
        errorMessage = 'Account does not have admin access. Please contact a super admin.'
      }
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'Admin account not found'
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Incorrect password'
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Too many failed attempts. Please try again later.'
      }
      
      throw new Error(errorMessage)
    }
  }

  const logout = async () => {
    try {
      const userEmail = adminUser?.email
      if (auth) {
        await signOut(auth)
      }
      setAdminUser(null)
      
      if (userEmail) {
        securityService.generateAuditLog('ADMIN_LOGOUT', userEmail, true)
      }
      
      toast.success('Admin logged out successfully')
    } catch (error: any) {
      throw new Error(error.message || 'Logout failed')
    }
  }

  const value: AdminAuthContextType = {
    adminUser,
    isLoading,
    login,
    logout,
    isAdmin: !!adminUser
  }

  return (
    <AdminAuthContext.Provider value={value}>
      {children}
    </AdminAuthContext.Provider>
  )
}

export const useAdminAuth = () => {
  const context = useContext(AdminAuthContext)
  if (context === undefined) {
    throw new Error('useAdminAuth must be used within an AdminAuthProvider')
  }
  return context
}
