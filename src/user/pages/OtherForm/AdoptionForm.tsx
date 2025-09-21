import { useForm } from 'react-hook-form'
import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'

interface AdoptionFormData {
  // Personal Information
  fullName: string
  email: string
  phone: string
  age: number
  occupation: string
  barangay: string
  address: string
  
  // Home Environment
  homeType: string
  hasYard: string
  yardSize?: string
  hasOtherPets: string
  otherPetsDetails?: string
  hasChildren: string
  childrenAges?: string
  
  // Experience & Knowledge
  petExperience: string
  vetKnowledge: string
  timeCommitment: string
  exercisePlan: string
  
  // References
  reference1Name: string
  reference1Phone: string
  reference1Relation: string
  
  // Additional Information
  adoptionReason: string
  specialNeeds: string
  emergencyPlan: string
  consent: boolean
}

const barangays = [
  'Adya', 'Anilao', 'Antipolo del Norte', 'Antipolo del Sur', 'Bagong Pook', 'Balintawak', 'Banaybanay', 'Banaybanay I', 'Banaybanay II', 'Bangcal', 'Bolbok', 'Bugtong na Pulo', 'Bulacnin', 'Bulaklakan', 'Calamias', 'Candating', 'Dagatan', 'Dela Paz', 'Dela Paz Proper', 'Halang', 'Inosluban', 'Kayumanggi', 'Latag', 'Lodlod', 'Lumbang', 'Mabini', 'Malagonlong', 'Malitlit', 'Marawoy', 'Munting Pulo', 'Pangao', 'Pinagkawitan', 'Pinagtongulan', 'Plaridel', 'Quiling', 'Rizal', 'Sabang', 'Sampaguita', 'San Benildo', 'San Carlos', 'San Celestino', 'San Francisco', 'San Francisco (Burol)', 'San Guillermo', 'San Jose', 'San Lucas', 'San Salvador', 'San Sebastian', 'San Vicente', 'Sapac', 'Sico 1', 'Sico 2', 'Sto. Niño', 'Tambo', 'Tangob', 'Tanguile', 'Tibig', 'Tico', 'Tipacan', 'Tuyo', 'Barangay 1 (Poblacion)', 'Barangay 2 (Poblacion)', 'Barangay 3 (Poblacion)', 'Barangay 4 (Poblacion)', 'Barangay 5 (Poblacion)', 'Barangay 6 (Poblacion)', 'Barangay 7 (Poblacion)', 'Barangay 8 (Poblacion)', 'Barangay 9 (Poblacion)', 'San Isidro', 'San Nicolas', 'Barangay San Miguel'
]

const AdoptionForm = () => {
  const { animalId } = useParams()
  const navigate = useNavigate()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBarangayOpen, setIsBarangayOpen] = useState(false)
  
  const { register, handleSubmit, formState: { errors }, reset, setValue, watch } = useForm<AdoptionFormData>()
  const selectedBarangay = watch('barangay')
  const hasYard = watch('hasYard') === 'true'
  const hasOtherPets = watch('hasOtherPets') === 'true'
  const hasChildren = watch('hasChildren') === 'true'

  const onSubmit = async (data: AdoptionFormData) => {
    console.log('Form submission started with data:', data)
    console.log('Form errors:', errors)
    console.log('Is form valid?', Object.keys(errors).length === 0)
    
    setIsSubmitting(true)
    try {
      if (!db) {
        console.error('Firestore not initialized')
        throw new Error('Firestore not initialized')
      }
      
      console.log('Firebase db instance:', db)
      console.log('Animal ID from params:', animalId)
      
      const adoptionData = {
        animalId: animalId || null,
        // Map form fields to admin expected fields
        applicantName: data.fullName,
        applicantEmail: data.email,
        applicantPhone: data.phone,
        applicantAge: data.age,
        applicantOccupation: data.occupation,
        applicantBarangay: data.barangay,
        applicantAddress: data.address,
        // Animal information (will be populated from animal data if animalId is provided)
        animalName: 'Selected Animal', // This should be populated from animal data
        animalType: 'Unknown', // This should be populated from animal data
        animalBreed: 'Unknown', // This should be populated from animal data
        // Keep other fields as they are
        homeType: data.homeType,
        hasYard: data.hasYard,
        yardSize: data.yardSize,
        hasOtherPets: data.hasOtherPets,
        otherPetsDetails: data.otherPetsDetails,
        hasChildren: data.hasChildren,
        childrenAges: data.childrenAges,
        petExperience: data.petExperience,
        vetKnowledge: data.vetKnowledge,
        timeCommitment: data.timeCommitment,
        exercisePlan: data.exercisePlan,
        reference1Name: data.reference1Name,
        reference1Phone: data.reference1Phone,
        reference1Relation: data.reference1Relation,
        adoptionReason: data.adoptionReason,
        specialNeeds: data.specialNeeds,
        emergencyPlan: data.emergencyPlan,
        consent: data.consent,
        status: 'pending',
        submittedAt: serverTimestamp(),
        createdAt: serverTimestamp()
      }
      
      console.log('Submitting adoption data to Firestore:', adoptionData)
      console.log('Collection reference:', collection(db, 'adoptions'))
      
      const docRef = await addDoc(collection(db, 'adoptions'), adoptionData)
      console.log('Adoption application submitted successfully with ID:', docRef.id)
      
      toast.success('Adoption application submitted successfully! We will contact you within 3-5 business days.')
      reset()
      navigate('/our-animals')
    } catch (error: any) {
      console.error('Adoption form submission error:', error)
      console.error('Error details:', {
        name: error?.name,
        message: error?.message,
        code: error?.code,
        stack: error?.stack
      })
      toast.error(`Failed to submit application: ${error?.message || 'Unknown error'}. Please try again.`)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center py-8">
      <div className="w-full max-w-4xl bg-orange-50 rounded-xl shadow-lg border border-orange-200 p-8">
        <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">
          Pet Adoption Application
        </h1>
        <p className="text-center text-gray-600 mb-8">
          Thank you for your interest in adopting a pet. Please fill out this form completely and honestly.
        </p>

        <form onSubmit={handleSubmit(onSubmit, (errors) => {
          console.log('Form validation failed:', errors)
          console.log('Number of validation errors:', Object.keys(errors).length)
        })} className="space-y-8">
          {/* Personal Information */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Personal Information</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  {...register('fullName', { required: 'Full name is required' })}
                  type="text"
                  className="input-field"
                  placeholder="e.g., Juan Dela Cruz"
                />
                {errors.fullName && <p className="text-sm text-red-600">{errors.fullName.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  {...register('email', { 
                    required: 'Email is required',
                    pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' }
                  })}
                  type="email"
                  className="input-field"
                  placeholder="e.g., juan@email.com"
                />
                {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                <input
                  {...register('phone', { 
                    required: 'Phone is required',
                    validate: value => /^\d+$/.test(value) || 'Numbers only'
                  })}
                  type="tel"
                  className="input-field"
                  placeholder="e.g., 09123456789"
                  onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault() }}
                />
                {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                <input
                  {...register('age', { 
                    required: 'Age is required',
                    valueAsNumber: true,
                    min: { value: 18, message: 'Must be at least 18 years old' },
                    max: { value: 100, message: 'Please enter a valid age' }
                  })}
                  type="number"
                  className="input-field"
                  placeholder="e.g., 25"
                />
                {errors.age && <p className="text-sm text-red-600">{errors.age.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Occupation *</label>
                <input
                  {...register('occupation', { required: 'Occupation is required' })}
                  type="text"
                  className="input-field"
                  placeholder="e.g., Teacher, Engineer"
                />
                {errors.occupation && <p className="text-sm text-red-600">{errors.occupation.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Barangay *</label>
                <input type="hidden" {...register('barangay', { required: 'Barangay is required' })} />
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
                      {barangays.map(b => (
                        <button 
                          key={b} 
                          type="button" 
                          onClick={() => { 
                            setValue('barangay', b, { shouldValidate: true })
                            setIsBarangayOpen(false)
                          }} 
                          className={`w-full text-left px-4 py-2 hover:bg-orange-50 ${selectedBarangay === b ? 'bg-orange-100' : ''}`}
                        >
                          {b}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {errors.barangay && <p className="text-sm text-red-600">{errors.barangay.message}</p>}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Complete Address *</label>
                <textarea
                  {...register('address', { required: 'Address is required' })}
                  className="input-field"
                  rows={3}
                  placeholder="House number, street, subdivision, etc."
                />
                {errors.address && <p className="text-sm text-red-600">{errors.address.message}</p>}
              </div>
            </div>
          </div>

          {/* Home Environment */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Home Environment</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Type of Home *</label>
                <select {...register('homeType', { required: 'Home type is required' })} className="input-field">
                  <option value="">Select home type</option>
                  <option value="house">House</option>
                  <option value="apartment">Apartment</option>
                  <option value="condo">Condominium</option>
                  <option value="townhouse">Townhouse</option>
                  <option value="other">Other</option>
                </select>
                {errors.homeType && <p className="text-sm text-red-600">{errors.homeType.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do you have a yard or outdoor space? *</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input type="radio" value="true" {...register('hasYard', { required: 'Please select an option' })} />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" value="false" {...register('hasYard', { required: 'Please select an option' })} />
                    <span className="ml-2">No</span>
                  </label>
                </div>
                {errors.hasYard && <p className="text-sm text-red-600">{errors.hasYard.message}</p>}
              </div>

              {hasYard === true && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Yard Size</label>
                  <select {...register('yardSize')} className="input-field">
                    <option value="">Select yard size</option>
                    <option value="small">Small (less than 50 sqm)</option>
                    <option value="medium">Medium (50-100 sqm)</option>
                    <option value="large">Large (more than 100 sqm)</option>
                  </select>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do you currently have other pets? *</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input type="radio" value="true" {...register('hasOtherPets', { required: 'Please select an option' })} />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" value="false" {...register('hasOtherPets', { required: 'Please select an option' })} />
                    <span className="ml-2">No</span>
                  </label>
                </div>
                {errors.hasOtherPets && <p className="text-sm text-red-600">{errors.hasOtherPets.message}</p>}
              </div>

              {hasOtherPets === true && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Please describe your other pets</label>
                  <textarea
                    {...register('otherPetsDetails')}
                    className="input-field"
                    rows={3}
                    placeholder="Type, breed, age, gender, and how they get along with other animals"
                  />
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Do you have children? *</label>
                <div className="flex gap-4">
                  <label className="inline-flex items-center">
                    <input type="radio" value="true" {...register('hasChildren', { required: 'Please select an option' })} />
                    <span className="ml-2">Yes</span>
                  </label>
                  <label className="inline-flex items-center">
                    <input type="radio" value="false" {...register('hasChildren', { required: 'Please select an option' })} />
                    <span className="ml-2">No</span>
                  </label>
                </div>
                {errors.hasChildren && <p className="text-sm text-red-600">{errors.hasChildren.message}</p>}
              </div>

              {hasChildren === true && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Children's Ages</label>
                  <input
                    {...register('childrenAges')}
                    type="text"
                    className="input-field"
                    placeholder="e.g., 5, 8, 12 years old"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Experience & Knowledge */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Experience & Knowledge</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pet Ownership Experience *</label>
                <select {...register('petExperience', { required: 'Please select your experience level' })} className="input-field">
                  <option value="">Select experience level</option>
                  <option value="none">No experience</option>
                  <option value="some">Some experience (1-2 years)</option>
                  <option value="moderate">Moderate experience (3-5 years)</option>
                  <option value="extensive">Extensive experience (5+ years)</option>
                </select>
                {errors.petExperience && <p className="text-sm text-red-600">{errors.petExperience.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Veterinary Knowledge *</label>
                <select {...register('vetKnowledge', { required: 'Please select your knowledge level' })} className="input-field">
                  <option value="">Select knowledge level</option>
                  <option value="basic">Basic (vaccinations, basic care)</option>
                  <option value="intermediate">Intermediate (common illnesses, first aid)</option>
                  <option value="advanced">Advanced (medical conditions, emergency care)</option>
                </select>
                {errors.vetKnowledge && <p className="text-sm text-red-600">{errors.vetKnowledge.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Time Commitment *</label>
                <textarea
                  {...register('timeCommitment', { required: 'Please describe your time commitment' })}
                  className="input-field"
                  rows={3}
                  placeholder="How much time can you dedicate daily to pet care? (feeding, exercise, grooming, etc.)"
                />
                {errors.timeCommitment && <p className="text-sm text-red-600">{errors.timeCommitment.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Exercise Plan *</label>
                <textarea
                  {...register('exercisePlan', { required: 'Please describe your exercise plan' })}
                  className="input-field"
                  rows={3}
                  placeholder="How will you ensure the pet gets adequate exercise and mental stimulation?"
                />
                {errors.exercisePlan && <p className="text-sm text-red-600">{errors.exercisePlan.message}</p>}
              </div>
            </div>
          </div>

          {/* References */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Reference</h2>
              <div className="space-y-4">

                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    {...register('reference1Name', { required: 'Reference name is required' })}
                    type="text"
                    className="input-field"
                    placeholder="Full name"
                  />
                  {errors.reference1Name && <p className="text-sm text-red-600">{errors.reference1Name.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    {...register('reference1Phone', { 
                      required: 'Reference phone is required',
                      validate: value => /^\d+$/.test(value) || 'Numbers only'
                    })}
                    type="tel"
                    className="input-field"
                    placeholder="Phone number"
                    onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault() }}
                  />
                  {errors.reference1Phone && <p className="text-sm text-red-600">{errors.reference1Phone.message}</p>}
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Relationship</label>
                  <input
                    {...register('reference1Relation', { required: 'Relationship is required' })}
                    type="text"
                    className="input-field"
                    placeholder="e.g., Friend, Colleague, Family"
                  />
                  {errors.reference1Relation && <p className="text-sm text-red-600">{errors.reference1Relation.message}</p>}
                </div>
              
            </div>
          </div>

          {/* Additional Information */}
          <div className="bg-white rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Why do you want to adopt this pet? *</label>
                <textarea
                  {...register('adoptionReason', { required: 'Please explain your reason for adoption' })}
                  className="input-field"
                  rows={4}
                  placeholder="Please explain your motivation for adopting and what you hope to gain from pet ownership"
                />
                {errors.adoptionReason && <p className="text-sm text-red-600">{errors.adoptionReason.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">How would you handle special needs or medical issues? *</label>
                <textarea
                  {...register('specialNeeds', { required: 'Please explain your approach to special needs' })}
                  className="input-field"
                  rows={3}
                  placeholder="Describe your willingness and ability to care for a pet with special needs or medical conditions"
                />
                {errors.specialNeeds && <p className="text-sm text-red-600">{errors.specialNeeds.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Plan *</label>
                <textarea
                  {...register('emergencyPlan', { required: 'Please describe your emergency plan' })}
                  className="input-field"
                  rows={3}
                  placeholder="What would you do if you could no longer care for the pet? (moving, financial hardship, etc.)"
                />
                {errors.emergencyPlan && <p className="text-sm text-red-600">{errors.emergencyPlan.message}</p>}
              </div>
            </div>
          </div>

          {/* Consent */}
          <div className="bg-white rounded-lg p-6">
            <div className="flex items-start space-x-2">
              <input
                type="checkbox"
                {...register('consent', { required: 'You must agree to the terms' })}
                className="mt-1"
              />
              <label className="text-sm text-gray-700">
                I understand that this is a legal document and that any false information may result in the denial of my application. 
                I agree to provide a loving, safe home for the pet and to follow all adoption policies. I understand that the 
                adoption fee is non-refundable and that the pet may be reclaimed if the terms of adoption are not met.
              </label>
            </div>
            {errors.consent && <p className="text-sm text-red-600 mt-2">{errors.consent.message}</p>}
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              onClick={() => navigate(-1)} 
              className="btn-secondary"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="btn-primary disabled:opacity-50"
            >
              {isSubmitting ? 'Submitting...' : 'Submit Application'}
            </button>
        </div>
        </form>
      </div>
    </div>
  )
}

export default AdoptionForm 
