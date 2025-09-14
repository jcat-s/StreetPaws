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
  sendEmailVerification as firebaseSendEmailVerification,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  Auth,
  AuthError
} from 'firebase/auth'
import { auth } from '../config/firebase'
import { securityService } from '../shared/utils/securityService'

interface AuthContextType {
  currentUser: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>
  verifyPasswordResetCode: (code: string) => Promise<string>
  sendEmailVerification: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  loading: boolean
  isEmailVerified: boolean
  requiresEmailVerification: boolean
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
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [requiresEmailVerification, setRequiresEmailVerification] = useState(false)

  async function signup(email: string, password: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth as Auth, email, password)
      // Send email verification after successful signup
      if (userCredential.user) {
        await firebaseSendEmailVerification(userCredential.user)
        // Set flag that email verification is required
        setRequiresEmailVerification(true)
        // Sign out the user immediately until email is verified
        await signOut(auth as Auth)
        throw new Error('EMAIL_VERIFICATION_REQUIRED')
      }
    } catch (error) {
      // If it's our custom error, re-throw it
      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        throw error
      }
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function login(email: string, password: string): Promise<void> {
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
      const userCredential = await signInWithEmailAndPassword(auth as Auth, email, password)
      
      // Check if email is verified
      if (userCredential.user && !userCredential.user.emailVerified) {
        // Sign out the user if email is not verified
        await signOut(auth as Auth)
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      
      // Record successful login
      securityService.recordLoginAttempt(email, true, ipAddress)
      securityService.generateAuditLog('LOGIN_SUCCESS', email, true)
    } catch (error) {
      // Record failed login
      securityService.recordLoginAttempt(email, false, ipAddress)
      securityService.generateAuditLog('LOGIN_FAILED', email, false, { error: (error as AuthError).code })
      
      // Handle email verification error
      if (error instanceof Error && error.message === 'EMAIL_NOT_VERIFIED') {
        throw new Error('Please verify your email address before logging in. Check your inbox for a verification link.')
      }
      
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function logout(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      const userEmail = currentUser?.email
      await signOut(auth as Auth)
      if (userEmail) {
        securityService.generateAuditLog('LOGOUT', userEmail, true)
      }
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function resetPassword(email: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      // In-app password reset so link comes to our app with oobCode
      const actionCodeSettings = {
        url: `${window.location.origin}/password-reset`,
        handleCodeInApp: true,
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

  async function sendEmailVerification(): Promise<void> {
    if (!auth || !currentUser) {
      throw new Error('User not authenticated')
    }
    try {
      await firebaseSendEmailVerification(currentUser)
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    if (!auth || !currentUser) {
      throw new Error('User not authenticated')
    }
    try {
      // Validate new password strength
      const strength = validatePasswordStrength(newPassword)
      if (!strength.isValid) {
        throw new Error(strength.message)
      }

      // Re-authenticate user before changing password
      const credential = EmailAuthProvider.credential(currentUser.email!, currentPassword)
      await reauthenticateWithCredential(currentUser, credential)
      
      // Update password
      await updatePassword(currentUser, newPassword)
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
      setIsEmailVerified(user?.emailVerified || false)
      setRequiresEmailVerification(false) // Reset when auth state changes
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
    sendEmailVerification,
    changePassword,
    loading,
    isEmailVerified,
    requiresEmailVerification
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
} 