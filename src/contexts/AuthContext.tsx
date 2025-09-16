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
  updateProfile,
  reauthenticateWithCredential,
  EmailAuthProvider,
  Auth,
  AuthError,
  signInWithPopup,
  fetchSignInMethodsForEmail
} from 'firebase/auth'
import { auth, googleProvider, facebookProvider, appleProvider } from '../config/firebase'
import { securityService } from '../shared/utils/securityService'

interface AuthContextType {
  currentUser: User | null
  login: (email: string, password: string) => Promise<void>
  signup: (email: string, password: string, firstName?: string, lastName?: string) => Promise<void>
  logout: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  confirmPasswordReset: (code: string, newPassword: string) => Promise<void>
  verifyPasswordResetCode: (code: string) => Promise<string>
  sendEmailVerification: () => Promise<void>
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>
  updateUserProfile: (firstName: string, lastName: string) => Promise<void>
  checkEmailVerificationStatus: (email: string) => Promise<boolean>
  signInWithGoogle: () => Promise<void>
  signInWithFacebook: () => Promise<void>
  signInWithApple: () => Promise<void>
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

  // Helper function to check if we recently attempted login with unverified email
  const hasRecentUnverifiedAttempt = (email: string): boolean => {
    try {
      const key = `unverified_attempt_${email}`
      const timestamp = localStorage.getItem(key)
      if (!timestamp) return false
      
      const attemptTime = parseInt(timestamp)
      const now = Date.now()
      const fiveMinutes = 5 * 60 * 1000 // 5 minutes
      
      return (now - attemptTime) < fiveMinutes
    } catch {
      return false
    }
  }

  // Helper function to mark an unverified attempt
  const markUnverifiedAttempt = (email: string): void => {
    try {
      const key = `unverified_attempt_${email}`
      localStorage.setItem(key, Date.now().toString())
    } catch {
      // Ignore localStorage errors
    }
  }

  async function signup(email: string, password: string, firstName?: string, lastName?: string): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      const userCredential = await createUserWithEmailAndPassword(auth as Auth, email, password)
      // Set display name if provided
      if (userCredential.user && firstName && lastName) {
        const displayName = `${firstName} ${lastName}`.trim()
        await updateProfile(userCredential.user, {
          displayName: displayName
        })
      }
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

    // Check if we recently had an unverified attempt for this email
    if (hasRecentUnverifiedAttempt(email)) {
      throw new Error('EMAIL_NOT_VERIFIED')
    }

    try {
      // Attempt authentication with Firebase
      const userCredential = await signInWithEmailAndPassword(auth as Auth, email, password)
      
      // Immediately check email verification status
      if (userCredential.user && !userCredential.user.emailVerified) {
        // Mark this as an unverified attempt to avoid repeated Firebase calls
        markUnverifiedAttempt(email)
        // Sign out immediately to prevent any session creation
        await signOut(auth as Auth)
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      
      // Clear any previous unverified attempt markers on successful login
      try {
        localStorage.removeItem(`unverified_attempt_${email}`)
      } catch {
        // Ignore localStorage errors
      }
      
      // Record successful login only if email is verified
      securityService.recordLoginAttempt(email, true, ipAddress)
      securityService.generateAuditLog('LOGIN_SUCCESS', email, true)
    } catch (error) {
      // Record failed login attempt
      securityService.recordLoginAttempt(email, false, ipAddress)
      
      // Handle email verification error specifically
      if (error instanceof Error && error.message === 'EMAIL_NOT_VERIFIED') {
        securityService.generateAuditLog('LOGIN_FAILED_EMAIL_NOT_VERIFIED', email, false)
        throw new Error('EMAIL_NOT_VERIFIED')
      }
      
      // Handle other Firebase auth errors
      const authError = error as AuthError
      securityService.generateAuditLog('LOGIN_FAILED', email, false, { error: authError.code })
      throw new Error(getErrorMessage(authError))
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

  async function updateUserProfile(firstName: string, lastName: string): Promise<void> {
    if (!auth || !currentUser) {
      throw new Error('User not authenticated')
    }
    try {
      const displayName = `${firstName} ${lastName}`.trim()
      await updateProfile(currentUser, {
        displayName: displayName
      })
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function checkEmailVerificationStatus(email: string): Promise<boolean> {
    if (!auth) {
      return false
    }
    
    try {
      // Check if email exists first
      const signInMethods = await fetchSignInMethodsForEmail(auth as Auth, email)
      if (signInMethods.length === 0) {
        return false // Email doesn't exist
      }
      
      // For existing emails, we need to attempt a minimal auth to check verification
      // This is a limitation of Firebase - we can't check verification without auth
      // But we can optimize by using a temporary approach
      return false // Will be checked during actual login
    } catch (error) {
      console.warn('Error checking email verification status:', error)
      return false
    }
  }

  async function signInWithGoogle(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      await signInWithPopup(auth as Auth, googleProvider)
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function signInWithFacebook(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      await signInWithPopup(auth as Auth, facebookProvider)
    } catch (error) {
      throw new Error(getErrorMessage(error as AuthError))
    }
  }

  async function signInWithApple(): Promise<void> {
    if (!auth) {
      throw new Error('Firebase auth not initialized')
    }
    try {
      await signInWithPopup(auth as Auth, appleProvider)
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
    updateUserProfile,
    checkEmailVerificationStatus,
    signInWithGoogle,
    signInWithFacebook,
    signInWithApple,
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