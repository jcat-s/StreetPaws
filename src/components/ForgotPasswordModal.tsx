import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { useModalStore } from '../stores/modalStore'
import { X, ArrowLeft, Mail } from 'lucide-react'
import toast from 'react-hot-toast'

interface ForgotPasswordFormData {
  email: string
}

const ForgotPasswordModal = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const { resetPassword } = useAuth()
  const { isForgotPasswordModalOpen, closeForgotPasswordModal, openLoginModal } = useModalStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    getValues
  } = useForm<ForgotPasswordFormData>()

  const onSubmit = async (data: ForgotPasswordFormData) => {
    setIsLoading(true)
    try {
      await resetPassword(data.email)
      setEmailSent(true)
      toast.success('Password reset email sent! Check your inbox.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to send reset email')
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackToLogin = () => {
    closeForgotPasswordModal()
    openLoginModal()
  }

  const handleResendEmail = async () => {
    const email = getValues('email')
    if (!email) return
    
    setIsLoading(true)
    try {
      await resetPassword(email)
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
                <p className="text-gray-600 text-sm">
                  Enter your email address and we'll send you a link to reset your password.
                </p>
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
                  disabled={isLoading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide disabled:opacity-50"
                >
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </form>
            </>
          ) : (
            <>
              {/* Success State */}
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <Mail className="h-6 w-6 text-green-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  Check Your Email
                </h3>
                <p className="text-sm text-gray-600 mb-6">
                  We've sent a password reset link to <strong>{getValues('email')}</strong>
                </p>
                
                <div className="space-y-3">
                  <button
                    onClick={handleResendEmail}
                    disabled={isLoading}
                    className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200 disabled:opacity-50"
                  >
                    {isLoading ? 'Sending...' : 'Resend Email'}
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
