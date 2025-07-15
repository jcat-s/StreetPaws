import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  Auth
} from 'firebase/auth'
import { auth } from '../config/firebase'

interface AuthContextType {
  currentUser: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  function signup(email: string, password: string): Promise<void> {
    if (!auth) {
      console.warn('Firebase auth not initialized - using mock signup')
      return Promise.resolve()
    }
    return createUserWithEmailAndPassword(auth as Auth, email, password).then(() => {})
  }

  function login(email: string, password: string): Promise<void> {
    if (!auth) {
      console.warn('Firebase auth not initialized - using mock login')
      return Promise.resolve()
    }
    return signInWithEmailAndPassword(auth as Auth, email, password).then(() => {})
  }

  function logout(): Promise<void> {
    if (!auth) {
      console.warn('Firebase auth not initialized - using mock logout')
      return Promise.resolve()
    }
    return signOut(auth as Auth)
  }

  useEffect(() => {
    if (!auth) {
      console.warn('Firebase auth not initialized - skipping auth state listener')
      setLoading(false)
      return
    }

    const unsubscribe = onAuthStateChanged(auth as Auth, (user) => {
      setCurrentUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 