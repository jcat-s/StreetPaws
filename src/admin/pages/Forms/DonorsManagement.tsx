import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query } from 'firebase/firestore'
import { db } from '../../../config/firebase'

type Donation = {
  id: string
  name: string
  email: string
  phone?: string | null
  amount: number
  paymentMethod: string
  reference?: string | null
  message?: string | null
  status: 'pending' | 'verified' | 'rejected'
  createdAt: string
}

const Donors = () => {
  const [items, setItems] = useState<Donation[]>([])

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'donations'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      const mapped: Donation[] = snap.docs.map((d) => {
        const data: any = d.data()
        const createdAt = data?.createdAt?.toDate ? data.createdAt.toDate().toISOString() : new Date().toISOString()
        return {
          id: d.id,
          name: data?.name || '',
          email: data?.email || '',
          phone: data?.phone || null,
          amount: Number(data?.amount || 0),
          paymentMethod: data?.paymentMethod || '',
          reference: data?.reference || null,
          message: data?.message || null,
          status: (data?.status || 'pending') as Donation['status'],
          createdAt
        }
      })
      setItems(mapped)
    })
    return () => unsub()
  }, [])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Donors</h1>
      <div className="bg-white rounded-lg border">
        <table className="min-w-full">
          <thead>
            <tr className="text-left text-sm text-gray-600">
              <th className="p-3">Name</th>
              <th className="p-3">Email</th>
              <th className="p-3">Amount</th>
              <th className="p-3">Method</th>
              <th className="p-3">Reference</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {items.map((d) => (
              <tr key={d.id} className="border-t">
                <td className="p-3">{d.name}</td>
                <td className="p-3">{d.email}</td>
                <td className="p-3">₱{d.amount.toLocaleString()}</td>
                <td className="p-3 capitalize">{d.paymentMethod}</td>
                <td className="p-3">{d.reference || '—'}</td>
                <td className="p-3 capitalize">{d.status}</td>
                <td className="p-3">{new Date(d.createdAt).toLocaleString()}</td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td className="p-6 text-gray-500" colSpan={7}>No donations yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Donors


