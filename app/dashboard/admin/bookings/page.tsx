'use client'

import { useState, useEffect } from 'react'
import { Search, Filter, CheckCircle, XCircle, Clock, Play, MapPin, AlertTriangle, FileText, DollarSign } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

// Types based on SCHEMA_V2 joins
interface Booking {
    id: string
    user_id: string
    car_id: string
    pickup_time: string
    drop_time: string
    expected_return_time: string | null
    total_amount: number
    due_amount: number
    late_fee?: number
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'ON_TRIP' | 'LATE' | 'RETURNED' | 'COMPLETED' | 'CANCELLED'
    user: {
        full_name: string
        phone: string
        email: string
    }
    car: {
        name: string
        car_number: string
        image_urls: string[]
    }
}

export default function AdminBookingsPage() {
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [currentTab, setCurrentTab] = useState('ALL')
    const [searchTerm, setSearchTerm] = useState('')

    const tabs = [
        { name: 'All Bookings', value: 'ALL' },
        { name: 'Pending', value: 'PENDING' },
        { name: 'Approved', value: 'APPROVED' },
        { name: 'Active Trips', value: 'ON_TRIP' },
        { name: 'Late / Overdue', value: 'LATE' },
        { name: 'Completed', value: 'COMPLETED' },
    ]

    // Action State
    const [extendingBooking, setExtendingBooking] = useState<Booking | null>(null)
    const [extensionDate, setExtensionDate] = useState('')

    const [lateFeeBooking, setLateFeeBooking] = useState<Booking | null>(null)
    const [lateFeeAmount, setLateFeeAmount] = useState('')

    useEffect(() => {
        fetchBookings()
    }, [])

    const [error, setError] = useState<string | null>(null)

    const fetchBookings = async () => {
        setLoading(true)
        setError(null)
        const { data, error } = await supabase
            .from('bookings')
            .select(`
                *,
                user:profiles(full_name, phone, email),
                car:cars(name, car_number, image_urls)
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching bookings:', error)
            setError(error.message)
        } else {
            const formattedData = (data || []).map(b => ({
                ...b,
                user: b.user || { full_name: 'Unknown User', phone: 'N/A', email: '' },
                car: b.car || { name: 'Unknown Car', car_number: 'N/A', image_urls: [] }
            })) as Booking[]
            setBookings(formattedData)
        }
        setLoading(false)
    }

    const handleUpdateStatus = async (bookingId: string, newStatus: string, additionalUpdates: any = {}) => {
        if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return

        const { error } = await supabase
            .from('bookings')
            .update({
                status: newStatus,
                ...additionalUpdates
            })
            .eq('id', bookingId)

        if (error) {
            alert('Error updating booking: ' + error.message)
        } else {
            // Auto-update car status based on booking flow
            if (newStatus === 'ON_TRIP') {
                const booking = bookings.find(b => b.id === bookingId)
                if (booking) {
                    await supabase.from('cars').update({ status: 'ON_TRIP' }).eq('id', booking.car_id)
                }
            }
            if (newStatus === 'COMPLETED' || newStatus === 'RETURNED') {
                const booking = bookings.find(b => b.id === bookingId)
                if (booking) {
                    await supabase.from('cars').update({ status: 'AVAILABLE' }).eq('id', booking.car_id)
                }
            }

            fetchBookings() // Refresh list
        }
    }

    const handleExtendBooking = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!extendingBooking || !extensionDate) return

        const { error } = await supabase
            .from('bookings')
            .update({ expected_return_time: extensionDate })
            .eq('id', extendingBooking.id)

        if (error) {
            alert('Error extending booking: ' + error.message)
        } else {
            alert('Booking extended successfully')
            setExtendingBooking(null)
            setExtensionDate('')
            fetchBookings()
        }
    }

    const handleAddLateFee = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!lateFeeBooking || !lateFeeAmount) return

        const fee = Number(lateFeeAmount)
        const newTotal = lateFeeBooking.total_amount + fee
        const newDue = (lateFeeBooking.due_amount || 0) + fee
        // Assuming database has a late_fee column, if not, create it or just update total
        // If late_fee column exists in schema: late_fee: (lateFeeBooking.late_fee || 0) + fee

        const { error } = await supabase
            .from('bookings')
            .update({
                total_amount: newTotal,
                due_amount: newDue,
                late_fee: (lateFeeBooking.late_fee || 0) + fee
            })
            .eq('id', lateFeeBooking.id)

        if (error) {
            alert('Error adding late fee: ' + error.message)
        } else {
            alert(`Late fee of ₹${fee} added. New Total: ₹${newTotal}`)
            setLateFeeBooking(null)
            setLateFeeAmount('')
            fetchBookings()
        }
    }

    // Filter logic
    const filteredBookings = bookings.filter(booking => {
        const matchesTab = currentTab === 'ALL' || booking.status === currentTab

        const userName = booking.user?.full_name || ''
        const carName = booking.car?.name || ''
        const carNumber = booking.car?.car_number || ''

        const matchesSearch =
            userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            carName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            carNumber.toLowerCase().includes(searchTerm.toLowerCase())

        return matchesTab && matchesSearch
    })

    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            PENDING: 'bg-orange-500 text-white border-orange-600',
            APPROVED: 'bg-blue-600 text-white border-blue-700',
            ON_TRIP: 'bg-indigo-600 text-white border-indigo-700 animate-pulse',
            LATE: 'bg-red-600 text-white border-red-700 shadow-sm',
            RETURNED: 'bg-yellow-500 text-black border-yellow-600',
            COMPLETED: 'bg-green-600 text-white border-green-700',
            CANCELLED: 'bg-gray-500 text-white border-gray-600',
            REJECTED: 'bg-red-800 text-white border-red-900',
        }

        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold border ${styles[status] || styles.CANCELLED}`}>
                {status}
            </span>
        )
    }

    return (
        <div>
            <div className="sm:flex sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Bookings & Operations</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Process bookings, approve trips, and handle returns.
                    </p>
                </div>
            </div>

            {/* Tabs */}
            <div className="mt-6 border-b border-gray-200 overflow-x-auto">
                <nav className="-mb-px flex space-x-8" aria-label="Tabs">
                    {tabs.map((tab) => (
                        <button
                            key={tab.name}
                            onClick={() => setCurrentTab(tab.value)}
                            className={`
                                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                                ${currentTab === tab.value
                                    ? 'border-indigo-500 text-indigo-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'}
                            `}
                        >
                            {tab.name}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Search */}
            <div className="mt-6 flex gap-4 max-w-xl">
                <div className="relative flex-grow">
                    <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 shadow-sm border"
                        placeholder="Search customer, car or plate..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Table */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Customer</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vehicle</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Schedule</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Financials</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-500">
                                                <div className="flex justify-center items-center">
                                                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600 mr-2"></div>
                                                    Loading bookings...
                                                </div>
                                            </td>
                                        </tr>
                                    ) : error ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-10 text-center text-sm text-red-500">
                                                Error loading bookings: {error}
                                            </td>
                                        </tr>
                                    ) : filteredBookings.length === 0 ? (
                                        <tr>
                                            <td colSpan={6} className="px-3 py-10 text-center text-sm text-gray-500">
                                                No bookings found.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredBookings.map((booking) => (
                                            <tr key={booking.id} className={booking.status === 'LATE' ? 'bg-red-50' : ''}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <div className="font-medium text-gray-900">{booking.user.full_name || 'Guest'}</div>
                                                    <div className="text-gray-500 text-xs">{booking.user.phone}</div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <div className="flex items-center gap-2">
                                                        {booking.car.image_urls?.[0] && (
                                                            <img src={booking.car.image_urls[0]} alt="" className="w-8 h-8 rounded object-cover" />
                                                        )}
                                                        <div>
                                                            <div className="font-medium text-gray-900">{booking.car.name}</div>
                                                            <div className="text-gray-500 text-xs font-mono">{booking.car.car_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div suppressHydrationWarning><span className="text-xs uppercase text-gray-400">Pick:</span> {new Date(booking.pickup_time).toLocaleDateString('en-IN')}</div>
                                                    <div suppressHydrationWarning><span className="text-xs uppercase text-gray-400">Drop:</span> {new Date(booking.drop_time).toLocaleDateString('en-IN')}</div>
                                                    {booking.status === 'LATE' && booking.expected_return_time && (
                                                        <div className="text-red-600 font-bold text-xs mt-1" suppressHydrationWarning>DUE: {new Date(booking.expected_return_time).toLocaleDateString('en-IN')}</div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <div className="font-medium text-gray-900">₹{booking.total_amount}</div>
                                                    {booking.due_amount > 0 ? (
                                                        <div className="text-red-500 text-xs font-bold">Due: ₹{booking.due_amount}</div>
                                                    ) : (
                                                        <div className="text-green-500 text-xs">Paid</div>
                                                    )}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    {getStatusBadge(booking.status)}
                                                </td>
                                                <td className="whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <div className="flex justify-end gap-2 flex-wrap max-w-[200px]">
                                                        {booking.status === 'PENDING' && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking.id, 'APPROVED', { approved_pickup_time: new Date().toISOString() })}
                                                                    className="text-green-600 hover:text-green-900 flex items-center bg-green-50 px-2 py-1 rounded"
                                                                >
                                                                    <CheckCircle className="h-4 w-4 mr-1" /> Approve
                                                                </button>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking.id, 'REJECTED')}
                                                                    className="text-red-600 hover:text-red-900 flex items-center bg-red-50 px-2 py-1 rounded"
                                                                >
                                                                    <XCircle className="h-4 w-4 mr-1" /> Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {booking.status === 'APPROVED' && (
                                                            <button
                                                                onClick={() => handleUpdateStatus(booking.id, 'ON_TRIP', { actual_pickup_time: new Date().toISOString() })}
                                                                className="text-indigo-600 hover:text-indigo-900 flex items-center bg-indigo-50 px-2 py-1 rounded animate-pulse"
                                                            >
                                                                <Play className="h-4 w-4 mr-1" /> Start
                                                            </button>
                                                        )}
                                                        {(booking.status === 'ON_TRIP' || booking.status === 'LATE') && (
                                                            <>
                                                                <button
                                                                    onClick={() => handleUpdateStatus(booking.id, 'COMPLETED', { actual_return_time: new Date().toISOString() })}
                                                                    className="text-orange-600 hover:text-orange-900 flex items-center bg-orange-50 px-2 py-1 rounded"
                                                                >
                                                                    <MapPin className="h-4 w-4 mr-1" /> Return
                                                                </button>
                                                                <button
                                                                    onClick={() => {
                                                                        setExtendingBooking(booking)
                                                                        const currentDate = booking.expected_return_time || booking.drop_time
                                                                        setExtensionDate(currentDate ? new Date(currentDate).toISOString().slice(0, 16) : '')
                                                                    }}
                                                                    className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded"
                                                                    title="Extend Trip"
                                                                >
                                                                    <Clock className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
                                                        {booking.status === 'LATE' && (
                                                            <>
                                                                <button
                                                                    onClick={() => setLateFeeBooking(booking)}
                                                                    className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded"
                                                                    title="Add Late Fee"
                                                                >
                                                                    <DollarSign className="h-4 w-4" />
                                                                </button>
                                                            </>
                                                        )}
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

            {/* Extend Modal */}
            {extendingBooking && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setExtendingBooking(null)} />
                        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-gray-900">Extend Booking</h3>
                            <p className="text-sm text-gray-500">Extending: {extendingBooking.car.name}</p>
                            <form onSubmit={handleExtendBooking} className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">New Return Time</label>
                                <input
                                    type="datetime-local"
                                    required
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={extensionDate}
                                    onChange={e => setExtensionDate(e.target.value)}
                                />
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Extend
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                        onClick={() => setExtendingBooking(null)}
                                    >
                                        Cancel
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* Late Fee Modal */}
            {lateFeeBooking && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setLateFeeBooking(null)} />
                        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-sm sm:p-6">
                            <h3 className="text-lg font-medium leading-6 text-red-600">Add Late Fee</h3>
                            <p className="text-sm text-gray-500">Adding penalty due to late return for {lateFeeBooking.car.name}.</p>
                            <form onSubmit={handleAddLateFee} className="mt-4">
                                <label className="block text-sm font-medium text-gray-700">Fee Amount (₹)</label>
                                <input
                                    type="number"
                                    required
                                    min="0"
                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                    value={lateFeeAmount}
                                    onChange={e => setLateFeeAmount(e.target.value)}
                                    placeholder="e.g. 500"
                                />
                                <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                    <button
                                        type="submit"
                                        className="inline-flex w-full justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                    >
                                        Add Fee
                                    </button>
                                    <button
                                        type="button"
                                        className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                        onClick={() => setLateFeeBooking(null)}
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
