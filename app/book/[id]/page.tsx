'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { ArrowLeft, Calendar, Clock, MapPin, Shield, CreditCard, ChevronRight, AlertCircle, CheckCircle } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function BookingPage() {
    const params = useParams()
    const router = useRouter()
    const { user } = useAuth()

    const [car, setCar] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState('')
    const [success, setSuccess] = useState(false)

    // Form State
    const [startDate, setStartDate] = useState('')
    const [startTime, setStartTime] = useState('09:00')
    const [endDate, setEndDate] = useState('')
    const [endTime, setEndTime] = useState('09:00')
    const [deliveryMode, setDeliveryMode] = useState<'SELF' | 'DELIVERY'>('SELF')

    // Calculated
    const [durationHours, setDurationHours] = useState(0)
    const [totalPrice, setTotalPrice] = useState(0)

    useEffect(() => {
        const fetchCar = async () => {
            if (!params?.id) return
            const { data, error } = await supabase
                .from('cars')
                .select('*')
                .eq('id', params.id)
                .single()

            if (data) setCar(data)
            setLoading(false)
        }
        fetchCar()
    }, [params?.id])

    // Calculate Price whenever inputs change
    useEffect(() => {
        if (!startDate || !endDate || !car) return

        const start = new Date(`${startDate}T${startTime}`)
        const end = new Date(`${endDate}T${endTime}`)
        const diffMs = end.getTime() - start.getTime()
        const diffHrs = Math.ceil(diffMs / (1000 * 60 * 60))

        if (diffHrs > 0) {
            setDurationHours(diffHrs)
            setTotalPrice(diffHrs * car.hourly_rate)
        } else {
            setDurationHours(0)
            setTotalPrice(0)
        }
    }, [startDate, startTime, endDate, endTime, car])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setSubmitting(true)

        if (!user) {
            setError('Please sign in to complete your booking.')
            setSubmitting(false)
            return
        }

        if (durationHours < (car?.min_booking_hours || 4)) {
            setError(`Minimum booking duration is ${car?.min_booking_hours || 4} hours.`)
            setSubmitting(false)
            return
        }

        const pickupTime = new Date(`${startDate}T${startTime}`).toISOString()
        const dropTime = new Date(`${endDate}T${endTime}`).toISOString()

        const { data, error: bookingError } = await supabase
            .from('bookings')
            .insert({
                user_id: user.id,
                car_id: car.id,
                pickup_time: pickupTime,
                drop_time: dropTime,
                total_amount: totalPrice,
                security_deposit: 0, // Logic to come later maybe
                status: 'PENDING'
            })
            .select()

        if (bookingError) {
            setError(bookingError.message)
            setSubmitting(false)
        } else {
            setSuccess(true)
            // Redirect after 2 seconds
            setTimeout(() => {
                router.push('/dashboard')
            }, 2000)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
                <div className="w-8 h-8 rounded-full border-2 border-[#F5B301] border-t-transparent animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-gray-100 font-sans pb-20 pt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                {/* Header */}
                <div className="mb-8">
                    <Link href={`/cars/${params?.id}`} className="text-gray-500 hover:text-[#F5B301] flex items-center text-sm font-medium transition-colors w-fit mb-4">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Car Details
                    </Link>
                    <h1 className="text-3xl font-bold text-white">Complete Your Booking</h1>
                    <p className="text-gray-400 mt-1">Review details and confirm your ride.</p>
                </div>

                <div className="lg:grid lg:grid-cols-3 lg:gap-8">

                    {/* LEFT: FORM */}
                    <div className="lg:col-span-2">
                        <form onSubmit={handleSubmit} className="bg-[#161616] rounded-2xl border border-gray-800 p-6 sm:p-8">

                            {/* Pickup / Dropoff Grid */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8">
                                {/* Pickup */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Pickup Date & Time</label>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="date"
                                                required
                                                min={new Date().toISOString().split('T')[0]}
                                                value={startDate}
                                                onChange={e => setStartDate(e.target.value)}
                                                className="w-full bg-[#1C1C1C] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="time"
                                                required
                                                value={startTime}
                                                onChange={e => setStartTime(e.target.value)}
                                                className="w-full bg-[#1C1C1C] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Dropoff */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-400 mb-2">Return Date & Time</label>
                                    <div className="space-y-3">
                                        <div className="relative">
                                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="date"
                                                required
                                                min={startDate || new Date().toISOString().split('T')[0]}
                                                value={endDate}
                                                onChange={e => setEndDate(e.target.value)}
                                                className="w-full bg-[#1C1C1C] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                                            />
                                        </div>
                                        <div className="relative">
                                            <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                                            <input
                                                type="time"
                                                required
                                                value={endTime}
                                                onChange={e => setEndTime(e.target.value)}
                                                className="w-full bg-[#1C1C1C] border border-gray-700 rounded-lg py-2.5 pl-10 pr-4 text-white focus:outline-none focus:border-[#F5B301] transition-colors"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Delivery Toggle */}
                            <div className="mb-8">
                                <label className="block text-sm font-medium text-gray-400 mb-3">Fulfillment Mode</label>
                                <div className="grid grid-cols-2 gap-4">
                                    <div
                                        onClick={() => setDeliveryMode('SELF')}
                                        className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${deliveryMode === 'SELF' ? 'bg-[#F5B301]/10 border-[#F5B301]' : 'bg-[#1C1C1C] border-gray-700 hover:border-gray-600'}`}
                                    >
                                        <div className="flex items-center">
                                            <MapPin className={`w-5 h-5 mr-3 ${deliveryMode === 'SELF' ? 'text-[#F5B301]' : 'text-gray-500'}`} />
                                            <div>
                                                <div className={`font-semibold ${deliveryMode === 'SELF' ? 'text-[#F5B301]' : 'text-white'}`}>Self Pickup</div>
                                                <div className="text-xs text-gray-500">Pick from our hub</div>
                                            </div>
                                        </div>
                                        {deliveryMode === 'SELF' && <CheckCircle className="w-5 h-5 text-[#F5B301]" />}
                                    </div>

                                    <div
                                        onClick={() => setDeliveryMode('DELIVERY')}
                                        className={`cursor-pointer p-4 rounded-xl border flex items-center justify-between transition-all ${deliveryMode === 'DELIVERY' ? 'bg-[#F5B301]/10 border-[#F5B301]' : 'bg-[#1C1C1C] border-gray-700 hover:border-gray-600'}`}
                                    >
                                        <div className="flex items-center">
                                            <CreditCard className={`w-5 h-5 mr-3 ${deliveryMode === 'DELIVERY' ? 'text-[#F5B301]' : 'text-gray-500'}`} />
                                            <div>
                                                <div className={`font-semibold ${deliveryMode === 'DELIVERY' ? 'text-[#F5B301]' : 'text-white'}`}>Home Delivery</div>
                                                <div className="text-xs text-gray-500">Doorstep service</div>
                                            </div>
                                        </div>
                                        {deliveryMode === 'DELIVERY' && <CheckCircle className="w-5 h-5 text-[#F5B301]" />}
                                    </div>
                                </div>
                            </div>

                            {/* Error/Success Messages */}
                            {error && (
                                <div className="mb-6 p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 flex items-center">
                                    <AlertCircle className="w-5 h-5 mr-2" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="mb-6 p-4 rounded-lg bg-green-500/10 border border-green-500/30 text-green-400 flex items-center">
                                    <CheckCircle className="w-5 h-5 mr-2" />
                                    Booking Request Successful! Redirecting...
                                </div>
                            )}

                        </form>
                    </div>

                    {/* RIGHT: SUMMARY CARD */}
                    <div className="mt-8 lg:mt-0 lg:col-span-1">
                        <div className="bg-[#1C1C1C] rounded-2xl border border-gray-800 p-6 sticky top-24">
                            <h3 className="text-lg font-bold text-white mb-6 border-b border-gray-800 pb-4">Booking Summary</h3>

                            {/* Car Info */}
                            <div className="flex items-center mb-6">
                                <img
                                    src={car.image_urls?.[0] || car.image_url}
                                    alt={car.name}
                                    className="w-20 h-14 object-cover rounded-lg mr-4 bg-[#0F0F0F]"
                                />
                                <div>
                                    <h4 className="font-bold text-white text-sm">{car.name}</h4>
                                    <div className="text-xs text-gray-500">₹{car.hourly_rate}/hr</div>
                                </div>
                            </div>

                            {/* Details List */}
                            <div className="space-y-3 mb-6">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Duration</span>
                                    <span className="text-white font-medium">{durationHours > 0 ? `${durationHours} Hours` : '--'}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Base Fare</span>
                                    <span className="text-white font-medium">₹{totalPrice}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Security Deposit</span>
                                    <span className="text-white font-medium">₹0</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-400">Taxes & Fees</span>
                                    <span className="text-green-500 font-medium">Included</span>
                                </div>
                            </div>

                            <div className="border-t border-gray-800 pt-4 mb-8">
                                <div className="flex justify-between items-end">
                                    <span className="text-gray-400 font-medium">Total Payable</span>
                                    <span className="text-2xl font-bold text-[#F5B301]">₹{totalPrice}</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                disabled={submitting || success}
                                className={`w-full py-4 rounded-xl font-bold flex items-center justify-center transition-all ${submitting ? 'bg-gray-700 cursor-not-allowed text-gray-400' : 'bg-[#F5B301] text-black hover:bg-[#D89E00] shadow-lg shadow-orange-500/20'}`}
                            >
                                {submitting ? 'Processing...' : 'Request to Book'}
                                {!submitting && <ChevronRight className="w-5 h-5 ml-2" />}
                            </button>
                            <p className="text-center text-xs text-gray-500 mt-4">By booking, you agree to our Terms & Conditions</p>

                        </div>
                    </div>

                </div>
            </div>
        </div>
    )
}
