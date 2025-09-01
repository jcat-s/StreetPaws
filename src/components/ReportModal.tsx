import { useModalStore } from '../stores/modalStore'
import { X, Search, Heart, AlertTriangle } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const ReportModal = () => {
  const { isReportModalOpen, closeReportModal } = useModalStore()
  const navigate = useNavigate()

  const handleClose = () => {
    closeReportModal()
  }

  if (!isReportModalOpen) return null

  return (
    <div className={`fixed inset-0 z-50 bg-black bg-opacity-50 flex items-center justify-center p-4`}>
      <div className={`max-w-2xl rounded-lg bg-white shadow-xl overflow-hidden`} onClick={(e) => e.stopPropagation()}>
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Submit a Report</h2>
            <button onClick={handleClose} className="text-gray-400 hover:text-gray-600"><X className="h-6 w-6" /></button>
          </div>

          <p className="text-gray-600 text-center mb-6">Please select the type of report you would like to submit:</p>

          <div className="grid gap-4">
            <button onClick={() => { navigate('/report/lost'); closeReportModal(); }} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200">
              <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4"><Search className="h-6 w-6 text-red-600" /></div>
              <div className="text-left"><h3 className="text-lg font-semibold text-gray-900">Lost Animal</h3><p className="text-gray-600">Report a missing pet and provide information to help locate it</p></div>
            </button>

            <button onClick={() => { navigate('/report/found'); closeReportModal(); }} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200">
              <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mr-4"><Heart className="h-6 w-6 text-green-600" /></div>
              <div className="text-left"><h3 className="text-lg font-semibold text-gray-900">Found Animal</h3><p className="text-gray-600">Report a found animal to help reunite it with its owner</p></div>
            </button>

            <button onClick={() => { navigate('/report/abuse'); closeReportModal(); }} className="flex items-center p-4 border-2 border-gray-200 rounded-lg hover:border-primary-300 hover:bg-primary-50 transition-colors duration-200">
              <div className="flex-shrink-0 w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4"><AlertTriangle className="h-6 w-6 text-yellow-600" /></div>
              <div className="text-left"><h3 className="text-lg font-semibold text-gray-900">Abused Animal</h3><p className="text-gray-600">Report animal abuse or neglect to the authorities</p></div>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ReportModal