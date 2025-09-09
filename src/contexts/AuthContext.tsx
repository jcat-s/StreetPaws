import React, { createContext, useContext, useEffect, useState } from 'react'
import { 
  User, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset as firebaseConfirmPasswordReset,
  verifyPasswordResetCode as firebaseVerifyPasswordResetCode,
  Auth,
  AuthError
} from 'firebase/auth'
import { auth } from '../config/firebase'

interface AuthContextType {
  currentUser: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>
  verifyPasswordResetCode: (code: string) => Promise<string>
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

// Password strength validation
export const validatePasswordStrength = (password: string): { isValid: boolean; message: string } => {
  if (password.length < 8) {
    return { isValid: false, message: 'Password must be at least 8 characters long' }
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one lowercase letter' }
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one uppercase letter' }
  }
  
  if (!/(?=.*\d)/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one number' }
  }
  
  if (!/(?=.*[@$!%*?&])/.test(password)) {
    return { isValid: false, message: 'Password must contain at least one special character (@$!%*?&)' }
  }
  
  return { isValid: true, message: 'Password is strong' }
}

// Helper function to get user-friendly error messages
const getErrorMessage = (error: AuthError): string => {
  switch (error.code) {
    case 'auth/user-not-found':
      return 'No account found with this email address.'
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.'
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.'
    case 'auth/weak-password':
      return 'Password should be at least 8 characters with uppercase, lowercase, number, and special character.'
    case 'auth/invalid-email':
      return 'Invalid email address.'
    case 'auth/user-disabled':
      return 'This account has been disabled.'
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.'
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.'
    case 'auth/expired-action-code':
      return 'The password reset link has expired. Please request a new one.'
    case 'auth/invalid-action-code':
      return 'The password reset link is invalid. Please request a new one.'
    default:
      return 'An error occurred. Please try again.'
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  async function signup(email: string, password: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      await createUserWithEmailAndPassword(auth as Auth, email, password)
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function login(email: string, password: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      await signInWithEmailAndPassword(auth as Auth, email, password)
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function logout(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      await signOut(auth as Auth)
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function resetPassword(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      // Use custom action URL to redirect to our app
      const actionCodeSettings = {
        url: `${window.location.origin}/password-reset?source=email&timestamp=${Date.now()}`,
        handleCodeInApp: false, // Must be false for proper redirect
      }
      
      console.log('Sending password reset with settings:', actionCodeSettings)
      console.log('Current origin:', window.location.origin)
      
      await sendPasswordResetEmail(auth as Auth, email, actionCodeSettings)
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      await firebaseConfirmPasswordReset(auth as Auth, code, newPassword)
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function verifyPasswordResetCode(code: string): Promise<string> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      const email = await firebaseVerifyPasswordResetCode(auth as Auth, code)
      return email
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
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
    resetPassword,
    confirmPasswordReset,
    verifyPasswordResetCode,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 