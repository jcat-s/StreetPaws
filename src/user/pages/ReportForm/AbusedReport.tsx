import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { Upload, FileText, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../../contexts/AuthContext'
import { submitAbuseReport } from '../../utils/abuseReportService'

interface AbusedAnimalFormData {
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

    const { register, handleSubmit, reset, setValue, watch } = useForm<AbusedAnimalFormData>()
    const [isBarangayOpen, setIsBarangayOpen] = useState(false)
    const selectedBarangay = watch('incidentLocation')

    const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(event.target.files || [])
        files.forEach(file => {
            if (file.size > 150 * 1024 * 1024) { toast.error(`${file.name} is too large`); return }
            if (!['image/jpeg', 'image/png', 'video/mp4'].includes(file.type)) { toast.error(`${file.name} is not supported`); return }
            setUploadedFiles(prev => [...prev, file])
            const reader = new FileReader(); reader.onload = (e) => setFilePreviews(prev => [...prev, e.target?.result as string]); reader.readAsDataURL(file)
        })
    }

    const removeFile = (index: number) => { setUploadedFiles(prev => prev.filter((_, i) => i !== index)); setFilePreviews(prev => prev.filter((_, i) => i !== index)) }

    const barangays = ['Adya', 'Anilao', 'Antipolo del Norte', 'Antipolo del Sur', 'Bagong Pook', 'Balintawak', 'Banaybanay', 'Banaybanay I', 'Banaybanay II', 'Bangcal', 'Bolbok', 'Bugtong na Pulo', 'Bulacnin', 'Bulaklakan', 'Calamias', 'Candating', 'Dagatan', 'Dela Paz', 'Dela Paz Proper', 'Halang', 'Inosluban', 'Kayumanggi', 'Latag', 'Lodlod', 'Lumbang', 'Mabini', 'Malagonlong', 'Malitlit', 'Marawoy', 'Munting Pulo', 'Pangao', 'Pinagkawitan', 'Pinagtongulan', 'Plaridel', 'Quiling', 'Rizal', 'Sabang', 'Sampaguita', 'San Benildo', 'San Carlos', 'San Celestino', 'San Francisco', 'San Francisco (Burol)', 'San Guillermo', 'San Jose', 'San Lucas', 'San Salvador', 'San Sebastian', 'San Vicente', 'Sapac', 'Sico 1', 'Sico 2', 'Sto. Niño', 'Tambo', 'Tangob', 'Tanguile', 'Tibig', 'Tico', 'Tipacan', 'Tuyo', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'San Isidro', 'San Nicolas', 'Barangay San Miguel']

    const onSubmit = async (data: AbusedAnimalFormData) => {
        setIsSubmitting(true)
        try {
            await submitAbuseReport(data, uploadedFiles, currentUser?.uid || null)
            toast.success('Abuse report submitted')
            reset(); setUploadedFiles([]); setFilePreviews([])
            navigate(-1)
        } catch (e) { toast.error('Failed to submit report') } finally { setIsSubmitting(false) }
    }

    return (
        <div className="min-h-screen bg-white flex items-center justify-center py-8">
            <div className="w-full max-w-4xl bg-orange-50 rounded-xl shadow-lg border border-orange-200 p-8">
                <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">Abused Animal Report</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Location *</label>
                            <input type="hidden" {...register('incidentLocation', { required: 'Incident location is required' })} />
                            <div className="relative">
                                <button type="button" onClick={() => setIsBarangayOpen(!isBarangayOpen)} className="input-field text-left">{selectedBarangay || 'Select barangay'}</button>
                                {isBarangayOpen && (<div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-48 overflow-y-auto">{barangays.map(b => (<button key={b} type="button" onClick={() => { setValue('incidentLocation', b, { shouldValidate: true }); setIsBarangayOpen(false) }} className={`w-full text-left px-4 py-2 hover:bg-orange-50 ${selectedBarangay === b ? 'bg-orange-100' : ''}`}>{b}</button>))}</div>)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Date *</label>
                            <input {...register('incidentDate', { required: 'Incident date is required' })} type="date" className="input-field" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Incident Time *</label>
                            <input {...register('incidentTime', { required: 'Incident time is required' })} type="time" className="input-field" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Type of Abuse *</label>
                        <select {...register('abuseType', { required: 'Abuse type is required' })} className="input-field"><option value="">Select abuse type</option><option value="physical">Physical abuse</option><option value="neglect">Neglect</option><option value="abandonment">Abandonment</option><option value="fighting">Animal fighting</option><option value="hoarding">Hoarding</option><option value="other">Other</option></select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Animal Description *</label>
                        <textarea {...register('animalDescription', { required: 'Animal description is required' })} rows={3} className="input-field" placeholder="Describe the animal(s) involved (type, breed, color, size, etc.)" />
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
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Phone *</label>
                            <input {...register('contactPhone', { required: 'Contact phone is required' })} type="tel" className="input-field" placeholder="Your phone number" />
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Contact Email *</label>
                            <input {...register('contactEmail', { required: 'Contact email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} type="email" className="input-field" placeholder="Your email address" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details</label>
                        <textarea {...register('additionalDetails')} rows={4} className="input-field" placeholder="Any additional information about the incident..." />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Evidence Files (Photos/Videos) *</label>
                        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
                            <div className="space-y-1 text-center">
                                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                                <div className="flex text-sm text-gray-600"><label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium"><span>Upload files</span><input id="file-upload" name="file-upload" type="file" multiple className="sr-only" accept="image/jpeg,image/png,video/mp4" onChange={handleFileUpload} /></label><p className="pl-1">or drag and drop</p></div>
                                <p className="text-xs text-gray-500">JPEG, PNG, MP4 up to 150MB each</p>
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
                        <button type="submit" disabled={isSubmitting || uploadedFiles.length === 0} className="btn-primary disabled:opacity-50">{isSubmitting ? 'Submitting...' : 'Submit Report'}</button>
                    </div>
                </form>
            </div>
        </div>
    )
}

export default AbusedReport
