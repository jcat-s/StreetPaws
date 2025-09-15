import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth } from '../../contexts/AuthContext'
import { useModalStore } from '../../stores/modalStore'
import { X, Eye, EyeOff } from 'lucide-react'
import toast from 'react-hot-toast'

interface LoginFormData {
  email: string
  password: string
  rememberMe: boolean
}

const LoginModal = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const { login, signInWithGoogle, signInWithFacebook, signInWithApple } = useAuth()
  const { isLoginModalOpen, closeLoginModal, openSignUpModal, openForgotPasswordModal } = useModalStore()
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<LoginFormData>()

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true)
    try {
      await login(data.email, data.password)
      toast.success('Successfully logged in!')
      closeLoginModal()
      reset()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to log in. Please check your credentials.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSignUpClick = () => {
    closeLoginModal()
    openSignUpModal()
  }

  const handleForgotPasswordClick = () => {
    closeLoginModal()
    openForgotPasswordModal()
  }

  const handleGoogleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithGoogle()
      toast.success('Successfully logged in with Google!')
      closeLoginModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to log in with Google.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleFacebookLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithFacebook()
      toast.success('Successfully logged in with Facebook!')
      closeLoginModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to log in with Facebook.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleAppleLogin = async () => {
    setIsLoading(true)
    try {
      await signInWithApple()
      toast.success('Successfully logged in with Apple!')
      closeLoginModal()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to log in with Apple.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isLoginModalOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="grid md:grid-cols-5 flex-grow overflow-hidden">
          {/* Left: Login Form (3/5 width) */}
          <div className="md:col-span-3 p-6 md:p-8 overflow-y-auto">
            <div className="flex justify-between items-center mb-6 md:mb-8">
              <h2 className="text-2xl md:text-3xl font-bold text-orange-500 uppercase tracking-wide">Sign In</h2>
            <button
              onClick={closeLoginModal}
              className="text-gray-400 hover:text-gray-600"
            >
                <X className="h-5 w-5 md:h-6 md:w-6" />
            </button>
          </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 md:space-y-6">
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
            <div>
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
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                    placeholder="Password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10 bg-transparent border-none outline-none"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <label className="flex items-center">
                <input
                  {...register('rememberMe')}
                  type="checkbox"
                    className="h-4 w-4 text-orange-500 focus:ring-orange-500 border-gray-300 rounded"
                />
                  <span className="ml-2 text-sm text-gray-700">Remember me?</span>
              </label>
                <button
                  type="button"
                  onClick={handleForgotPasswordClick}
                  className="text-sm text-blue-600 hover:text-blue-500 hover:underline"
                >
                  Forgot Password?
                </button>
            </div>

            {/* Login Button */}
            <button
              type="submit"
              disabled={isLoading}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide disabled:opacity-50"
            >
              {isLoading ? 'Logging in...' : 'Login'}
            </button>

              {/* Divider */}
              <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

              {/* Third-Party Login Buttons */}
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleFacebookLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" />
                </svg>
              </button>
                <button
                  type="button"
                  className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleGoogleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
              </button>
                <button
                  type="button"
                  className="flex items-center justify-center p-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleAppleLogin}
                  disabled={isLoading}
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
                </svg>
              </button>
            </div>
            </form>

          </div>

          {/* Right: Sign Up teaser (2/5 width) */}
          <div className="md:col-span-2 bg-orange-500 text-white p-6 md:p-8 flex-shrink-0">
            <div className="sticky top-0 h-full flex items-center">
              <div className="text-center w-full">
                <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-wide">New Here?</h3>
                <p className="text-orange-100 mb-6 md:mb-8 text-sm md:text-base">Sign up and discover a great community of pet lovers!</p>
              <button
                onClick={handleSignUpClick}
                  className="bg-white text-orange-500 hover:bg-gray-100 font-bold py-2 md:py-3 px-4 md:px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide border-2 border-white text-sm md:text-base"
              >
                Sign Up
              </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LoginModal 