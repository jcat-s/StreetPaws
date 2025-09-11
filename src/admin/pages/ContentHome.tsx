import { Link } from 'react-router-dom'

const ContentHome = () => {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Content Management</h1>
      <div className="space-x-3">
        <Link className="text-orange-600 hover:underline" to="/admin/content/lost">Manage Lost</Link>
        <Link className="text-orange-600 hover:underline" to="/admin/content/found">Manage Found</Link>
      </div>
    </div>
  )
}

export default ContentHome


