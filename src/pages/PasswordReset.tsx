import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import PasswordResetModal from '../components/PasswordResetModal'
import { Loader2, AlertCircle } from 'lucide-react'

const PasswordReset = () => {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { verifyPasswordResetCode } = useAuth()
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)
  const [resetCode, setResetCode] = useState<string | null>(null)

  useEffect(() => {
    const code = searchParams.get('oobCode')

    // Handle both direct links and Firebase action links
    if (!code) {
      setError('Invalid password reset link - missing reset code')
      setIsLoading(false)
      return
    }

    const verifyCode = async () => {
      try {
        const email = await verifyPasswordResetCode(code)
        setEmail(email)
        setResetCode(code)
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Invalid or expired reset link')
      } finally {
        setIsLoading(false)
      }
    }

    verifyCode()
  }, [searchParams, verifyPasswordResetCode])

  const handleClose = () => {
    navigate('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-4" />
          <p className="text-gray-600">Verifying reset link...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-900 mb-2">Reset Link Invalid</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-2 px-6 rounded-lg transition-colors duration-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    )
  }

  if (email && resetCode) {
    return (
      <PasswordResetModal
        resetCode={resetCode}
        email={email}
        onClose={handleClose}
      />
    )
  }

  return null
}

export default PasswordReset
