'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { Lock, Unlock, Calendar, Trash, Pencil, X } from 'lucide-react'

// JOIN types
interface CarLock {
    id: string
    car_id: string
    start_time: string
    end_time: string
    reason: string
    note: string
    created_at: string
    car: {
        name: string
        car_number: string
    }
}

export default function AdminLocksPage() {
    const [locks, setLocks] = useState<CarLock[]>([])
    const [loading, setLoading] = useState(true)
    const [editingLock, setEditingLock] = useState<CarLock | null>(null)
    const [editForm, setEditForm] = useState({ start_time: '', end_time: '' })

    useEffect(() => {
        fetchLocks()
    }, [])

    const fetchLocks = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('car_locks')
            .select(`
                *,
                car:cars(name, car_number)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching locks:', error)
        } else {
            // Safe cast (supabase join returns array or object depending on relationship, strictly singular here)
            const formatted = (data || []).map(l => ({
                ...l,
                car: l.car || { name: 'Unknown', car_number: 'N/A' }
            }))
            setLocks(formatted as CarLock[])
        }
        setLoading(false)
    }

    const handleUpdateLock = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!editingLock) return

        const { error } = await supabase
            .from('car_locks')
            .update({
                start_time: editForm.start_time,
                end_time: editForm.end_time
            })
            .eq('id', editingLock.id)

        if (error) {
            alert('Error updating lock: ' + error.message)
        } else {
            setEditingLock(null)
            fetchLocks()
        }
    }

    const startEdit = (lock: CarLock) => {
        setEditingLock(lock)
        setEditForm({
            start_time: new Date(lock.start_time).toISOString().slice(0, 16),
            end_time: new Date(lock.end_time).toISOString().slice(0, 16)
        })
    }

    const handleUnlock = async (lockId: string, carId: string) => {
        if (!confirm('Are you sure you want to delete this lock and UNLOCK the car?')) return

        // 1. Delete lock
        const { error: deleteError } = await supabase
            .from('car_locks')
            .delete()
            .eq('id', lockId)

        if (deleteError) {
            alert('Error deleting lock: ' + deleteError.message)
            return
        }

        // 2. Set car status to AVAILABLE
        const { error: updateError } = await supabase
            .from('cars')
            .update({ status: 'AVAILABLE' })
            .eq('id', carId)

        if (updateError) {
            alert('Lock deleted, but failed to update car status: ' + updateError.message)
        } else {
            fetchLocks()
        }
    }

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Manual Car Locks</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        View and manage active locks. Deleting a lock will immediately make the car AVAILABLE.
                    </p>
                </div>
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Lock Period</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Reason</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Created</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-10 text-center text-sm text-gray-500">
                                                Loading locks...
                                            </td>
                                        </tr>
                                    ) : locks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-10 text-center text-sm text-gray-500">
                                                No active locks found.
                                            </td>
                                        </tr>
                                    ) : (
                                        locks.map((lock) => (
                                            <tr key={lock.id}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <div className="font-medium text-gray-900">{lock.car.name}</div>
                                                    <div className="text-gray-500 font-mono text-xs">{lock.car.car_number}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="flex items-center text-xs">
                                                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                                            {new Date(lock.start_time).toLocaleString()}
                                                        </span>
                                                        <span className="flex items-center text-xs">
                                                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                                                            {new Date(lock.end_time).toLocaleString()}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                                                        ${lock.reason === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}
                                                    `}>
                                                        {lock.reason}
                                                    </span>
                                                    {lock.note && <p className="text-xs text-gray-400 mt-1 truncate max-w-[150px]">{lock.note}</p>}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(lock.created_at).toLocaleDateString()}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <div className="flex justify-end gap-2">
                                                        <button
                                                            onClick={() => startEdit(lock)}
                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded"
                                                            title="Edit Lock Times"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleUnlock(lock.id, lock.car_id)}
                                                            className="text-red-600 hover:text-red-900 bg-red-50 p-1.5 rounded"
                                                            title="Delete Lock & Unlock Car"
                                                        >
                                                            <Unlock className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Edit Lock Modal */}
            {editingLock && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setEditingLock(null)} />
                        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={() => setEditingLock(null)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Edit Lock Period</h3>
                            <p className="text-sm text-gray-500 mt-1">Car: {editingLock.car.name}</p>

                            <form onSubmit={handleUpdateLock} className="mt-4 flex flex-col gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                    <input type="datetime-local" required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={editForm.start_time}
                                        onChange={e => setEditForm({ ...editForm, start_time: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">End Time</label>
                                    <input type="datetime-local" required
                                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                        value={editForm.end_time}
                                        onChange={e => setEditForm({ ...editForm, end_time: e.target.value })}
                                    />
                                </div>

                                <div className="mt-2 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Update Lock
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                        onClick={() => setEditingLock(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
