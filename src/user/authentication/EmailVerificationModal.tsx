import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { useModalStore } from '../../stores/modalStore'
import { X, Mail, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'

const EmailVerificationModal = () => {
  const [isResending, setIsResending] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const { currentUser } = useAuth()
  const { openLoginModal } = useModalStore()

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  const handleResendVerification = async () => {
    if (!currentUser) return
    
    setIsResending(true)
    try {
      // Placeholder for email verification
      toast.success('Verification email sent! Please check your inbox.')
      setCountdown(60) // 60 second cooldown
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send verification email')
    } finally {
      setIsResending(false)
    }
  }

  const handleClose = () => {
    // Close modal
  }

  const handleLoginClick = () => {
    // Close modal
    openLoginModal()
  }

  // Always show for demo purposes

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-orange-500 uppercase tracking-wide">Verify Your Email</h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
              <Mail className="h-8 w-8 text-orange-500" />
            </div>
            
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Check Your Email
            </h3>
            
            <p className="text-gray-600 mb-4">
              We've sent a verification link to:
            </p>
            
            <p className="font-medium text-orange-500 mb-4">
              {currentUser?.email}
            </p>
            
            <p className="text-sm text-gray-600 mb-6">
              Click the link in the email to verify your account and complete your registration.
            </p>
          </div>

          <div className="space-y-4">
            {/* Resend Button */}
            <button
              onClick={handleResendVerification}
              disabled={isResending || countdown > 0}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            >
              {isResending ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : countdown > 0 ? (
                `Resend in ${countdown}s`
              ) : (
                'Resend Verification Email'
              )}
            </button>

            {/* Login Button */}
            <button
              onClick={handleLoginClick}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide"
            >
              Back to Login
            </button>
          </div>

          {/* Help Text */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-blue-500 mt-0.5 mr-2 flex-shrink-0" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">Can't find the email?</p>
                <ul className="text-xs space-y-1">
                  <li>• Check your spam/junk folder</li>
                  <li>• Make sure you entered the correct email address</li>
                  <li>• Wait a few minutes for the email to arrive</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default EmailVerificationModal
