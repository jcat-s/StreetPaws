import { useState } from 'react'
import { 
  Search, 
  Eye, 
  CheckCircle, 
  XCircle, 
  Heart,
  Download
} from 'lucide-react'

// Mock data - In production, this would come from your database
const MOCK_ADOPTIONS = [
  {
    id: '1',
    animalId: '1',
    animalName: 'Jepoy',
    animalType: 'dog',
    animalBreed: 'Golden Retriever',
    animalAge: '2 years',
    applicantName: 'Pedro Martinez',
    applicantEmail: 'pedro.martinez@email.com',
    applicantPhone: '+63 912 345 6789',
    applicantAge: 28,
    applicantOccupation: 'Software Engineer',
    applicantBarangay: 'Barangay 1',
    applicantAddress: '123 Main Street, Barangay 1, Lipa City',
    homeType: 'House',
    hasYard: 'Yes',
    yardSize: 'Large',
    hasOtherPets: 'No',
    otherPetsDetails: '',
    hasChildren: 'No',
    childrenAges: '',
    petExperience: 'Yes, I have owned dogs before',
    vetKnowledge: 'Basic knowledge of pet care',
    timeCommitment: 'I work from home and can spend 4-6 hours daily',
    exercisePlan: 'Daily walks and playtime in the yard',
    reference1Name: 'Maria Santos',
    reference1Phone: '+63 923 456 7890',
    reference1Relation: 'Friend',
    reference2Name: 'Juan Dela Cruz',
    reference2Phone: '+63 934 567 8901',
    reference2Relation: 'Neighbor',
    adoptionReason: 'I have always wanted a Golden Retriever and have the time and resources to care for one properly.',
    specialNeeds: 'None',
    emergencyPlan: 'I have a local vet contact and emergency fund for pet care.',
    consent: true,
    status: 'pending',
    priority: 'normal',
    submittedAt: '2024-01-15T10:30:00Z',
    reviewedBy: null,
    reviewedAt: null,
    notes: '',
    decisionReason: ''
  },
  {
    id: '2',
    animalId: '2',
    animalName: 'Putchi',
    animalType: 'cat',
    animalBreed: 'Persian',
    animalAge: '1 year',
    applicantName: 'Sofia Garcia',
    applicantEmail: 'sofia.garcia@email.com',
    applicantPhone: '+63 945 678 9012',
    applicantAge: 35,
    applicantOccupation: 'Teacher',
    applicantBarangay: 'Barangay 3',
    applicantAddress: '456 Oak Avenue, Barangay 3, Lipa City',
    homeType: 'Apartment',
    hasYard: 'No',
    yardSize: '',
    hasOtherPets: 'Yes',
    otherPetsDetails: 'I have one cat already, a 3-year-old Siamese',
    hasChildren: 'Yes',
    childrenAges: '8 and 12 years old',
    petExperience: 'Yes, I have owned cats for 10 years',
    vetKnowledge: 'Experienced with cat health and behavior',
    timeCommitment: 'I can spend 2-3 hours daily with the pet',
    exercisePlan: 'Indoor play and climbing activities',
    reference1Name: 'Ana Rodriguez',
    reference1Phone: '+63 956 789 0123',
    reference1Relation: 'Colleague',
    reference2Name: 'Miguel Torres',
    reference2Phone: '+63 967 890 1234',
    reference2Relation: 'Veterinarian',
    adoptionReason: 'My children love cats and we want to give a loving home to a rescue cat.',
    specialNeeds: 'None',
    emergencyPlan: 'I have a trusted vet and pet insurance.',
    consent: true,
    status: 'approved',
    priority: 'normal',
    submittedAt: '2024-01-14T14:20:00Z',
    reviewedBy: 'Dr. Maria Santos',
    reviewedAt: '2024-01-14T16:45:00Z',
    notes: 'Excellent application. Experienced cat owner with stable home environment.',
    decisionReason: 'Approved based on experience, stable home, and good references.'
  },
  {
    id: '3',
    animalId: '3',
    animalName: 'Josh',
    animalType: 'dog',
    animalBreed: 'Labrador',
    animalAge: '3 years',
    applicantName: 'Miguel Torres',
    applicantEmail: 'miguel.torres@email.com',
    applicantPhone: '+63 978 901 2345',
    applicantAge: 22,
    applicantOccupation: 'Student',
    applicantBarangay: 'Barangay 5',
    applicantAddress: '789 Pine Street, Barangay 5, Lipa City',
    homeType: 'Apartment',
    hasYard: 'No',
    yardSize: '',
    hasOtherPets: 'No',
    otherPetsDetails: '',
    hasChildren: 'No',
    childrenAges: '',
    petExperience: 'No, this would be my first pet',
    vetKnowledge: 'Limited knowledge',
    timeCommitment: 'I can spend 1-2 hours daily',
    exercisePlan: 'Walks around the neighborhood',
    reference1Name: 'Carlos Lopez',
    reference1Phone: '+63 989 012 3456',
    reference1Relation: 'Roommate',
    reference2Name: 'Elena Ruiz',
    reference2Phone: '+63 990 123 4567',
    reference2Relation: 'Friend',
    adoptionReason: 'I want a companion while studying.',
    specialNeeds: 'None',
    emergencyPlan: 'I will ask my parents for help with vet bills.',
    consent: true,
    status: 'rejected',
    priority: 'normal',
    submittedAt: '2024-01-13T09:15:00Z',
    reviewedBy: 'Dr. Ana Rodriguez',
    reviewedAt: '2024-01-13T11:30:00Z',
    notes: 'Concerns about financial stability and experience level.',
    decisionReason: 'Rejected due to lack of pet experience, limited time commitment, and financial concerns.'
  }
]

const AdoptionsManagement = () => {
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [animalFilter, setAnimalFilter] = useState<'all' | 'dog' | 'cat'>('all')
  const [selectedAdoption, setSelectedAdoption] = useState<any>(null)
  const [showAdoptionModal, setShowAdoptionModal] = useState(false)
  const [showDecisionModal, setShowDecisionModal] = useState(false)
  const [decisionType, setDecisionType] = useState<'approve' | 'reject'>('approve')
  const [decisionReason, setDecisionReason] = useState('')

  const filteredAdoptions = MOCK_ADOPTIONS.filter(adoption => {
    const matchesSearch = searchTerm === '' || 
      adoption.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adoption.animalName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      adoption.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'all' || adoption.status === statusFilter
    const matchesAnimal = animalFilter === 'all' || adoption.animalType === animalFilter

    return matchesSearch && matchesStatus && matchesAnimal
  })

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      case 'approved': return 'bg-green-100 text-green-800'
      case 'rejected': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }


  const handleViewAdoption = (adoption: any) => {
    setSelectedAdoption(adoption)
    setShowAdoptionModal(true)
  }

  const handleMakeDecision = (adoption: any, type: 'approve' | 'reject') => {
    setSelectedAdoption(adoption)
    setDecisionType(type)
    setDecisionReason('')
    setShowDecisionModal(true)
  }

  const handleSubmitDecision = () => {
    // In production, this would update the database
    console.log(`Decision: ${decisionType} for adoption ${selectedAdoption.id}`)
    console.log(`Reason: ${decisionReason}`)
    setShowDecisionModal(false)
    setShowAdoptionModal(false)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Adoption Management</h1>
          <p className="text-gray-600 mt-2">Review and manage adoption applications from potential pet owners.</p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search applications..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
            </div>

            {/* Status Filter */}
            <div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="approved">Approved</option>
                <option value="rejected">Rejected</option>
              </select>
            </div>

            {/* Animal Type Filter */}
            <div>
              <select
                value={animalFilter}
                onChange={(e) => setAnimalFilter(e.target.value as any)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
              >
                <option value="all">All Animals</option>
                <option value="dog">Dogs</option>
                <option value="cat">Cats</option>
              </select>
            </div>
          </div>
        </div>

        {/* Adoptions Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">
                Adoption Applications ({filteredAdoptions.length})
              </h2>
              <button className="flex items-center space-x-2 text-orange-600 hover:text-orange-700">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Animal</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Applicant</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Submitted</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAdoptions.map((adoption) => (
                  <tr key={adoption.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="bg-orange-100 p-2 rounded-full">
                          <Heart className="h-4 w-4 text-orange-600" />
                        </div>
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{adoption.animalName}</div>
                          <div className="text-sm text-gray-500 capitalize">{adoption.animalType} • {adoption.animalBreed}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{adoption.applicantName}</div>
                      <div className="text-sm text-gray-500">{adoption.applicantAge} years • {adoption.applicantOccupation}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{adoption.applicantPhone}</div>
                      <div className="text-sm text-gray-500">{adoption.applicantEmail}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {adoption.petExperience === 'Yes, I have owned dogs before' || adoption.petExperience === 'Yes, I have owned cats for 10 years' ? 'Experienced' : 'First-time'}
                      </div>
                      <div className="text-sm text-gray-500">{adoption.homeType} • {adoption.hasYard === 'Yes' ? 'Has yard' : 'No yard'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(adoption.status)}`}>
                        {adoption.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(adoption.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleViewAdoption(adoption)}
                          className="text-orange-600 hover:text-orange-900 flex items-center space-x-1"
                        >
                          <Eye className="h-4 w-4" />
                          <span>View</span>
                        </button>
                        {adoption.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleMakeDecision(adoption, 'approve')}
                              className="text-green-600 hover:text-green-900 flex items-center space-x-1"
                            >
                              <CheckCircle className="h-4 w-4" />
                              <span>Approve</span>
                            </button>
                            <button
                              onClick={() => handleMakeDecision(adoption, 'reject')}
                              className="text-red-600 hover:text-red-900 flex items-center space-x-1"
                            >
                              <XCircle className="h-4 w-4" />
                              <span>Reject</span>
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Adoption Detail Modal */}
        {showAdoptionModal && selectedAdoption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <div className="flex items-center space-x-3">
                  <div className="bg-orange-100 p-3 rounded-full">
                    <Heart className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Adoption Application</h2>
                    <p className="text-sm text-gray-600">#{selectedAdoption.id} • {selectedAdoption.animalName}</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowAdoptionModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XCircle className="h-6 w-6" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-6 space-y-6">
                {/* Animal Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Animal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Name</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.animalName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Type</label>
                      <p className="text-sm text-gray-900 capitalize">{selectedAdoption.animalType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Breed</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.animalBreed}</p>
                    </div>
                  </div>
                </div>

                {/* Applicant Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Applicant Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantName}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Age</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantAge} years</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Occupation</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantOccupation}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantPhone}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantEmail}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Barangay</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantBarangay}</p>
                    </div>
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700">Address</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.applicantAddress}</p>
                    </div>
                  </div>
                </div>

                {/* Home Environment */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Home Environment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Home Type</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.homeType}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Has Yard</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.hasYard}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Other Pets</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.hasOtherPets}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Children</label>
                      <p className="text-sm text-gray-900">{selectedAdoption.hasChildren}</p>
                    </div>
                    {selectedAdoption.otherPetsDetails && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Other Pets Details</label>
                        <p className="text-sm text-gray-900">{selectedAdoption.otherPetsDetails}</p>
                      </div>
                    )}
                    {selectedAdoption.childrenAges && (
                      <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700">Children Ages</label>
                        <p className="text-sm text-gray-900">{selectedAdoption.childrenAges}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Experience & Knowledge */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Experience & Knowledge</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Pet Experience</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.petExperience}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Veterinary Knowledge</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.vetKnowledge}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Time Commitment</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.timeCommitment}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Exercise Plan</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.exercisePlan}</p>
                    </div>
                  </div>
                </div>

                {/* References */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">References</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Reference 1</h4>
                      <p className="text-sm text-gray-900"><strong>Name:</strong> {selectedAdoption.reference1Name}</p>
                      <p className="text-sm text-gray-900"><strong>Phone:</strong> {selectedAdoption.reference1Phone}</p>
                      <p className="text-sm text-gray-900"><strong>Relation:</strong> {selectedAdoption.reference1Relation}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <h4 className="font-medium text-gray-900 mb-2">Reference 2</h4>
                      <p className="text-sm text-gray-900"><strong>Name:</strong> {selectedAdoption.reference2Name}</p>
                      <p className="text-sm text-gray-900"><strong>Phone:</strong> {selectedAdoption.reference2Phone}</p>
                      <p className="text-sm text-gray-900"><strong>Relation:</strong> {selectedAdoption.reference2Relation}</p>
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Adoption Reason</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.adoptionReason}</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Emergency Plan</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.emergencyPlan}</p>
                    </div>
                  </div>
                </div>

                {/* Status Information */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Status Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Current Status</label>
                      <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusColor(selectedAdoption.status)}`}>
                        {selectedAdoption.status}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Submitted At</label>
                      <p className="text-sm text-gray-900">{formatDate(selectedAdoption.submittedAt)}</p>
                    </div>
                    {selectedAdoption.reviewedBy && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reviewed By</label>
                        <p className="text-sm text-gray-900">{selectedAdoption.reviewedBy}</p>
                      </div>
                    )}
                    {selectedAdoption.reviewedAt && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700">Reviewed At</label>
                        <p className="text-sm text-gray-900">{formatDate(selectedAdoption.reviewedAt)}</p>
                      </div>
                    )}
                  </div>
                  {selectedAdoption.decisionReason && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700">Decision Reason</label>
                      <p className="text-sm text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedAdoption.decisionReason}</p>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex items-center justify-end space-x-4 pt-6 border-t border-gray-200">
                  <button
                    onClick={() => setShowAdoptionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Close
                  </button>
                  {selectedAdoption.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleMakeDecision(selectedAdoption, 'approve')}
                        className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleMakeDecision(selectedAdoption, 'reject')}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center space-x-2"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Decision Modal */}
        {showDecisionModal && selectedAdoption && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className={`p-2 rounded-full ${decisionType === 'approve' ? 'bg-green-100' : 'bg-red-100'}`}>
                    {decisionType === 'approve' ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <XCircle className="h-6 w-6 text-red-600" />
                    )}
                  </div>
                  <h2 className="text-xl font-bold text-gray-900">
                    {decisionType === 'approve' ? 'Approve' : 'Reject'} Adoption
                  </h2>
                </div>
                
                <p className="text-gray-600 mb-4">
                  {decisionType === 'approve' 
                    ? `Are you sure you want to approve ${selectedAdoption.applicantName}'s adoption application for ${selectedAdoption.animalName}?`
                    : `Are you sure you want to reject ${selectedAdoption.applicantName}'s adoption application for ${selectedAdoption.animalName}?`
                  }
                </p>

                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {decisionType === 'approve' ? 'Approval' : 'Rejection'} Reason
                  </label>
                  <textarea
                    value={decisionReason}
                    onChange={(e) => setDecisionReason(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    placeholder={`Enter the reason for ${decisionType === 'approve' ? 'approval' : 'rejection'}...`}
                  />
                </div>

                <div className="flex items-center justify-end space-x-4">
                  <button
                    onClick={() => setShowDecisionModal(false)}
                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmitDecision}
                    disabled={!decisionReason.trim()}
                    className={`px-4 py-2 text-white rounded-lg transition-colors flex items-center space-x-2 ${
                      decisionType === 'approve' 
                        ? 'bg-green-600 hover:bg-green-700 disabled:bg-green-400' 
                        : 'bg-red-600 hover:bg-red-700 disabled:bg-red-400'
                    }`}
                  >
                    {decisionType === 'approve' ? (
                      <CheckCircle className="h-4 w-4" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    <span>{decisionType === 'approve' ? 'Approve' : 'Reject'}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default AdoptionsManagement
