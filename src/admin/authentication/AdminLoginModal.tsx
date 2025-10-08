import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { X, Eye, EyeOff, Shield } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAdminAuth } from '../hooks/useAdminAuth'
import { auth } from '../../config/firebase'
import { sendPasswordResetEmail } from 'firebase/auth'

interface AdminLoginFormData {
  email: string
  password: string
}

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
}

const AdminLoginModal = ({ isOpen, onClose }: AdminLoginModalProps) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login } = useAdminAuth()

  const { register, handleSubmit, formState: { errors }, reset, getValues } = useForm<AdminLoginFormData>()

  // Normalize input so users can type either username or full email
  const normalizeAdminEmail = (raw: string): string => {
    const trimmed = (raw || '').trim().toLowerCase()
    if (!trimmed) return ''
    if (trimmed.includes('@')) return trimmed
    return `${trimmed}@streetpaws.gov.ph`
  }

  const onSubmit = async (data: AdminLoginFormData) => {
    setIsLoading(true)
    try {
      const normalizedEmail = normalizeAdminEmail(data.email)
      await login(normalizedEmail, data.password)
      toast.success('Admin login successful!')
      reset()
      onClose()
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async () => {
    // Use the current email/username value from the form state for reliability
    const emailValue = normalizeAdminEmail(getValues('email') || '')

    if (!emailValue) {
      toast.error('Enter your admin email to reset your password.')
      return
    }

    // We no longer check a hardcoded allowlist here; Firestore rules protect data.

    if (!auth) {
      toast.error('Password reset is unavailable right now.')
      return
    }

    try {
      await sendPasswordResetEmail(auth, emailValue)
      toast.success('Password reset email sent. Check your inbox.')
    } catch (error: any) {
      const message = error?.message || 'Failed to send reset email.'
      toast.error(message)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-orange-100 p-2 rounded-lg">
              <Shield className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Admin Access</h2>
              <p className="text-sm text-gray-600">City Vet Personnel Only</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="p-6 space-y-6">

          {/* Username (Email) Field */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Username or Email
            </label>
            <input
              {...register('email', {
                required: 'Username or email is required'
              })}
              type="text"
              id="email"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
              placeholder="Username (e.g., admin) or full email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <input
                {...register('password', {
                  required: 'Password is required',
                  minLength: {
                    value: 6,
                    message: 'Password must be at least 6 characters'
                  }
                })}
                type={showPassword ? 'text' : 'password'}
                id="password"
                className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors"
                placeholder="Enter your password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && (
              <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
            )}
            <div className="mt-2 text-right">
              <button type="button" onClick={handleForgotPassword} className="text-sm text-orange-600 hover:text-orange-700 font-medium">
                Forgot Password?
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 text-white font-medium py-3 px-4 rounded-lg transition-colors flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Signing In...</span>
              </>
            ) : (
              <>
                <Shield className="h-5 w-5" />
                <span>Log In</span>
              </>
            )}
          </button>
        </form>

        {/* Footer (kept minimal per target design) */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl"></div>
      </div>
    </div>
  )
}

export default AdminLoginModal