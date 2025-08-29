import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../contexts/AuthContext'
import { useModalStore } from '../stores/modalStore'
import { X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface SignUpFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

const SignUpModal = () => {
  const [showPasswords, setShowPasswords] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { signup } = useAuth()
  const { isSignUpModalOpen, closeSignUpModal, openLoginModal } = useModalStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    reset
  } = useForm<SignUpFormData>()

  const password = watch('password')

  const onSubmit = async (data: SignUpFormData) => {
    setIsLoading(true)
    try {
      await signup(data.email, data.password)
      toast.success('Account created successfully!')
      closeSignUpModal()
      reset()
    } catch (error) {
      toast.error('Failed to create account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginClick = () => {
    closeSignUpModal()
    openLoginModal()
  }

  if (!isSignUpModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="grid md:grid-cols-5 flex-grow overflow-hidden">
          {/* Left: Login teaser (2/5 width) */}
          <div className="md:col-span-2 bg-orange-500 text-white p-6 md:p-8 flex-shrink-0">
            <div className="sticky top-0 h-full flex items-center">
              <div className="text-center w-full">
                <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-wide">Already Have an Account?</h3>
                <p className="text-orange-100 mb-6 md:mb-8 text-sm md:text-base">Register with your personal details to use all of site features.</p>
                <button
                  onClick={handleLoginClick}
                  className="bg-white text-orange-500 hover:bg-gray-100 font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide border-2 border-white text-sm md:text-base"
                >
                  Login
                </button>
              </div>
            </div>
          </div>

          {/* Right: Sign Up Form (3/5 width) */}
          <div className="md:col-span-3 p-6 md:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-orange-500 uppercase tracking-wide">Sign Up</h2>
            <button
              onClick={closeSignUpModal}
              className="text-gray-400 hover:text-gray-600"
            >
                <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-3 md:space-y-4">
            {/* First Name Field */}
            <div>
                <input
                  {...register('firstName', {
                    required: 'First name is required'
                  })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="First Name"
                />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
              )}
            </div>

            {/* Last Name Field */}
            <div>
                <input
                  {...register('lastName', {
                    required: 'Last name is required'
                  })}
                  type="text"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Last Name"
                />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
              )}
            </div>

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
                  placeholder="Email"
                />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            {/* Password Field */}
              <div className="relative">
                <input
                  {...register('password', {
                    required: 'Password is required',
                    minLength: {
                      value: 6,
                      message: 'Password must be at least 6 characters'
                    }
                  })}
                  type={showPasswords ? 'text' : 'password'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                  placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPasswords(!showPasswords)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPasswords ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
                <input
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: value => value === password || 'Passwords do not match'
                  })}
                  type={showPasswords ? 'text' : 'password'}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                  placeholder="Confirm Password"
                />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
              )}
            </div>

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide disabled:opacity-50"
            >
              {isLoading ? 'Creating Account...' : 'Sign Up'}
            </button>

          </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SignUpModal 