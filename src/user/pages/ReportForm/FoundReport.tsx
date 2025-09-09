import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

interface FoundAnimalFormData {
    animalType: string
    breed: string
    colors: string
    estimatedAge: string
    gender: string
    size: string
    wearing: string
    condition: string
    foundLocation: string
    foundDate: string
    foundTime: string
    contactName: string
    contactPhone: string
    contactEmail: string
    additionalDetails: string
}

const FoundReport = () => {
    const navigate = useNavigate()
    const [uploadedImage, setUploadedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { register, handleSubmit, reset, setValue, watch } = useForm<FoundAnimalFormData>()
    const [isBarangayOpen, setIsBarangayOpen] = useState(false)
    const selectedBarangay = watch('foundLocation')

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.size > 50 * 1024 * 1024) { toast.error('File size must be less than 50MB'); return }
            if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('Please upload a JPEG or PNG file'); return }
            setUploadedImage(file)
            const reader = new FileReader(); reader.onload = (e) => setImagePreview(e.target?.result as string); reader.readAsDataURL(file)
        }
    }

    const removeImage = () => { setUploadedImage(null); setImagePreview(null) }

    const barangays = ['Adya', 'Anilao', 'Antipolo del Norte', 'Antipolo del Sur', 'Bagong Pook', 'Balintawak', 'Banaybanay', 'Banaybanay I', 'Banaybanay II', 'Bangcal', 'Bolbok', 'Bugtong na Pulo', 'Bulacnin', 'Bulaklakan', 'Calamias', 'Candating', 'Dagatan', 'Dela Paz', 'Dela Paz Proper', 'Halang', 'Inosluban', 'Kayumanggi', 'Latag', 'Lodlod', 'Lumbang', 'Mabini', 'Malagonlong', 'Malitlit', 'Marawoy', 'Munting Pulo', 'Pangao', 'Pinagkawitan', 'Pinagtongulan', 'Plaridel', 'Quiling', 'Rizal', 'Sabang', 'Sampaguita', 'San Benildo', 'San Carlos', 'San Celestino', 'San Francisco', 'San Francisco (Burol)', 'San Guillermo', 'San Jose', 'San Lucas', 'San Salvador', 'San Sebastian', 'San Vicente', 'Sapac', 'Sico 1', 'Sico 2', 'Sto. Niño', 'Tambo', 'Tangob', 'Tanguile', 'Tibig', 'Tico', 'Tipacan', 'Tuyo', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'San Isidro', 'San Nicolas', 'Barangay San Miguel']

    const validatePhoneNumber = (value: string) => /^\d+$/.test(value) || 'Please enter numbers only'

    const onSubmit = async (data: FoundAnimalFormData) => {
        setIsSubmitting(true)
        try {
            console.log('found report', data, uploadedImage)
            await new Promise(r => setTimeout(r, 800))
            toast.success('Found report submitted')
            reset(); setUploadedImage(null); setImagePreview(null)
            navigate(-1)
        } catch (e) { toast.error('Failed to submit report') } finally { setIsSubmitting(false) }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center py-8">
            <div className="w-full max-w-4xl bg-orange-50 rounded-xl shadow-lg border border-orange-200 p-8">
                <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">Found Animal Report</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type *</label>
                            <select {...register('animalType', { required: 'Animal type is required' })} className="input-field" defaultValue=""><option value="" disabled hidden>Select animal type</option><option value="dog">Dog</option><option value="cat">Cat</option></select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
                            <input {...register('breed', { required: 'Breed is required' })} className="input-field" placeholder="e.g., Labrador" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Colors *</label>
                            <input {...register('colors', { required: 'Colors are required' })} className="input-field" placeholder="e.g., Brown and white" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Estimated Age *</label>
                            <input {...register('estimatedAge', { required: 'Estimated age is required' })} className="input-field" placeholder="e.g., 2-3 years old" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                            <select {...register('gender', { required: 'Gender is required' })} className="input-field" defaultValue=""><option value="" disabled hidden>Select gender</option><option value="male">Male</option><option value="female">Female</option><option value="unknown">Unknown</option></select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Size *</label>
                            <select {...register('size', { required: 'Size is required' })} className="input-field" defaultValue=""><option value="" disabled hidden>Select size</option><option value="small">Small</option><option value="medium">Medium</option><option value="large">Large</option></select>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Found Location *</label>
                            <input type="hidden" {...register('foundLocation', { required: 'Found location is required' })} />
                            <div className="relative">
                                <button type="button" onClick={() => setIsBarangayOpen(!isBarangayOpen)} className="input-field text-left">{selectedBarangay || 'Select barangay'}</button>
                                {isBarangayOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-48 overflow-y-auto">{barangays.map(b => (<button key={b} type="button" onClick={() => { setValue('foundLocation', b, { shouldValidate: true }); setIsBarangayOpen(false); }} className={`w-full text-left px-4 py-2 hover:bg-orange-50 ${selectedBarangay === b ? 'bg-orange-100' : ''}`}>{b}</button>))}</div>
                                )}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Found Date *</label>
                            <input {...register('foundDate', { required: 'Found date is required' })} type="date" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Found Time *</label>
                            <input {...register('foundTime', { required: 'Found time is required' })} type="time" className="input-field" />
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                            <input {...register('contactName', { required: 'Contact name is required' })} className="input-field" placeholder="Your full name" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                            <input {...register('contactPhone', { required: 'Contact phone is required', validate: validatePhoneNumber })} type="tel" inputMode="numeric" pattern="[0-9]*" className="input-field" placeholder="Your phone number" onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                            <input {...register('contactEmail', { required: 'Contact email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} type="email" className="input-field" placeholder="Your email address" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                        <textarea {...register('additionalDetails')} rows={4} className="input-field" placeholder="Any additional information about the animal or circumstances..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Animal Photo *</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                            {!imagePreview ? (
                                <div className="space-y-1 text-center">
                                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600"><label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium"><span>Upload a file</span><input id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/jpeg,image/png" onChange={handleImageUpload} /></label><p className="pl-1">or drag and drop</p></div>
                                    <p className="text-xs text-gray-500">JPEG, PNG up to 50MB</p>
                                </div>
                            ) : (
                                <div className="relative"><img src={imagePreview} alt="Animal preview" className="h-32 w-32 object-cover rounded-lg" /><button type="button" onClick={removeImage} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="h-4 w-4" /></button></div>
                            )}
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 mt-6">
                        <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={isSubmitting || !imagePreview} className="btn-primary disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit Report'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default FoundReport
