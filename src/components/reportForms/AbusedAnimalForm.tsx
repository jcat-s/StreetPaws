import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, X, Upload, FileText } from 'lucide-react'
import toast from 'react-hot-toast'

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

interface AbusedAnimalFormProps {
  onBack: () => void
  onClose: () => void
  onSubmitSuccess: () => void
}

const AbusedAnimalForm = ({ onBack, onClose, onSubmitSuccess }: AbusedAnimalFormProps) => {
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([])
  const [filePreviews, setFilePreviews] = useState<string[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<AbusedAnimalFormData>()

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || [])

    files.forEach(file => {
      if (file.size > 150 * 1024 * 1024) { // 150MB limit
        toast.error(`${file.name} is too large. File size must be less than 150MB`)
        return
      }

      if (!['image/jpeg', 'image/png', 'video/mp4'].includes(file.type)) {
        toast.error(`${file.name} is not a supported file type. Please upload JPEG, PNG, or MP4 files`)
        return
      }

      setUploadedFiles(prev => [...prev, file])

      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreviews(prev => [...prev, e.target?.result as string])
      }
      reader.readAsDataURL(file)
    })
  }

  const removeFile = (index: number) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index))
    setFilePreviews(prev => prev.filter((_, i) => i !== index))
  }

  const onSubmit = async (data: AbusedAnimalFormData) => {
    setIsSubmitting(true)
    try {
      // Add your form submission logic here
      // For example: await submitAbusedAnimalReport(data, uploadedFiles)

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000))

      // Call the success handler
      onSubmitSuccess()

      // Reset form
      reset()
      setUploadedFiles([])
      setFilePreviews([])
    } catch (error) {
      console.error('Error submitting form:', error)
      toast.error('Failed to submit report. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div>
      {/* Header with back button */}
      <div className="flex items-center mb-6">
        <button
          onClick={onBack}
          className="flex items-center text-gray-600 hover:text-gray-900 mr-4"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back
        </button>
        <h3 className="text-xl font-semibold text-gray-900">Abused Animal Report</h3>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Incident Information */}
        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label htmlFor="incidentLocation" className="block text-sm font-medium text-gray-700 mb-1">
              Incident Location *
            </label>
            <input
              {...register('incidentLocation', { required: 'Incident location is required' })}
              type="text"
              id="incidentLocation"
              className="input-field"
              placeholder="Enter exact location where the incident occurred"
            />
            {errors.incidentLocation && (
              <p className="mt-1 text-sm text-red-600">{errors.incidentLocation.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="incidentDate" className="block text-sm font-medium text-gray-700 mb-1">
              Incident Date *
            </label>
            <input
              {...register('incidentDate', { required: 'Incident date is required' })}
              type="date"
              id="incidentDate"
              className="input-field"
            />
            {errors.incidentDate && (
              <p className="mt-1 text-sm text-red-600">{errors.incidentDate.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="incidentTime" className="block text-sm font-medium text-gray-700 mb-1">
              Incident Time *
            </label>
            <input
              {...register('incidentTime', { required: 'Incident time is required' })}
              type="time"
              id="incidentTime"
              className="input-field"
            />
            {errors.incidentTime && (
              <p className="mt-1 text-sm text-red-600">{errors.incidentTime.message}</p>
            )}
          </div>
        </div>

        {/* Abuse Type */}
        <div>
          <label htmlFor="abuseType" className="block text-sm font-medium text-gray-700 mb-1">
            Type of Abuse *
          </label>
          <select
            {...register('abuseType', { required: 'Abuse type is required' })}
            id="abuseType"
            className="input-field"
          >
            <option value="">Select abuse type</option>
            <option value="physical">Physical abuse</option>
            <option value="neglect">Neglect</option>
            <option value="abandonment">Abandonment</option>
            <option value="fighting">Animal fighting</option>
            <option value="hoarding">Hoarding</option>
            <option value="other">Other</option>
          </select>
          {errors.abuseType && (
            <p className="mt-1 text-sm text-red-600">{errors.abuseType.message}</p>
          )}
        </div>

        {/* Animal Description */}
        <div>
          <label htmlFor="animalDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Animal Description *
          </label>
          <textarea
            {...register('animalDescription', { required: 'Animal description is required' })}
            id="animalDescription"
            rows={3}
            className="input-field"
            placeholder="Describe the animal(s) involved (type, breed, color, size, etc.)"
          />
          {errors.animalDescription && (
            <p className="mt-1 text-sm text-red-600">{errors.animalDescription.message}</p>
          )}
        </div>

        {/* Perpetrator Description */}
        <div>
          <label htmlFor="perpetratorDescription" className="block text-sm font-medium text-gray-700 mb-1">
            Perpetrator Description
          </label>
          <textarea
            {...register('perpetratorDescription')}
            id="perpetratorDescription"
            rows={3}
            className="input-field"
            placeholder="Describe the person(s) involved (if known)"
          />
        </div>

        {/* Witness Details */}
        <div>
          <label htmlFor="witnessDetails" className="block text-sm font-medium text-gray-700 mb-1">
            Witness Details
          </label>
          <textarea
            {...register('witnessDetails')}
            id="witnessDetails"
            rows={3}
            className="input-field"
            placeholder="Were there any witnesses? What did they see?"
          />
        </div>

        {/* Contact Information */}
        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Name *
            </label>
            <input
              {...register('contactName', { required: 'Contact name is required' })}
              type="text"
              id="contactName"
              className="input-field"
              placeholder="Your full name"
            />
            {errors.contactName && (
              <p className="mt-1 text-sm text-red-600">{errors.contactName.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Phone *
            </label>
            <input
              {...register('contactPhone', { required: 'Contact phone is required' })}
              type="tel"
              id="contactPhone"
              className="input-field"
              placeholder="Your phone number"
            />
            {errors.contactPhone && (
              <p className="mt-1 text-sm text-red-600">{errors.contactPhone.message}</p>
            )}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
              Contact Email *
            </label>
            <input
              {...register('contactEmail', {
                required: 'Contact email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address'
                }
              })}
              type="email"
              id="contactEmail"
              className="input-field"
              placeholder="Your email address"
            />
            {errors.contactEmail && (
              <p className="mt-1 text-sm text-red-600">{errors.contactEmail.message}</p>
            )}
          </div>
        </div>

        {/* Additional Details */}
        <div>
          <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700 mb-1">
            Additional Details
          </label>
          <textarea
            {...register('additionalDetails')}
            id="additionalDetails"
            rows={4}
            className="input-field"
            placeholder="Any additional information about the incident..."
          />
        </div>

        {/* File Upload */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Evidence Files (Photos/Videos) *
          </label>
          <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
            <div className="space-y-1 text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="flex text-sm text-gray-600">
                <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                  <span>Upload files</span>
                  <input
                    id="file-upload"
                    name="file-upload"
                    type="file"
                    multiple
                    className="sr-only"
                    accept="image/jpeg,image/png,video/mp4"
                    onChange={handleFileUpload}
                  />
                </label>
                <p className="pl-1">or drag and drop</p>
              </div>
              <p className="text-xs text-gray-500">JPEG, PNG, MP4 up to 150MB each</p>
            </div>
          </div>
        </div>

        {/* File Previews */}
        {filePreviews.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Uploaded Files:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {filePreviews.map((preview, index) => (
                <div key={index} className="relative">
                  {uploadedFiles[index].type.startsWith('image/') ? (
                    <img
                      src={preview}
                      alt={`File ${index + 1}`}
                      className="h-24 w-full object-cover rounded-lg"
                    />
                  ) : (
                    <div className="h-24 w-full bg-gray-100 rounded-lg flex items-center justify-center">
                      <FileText className="h-8 w-8 text-gray-400" />
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => removeFile(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {uploadedFiles[index].name}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting || uploadedFiles.length === 0}
            className="btn-primary disabled:opacity-50"
          >
            {isSubmitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </div>
      </form>
    </div>
  )
}

export default AbusedAnimalForm