import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth, validatePasswordStrength } from '../../contexts/AuthContext'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, CheckCircle, AlertCircle, X } from 'lucide-react'
import toast from 'react-hot-toast'

interface PasswordResetFormData {
  newPassword: string
  confirmPassword: string
}

interface PasswordResetProps {
  // Optional props for modal mode
  resetCode?: string
  email?: string
  onClose?: () => void
  isModal?: boolean
}

const PasswordReset = ({ resetCode: propResetCode, email: propEmail, onClose, isModal = false }: PasswordResetProps) => {
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, message: '' })
  const { confirmPasswordReset } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  
  // Get resetCode and email from props (modal mode) or URL params (page mode)
  const resetCode = propResetCode || searchParams.get('oobCode')
  const email = propEmail || searchParams.get('email')
  
  
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
    if (!resetCode) {
      toast.error('Invalid reset link. Please request a new password reset.')
      navigate('/')
      return
    }

    if (!passwordStrength.isValid) {
      toast.error(passwordStrength.message)
      return
    }

    setIsLoading(true)
    try {
      await confirmPasswordReset(resetCode, data.newPassword)
      toast.success('Password reset successfully! Redirecting to login...')
      reset()
      
      if (isModal && onClose) {
        onClose()
        // Redirect to home page where user can login
        setTimeout(() => {
          window.location.href = '/'
        }, 2000)
      } else {
        // Redirect to home page where user can login
        setTimeout(() => {
          navigate('/')
        }, 2000)
      }
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

  // If no reset code, show error message
  if (!resetCode) {
    const errorContent = (
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 text-center">
        <div className="mb-4">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Invalid Reset Link</h2>
          <p className="text-gray-600 mb-6">
            This password reset link is invalid or has expired. Please request a new password reset.
          </p>
        </div>
        <button
          onClick={() => isModal && onClose ? onClose() : navigate('/')}
          className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide"
        >
          Go to Home
        </button>
      </div>
    )

    if (isModal) {
      return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          {errorContent}
        </div>
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        {errorContent}
      </div>
    )
  }

  const formContent = (
    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-orange-500 uppercase tracking-wide">
            Set New Password
          </h2>
          {isModal && onClose && (
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
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
                type={showNewPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                placeholder="Enter new password"
              />
              <button
                type="button"
                onClick={() => setShowNewPassword(!showNewPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 bg-transparent border-none outline-none"
              >
                {showNewPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
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
            <div className="relative">
              <input
                {...register('confirmPassword', {
                  required: 'Please confirm your password',
                  validate: value => value === newPassword || 'Passwords do not match'
                })}
                type={showConfirmPassword ? 'text' : 'password'}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                placeholder="Confirm new password"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 bg-transparent border-none outline-none"
              >
                {showConfirmPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
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

          {/* Back Button */}
          <button
            type="button"
            onClick={() => isModal && onClose ? onClose() : navigate('/')}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium py-2 px-4 rounded-lg transition-colors duration-200"
          >
            {isModal ? 'Back to Login' : 'Back to Home'}
          </button>
        </form>
      </div>
    </div>
  )

  // Return modal or full page based on isModal prop
  if (isModal) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        {formContent}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      {formContent}
    </div>
  )
}

export default PasswordReset
