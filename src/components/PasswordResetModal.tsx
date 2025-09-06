import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth, validatePasswordStrength } from '../contexts/AuthContext'
import { X, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

interface PasswordResetFormData {
  newPassword: string
  confirmPassword: string
}

interface PasswordResetModalProps {
  resetCode: string
  email: string
  onClose: () => void
}

const PasswordResetModal = ({ resetCode, email, onClose }: PasswordResetModalProps) => {
  const [showPasswords, setShowPasswords] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, message: '' })
  const { confirmPasswordReset } = useAuth()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<PasswordResetFormData>()

  const newPassword = watch('newPassword')

  // Check password strength in real-time
  useEffect(() => {
    if (newPassword) {
      setPasswordStrength(validatePasswordStrength(newPassword))
    } else {
      setPasswordStrength({ isValid: false, message: '' })
    }
  }, [newPassword])

  const onSubmit = async (data: PasswordResetFormData) => {
    if (!passwordStrength.isValid) {
      toast.error(passwordStrength.message)
      return
    }

    setIsLoading(true)
    try {
      await confirmPasswordReset(resetCode, data.newPassword)
      toast.success('Password reset successfully! Redirecting to login...')
      onClose()
      reset()
      // Redirect to home page where user can login
      setTimeout(() => {
        window.location.href = '/'
      }, 2000)
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to reset password')
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (!newPassword) return 'text-gray-400'
    if (passwordStrength.isValid) return 'text-green-600'
    return 'text-red-600'
  }

  const getPasswordStrengthIcon = () => {
    if (!newPassword) return null
    if (passwordStrength.isValid) return <CheckCircle className="h-4 w-4" />
    return <AlertCircle className="h-4 w-4" />
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-orange-500 uppercase tracking-wide">
              Set New Password
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Instructions */}
          <div className="mb-6">
            <p className="text-gray-600 text-sm mb-2">
              Enter a new password for <strong>{email}</strong>
            </p>
            <p className="text-gray-500 text-xs">
              Your password must be strong and secure.
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* New Password Field */}
            <div>
              <div className="relative">
                <input
                  {...register('newPassword', {
                    required: 'New password is required',
                    validate: (value) => {
                      const strength = validatePasswordStrength(value)
                      return strength.isValid || strength.message
                    }
                  })}
                  type={showPasswords ? 'text' : 'password'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              
              {/* Password Strength Indicator */}
              {newPassword && (
                <div className={`mt-2 flex items-center text-sm ${getPasswordStrengthColor()}`}>
                  {getPasswordStrengthIcon()}
                  <span className="ml-1">{passwordStrength.message}</span>
                </div>
              )}
              
              {errors.newPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.newPassword.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match'
                })}
                type={showPasswords ? 'text' : 'password'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                placeholder="Confirm new password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Password Requirements */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <p className="text-xs text-gray-600 font-medium mb-2">Password Requirements:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                <li className={`flex items-center ${newPassword && newPassword.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">•</span>
                  At least 8 characters
                </li>
                <li className={`flex items-center ${newPassword && /(?=.*[a-z])/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">•</span>
                  One lowercase letter
                </li>
                <li className={`flex items-center ${newPassword && /(?=.*[A-Z])/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">•</span>
                  One uppercase letter
                </li>
                <li className={`flex items-center ${newPassword && /(?=.*\d)/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">•</span>
                  One number
                </li>
                <li className={`flex items-center ${newPassword && /(?=.*[@$!%*?&])/.test(newPassword) ? 'text-green-600' : 'text-gray-500'}`}>
                  <span className="mr-2">•</span>
                  One special character (@$!%*?&)
                </li>
              </ul>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !passwordStrength.isValid}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Resetting Password...' : 'Reset Password'}
            </button>

            {/* Back to Login Button */}
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
            >
              Back to Login
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default PasswordResetModal
