'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/components/providers/AuthProvider'
import { supabase } from '@/lib/supabaseClient'
import { Clock, CheckCircle, AlertCircle, Phone, ArrowRight, Car } from 'lucide-react'
import Link from 'next/link'

export default function DashboardPage() {
    const { user, profile, loading: authLoading, isAdmin } = useAuth()
    const router = useRouter()
    const [bookings, setBookings] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (authLoading) return
        if (!user) {
            router.push('/')
            return
        }

        // Redirect Admin immediately
        if (isAdmin) {
            router.push('/dashboard/admin')
            return
        }

        // Fetch Customer Bookings
        const fetchBookings = async () => {
            const { data, error } = await supabase
                .from('bookings')
                .select('*, car:cars(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })

            if (data) setBookings(data)
            setLoading(false)
        }

        fetchBookings()
    }, [user, authLoading, isAdmin, router])

    if (authLoading || loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="w-8 h-8 rounded-full border-2 border-[#F5B301] border-t-transparent animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold text-gray-900">My Dashboard</h1>

            {/* Active / Recent Bookings Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                    <h2 className="font-semibold text-gray-800">Recent Bookings</h2>
                    <Link href="/dashboard/bookings" className="text-sm text-[#F5B301] hover:underline font-medium">
                        View All
                    </Link>
                </div>

                {bookings.length === 0 ? (
                    <div className="p-8 text-center">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
                            <Car className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900">No bookings yet</h3>
                        <p className="text-gray-500 mt-2 mb-6">Start your journey by selecting a premium car from our fleet.</p>
                        <Link href="/#fleets" className="inline-flex items-center px-6 py-3 bg-[#F5B301] text-black font-bold rounded-lg hover:bg-[#D89E00] transition-colors">
                            Browse Cars
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {bookings.map((booking) => (
                            <div key={booking.id} className="p-6 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">

                                    {/* Car Info */}
                                    <div className="flex items-start gap-4">
                                        <div className="w-16 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                                            {booking.car?.image_urls?.[0] ? (
                                                <img src={booking.car.image_urls[0]} alt={booking.car.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full"><Car className="w-6 h-6 text-gray-400" /></div>
                                            )}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900">{booking.car?.name || 'Unknown Car'}</h3>
                                            <p className="text-sm text-gray-500">
                                                <span suppressHydrationWarning>
                                                    {new Date(booking.pickup_time).toLocaleDateString()} • {new Date(booking.pickup_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    {/* Status Badge & Message */}
                                    <div className="flex flex-col items-end gap-2">
                                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide border
                                            ${booking.status === 'PENDING' ? 'bg-yellow-50 text-yellow-700 border-yellow-200' :
                                                booking.status === 'APPROVED' ? 'bg-green-50 text-green-700 border-green-200' :
                                                    booking.status === 'CANCELLED' ? 'bg-red-50 text-red-700 border-red-200' :
                                                        'bg-gray-50 text-gray-600 border-gray-200'
                                            }
                                        `}>
                                            {booking.status === 'PENDING' && <Clock className="w-3 h-3 mr-1" />}
                                            {booking.status === 'APPROVED' && <CheckCircle className="w-3 h-3 mr-1" />}
                                            {booking.status}
                                        </span>

                                        {booking.status === 'PENDING' && (
                                            <p className="text-xs text-yellow-600 font-medium">Wait for admin approval</p>
                                        )}
                                    </div>

                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            {/* Support Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-[#1C1C1C] rounded-xl p-6 text-white flex flex-col justify-between shadow-lg">
                    <div>
                        <h3 className="text-lg font-bold mb-2">Need Immediate Help?</h3>
                        <p className="text-gray-400 text-sm mb-6">Our support team is available 24/7 to assist you with your booking status or any other queries.</p>
                    </div>
                    <a href="tel:+919876543210" className="inline-flex items-center justify-center w-full px-4 py-3 bg-[#F5B301] text-black font-bold rounded-lg hover:bg-[#D89E00] transition-colors">
                        <Phone className="w-5 h-5 mr-2" />
                        Call Support
                    </a>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Booking Policy</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Bookings are usually confirmed within 15 minutes during working hours.
                            Please ensure your documents are verified for faster approval.
                        </p>
                    </div>
                    <Link href="/profile" className="inline-flex items-center justify-center w-full px-4 py-3 bg-gray-100 text-gray-700 font-semibold rounded-lg hover:bg-gray-200 transition-colors">
                        Verify Documents <ArrowRight className="w-4 h-4 ml-2" />
                    </Link>
                </div>
            </div>

            {/* Debug tools removed for production safety */}

        </div>
    )
}
