import React from 'react'
import { X, MapPin, AlertTriangle } from 'lucide-react'

interface LocationErrorModalProps {
  isOpen: boolean
  onClose: () => void
  message: string
}

const LocationErrorModal: React.FC<LocationErrorModalProps> = ({
  isOpen,
  onClose,
  message
}) => {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-2xl max-w-md w-full mx-4 transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              Location Not Supported
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors duration-200"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
              <MapPin className="w-4 h-4 text-orange-600" />
            </div>
            <div className="flex-1">
              <p className="text-gray-700 leading-relaxed">
                {message}
              </p>
              <div className="mt-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                <p className="text-sm text-orange-800">
                  <span className="font-medium">Tip:</span> Try searching for locations like:
                </p>
                <ul className="mt-2 text-sm text-orange-700 space-y-1">
                  <li>• Barangay 1, Lipa City, Batangas</li>
                  <li>• Lipa City Hall, Batangas</li>
                  <li>• Lipa City Public Market</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 rounded-b-xl">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200 font-medium"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  )
}

export default LocationErrorModal

