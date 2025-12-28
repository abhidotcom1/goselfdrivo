'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash, Search, DollarSign, Filter, CreditCard } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface Payment {
    id: string
    booking_id: string
    amount: number
    payment_mode: 'UPI' | 'CASH' | 'BANK_TRANSFER' | 'ONLINE' | 'OTHER'
    payment_status: string
    payment_date: string
    notes: string
    created_at: string
    booking?: {
        id: string
        user: { full_name: string }
        car: { car_number: string }
    }
}

interface Booking {
    id: string
    user: { full_name: string }
    car: { car_number: string }
    due_amount: number
    total_amount: number
}

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([])
    const [bookings, setBookings] = useState<Booking[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        booking_id: '',
        amount: '',
        payment_mode: 'UPI',
        payment_date: new Date().toISOString().split('T')[0],
        notes: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        // Fetch Payments
        const { data: payData, error: payError } = await supabase
            .from('payments')
            .select('*, booking:bookings(id, user:profiles(full_name), car:cars(car_number))')
            .order('payment_date', { ascending: false })

        if (payError) console.error('Error fetching payments:', payError)
        else setPayments(payData || [])

        // Fetch Bookings (Active ones or those with dues)
        // We'll just fetch recent 100 bookings for dropdown to avoid overload in simple version
        const { data: bookData, error: bookError } = await supabase
            .from('bookings')
            // .select('id, due_amount, total_amount, ...') // Need relations for display
            .select('id, due_amount, total_amount, user:profiles(full_name), car:cars(car_number)')
            .order('created_at', { ascending: false })
            .limit(100)

        if (bookError) console.error('Error fetching bookings:', bookError)
        else {
            const formattedBookings = (bookData || []).map((b: any) => ({
                id: b.id,
                due_amount: b.due_amount,
                total_amount: b.total_amount,
                user: Array.isArray(b.user) ? b.user[0] : b.user,
                car: Array.isArray(b.car) ? b.car[0] : b.car
            }))
            setBookings(formattedBookings)
        }

        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const amountVal = parseFloat(formData.amount)
        const selectedBooking = bookings.find(b => b.id === formData.booking_id)

        if (!selectedBooking) {
            alert('Invalid booking selected')
            setSubmitting(false)
            return
        }

        // 1. Insert Payment
        const { error: insertError } = await supabase
            .from('payments')
            .insert([{
                booking_id: formData.booking_id,
                amount: amountVal,
                payment_mode: formData.payment_mode,
                payment_status: 'PAID',
                payment_date: formData.payment_date,
                notes: formData.notes
            }])

        if (insertError) {
            alert('Error recording payment: ' + insertError.message)
            setSubmitting(false)
            return
        }

        // 2. Update Booking Due Amount
        const newDue = (selectedBooking.due_amount || 0) - amountVal
        const newStatus = newDue <= 0 ? (selectedBooking.total_amount > 0 ? 'PAID' : 'PENDING') : 'PARTIAL'
        // Logic for booking status update? Currently booking 'payment_status' column exists in schema.

        const { error: updateError } = await supabase
            .from('bookings')
            .update({
                due_amount: newDue < 0 ? 0 : newDue, // Prevent negative due
                payment_status: newDue <= 0 ? 'PAID' : 'PARTIAL'
            })
            .eq('id', formData.booking_id)

        if (updateError) {
            alert('Payment recorded but failed to update booking balance: ' + updateError.message)
        } else {
            setIsAddModalOpen(false)
            setFormData({
                booking_id: '',
                amount: '',
                payment_mode: 'UPI',
                payment_date: new Date().toISOString().split('T')[0],
                notes: ''
            })
            fetchData() // Refresh list
        }
        setSubmitting(false)
    }

    const filteredPayments = payments.filter(p =>
        (p.booking?.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (p.booking?.car?.car_number?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        p.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.payment_mode.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalCollected = filteredPayments.reduce((sum, p) => sum + Number(p.amount), 0)

    return (
        <div>
            {/* Header */}
            <div className="sm:flex sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Payments & Transactions</h1>
                    <p className="mt-2 text-sm text-gray-700">Log incoming payments and track revenue.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Record Payment
                    </button>
                </div>
            </div>

            {/* Banner */}
            <div className="mt-6 bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6 flex items-center">
                    <div className="rounded-md bg-green-100 p-3">
                        <CreditCard className="h-6 w-6 text-green-600" />
                    </div>
                    <div className="ml-5">
                        <dt className="truncate text-sm font-medium text-gray-500">Total Collected</dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">₹{totalCollected.toLocaleString()}</dd>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Booking Ref</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Mode</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr><td colSpan={5} className="text-center py-10 text-gray-500">Loading...</td></tr>
                                    ) : filteredPayments.length === 0 ? (
                                        <tr><td colSpan={5} className="text-center py-10 text-gray-500">No payments recorded.</td></tr>
                                    ) : (
                                        filteredPayments.map((pay) => (
                                            <tr key={pay.id}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(pay.payment_date).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                    {pay.booking?.user?.full_name} <br />
                                                    <span className="text-gray-500 font-normal text-xs">{pay.booking?.car?.car_number}</span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-bold text-green-600">
                                                    ₹{pay.amount.toLocaleString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span className="inline-flex rounded-full bg-gray-100 px-2 text-xs font-semibold leading-5 text-gray-800">
                                                        {pay.payment_mode}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {pay.notes}
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

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <form onSubmit={handleSubmit}>
                                    <div>
                                        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                                            <CreditCard className="h-6 w-6 text-green-600" aria-hidden="true" />
                                        </div>
                                        <div className="mt-3 text-center sm:mt-5">
                                            <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">Record Payment</h3>
                                        </div>
                                    </div>
                                    <div className="mt-5 space-y-4">
                                        <div>
                                            <label htmlFor="booking" className="block text-sm font-medium text-gray-700">Select Booking</label>
                                            <select
                                                id="booking"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                value={formData.booking_id}
                                                onChange={(e) => setFormData({ ...formData, booking_id: e.target.value })}
                                            >
                                                <option value="">-- Choose Booking --</option>
                                                {bookings.map(b => (
                                                    <option key={b.id} value={b.id}>
                                                        {b.user?.full_name} - {b.car?.car_number} (Due: ₹{b.due_amount})
                                                    </option>
                                                ))}
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                                <input
                                                    type="number"
                                                    id="amount"
                                                    required
                                                    min="0"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={formData.amount}
                                                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label htmlFor="mode" className="block text-sm font-medium text-gray-700">Mode</label>
                                                <select
                                                    id="mode"
                                                    required
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={formData.payment_mode}
                                                    onChange={(e) => setFormData({ ...formData, payment_mode: e.target.value as any })}
                                                >
                                                    <option value="UPI">UPI</option>
                                                    <option value="CASH">Cash</option>
                                                    <option value="BANK_TRANSFER">Bank Transfer</option>
                                                    <option value="ONLINE">Online</option>
                                                    <option value="OTHER">Other</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                                            <input
                                                type="date"
                                                id="date"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                value={formData.payment_date}
                                                onChange={(e) => setFormData({ ...formData, payment_date: e.target.value })}
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Notes / Transaction Ref</label>
                                            <input
                                                type="text"
                                                id="notes"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                value={formData.notes}
                                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div className="mt-5 sm:mt-6 grid grid-cols-2 gap-3">
                                        <button
                                            type="button"
                                            className="inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm"
                                            onClick={() => setIsAddModalOpen(false)}
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 sm:text-sm disabled:opacity-50"
                                        >
                                            {submitting ? 'Saving...' : 'Confirm Payment'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
