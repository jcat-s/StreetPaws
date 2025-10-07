import { useEffect, useState } from 'react'
import { collection, onSnapshot, orderBy, query, updateDoc, doc, deleteDoc, setDoc } from 'firebase/firestore'
import { db } from '../../config/firebase'
import { Archive, Trash2, Mail, CheckCircle, Clock, X } from 'lucide-react'

type Message = {
  id: string
  name: string
  email: string
  subject: string
  message: string
  createdAt?: { seconds: number }
  read?: boolean
  archived?: boolean
}

const MessageManagement = () => {
  const [messages, setMessages] = useState<Message[]>([])
  const [selected, setSelected] = useState<Message | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [lastDeleted, setLastDeleted] = useState<{ id: string; item: Message } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<Message | null>(null)
  const [undoSeconds, setUndoSeconds] = useState<number>(0)

  useEffect(() => {
    if (!db) return
    const q = query(collection(db, 'messages'), orderBy('createdAt', 'desc'))
    const unsub = onSnapshot(q, (snap) => {
      setMessages(snap.docs.map((d) => ({ id: d.id, ...(d.data() as any) })))
    })
    return () => unsub()
  }, [])

  const markRead = async (m: Message, read = true) => {
    if (!db) return
    try { await updateDoc(doc(db, 'messages', m.id), { read }) } catch {}
  }
  const toggleArchive = async (m: Message) => {
    if (!db) return
    try { await updateDoc(doc(db, 'messages', m.id), { archived: !m.archived }) } catch {}
  }
  const remove = async (m: Message) => {
    if (!db) return
    try { 
      setLastDeleted({ id: m.id, item: m })
      await deleteDoc(doc(db, 'messages', m.id)) 
      setUndoSeconds(10)
    } catch {}
  }
  const undoDelete = async () => {
    if (!db || !lastDeleted) return
    try {
      const { id, item } = lastDeleted
      const { createdAt, ...rest } = item as any
      await setDoc(doc(db, 'messages', id), { ...rest, ...(createdAt ? { createdAt } : {}) })
    } catch {}
    finally { setLastDeleted(null) }
  }

  // countdown handler for undo bar
  useEffect(() => {
    if (!lastDeleted) return
    setUndoSeconds((s) => (s <= 0 ? 10 : s))
    const interval = setInterval(() => {
      setUndoSeconds((s) => {
        if (s <= 1) {
          clearInterval(interval)
          return 0
        }
        return s - 1
      })
    }, 1000)
    return () => clearInterval(interval)
  }, [lastDeleted])

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-4">Message Management</h1>
      <div className="bg-white rounded-lg shadow-sm border border-gray-100">
        <div className="px-4 py-3 border-b text-sm text-gray-600 flex items-center gap-3">
          <Mail className="h-4 w-4" /> Inbox
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Full Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Email</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Subject</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {messages.map((m) => (
                <tr key={m.id} className={`hover:bg-gray-50 ${m.archived ? 'bg-orange-50/40' : ''}`}>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => { setSelected(m); setShowModal(true); if (!m.read) markRead(m, true) }}>{m.name || '(No name)'}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => { setSelected(m); setShowModal(true); if (!m.read) markRead(m, true) }}>{m.email}</td>
                  <td className="px-4 py-3 cursor-pointer" onClick={() => { setSelected(m); setShowModal(true); if (!m.read) markRead(m, true) }}>{m.subject || '(No subject)'}</td>
                  <td className="px-4 py-3 text-xs text-gray-500">{m.createdAt?.seconds ? new Date(m.createdAt.seconds * 1000).toLocaleString() : ''}</td>
                  <td className="px-4 py-3 text-xs">{m.read ? <span className="inline-flex items-center text-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Read</span> : <span className="inline-flex items-center text-orange-600"><Clock className="h-3 w-3 mr-1" /> New</span>}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button className="inline-flex items-center px-3 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50" onClick={() => markRead(m, !m.read)}>
                        <CheckCircle className="h-4 w-4 mr-1" /> {m.read ? 'Mark as Unread' : 'Mark as Read'}
                      </button>
                      <button className="inline-flex items-center px-3 py-1.5 text-xs rounded-md border border-gray-300 hover:bg-gray-50" onClick={() => toggleArchive(m)}>
                        <Archive className="h-4 w-4 mr-1" /> {m.archived ? 'Unarchive' : 'Archive'}
                      </button>
                      <button className="inline-flex items-center px-3 py-1.5 text-xs rounded-md border border-red-300 text-red-600 hover:bg-red-50" onClick={() => setConfirmDelete(m)}>
                        <Trash2 className="h-4 w-4 mr-1" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {messages.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-gray-600">No messages yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {showModal && selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b bg-orange-50 flex items-center justify-between">
              <h2 className="text-sm font-bold text-orange-700 tracking-wide uppercase">Message Details</h2>
              <button className="text-orange-500 hover:text-orange-700" onClick={() => setShowModal(false)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto">
              <div className="p-5 space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Full Name</div>
                    <div className="text-sm text-gray-800">{selected.name || '(No name)'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Email</div>
                    <div className="text-sm text-gray-800">{selected.email}</div>
                  </div>
                  <div className="md:col-span-2">
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Subject</div>
                    <div className="text-sm text-gray-800">{selected.subject || '(No subject)'}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Date</div>
                    <div className="text-sm text-gray-800">{selected.createdAt?.seconds ? new Date(selected.createdAt.seconds * 1000).toLocaleString() : ''}</div>
                  </div>
                  <div>
                    <div className="text-[11px] font-semibold text-gray-500 uppercase">Status</div>
                    <div className="text-xs">{selected.read ? <span className="inline-flex items-center text-green-600"><CheckCircle className="h-3 w-3 mr-1" /> Read</span> : <span className="inline-flex items-center text-orange-600"><Clock className="h-3 w-3 mr-1" /> New</span>}</div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold text-gray-500 uppercase">Message</div>
                  <div className="mt-1 text-sm text-gray-800 whitespace-pre-wrap border rounded-md p-3 bg-gray-50">{selected.message}</div>
                </div>
              </div>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
              <button className="inline-flex items-center px-3 py-2 text-xs rounded-full border border-gray-300 hover:bg-white" onClick={() => { markRead(selected, !selected.read); }}>
                <CheckCircle className="h-4 w-4 mr-1" /> {selected.read ? 'Mark as Unread' : 'Mark as Read'}
              </button>
              <button className="inline-flex items-center px-3 py-2 text-xs rounded-full border border-gray-300 hover:bg-white" onClick={() => { toggleArchive(selected); }}>
                <Archive className="h-4 w-4 mr-1" /> {selected.archived ? 'Unarchive' : 'Archive'}
              </button>
              <button className="inline-flex items-center px-3 py-2 text-xs rounded-full border border-red-300 text-red-600 hover:bg-red-50" onClick={() => { setConfirmDelete(selected); }}>
                <Trash2 className="h-4 w-4 mr-1" /> Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="px-5 py-4 border-b flex items-center gap-3">
              <div className="h-10 w-10 bg-red-50 text-red-600 rounded-full flex items-center justify-center">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <div className="text-base font-bold text-gray-900">Delete Message</div>
                <div className="text-xs text-gray-500">This action cannot be undone</div>
              </div>
              <button className="ml-auto text-gray-400 hover:text-gray-600" onClick={() => setConfirmDelete(null)} aria-label="Close">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-700">Are you sure you want to delete this message from <span className="font-semibold">{confirmDelete.name}</span> &lt;{confirmDelete.email}&gt;?</p>
              <div className="rounded-md border border-yellow-200 bg-yellow-50 p-3 text-yellow-800 text-sm">
                <span className="font-semibold">Note:</span> You'll have 10 seconds to undo this action after deletion.
              </div>
            </div>
            <div className="px-5 py-4 border-t bg-gray-50 flex items-center justify-end gap-2">
              <button className="inline-flex items-center px-4 py-2 text-sm rounded-full border border-gray-300 hover:bg-white" onClick={() => setConfirmDelete(null)}>Cancel</button>
              <button className="inline-flex items-center px-4 py-2 text-sm rounded-full bg-red-600 text-white hover:bg-red-700" onClick={() => { remove(confirmDelete); setConfirmDelete(null); setShowModal(false); }}>
                <Trash2 className="h-5 w-5 mr-2" /> Delete Message
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Undo snackbar */}
      {lastDeleted && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-white border border-orange-300 text-orange-700 rounded-full shadow-lg px-4 py-2 flex items-center gap-3">
          <span className="text-xs">Message deleted. Undo in {undoSeconds}s</span>
          <button onClick={undoDelete} className="text-xs font-semibold hover:underline">Undo</button>
        </div>
      )}
    </div>
  )
}

export default MessageManagement



