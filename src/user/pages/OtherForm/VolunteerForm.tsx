import { useForm } from 'react-hook-form';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../../config/firebase'
import { useAuth } from '../../../contexts/AuthContext'

interface VolunteerFormData {
    name: string;
    email: string;
    phone: string;
    barangay: string;
    skills: string;
    message: string;
    availability?: string;
    preferredRoles?: string[];
    experience?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    consent?: boolean;
}

// Removed static barangay list; using free-text location input to support global addresses

const VolunteerForm = () => {
    const { currentUser } = useAuth()
    const { register, handleSubmit, formState: { errors }, reset } = useForm<VolunteerFormData>();
    const [otherRole, setOtherRole] = useState('');

    const onSubmit = async (data: VolunteerFormData) => {
        try {
            if (!db) throw new Error('Firestore not initialized')
            const payload = {
                ...data,
                preferredRoles: [...(data.preferredRoles || []), ...(otherRole ? [otherRole] : [])],
                userId: currentUser?.uid || null, // Capture user ID for notifications
                createdAt: serverTimestamp(),
                status: 'pending'
            }
            await addDoc(collection(db, 'volunteers'), payload)
            toast.success('Thank you for volunteering!')
            reset()
            setOtherRole('')
        } catch (e) {
            toast.error('Failed to submit volunteer form. Please try again.')
        }
    };

    return (
        <div className="min-h-screen bg-white flex items-center justify-center py-8">
            <div className="w-full max-w-4xl bg-orange-50 rounded-xl shadow-lg border border-orange-200 p-8">
                <h1 className="text-2xl font-bold text-center text-orange-500 mb-6">Volunteer Application</h1>
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                            <input {...register('name', { required: 'Name is required' })} type="text" className="input-field" placeholder="e.g., Juan Dela Cruz" />
                            {errors.name && <p className="text-sm text-red-600">{errors.name.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                            <input {...register('email', { required: 'Email is required', pattern: { value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i, message: 'Invalid email address' } })} type="email" className="input-field" placeholder="e.g., juan@email.com" />
                            {errors.email && <p className="text-sm text-red-600">{errors.email.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
                            <input {...register('phone', { required: 'Phone is required', validate: value => /^\d+$/.test(value) || 'Numbers only' })} type="tel" className="input-field" placeholder="e.g., 09123456789" onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
                            {errors.phone && <p className="text-sm text-red-600">{errors.phone.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Location (City/Region, Country) *</label>
                            <input {...register('barangay', { required: 'Location is required' })} type="text" className="input-field" placeholder="e.g., Lipa City, Batangas, Philippines" />
                            {errors.barangay && <p className="text-sm text-red-600">{errors.barangay.message}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Skills</label>
                            <input {...register('skills')} type="text" className="input-field" placeholder="e.g., Animal care, Social media" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                            <select {...register('availability')} className="input-field">
                                <option value="">Select availability</option>
                                <option value="weekdays">Weekdays</option>
                                <option value="weekends">Weekends</option>
                                <option value="evenings">Evenings</option>
                                <option value="flexible">Flexible</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Roles</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['Shelter Care', 'Transport & Rescue', 'Events & Fundraising', 'Foster Care', 'Photography', 'Admin'].map((r) => (
                                    <label key={r} className="inline-flex items-center space-x-2">
                                        <input type="checkbox" value={r} {...register('preferredRoles')} />
                                        <span className="text-sm">{r}</span>
                                    </label>
                                ))}
                            </div>
                            <div className="mt-2">
                                <input type="text" value={otherRole} onChange={e => setOtherRole(e.target.value)} placeholder="Other role (optional)" className="input-field" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Experience</label>
                            <textarea {...register('experience')} className="input-field" placeholder="Briefly describe any relevant experience (optional)" rows={3} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                                <input {...register('emergencyContactName')} type="text" className="input-field" placeholder="e.g., Maria Santos" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                                <input {...register('emergencyContactPhone', { validate: v => !v || /^\d+$/.test(v) || 'Numbers only' })} type="tel" className="input-field" placeholder="e.g., 09123456789" onKeyPress={e => { if (!/[0-9]/.test(e.key)) e.preventDefault(); }} />
                            </div>
                        </div>
                    </div>
                    <div className="flex items-start space-x-2">
                        <input type="checkbox" {...register('consent', { required: 'You must agree to the terms' })} />
                        <label className="text-sm">I agree to be contacted and to follow the volunteer guidelines.</label>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                        <textarea {...register('message')} className="input-field" placeholder="Optional message..." rows={3} />
                    </div>
                    <button type="submit" className="btn-primary w-full mt-4">Volunteer</button>
                </form>
            </div>
        </div>
    );
};

export default VolunteerForm;
