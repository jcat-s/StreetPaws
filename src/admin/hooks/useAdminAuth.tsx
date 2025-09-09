import { useState, useEffect, createContext, useContext, ReactNode } from 'react'
import { signOut, User } from 'firebase/auth'
import { auth } from '../../config/firebase'
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

// Mock admin users - In production, this would be stored in Firebase with proper security rules
const ADMIN_USERS: Record<string, AdminUser> = {
  'admin@streetpaws.gov.ph': {
    uid: 'admin-001',
    email: 'admin@streetpaws.gov.ph',
    role: 'admin',
    name: 'Dr. Maria Santos',
    department: 'Veterinary Services'
  },
  'superadmin@streetpaws.gov.ph': {
    uid: 'super-admin-001',
    email: 'superadmin@streetpaws.gov.ph',
    role: 'super_admin',
    name: 'Dr. Juan Dela Cruz',
    department: 'Administration'
  },
  'vet@streetpaws.gov.ph': {
    uid: 'vet-001',
    email: 'vet@streetpaws.gov.ph',
    role: 'admin',
    name: 'Dr. Ana Rodriguez',
    department: 'Animal Care'
  }
}

export const AdminAuthProvider = ({ children }: { children: ReactNode }) => {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (!auth) {
      setIsLoading(false)
      return
    }

    const unsubscribe = auth.onAuthStateChanged(async (user: User | null) => {
      if (user) {
        // Check if the user is an admin
        const adminData = ADMIN_USERS[user.email || '']
        if (adminData) {
          setAdminUser(adminData)
        } else {
          // User is not an admin, sign them out
          if (auth) {
            await signOut(auth)
          }
          setAdminUser(null)
        }
      } else {
        setAdminUser(null)
      }
      setIsLoading(false)
    })

    return () => unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    try {
      // For demo purposes, we'll use a simple password check
      // In production, you'd use Firebase Auth with proper admin accounts
      if (email === 'admin@streetpaws.gov.ph' && password === 'admin123') {
        const adminData = ADMIN_USERS[email]
        if (adminData) {
          setAdminUser(adminData)
          return
        }
      }
      if (email === 'superadmin@streetpaws.gov.ph' && password === 'superadmin123') {
        const adminData = ADMIN_USERS[email]
        if (adminData) {
          setAdminUser(adminData)
          return
        }
      }
      if (email === 'vet@streetpaws.gov.ph' && password === 'vet123') {
        const adminData = ADMIN_USERS[email]
        if (adminData) {
          setAdminUser(adminData)
          return
        }
      }
      
      throw new Error('Invalid admin credentials')
    } catch (error: any) {
      throw new Error(error.message || 'Login failed')
    }
  }

  const logout = async () => {
    try {
      setAdminUser(null)
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
