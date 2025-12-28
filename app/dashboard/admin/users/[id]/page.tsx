'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabaseClient'
import { User, Mail, Phone, Calendar, ArrowLeft, CreditCard, Clock } from 'lucide-react'
import Link from 'next/link'

interface Booking {
    id: string
    car: { name: string; car_number: string }
    start_time: string
    end_time: string
    total_amount: number
    due_amount: number
    status: string
    created_at: string
}

interface Profile {
    id: string
    full_name: string
    email: string
    phone: string
    role: string
    created_at: string
    is_verified: boolean
}

export default function UserDetailsPage() {
    const params = useParams()
    const router = useRouter()
    const userId = params.id as string

    const [user, setUser] = useState<Profile | null>(null)
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (userId) {
            fetchUserDetails()
        }
    }, [userId])

    const fetchUserDetails = async () => {
        setLoading(true)
        // 1. Fetch Profile
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .single()

        if (profileError) {
            console.error('Error fetching profile:', profileError)
            setLoading(false)
            return
        }

        setUser(profileData)

        // 2. Fetch Bookings
        const { data: bookingsData, error: bookingsError } = await supabase
            .from('bookings')
            .select(`
                id,
                total_amount,
                status,
                created_at,
                pickup_time,
                drop_time,
                car:cars(name, car_number)
            `)
            .eq('user_id', userId)
            .order('created_at', { ascending: false })

        if (bookingsError) {
            console.error('Error fetching bookings:', JSON.stringify(bookingsError, null, 2))
        } else {
            // Map the response to our Booking interface
            const mappedBookings = bookingsData.map((b: any) => ({
                id: b.id,
                car: b.car,
                start_time: b.pickup_time,
                end_time: b.drop_time,
                total_amount: b.total_amount,
                due_amount: 0, // Calculated field in future
                status: b.status,
                created_at: b.created_at
            }))
            setBookings(mappedBookings)
        }
        setLoading(false)
    }

    if (loading) return <div className="p-8 text-center text-gray-500">Loading details...</div>
    if (!user) return <div className="p-8 text-center text-red-500">User not found</div>

    // Stats
    const totalSpent = bookings.reduce((sum, b) => sum + (b.total_amount || 0), 0)
    const totalDue = bookings.reduce((sum, b) => sum + (b.due_amount || 0), 0)
    const completedTrips = bookings.filter(b => b.status === 'COMPLETED').length

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full text-gray-600"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{user.full_name}</h1>
                    <p className="text-sm text-gray-500">{user.role.toUpperCase()} • Joined {new Date(user.created_at).toLocaleDateString()}</p>
                </div>
            </div>

            {/* User Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Contact Card */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Contact Information</h3>
                    <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-900">
                            <Mail className="w-4 h-4 mr-3 text-gray-400" />
                            {user.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                            <Phone className="w-4 h-4 mr-3 text-gray-400" />
                            {user.phone || 'No phone provided'}
                        </div>
                        <div className="flex items-center text-sm text-gray-900">
                            <User className="w-4 h-4 mr-3 text-gray-400" />
                            ID: <span className="font-mono text-xs ml-1 text-gray-500">{user.id}</span>
                        </div>
                    </div>
                </div>

                {/* Financial Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Financial Summary</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Total Spent</p>
                            <p className="text-lg font-bold text-green-600">₹{totalSpent.toLocaleString()}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Outstanding Dues</p>
                            <p className={`text-lg font-bold ${totalDue > 0 ? 'text-red-600' : 'text-gray-900'}`}>
                                ₹{totalDue.toLocaleString()}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Booking Stats */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h3 className="text-sm font-medium text-gray-500 mb-4">Trip Statistics</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-gray-500">Total Bookings</p>
                            <p className="text-lg font-bold text-gray-900">{bookings.length}</p>
                        </div>
                        <div>
                            <p className="text-xs text-gray-500">Completed Trips</p>
                            <p className="text-lg font-bold text-gray-900">{completedTrips}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Booking History Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100">
                    <h3 className="font-semibold text-gray-900">Booking History</h3>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Car</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Due</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {bookings.map((booking) => (
                                <tr key={booking.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-medium text-gray-900">{booking.car?.name || 'Unknown Car'}</div>
                                        <div className="text-xs text-gray-500">{booking.car?.car_number}</div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-xs text-gray-900">
                                            {new Date(booking.start_time).toLocaleDateString()}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            to {new Date(booking.end_time).toLocaleDateString()}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                                            ${booking.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                                                booking.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                                                    booking.status === 'ON_TRIP' ? 'bg-blue-100 text-blue-800' :
                                                        'bg-yellow-100 text-yellow-800'}`}>
                                            {booking.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        ₹{booking.total_amount?.toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                        {booking.due_amount > 0 ? (
                                            <span className="text-red-600">₹{booking.due_amount?.toLocaleString()}</span>
                                        ) : (
                                            <span className="text-green-600">Paid</span>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {bookings.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-500">
                                        No bookings found for this user.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    )
}
