import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Upload, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { submitAbuseReport } from '../../utils/reportService'
import { LIPA_BARANGAYS } from '../../../shared/constants/barangays'
import { supabase } from '../../../config/supabase'

interface AbusedAnimalFormData {
    caseTitle: string
    animalType: string
    incidentLocation: string
    incidentDate: string
    incidentTime: string
    abuseType: string
    animalDescription: string
    perpetratorDescription: string
    witnessDetails: string
    contactName: string
    contactPhone: string
    contactEmail: string
    additionalDetails: string
}

const AbusedReport = () => {
    const navigate = useNavigate()
    const { currentUser } = useAuth()
    const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
    const [filePreviews, setFilePreviews] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)

    const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<AbusedAnimalFormData>()
    const [isBarangayOpen, setIsBarangayOpen] = useState(false)
    const [barangayQuery, setBarangayQuery] = useState("")
    const selectedBarangay = watch('incidentLocation')
    const today = new Date()
    const todayStr = new Date(today.getTime() - (today.getTimezoneOffset() * 60000)).toISOString().split('T')[0]
    const nowTimeStr = new Date().toTimeString().slice(0,5)
    const selectedIncidentDate = watch('incidentDate')
    const maxIncidentTime = selectedIncidentDate === todayStr ? nowTimeStr : '23:59'

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        files.forEach(file => {
            // Check file size - videos limited to 150MB, photos unlimited
            const isVideo = file.type.startsWith('video/')
            const maxSize = isVideo ? 150 * 1024 * 1024 : Infinity // 150MB for videos, no limit for photos
            
            if (file.size > maxSize) { 
                toast.error(`${file.name} is too large (max ${isVideo ? '150MB' : 'unlimited'} for ${isVideo ? 'videos' : 'photos'})`); 
                return 
            }
            if (!['image/jpeg', 'image/png', 'video/mp4', 'image/jpg'].includes(file.type)) { 
                toast.error(`${file.name} is not supported`); 
                return 
            }
            setUploadedFiles(prev => [...prev, file])
            const reader = new FileReader(); reader.onload = (e) => setFilePreviews(prev => [...prev, e.target?.result as string]); reader.readAsDataURL(file)
        })
    }

    const removeFile = (index: number) => { setUploadedFiles(prev => prev.filter((_, i) => i !== index)); setFilePreviews(prev => prev.filter((_, i) => i !== index)) }

    const barangays = LIPA_BARANGAYS
    const filteredBarangays = barangays.filter(b => b.toLowerCase().startsWith(barangayQuery.toLowerCase()))

    const onSubmit = async (data: AbusedAnimalFormData) => {
        if (uploadedFiles.filter(f => f.type.startsWith('image/')).length === 0) {
            toast.error('Please upload at least one evidence photo')
            return
        }
        
        // Check if Supabase is configured
        if (!supabase) {
            toast.error('Supabase not configured. Please set up VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.')
            return
        }
        
        setIsSubmitting(true)
        try {
            console.log('🚀 Submitting abuse report with files:', uploadedFiles)
            const reportData = {
                type: 'abuse' as const,
                caseTitle: data.caseTitle,
                animalType: data.animalType,
                incidentLocation: data.incidentLocation,
                incidentDate: data.incidentDate,
                incidentTime: data.incidentTime,
                abuseType: data.abuseType,
                animalDescription: data.animalDescription,
                perpetratorDescription: data.perpetratorDescription,
                witnessDetails: data.witnessDetails,
                contactName: data.contactName,
                contactPhone: data.contactPhone,
                contactEmail: data.contactEmail,
                additionalDetails: data.additionalDetails
            }
            
            console.log('📋 Report data:', reportData)
            await submitAbuseReport(reportData, uploadedFiles, currentUser?.uid || null)
            toast.success('Abuse report submitted')
            reset(); setUploadedFiles([]); setFilePreviews([])
            navigate(-1)
        } catch (e: any) { 
            console.error('Abuse report submission error:', e)
            console.error('Error details:', {
                name: e?.name,
                message: e?.message,
                code: e?.code,
                stack: e?.stack
            })
            const errorMessage = e?.message || e?.error?.message || 'Failed to submit report'
            toast.error(`Failed to submit abuse report: ${errorMessage}`)
        } finally { setIsSubmitting(false) }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center py-8">
            <div className="w-full max-w-4xl bg-orange-50 rounded-xl shadow-lg border border-orange-200 p-8">
                <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">Abused Animal Report</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Case Title *</label>
                            <input {...register('caseTitle', { required: 'Case title is required' })} className="input-field" placeholder="e.g., Stray dog tied and beaten in Barangay 12" />
                            {errors.caseTitle && <p className="mt-1 text-sm text-red-600">{errors.caseTitle.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Animal Type *</label>
                            <select {...register('animalType', { required: 'Animal type is required' })} className="input-field" defaultValue="">
                                <option value="" disabled hidden>Select animal type</option>
                                <option value="dog">Dog</option>
                                <option value="cat">Cat</option>
                      
                            </select>
                            {errors.animalType && <p className="mt-1 text-sm text-red-600">{errors.animalType.message}</p>}
                        </div>
                        
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Location *</label>
                            <input type="hidden" {...register('incidentLocation', { required: 'Incident location is required' })} />
                            <div className="relative">
                                <button type="button" onClick={() => { setIsBarangayOpen(!isBarangayOpen); if (!isBarangayOpen) setBarangayQuery('') }} className="input-field text-left">{selectedBarangay || 'Select barangay'}</button>
                                {isBarangayOpen && (
                                    <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-64 overflow-y-auto">
                                        <div className="p-2 border-b border-gray-200 sticky top-0 bg-white">
                                            <input
                                                type="text"
                                                value={barangayQuery}
                                                onChange={(e) => setBarangayQuery(e.target.value)}
                                                placeholder="Type to search barangay..."
                                                className="w-full px-3 py-2 text-sm border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-300"
                                                autoFocus
                                            />
                                        </div>
                                        {(barangayQuery ? filteredBarangays : barangays).map(b => (
                                            <button
                                                key={b}
                                                type="button"
                                                onClick={() => { setValue('incidentLocation', b, { shouldValidate: true }); setIsBarangayOpen(false) }}
                                                className={`w-full text-left px-4 py-2 hover:bg-orange-50 ${selectedBarangay === b ? 'bg-orange-100' : ''}`}
                                            >
                                                {b}
                                            </button>
                                        ))}
                                        {(barangayQuery && filteredBarangays.length === 0) && (
                                            <div className="px-4 py-2 text-sm text-gray-500">No results</div>
                                        )}
                                    </div>
                                )}
                            </div>
                            {errors.incidentLocation && <p className="mt-1 text-sm text-red-600">{errors.incidentLocation.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date *</label>
                            <input {...register('incidentDate', { required: 'Incident date is required', validate: (v) => v <= todayStr || 'Date cannot be in the future', onChange: (e) => { const v = (e.target as HTMLInputElement).value; if (v > todayStr) { (e.target as HTMLInputElement).value = todayStr; setValue('incidentDate', todayStr, { shouldValidate: true }); toast.error('Date cannot be in the future') } } })} type="date" className="input-field" max={todayStr} />
                            {errors.incidentDate && <p className="mt-1 text-sm text-red-600">{errors.incidentDate.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Time *</label>
                            <input {...register('incidentTime', { required: 'Incident time is required', validate: (v) => { if (selectedIncidentDate === todayStr) { return v <= nowTimeStr || 'Time cannot be in the future' } return true } })} type="time" className="input-field" max={maxIncidentTime} />
                            {errors.incidentTime && <p className="mt-1 text-sm text-red-600">{errors.incidentTime.message}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type of Abuse *</label>
                        <select {...register('abuseType', { required: 'Abuse type is required' })} className="input-field"><option value="">Select abuse type</option><option value="physical">Physical abuse</option><option value="neglect">Neglect</option><option value="abandonment">Abandonment</option><option value="fighting">Animal fighting</option><option value="hoarding">Hoarding</option><option value="other">Other</option></select>
                        {errors.abuseType && <p className="mt-1 text-sm text-red-600">{errors.abuseType.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Animal Description *</label>
                        <textarea {...register('animalDescription', { required: 'Animal description is required' })} rows={3} className="input-field" placeholder="Describe the animal(s) involved (type, breed, color, size, etc.)" />
                        {errors.animalDescription && <p className="mt-1 text-sm text-red-600">{errors.animalDescription.message}</p>}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Perpetrator Description</label>
                        <textarea {...register('perpetratorDescription')} rows={3} className="input-field" placeholder="Describe the person(s) involved (if known)" />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Witness Details</label>
                        <textarea {...register('witnessDetails')} rows={3} className="input-field" placeholder="Were there any witnesses? What did they see?" />
                    </div>

                    <div className="grid md:grid-cols-2 gap-4 mt-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Name *</label>
                            <input {...register('contactName', { required: 'Contact name is required' })} className="input-field" placeholder="Your full name" />
                            {errors.contactName && <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                            <input {...register('contactPhone', { required: 'Contact phone is required' })} type="tel" className="input-field" placeholder="Your phone number" />
                            {errors.contactPhone && <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>}
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                            <input {...register('contactEmail', { required: 'Contact email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} type="email" className="input-field" placeholder="Your email address" />
                            {errors.contactEmail && <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message as string}</p>}
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                        <textarea {...register('additionalDetails')} rows={4} className="input-field" placeholder="Any additional information about the incident..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Files (1-2 Photos Required, Videos Optional) *</label>
                        <div className={`mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-lg ${uploadedFiles.filter(f => f.type.startsWith('image/')).length === 0 ? 'border-red-300 bg-red-50' : 'border-gray-300'}`}>
                            <div className="space-y-1 text-center">
                                <Upload className={`mx-auto h-12 w-12 ${uploadedFiles.filter(f => f.type.startsWith('image/')).length === 0 ? 'text-red-400' : 'text-gray-400'}`} />
                                <div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium"><span>Upload files</span><input id="file-upload" name="file-upload" type="file" multiple className="sr-only" accept="image/jpeg,image/png,image/jpg,video/mp4" onChange={handleFileUpload} /></label><p className="pl-1">or drag and drop</p></div>
                                <p className="text-xs text-gray-500">Photos: unlimited size • Videos: max 150MB each</p>
                                {uploadedFiles.filter(f => f.type.startsWith('image/')).length === 0 && <p className="text-xs text-red-600 font-medium">At least 1-2 photos are required</p>}
                            </div>
                        </div>
                    </div>

                    {filePreviews.length > 0 && (
                        <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {filePreviews.map((preview, index) => (
                                    <div key={index} className="relative">
                                        {uploadedFiles[index].type.startsWith('image/') ? (
                                            <img src={preview} alt={`File ${index + 1}`} className="h-24 w-full object-cover rounded-lg" />
                                        ) : (
                                            <div className="h-24 w-full bg-gray-100 rounded-lg flex items-center justify-center"><FileText className="h-8 w-8 text-gray-400" /></div>
                                        )}
                                        <button type="button" onClick={() => removeFile(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"><X className="h-4 w-4" /></button>
                                        <p className="text-xs text-gray-500 mt-1 truncate">{uploadedFiles[index].name}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex justify-end space-x-3">
                        <button type="button" onClick={() => navigate(-1)} className="btn-secondary">Cancel</button>
                        <button type="submit" disabled={isSubmitting || uploadedFiles.filter(f => f.type.startsWith('image/')).length === 0} className="btn-primary disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit Report'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AbusedReport


