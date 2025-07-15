import { Link } from 'react-router-dom'

const OurAnimals = () => {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Our Animals</h1>
          <p className="text-lg text-gray-600 mb-8">
            Meet the wonderful animals currently in our care.
          </p>
          <Link to="/adopt" className="btn-primary">
            View Adoptable Animals
          </Link>
        </div>
      </div>
    </div>
  )
}

export default OurAnimals 