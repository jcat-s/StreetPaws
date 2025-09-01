import { useForm } from 'react-hook-form'
import toast from 'react-hot-toast'

interface DonationData {
  name: string
  email: string
  phone?: string
  amount: number
  donationType: string
  paymentMethod: string
  message?: string
  consent?: boolean
}

const DonationForm = () => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm<DonationData>()

  const onSubmit = async (data: DonationData) => {
    console.log('donation payload', data)
    await new Promise(res => setTimeout(res, 800))
    toast.success('Thank you for your donation!')
    reset()
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8">
      <div className="w-full max-w-4xl bg-orange-50 rounded-xl shadow-lg border border-orange-200 p-8">
        <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">Donate Online</h1>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
              <input {...register('name', { required: 'Name is required' })} type="text" className="input-field" placeholder="e.g., Ana Santos" />
              {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
              <input {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email' } })} type="email" className="input-field" placeholder="e.g., ana@email.com" />
              {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input {...register('phone', { validate: v => !v || /^\d+$/.test(v) || 'Numbers only' })} type="tel" className="input-field" placeholder="e.g., 09123456789" onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
              {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Amount (PHP) *</label>
              <input {...register('amount', { required: 'Amount is required', valueAsNumber: true, validate: v => v > 0 || 'Amount must be greater than 0' })} type="number" step="0.01" className="input-field" placeholder="e.g., 500.00" />
              {errors.amount && <p className="text-sm text-red-600">{errors.amount.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Donation Type</label>
              <select {...register('donationType')} className="input-field">
                <option value="one-time">One-time</option>
                <option value="monthly">Monthly</option>
                <option value="supplies">Supplies</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
              <select {...register('paymentMethod')} className="input-field">
                <option value="bank">Bank Transfer</option>
                <option value="gcash">GCash</option>
                <option value="cash">Cash / In-person</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
            <textarea {...register('message')} className="input-field" placeholder="Optional message (e.g., dedicate to someone)" rows={3} />
          </div>

          <div className="flex items-start space-x-2">
            <input type="checkbox" {...register('consent', { required: 'Please agree to proceed' })} />
            <label className="text-sm">I agree to be contacted regarding this donation.</label>
          </div>

          <button type="submit" className="btn-primary w-full mt-4">Donate</button>
        </form>
      </div>
    </div>
  )
}

export default DonationForm