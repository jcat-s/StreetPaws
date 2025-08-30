import { useParams, useNavigate } from 'react-router-dom'
import LostAnimalForm from '../components/reportForms/LostAnimalForm'
import FoundAnimalForm from '../components/reportForms/FoundAnimalForm'
import AbusedAnimalForm from '../components/reportForms/AbusedAnimalForm'

type ReportType = 'lost' | 'found' | 'abused'

const ReportFormPage = () => {
  const { type } = useParams<{ type: ReportType }>()
  const navigate = useNavigate()

  const handleSubmitSuccess = () => {
    navigate('/report/success')
  }

  const renderForm = () => {
    switch (type) {
      case 'lost':
        return (
          <LostAnimalForm
            onBack={() => navigate(-1)}
            onClose={() => navigate('/')}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )
      case 'found':
        return (
          <FoundAnimalForm
            onBack={() => navigate(-1)}
            onClose={() => navigate('/')}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )
      case 'abused':
        return (
          <AbusedAnimalForm
            onBack={() => navigate(-1)}
            onClose={() => navigate('/')}
            onSubmitSuccess={handleSubmitSuccess}
          />
        )
      default:
        return <div className="p-8">Invalid report type</div>
    }
  }

  if (!type || !['lost', 'found', 'abused'].includes(type)) {
    return <div className="p-8">Invalid report type</div>
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-7xl mx-auto p-4 md:p-8">{renderForm()}</div>
    </div>
  )
}

export default ReportFormPage
