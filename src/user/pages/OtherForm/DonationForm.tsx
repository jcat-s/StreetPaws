import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'

// Import actual QR code images
import GCashQR from '../../../assets/images/QR/gcash.png'
import MayaQR from '../../../assets/images/QR/maya.png'

interface DonationData {
  name: string
  email: string
  phone?: string
  amount: number
  paymentMethod: string
  reference?: string
  message?: string
  consent?: boolean
  isAnonymous?: boolean
}

const DonationForm = () => {
  const { currentUser } = useAuth()
  const { register, handleSubmit, watch, formState: { errors }, reset, setValue } = useForm<DonationData>({
    defaultValues: {
      paymentMethod: "", // 👈 force dropdown to start empty
      isAnonymous: false,
    }
  })

  const paymentMethod = watch('paymentMethod')
  const isAnonymous = watch('isAnonymous')

  const onSubmit = async (data: DonationData) => {
    try {
      if (!db) throw new Error('Firestore not initialized')
      await addDoc(collection(db, 'donations'), {
        name: data.isAnonymous ? 'Anonymous' : data.name,
        email: data.email,
        phone: data.phone || null,
        amount: Number(data.amount),
        paymentMethod: data.paymentMethod,
        reference: data.reference || null,
        message: data.message || null,
        isAnonymous: !!data.isAnonymous,
        consent: !!data.consent,
        status: 'pending',
        userId: currentUser?.uid || null, // Capture user ID for notifications
        createdAt: serverTimestamp()
      })
      toast.success('🙏 Thank you for your donation! We will verify your payment.')
      reset()
    } catch (e) {
      toast.error('Failed to submit donation. Please try again.')
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8">
      <div className="w-full max-w-4xl bg-orange-50 rounded-xl shadow-lg border border-orange-200 p-8">
        <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">
          Donate Online
        </h1>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

          {/* Donor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name {isAnonymous ? '' : '*'}</label>
              <input
                {...register('name', { required: isAnonymous ? false : 'Name is required' })}
                type="text"
                className="input-field"
                placeholder={isAnonymous ? 'Anonymous' : 'e.g., Maria Santos'}
                disabled={isAnonymous}
              />
              {!isAnonymous && errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input
                {...register('email', {
                  required: 'Email is required',
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: 'Invalid email',
                  },
                })}
                type="email"
                className="input-field"
                placeholder="e.g., maria@email.com"
              />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone (optional)</label>
              <input
                {...register('phone', {
                  validate: (v) => !v || /^\d+$/.test(v) || 'Numbers only',
                })}
                type="tel"
                className="input-field"
                placeholder="e.g., 09123456789"
              />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount (PHP) *
              </label>
              <input
                {...register('amount', {
                  required: 'Amount is required',
                  valueAsNumber: true,
                  validate: (v) =>
                    v >= 20 && v <= 999999 || 'Amount must be ₱20 or more',
                })}
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={6}
                className="input-field"
                placeholder="e.g., 100"
                onInput={(e) => {
                  const target = e.target as HTMLInputElement
                  target.value = target.value.replace(/\D/g, '')
                }}
              />
              {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
            </div>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Payment Method *
            </label>
            <select
              {...register('paymentMethod', { required: 'Payment method is required' })}
              className="input-field"
            >
              <option value="" disabled>Select a method</option>
              <option value="gcash">GCash</option>
              <option value="maya">Maya</option>
            </select>
            {errors.paymentMethod && (
              <p className="text-sm text-red-600">{errors.paymentMethod.message}</p>
            )}
          </div>

          {/* Donate Anonymously */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              {...register('isAnonymous')}
              onChange={(e) => {
                const checked = e.target.checked
                setValue('isAnonymous', checked)
                if (checked) {
                  setValue('name', 'Anonymous')
                } else {
                  setValue('name', '')
                }
              }}
            />
            <label className="text-sm">Donate anonymously (your name will appear as "Anonymous").</label>
          </div>

          {/* QR Codes */}
          {paymentMethod && (
            <div className="flex justify-center gap-4 mt-4">
              {paymentMethod === "gcash" && (
                <img src={GCashQR} alt="GCash QR" className="w-96 h-96" />
              )}
              {paymentMethod === "maya" && (
                <img src={MayaQR} alt="Maya QR" className="w-96 h-96" />
              )}
            </div>
          )}

          {/* Reference Number */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reference No. * (required for online payments)
            </label>
            <input
              {...register('reference', {
                validate: (v) => {
                  if (
                    ['gcash', 'maya', 'bank'].includes(paymentMethod) &&
                    (!v || v.trim() === '')
                  ) {
                    return 'Reference number is required for digital payments'
                  }
                  return true
                },
              })}
              type="text"
              className="input-field"
              placeholder="Enter transaction reference no."
            />
            {errors.reference && (
              <p className="text-sm text-red-600">{errors.reference.message}</p>
            )}
          </div>

          {/* Optional Message */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message (optional)</label>
            <textarea
              {...register('message')}
              className="input-field"
              placeholder="Optional message (e.g., dedicate to someone)"
              rows={3}
            />
          </div>

          {/* Consent */}
          <div className="flex items-start space-x-2">
            <input
              type="checkbox"
              {...register('consent', { required: 'Please agree to proceed' })}
            />
            <label className="text-sm">I agree to be contacted regarding this donation.</label>
          </div>
          {errors.consent && <p className="text-sm text-red-600">{errors.consent.message}</p>}

          {/* Submit */}
          <button type="submit" className="btn-primary w-full mt-4">Donate</button>
        </form>
      </div>
    </div>
  )
}

export default DonationForm
