import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../../config/firebase'

type Volunteer = {
  id: string
  name: string
  email: string
  phone: string
  barangay: string
  skills?: string
  availability?: string
  preferredRoles?: string[]
  experience?: string
  status: 'pending' | 'approved' | 'rejected'
  createdAt: string
}

const Volunteers = () => {
  const [items, setItems] = useState<Volunteer[]>([])

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'volunteers'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const mapped: Volunteer[] = snap.docs.map((d) => {
        const data: any = d.data()
        const createdAt = data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        return {
          id: d.id,
          name: data?.name || '',
          email: data?.email || '',
          phone: data?.phone || '',
          barangay: data?.barangay || '',
          skills: data?.skills || '',
          availability: data?.availability || '',
          preferredRoles: Array.isArray(data?.preferredRoles) ? data.preferredRoles : [],
          experience: data?.experience || '',
          status: (data?.status || 'pending') as Volunteer['status'],
          createdAt
        }
      })
      setItems(mapped)
    })
    return () => unsub()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Volunteers</h1>
      <div className="bg-white rounded-lg border">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Phone</th>
              <th className="p-3">Barangay</th>
              <th className="p-3">Availability</th>
              <th className="p-3">Roles</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((v) => (
              <tr key={v.id} className="border-t">
                <td className="p-3">{v.name}</td>
                <td className="p-3">{v.email}</td>
                <td className="p-3">{v.phone}</td>
                <td className="p-3">{v.barangay}</td>
                <td className="p-3 capitalize">{v.availability || '—'}</td>
                <td className="p-3">{(v.preferredRoles || []).join(', ') || '—'}</td>
                <td className="p-3 capitalize">{v.status}</td>
                <td className="p-3">{new Date(v.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-6 text-gray-500" colSpan={8}>No volunteers yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Volunteers


