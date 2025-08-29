import { useState } from 'react'
import { useModalStore } from '../stores/modalStore'
import { X, Search, Heart, AlertTriangle } from 'lucide-react'
import LostAnimalForm from './reportForms/LostAnimalForm'
import FoundAnimalForm from './reportForms/FoundAnimalForm'
import AbusedAnimalForm from './reportForms/AbusedAnimalForm'

type ReportType = 'lost' | 'found' | 'abused' | null

const ReportModal = () => {
  const [reportType, setReportType] = useState<ReportType>(null)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const { isReportModalOpen, closeReportModal } = useModalStore()

  const handleClose = () => {
    setReportType(null)
    setIsSubmitted(false)
    closeReportModal()
  }

  const handleSubmitSuccess = () => {
    setIsSubmitted(true)
  }

  if (!isReportModalOpen) return null

  return (
    <div className={`fixed inset-0 z-50 overflow-y-auto ${reportType ? 'bg-white' : 'bg-black bg-opacity-50'} flex items-center justify-center p-4`}>
      <div
        className={`${reportType ? 'w-full h-full max-w-none rounded-none' : 'max-w-2xl rounded-lg'} bg-white shadow-xl overflow-hidden`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 h-full flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              {isSubmitted ? 'Thank You!' : reportType ? 'Submit a Report' : 'Submit a Report'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {/* Success Message */}
          {isSubmitted ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center py-8 max-w-md">
                <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 mb-4">
                  <svg
                    className="h-8 w-8 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Report Submitted Successfully!</h3>
                <p className="text-gray-600 mb-6">
                  Your report has been received. We'll review it and get back to you soon.
                </p>
                <button
                  onClick={handleClose}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
                >
                  Done
                </button>
              </div>
            </div>
          ) : reportType ? (
            <div className="flex-1 overflow-auto">
              {reportType === 'found' && (
                <FoundAnimalForm
                  onBack={() => setReportType(null)}
                  onClose={handleClose}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              )}
              {reportType === 'lost' && (
                <LostAnimalForm
                  onBack={() => setReportType(null)}
                  onClose={handleClose}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              )}
              {reportType === 'abused' && (
                <AbusedAnimalForm
                  onBack={() => setReportType(null)}
                  onClose={handleClose}
                  onSubmitSuccess={handleSubmitSuccess}
                />
              )}
            </div>
          ) : (
            <div className="flex-1 overflow-auto">
              <p className="text-gray-600 text-center mb-6">
                Please select the type of report you would like to submit:
              </p>

              <div className="grid gap-4">
                <button
                  onClick={() => setReportType('lost')}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                    <Search className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Lost Animal</h3>
                    <p className="text-gray-600">Report a missing pet and provide information to help locate it</p>
                  </div>
                </button>

                <button
                  onClick={() => setReportType('found')}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4">
                    <Heart className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Found Animal</h3>
                    <p className="text-gray-600">Report a found animal to help reunite it with its owner</p>
                  </div>
                </button>

                <button
                  onClick={() => setReportType('abused')}
                  className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200"
                >
                  <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
                    <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="text-left">
                    <h3 className="text-lg font-semibold text-gray-900">Abused Animal</h3>
                    <p className="text-gray-600">Report animal abuse or neglect to the authorities</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ReportModal