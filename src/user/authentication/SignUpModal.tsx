import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { useAuth, validatePasswordStrength } from '../../contexts/AuthContext'
import { useModalStore } from '../../stores/modalStore'
import { emailVerificationHelper } from '../../shared/utils/emailVerificationHelper'
import { X, Eye, EyeOff, CheckCircle, AlertCircle, Mail, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'

interface SignUpFormData {
  firstName: string
  lastName: string
  email: string
  password: string
  confirmPassword: string
}

const SignUpModal = () => {
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [passwordStrength, setPasswordStrength] = useState({ isValid: false, message: '' })
  const [showEmailVerification, setShowEmailVerification] = useState(false)
  const [signupEmail, setSignupEmail] = useState('')
  const [emailValidation, setEmailValidation] = useState({ isValid: true, message: '', warnings: [] as string[] })
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
  const email = watch('email')

  // Check password strength in real-time
  useEffect(() => {
    if (password) {
      setPasswordStrength(validatePasswordStrength(password))
    } else {
      setPasswordStrength({ isValid: false, message: '' })
    }
  }, [password])

  // Check email validation in real-time
  useEffect(() => {
    if (email) {
      const validation = emailVerificationHelper.validateEmailForSignup(email)
      setEmailValidation(validation)
    } else {
      setEmailValidation({ isValid: true, message: '', warnings: [] })
    }
  }, [email])

  const onSubmit = async (data: SignUpFormData) => {
    if (!passwordStrength.isValid) {
      toast.error(passwordStrength.message)
      return
    }
    
    if (!emailValidation.isValid) {
      toast.error(emailValidation.message)
      return
    }
    
    setIsLoading(true)
    try {
      await signup(data.email, data.password)
      // If we get here, it means email verification is required
      setSignupEmail(data.email)
      setShowEmailVerification(true)
      toast.success('Account created! Please check your email to verify your account.')
    } catch (error) {
      if (error instanceof Error && error.message === 'EMAIL_VERIFICATION_REQUIRED') {
        // This is expected - show email verification modal
        setSignupEmail(data.email)
        setShowEmailVerification(true)
        toast.success('Account created! Please check your email to verify your account.')
      } else {
        toast.error(error instanceof Error ? error.message : 'Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLoginClick = () => {
    closeSignUpModal()
    openLoginModal()
  }

  if (!isSignUpModalOpen) return null

  // Show email verification message if needed
  if (showEmailVerification) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-orange-500 uppercase tracking-wide">Verify Your Email</h2>
              <button
                onClick={() => {
                  setShowEmailVerification(false)
                  closeSignUpModal()
                }}
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
                {signupEmail}
              </p>
              
              <p className="text-sm text-gray-600 mb-6">
                Click the link in the email to verify your account and complete your registration.
              </p>
            </div>

            <div className="space-y-4">
              <button
                onClick={() => {
                  setShowEmailVerification(false)
                  closeSignUpModal()
                  openLoginModal()
                }}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide"
              >
                Continue to Login
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

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="grid md:grid-cols-5 flex-grow overflow-hidden">
          {/* Left: Login teaser (2/5 width) */}
          <div className="md:col-span-2 bg-orange-500 text-white p-6 md:p-8 flex-shrink-0">
            <div className="sticky top-0 h-full flex items-center">
              <div className="text-center w-full">
                <h3 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-wide">Already Have an Account?</h3>
                <p className="text-orange-100 mb-6 md:mb-8 text-sm md:text-base">Register with your personal details to adopt a pet that you like 🐱🐶.</p>
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
                  className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
                    email && !emailValidation.isValid 
                      ? 'border-red-300 focus:ring-red-500' 
                      : email && emailValidation.isValid 
                        ? 'border-green-300 focus:ring-green-500' 
                        : 'border-gray-300 focus:ring-orange-500'
                  }`}
                  placeholder="Email"
                />
                
                {/* Email validation feedback */}
                {email && (
                  <div className={`mt-2 flex items-center text-sm ${
                    emailValidation.isValid ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {emailValidation.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span className="ml-1">{emailValidation.message}</span>
                  </div>
                )}
                
                {/* Email warnings */}
                {email && emailValidation.warnings.length > 0 && (
                  <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="flex items-start">
                      <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5 mr-2 flex-shrink-0" />
                      <div className="text-sm text-yellow-700">
                        {emailValidation.warnings.map((warning, index) => (
                          <p key={index}>{warning}</p>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
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
                      validate: (value) => {
                        const strength = validatePasswordStrength(value)
                        return strength.isValid || strength.message
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
                
                {/* Password Strength Indicator */}
                {password && (
                  <div className={`mt-2 flex items-center text-sm ${passwordStrength.isValid ? 'text-green-600' : 'text-red-600'}`}>
                    {passwordStrength.isValid ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                    <span className="ml-1">{passwordStrength.message}</span>
                  </div>
                )}
                
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <div className="relative">
                  <input
                    {...register('confirmPassword', {
                      required: 'Please confirm your password',
                      validate: value => value === password || 'Passwords do not match'
                    })}
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent pr-12"
                    placeholder="Confirm Password"
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
              {password && (
                <div className="bg-gray-50 p-3 rounded-lg">
                  <p className="text-xs text-gray-600 font-medium mb-2">Password Requirements:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    <li className={`flex items-center ${password && password.length >= 8 ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">•</span>
                      At least 8 characters
                    </li>
                    <li className={`flex items-center ${password && /(?=.*[a-z])/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">•</span>
                      One lowercase letter
                    </li>
                    <li className={`flex items-center ${password && /(?=.*[A-Z])/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">•</span>
                      One uppercase letter
                    </li>
                    <li className={`flex items-center ${password && /(?=.*\d)/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">•</span>
                      One number
                    </li>
                    <li className={`flex items-center ${password && /(?=.*[@$!%*?&])/.test(password) ? 'text-green-600' : 'text-gray-500'}`}>
                      <span className="mr-2">•</span>
                      One special character (@$!%*?&)
                    </li>
                  </ul>
                </div>
              )}

              {/* Sign Up Button */}
              <button
                type="submit"
                disabled={isLoading || !passwordStrength.isValid || !emailValidation.isValid}
                className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 uppercase tracking-wide disabled:opacity-50 disabled:cursor-not-allowed"
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