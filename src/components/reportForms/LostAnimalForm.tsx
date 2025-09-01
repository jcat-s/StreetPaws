import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { ArrowLeft, X, Camera } from 'lucide-react'
import toast from 'react-hot-toast'

interface LostAnimalFormData {
  animalType: string
  animalName: string
  breed: string
  colors: string
  age: string
  gender: string
  size: string
  spayNeuterStatus: string
  lastSeenLocation: string
  lastSeenDate: string
  lastSeenTime: string
  contactName: string
  contactPhone: string
  contactEmail: string
  additionalDetails: string
}

interface LostAnimalFormProps {
  onBack: () => void
  onClose: () => void
  onSubmitSuccess: () => void
}

const LostAnimalForm = ({ onBack, onClose, onSubmitSuccess }: LostAnimalFormProps) => {
  const [uploadedImage, setUploadedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch
  } = useForm<LostAnimalFormData>();
  const [isBarangayOpen, setIsBarangayOpen] = useState(false);
  const selectedBarangay = watch('lastSeenLocation');

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 50 * 1024 * 1024) {
        toast.error('File size must be less than 50MB');
        return;
      }
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        toast.error('Please upload a JPEG or PNG file');
        return;
      }
      setUploadedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setUploadedImage(null);
    setImagePreview(null);
  };

  const barangays = [
    'Adya', 'Anilao', 'Antipolo del Norte', 'Antipolo del Sur', 'Bagong Pook', 'Balintawak', 'Banaybanay', 'Banaybanay I', 'Banaybanay II', 'Bangcal', 'Bolbok', 'Bugtong na Pulo', 'Bulacnin', 'Bulaklakan', 'Calamias', 'Candating', 'Dagatan', 'Dela Paz', 'Dela Paz Proper', 'Halang', 'Inosluban', 'Kayumanggi', 'Latag', 'Lodlod', 'Lumbang', 'Mabini', 'Malagonlong', 'Malitlit', 'Marawoy', 'Munting Pulo', 'Pangao', 'Pinagkawitan', 'Pinagtongulan', 'Plaridel', 'Quiling', 'Rizal', 'Sabang', 'Sampaguita', 'San Benildo', 'San Carlos', 'San Celestino', 'San Francisco', 'San Francisco (Burol)', 'San Guillermo', 'San Jose', 'San Lucas', 'San Salvador', 'San Sebastian', 'San Vicente', 'Sapac', 'Sico 1', 'Sico 2', 'Sto. Niño', 'Tambo', 'Tangob', 'Tanguile', 'Tibig', 'Tico', 'Tipacan', 'Tuyo', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'San Isidro', 'San Nicolas', 'Barangay San Miguel'
  ];

  const validatePhoneNumber = (value: string) => {
    return /^\d+$/.test(value) || 'Please enter numbers only';
  };

  const onSubmit = async (data: LostAnimalFormData) => {
    setIsSubmitting(true);
    try {
      // Add your form submission logic here
      // For example: await submitLostAnimalReport(data, uploadedImage)
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSubmitSuccess();
      reset();
      setUploadedImage(null);
      setImagePreview(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header - full width orange */}
      <div className="bg-orange-500 text-white p-4">
        <div className="max-w-7xl mx-auto relative flex items-center justify-center">
          {/* Back Arrow Button - positioned absolutely to the left */}
          <button
            onClick={onBack}
            className="absolute left-0 flex items-center text-white hover:bg-orange-600 p-2 rounded-full transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>

          {/* Centered Heading */}
          <h1 className="text-2xl font-bold">Lost Animal Report</h1>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Pet Information Section */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="animalType" className="block text-sm font-medium text-gray-700 mb-1">
                Animal Type *
              </label>
              <select
                {...register('animalType', { required: 'Animal type is required' })}
                id="animalType"
                className="input-field"
                defaultValue=""
              >
                <option value="" disabled hidden>
                  Select animal type
                </option>
                <option value="dog">Dog</option>
                <option value="cat">Cat</option>
              </select>
              {errors.animalType && (
                <p className="mt-1 text-sm text-red-600">{errors.animalType.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="animalName" className="block text-sm font-medium text-gray-700 mb-1">
                Pet's Name *
              </label>
              <input
                {...register('animalName', { required: "Pet's name is required" })}
                type="text"
                id="animalName"
                className="input-field"
                placeholder="e.g., Mingming"
              />
              {errors.animalName && (
                <p className="mt-1 text-sm text-red-600">{errors.animalName.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="breed" className="block text-sm font-medium text-gray-700 mb-1">
                Breed *
              </label>
              <input
                {...register('breed', { required: 'Breed is required' })}
                type="text"
                id="breed"
                className="input-field"
                placeholder="e.g., Labrador"
              />
              {errors.breed && (
                <p className="mt-1 text-sm text-red-600">{errors.breed.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="colors" className="block text-sm font-medium text-gray-700 mb-1">
                Colors *
              </label>
              <input
                {...register('colors', { required: 'Colors are required' })}
                type="text"
                id="colors"
                className="input-field"
                placeholder="e.g., Brown and white"
              />
              {errors.colors && (
                <p className="mt-1 text-sm text-red-600">{errors.colors.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="age" className="block text-sm font-medium text-gray-700 mb-1">
                Age *
              </label>
              <input
                {...register('age', { required: 'Age is required' })}
                type="text"
                id="age"
                className="input-field"
                placeholder="e.g., 3 years old"
              />
              {errors.age && (
                <p className="mt-1 text-sm text-red-600">{errors.age.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="gender" className="block text-sm font-medium text-gray-700 mb-1">
                Gender *
              </label>
              <select
                {...register('gender', { required: 'Gender is required' })}
                id="gender"
                className="input-field"
                defaultValue=""
              >
                <option value="" disabled hidden>
                  Select gender
                </option>
                <option value="male">Male</option>
                <option value="female">Female</option>
              </select>
              {errors.gender && (
                <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="size" className="block text-sm font-medium text-gray-700 mb-1">
                Size *
              </label>
              <select
                {...register('size', { required: 'Size is required' })}
                id="size"
                className="input-field"
                defaultValue=""
              >
                <option value="" disabled hidden>
                  Select size
                </option>
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
              {errors.size && (
                <p className="mt-1 text-sm text-red-600">{errors.size.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="spayNeuterStatus" className="block text-sm font-medium text-gray-700 mb-1">
                Spay/Neuter Status *
              </label>
              <select
                {...register('spayNeuterStatus', { required: 'Spay/neuter status is required' })}
                id="spayNeuterStatus"
                className="input-field"
                defaultValue=""
              >
                <option value="" disabled hidden>
                  Select status
                </option>
                <option value="spayed">Spayed</option>
                <option value="neutered">Neutered</option>
                <option value="intact">Intact</option>
                <option value="unknown">Unknown</option>
              </select>
              {errors.spayNeuterStatus && (
                <p className="mt-1 text-sm text-red-600">{errors.spayNeuterStatus.message}</p>
              )}
            </div>
          </div>

          {/* Last Seen Location and Time */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label htmlFor="lastSeenLocation" className="block text-sm font-medium text-gray-700 mb-1">
                Last Seen Location *
              </label>
              <input type="hidden" {...register('lastSeenLocation', { required: 'Last seen location is required' })} />
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setIsBarangayOpen(!isBarangayOpen)}
                  className="input-field text-left"
                >
                  {selectedBarangay || 'Select barangay'}
                </button>
                {isBarangayOpen && (
                  <div className="absolute z-10 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow max-h-48 overflow-y-auto">
                    {barangays.map((b) => (
                      <button
                        type="button"
                        key={b}
                        onClick={() => { setValue('lastSeenLocation', b, { shouldValidate: true }); setIsBarangayOpen(false); }}
                        className={`w-full text-left px-4 py-2 hover:bg-orange-50 ${selectedBarangay === b ? 'bg-orange-100' : ''}`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {errors.lastSeenLocation && (
                <p className="mt-1 text-sm text-red-600">{errors.lastSeenLocation.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastSeenDate" className="block text-sm font-medium text-gray-700 mb-1">
                Last Seen Date *
              </label>
              <input
                {...register('lastSeenDate', { required: 'Last seen date is required' })}
                type="date"
                id="lastSeenDate"
                className="input-field"
              />
              {errors.lastSeenDate && (
                <p className="mt-1 text-sm text-red-600">{errors.lastSeenDate.message}</p>
              )}
            </div>
            <div>
              <label htmlFor="lastSeenTime" className="block text-sm font-medium text-gray-700 mb-1">
                Last Seen Time *
              </label>
              <input
                {...register('lastSeenTime', { required: 'Last seen time is required' })}
                type="time"
                id="lastSeenTime"
                className="input-field"
              />
              {errors.lastSeenTime && (
                <p className="mt-1 text-sm text-red-600">{errors.lastSeenTime.message}</p>
              )}
            </div>
          </div>

          {/* Contact Information */}
          <div className="grid md:grid-cols-2 gap-4 mt-6">
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
                {...register('contactPhone', {
                  required: 'Contact phone is required',
                  validate: validatePhoneNumber
                })}
                type="tel"
                id="contactPhone"
                inputMode="numeric"
                pattern="[0-9]*"
                className="input-field"
                placeholder="Your phone number"
                onKeyPress={(e) => {
                  if (!/[0-9]/.test(e.key)) {
                    e.preventDefault();
                  }
                }}
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
          <div className="mt-6">
            <label htmlFor="additionalDetails" className="block text-sm font-medium text-gray-700 mb-1">
              Additional Details
            </label>
            <textarea
              {...register('additionalDetails')}
              id="additionalDetails"
              rows={4}
              className="input-field"
              placeholder="Any additional information that might help locate the animal..."
            />
          </div>

          {/* Image Upload */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Animal Photo *
            </label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg">
              {!imagePreview ? (
                <div className="space-y-1 text-center">
                  <Camera className="mx-auto h-12 w-12 text-gray-400" />
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="image-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload a file</span>
                      <input
                        id="image-upload"
                        name="image-upload"
                        type="file"
                        className="sr-only"
                        accept="image/jpeg,image/png"
                        onChange={handleImageUpload}
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">JPEG, PNG up to 50MB</p>
                </div>
              ) : (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Animal preview"
                    className="h-32 w-32 object-cover rounded-lg"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-3 mt-8">
            <button
              type="button"
              onClick={onBack}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !imagePreview}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div >
    </div >
  );
}

export default LostAnimalForm