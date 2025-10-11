import { useState, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { Camera, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { submitReport } from '../../utils/reportService'
import LocationPicker from '../../components/LocationPicker'

interface FoundAnimalFormData {
    animalType: string
    animalName: string
    breed: string
    colors: string
    estimatedAge: string
    gender: string
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
    const fileInputRef = useRef<HTMLInputElement | null>(null)
    const { currentUser } = useAuth()
    const [uploadedImage, setUploadedImage] = useState<File | null>(null)
    const [imagePreview, setImagePreview] = useState<string | null>(null)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FoundAnimalFormData>()
    const [selectedLocation, setSelectedLocation] = useState<{ lat: number; lon: number; address: string }>({
        lat: 0,
        lon: 0,
        address: ''
    })
    const today = new Date()
    const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    const nowTimeStr = new Date().toTimeString().slice(0,5)
    const selectedDate = watch('foundDate')
    const maxTime = selectedDate === todayStr ? nowTimeStr : '23:59'

    const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0]
        if (file) {
            if (file.size > 50 * 1024 * 1024) { toast.error('File size must be less than 50MB'); return }
            if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('Please upload a JPEG or PNG file'); return }
            setUploadedImage(file)
            const reader = new FileReader(); reader.onload = (e) => setImagePreview(e.target?.result as string); reader.readAsDataURL(file)
        }
    }

    const handleDrop = (event: React.DragEvent<HTMLDivElement>) => {
        event.preventDefault(); event.stopPropagation()
        const file = event.dataTransfer.files?.[0]
        if (!file) return
        if (file.size > 50 * 1024 * 1024) { toast.error('File size must be less than 50MB'); return }
        if (!['image/jpeg', 'image/png'].includes(file.type)) { toast.error('Please upload a JPEG or PNG file'); return }
        setUploadedImage(file)
        const reader = new FileReader(); reader.onload = (e) => setImagePreview(e.target?.result as string); reader.readAsDataURL(file)
    }

    const preventDragDefaults = (event: React.DragEvent<HTMLDivElement>) => { event.preventDefault(); event.stopPropagation() }

    const removeImage = () => { setUploadedImage(null); setImagePreview(null) }

    const validatePhoneNumber = (value: string) => /^\d+$/.test(value) || 'Please enter numbers only'
    
    const validateLipaLocation = (value: string) => {
        if (!value) return 'Location is required'
        const locationLower = value.toLowerCase()
        if (!locationLower.includes('lipa')) {
            return 'Sorry, the scope of our service is limited to Lipa City only. Please select a location within Lipa City.'
        }
        return true
    }

    const onSubmit = async (data: FoundAnimalFormData) => {
        const locationToValidate = selectedLocation.address || data.foundLocation
        const locationValidation = validateLipaLocation(locationToValidate)
        
        if (locationValidation !== true) {
            toast.error(locationValidation)
            return
        }
        
        setIsSubmitting(true)
        try {
            await submitReport(
                {
                    type: 'found',
                    animalType: data.animalType,
                    animalName: data.animalName,
                    breed: data.breed,
                    colors: data.colors,
                    estimatedAge: data.estimatedAge,
                    gender: data.gender,
                    foundLocation: locationToValidate,
                    foundDate: data.foundDate,
                    foundTime: data.foundTime,
                    contactName: data.contactName,
                    contactPhone: data.contactPhone,
                    contactEmail: data.contactEmail,
                    additionalDetails: data.additionalDetails
                },
                uploadedImage,
                currentUser ? currentUser.uid : null
            )
            toast.success('Found report submitted')
            reset(); setUploadedImage(null); setImagePreview(null); setSelectedLocation({ lat: 0, lon: 0, address: '' })
            navigate('/lost-and-found?submitted=1')
        } catch (e: any) { 
            console.error('Report submission error:', e)
            const errorMessage = e?.message || e?.error?.message || 'Failed to submit report'
            toast.error(errorMessage)
        } finally { setIsSubmitting(false) }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center py-8">
            <div className="w-full max-w-4xl bg-orange-50 rounded-xl shadow-lg border border-orange-200 p-8">
                <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">Found Animal Report</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type *</label>
                            <select {...register('animalType', { required: 'Animal type is required' })} className="input-field" defaultValue="">
                                <option value="" disabled hidden>Select animal type</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                            </select>
                            {errors.animalType && <p className="mt-1 text-sm text-red-600">{errors.animalType.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Pet's Name (Optional)</label>
                            <input {...register('animalName')} className="input-field" placeholder="e.g., Mingming" />
                            {/* Remove required validation and error message */}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Breed *</label>
                            <input {...register('breed', { required: 'Breed is required' })} className="input-field" placeholder="e.g., Labrador" />
                            {errors.breed && <p className="mt-1 text-sm text-red-600">{errors.breed.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Colors *</label>
                            <input {...register('colors', { required: 'Colors are required' })} className="input-field" placeholder="e.g., Brown and white" />
                            {errors.colors && <p className="mt-1 text-sm text-red-600">{errors.colors.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1"> Estimated Age *</label>
                            <input {...register('estimatedAge', { required: 'Age is required' })} className="input-field" placeholder="e.g., 2-3 years old" />
                            {errors.estimatedAge && <p className="mt-1 text-sm text-red-600">{errors.estimatedAge.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                            <select {...register('gender', { required: 'Gender is required' })} className="input-field" defaultValue="">
                                <option value="" disabled hidden>Select gender</option>
                                <option value="male">Male</option>
                                <option value="female">Female</option>
                            </select>
                            {errors.gender && <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <LocationPicker
                                label="Found Location"
                                value={selectedLocation.address}
                                onChange={(location) => {
                                    setSelectedLocation(location)
                                    // Trigger validation when location changes
                                    setValue('foundLocation', location.address, { shouldValidate: true })
                                }}
                                placeholder="e.g., Barangay 1, Lipa City, Batangas"
                                required
                                error={errors.foundLocation?.message}
                            />
                            <input type="hidden" {...register('foundLocation', { 
                                required: 'Found location is required',
                                validate: validateLipaLocation
                            })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Found Date *</label>
                            <input {...register('foundDate', { required: 'Found date is required', validate: (v) => v <= todayStr || 'Date cannot be in the future', onChange: (e) => { const v = (e.target as HTMLInputElement).value; if (v > todayStr) { (e.target as HTMLInputElement).value = todayStr; setValue('foundDate', todayStr, { shouldValidate: true }); toast.error('Date cannot be in the future') } } })} type="date" className="input-field" max={todayStr} />
                            {errors.foundDate && <p className="mt-1 text-sm text-red-600">{errors.foundDate.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Found Time *</label>
                            <input {...register('foundTime', { required: 'Found time is required', validate: (v) => { if (selectedDate === todayStr) { return v <= nowTimeStr || 'Time cannot be in the future' } return true } })} type="time" className="input-field" max={maxTime} />
                            {errors.foundTime && <p className="mt-1 text-sm text-red-600">{errors.foundTime.message}</p>}
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                            <input {...register('contactName', { required: 'Contact name is required' })} className="input-field" placeholder="Your full name" />
                            {errors.contactName && <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                            <input {...register('contactPhone', { required: 'Contact phone is required', validate: validatePhoneNumber })} type="tel" inputMode="numeric" pattern="[0-9]*" className="input-field" placeholder="Your phone number" onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
                            {errors.contactPhone && <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message as string}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                            <input {...register('contactEmail', { required: 'Contact email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} type="email" className="input-field" placeholder="Your email address" />
                            {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message as string}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                        <textarea {...register('additionalDetails')} rows={4} className="input-field" placeholder="Any additional information about the animal or circumstances..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Animal Photo *</label>
                        <div
                            className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg"
                            onDrop={handleDrop}
                            onDragOver={preventDragDefaults}
                            onDragEnter={preventDragDefaults}
                            onClick={() => { if (!imagePreview) fileInputRef.current?.click() }}
                        >
                            {!imagePreview ? (
                                <div className="space-y-1 text-center">
                                    <Camera className="mx-auto h-12 w-12 text-gray-400" />
                                    <div className="flex text-sm text-gray-600"><label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium"><span>Upload a file</span><input ref={fileInputRef} id="image-upload" name="image-upload" type="file" className="sr-only" accept="image/jpeg,image/png" onChange={handleImageUpload} /></label><p className="pl-1">or drag and drop</p></div>
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
