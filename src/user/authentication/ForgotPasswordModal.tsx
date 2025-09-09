import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { useModalStore } from '../../stores/modalStore'
import { X, ArrowLeft, Mail, Clock, CheckCircle, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface ForgotPasswordFormData {
  email: string
}

const ForgotPasswordModal = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [attempts, setAttempts] = useState(0)
  const { resetPassword } = useAuth()
  const { isForgotPasswordModalOpen, closeForgotPasswordModal, openLoginModal, closeAllModals } = useModalStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues,
    reset
  } = useForm<ForgotPasswordFormData>()

  // Reset form when modal opens
  useEffect(() => {
    if (isForgotPasswordModalOpen) {
      setEmailSent(false)
      setResendCooldown(0)
      setAttempts(0)
      reset()
    }
  }, [isForgotPasswordModalOpen, reset])

  // Cooldown timer for resend
  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown(resendCooldown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [resendCooldown])

  const onSubmit = async (data: ForgotPasswordFormData) => {
    // Rate limiting protection
    if (attempts >= 3) {
      toast.error('Too many attempts. Please wait before trying again.')
      return
    }

    setIsLoading(true)
    try {
      await resetPassword(data.email)
      setEmailSent(true)
      setResendCooldown(60) // 60 second cooldown
      toast.success('Password reset email sent! Check your inbox and spam folder.')
    } catch (error) {
      setAttempts(prev => prev + 1)
      const errorMessage = error instanceof Error ? error.message : 'Failed to send reset email'
      toast.error(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    closeAllModals()
    openLoginModal()
  }

  const handleResendEmail = async () => {
    const email = getValues('email')
    if (!email) return
    
    if (resendCooldown > 0) {
      toast.error(`Please wait ${resendCooldown} seconds before resending`)
      return
    }
    
    setIsLoading(true)
    try {
      await resetPassword(email)
      setResendCooldown(60) // 60 second cooldown
      toast.success('Password reset email sent again!')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isForgotPasswordModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center">
              <button
                onClick={handleBackToLogin}
                className="mr-3 text-gray-400 hover:text-gray-600 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h2 className="text-2xl font-bold text-orange-500 uppercase tracking-wide">
                Reset Password
              </h2>
            </div>
            <button
              onClick={closeForgotPasswordModal}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {!emailSent ? (
            <>
              {/* Instructions */}
              <div className="mb-6">
                <div className="flex items-start space-x-3 mb-4">
                  <div className="flex-shrink-0">
                    <AlertTriangle className="h-5 w-5 text-orange-500 mt-0.5" />
                  </div>
                  <div>
                    <p className="text-gray-700 text-sm font-medium">
                      Forgot your password?
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      No worries! Enter your email address and we'll send you a secure link to reset your password.
                    </p>
                  </div>
                </div>
                
                {attempts > 0 && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <p className="text-yellow-800 text-xs">
                      <strong>Note:</strong> {3 - attempts} attempts remaining. If you continue to have issues, please contact support.
                    </p>
                  </div>
                )}
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                {/* Email Field */}
                <div>
                  <input
                    {...register('email', {
                      required: 'Email is required',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: 'Invalid email address'
                      }
                    })}
                    type="email"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                    placeholder="Enter your email address"
                  />
                  {errors.email && (
                    <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading || attempts >= 3}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Sending...
                    </div>
                  ) : attempts >= 3 ? 'Too Many Attempts' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-6">
                  <CheckCircle className="h-8 w-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Check Your Email
                </h3>
                <p className="text-sm text-gray-600 mb-2">
                  We've sent a password reset link to:
                </p>
                <p className="text-sm font-medium text-orange-600 mb-6">
                  {getValues('email')}
                </p>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-2">
                    <Mail className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
                    <div className="text-left">
                      <p className="text-blue-800 text-xs font-medium mb-1">What's next?</p>
                      <ul className="text-blue-700 text-xs space-y-1">
                        <li>• Check your inbox and spam folder</li>
                        <li>• Click the reset link in the email</li>
                        <li>• Create a new strong password</li>
                        <li>• The link expires in 1 hour</li>
                      </ul>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading || resendCooldown > 0}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                  >
                    {isLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
                        Sending...
                      </>
                    ) : resendCooldown > 0 ? (
                      <>
                        <Clock className="h-4 w-4 mr-2" />
                        Resend in {resendCooldown}s
                      </>
                    ) : (
                      'Resend Email'
                    )}
                  </button>
                  
                  <button
                    onClick={handleBackToLogin}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-4 rounded-lg transition-colors duration-200"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ForgotPasswordModal
