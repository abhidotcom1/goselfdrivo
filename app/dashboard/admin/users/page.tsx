'use client'

import { useState, useEffect } from 'react'
import { Search, Mail, Phone, Calendar, User, Eye } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'

interface Profile {
    id: string
    full_name: string
    email: string
    phone: string
    role: string
    created_at: string
    bookings?: { id: string, total_amount: number, due_amount?: number }[]
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<Profile[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        setLoading(true)
        // Fetch profiles along with their bookings to calculate stats
        const { data, error } = await supabase
            .from('profiles')
            .select(`
                *,
                bookings (
                    id,
                    total_amount,
                    total_amount,
                    status
                )
            `)
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching users:', error)
        } else {
            setUsers(data || [])
        }
        setLoading(false)
    }

    const filteredUsers = users.filter(user =>
        (user.full_name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.email || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (user.phone || '').includes(searchTerm)
    )

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Customer Leads</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage registered customers (leads) and view their booking history.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="mt-6 max-w-md relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 border shadow-sm"
                    placeholder="Search by name, email or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">User Details</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Contact</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Stats</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-10 text-center text-sm text-gray-500">Loading users...</td>
                                        </tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-10 text-center text-sm text-gray-500">No users found.</td>
                                        </tr>
                                    ) : (
                                        filteredUsers.map((user) => {
                                            const bookingCount = user.bookings?.length || 0
                                            const totalSpent = user.bookings?.reduce((acc, b) => acc + (b.total_amount || 0), 0) || 0
                                            const pendingDues = 0 // Calculator logic needed if column missing

                                            return (
                                                <tr key={user.id}>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                        <div className="flex items-center">
                                                            <div className="h-10 w-10 flex-shrink-0">
                                                                <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                                                                    <User className="h-5 w-5" />
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="font-medium text-gray-900">{user.full_name || 'No Name'}</div>
                                                                <div className="text-gray-500 text-xs">Joined {new Date(user.created_at).toLocaleDateString()}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        <div className="flex flex-col gap-1">
                                                            <div className="flex items-center text-xs">
                                                                <Mail className="h-3 w-3 mr-1" /> {user.email}
                                                            </div>
                                                            <div className="flex items-center text-xs">
                                                                <Phone className="h-3 w-3 mr-1" /> {user.phone || 'N/A'}
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                        <div className="text-xs">
                                                            <p><span className="font-semibold text-gray-700">{bookingCount}</span> Bookings</p>
                                                            <p>Spent: <span className="font-semibold text-green-600">₹{totalSpent}</span></p>
                                                            {pendingDues > 0 && <p className="text-red-500 font-bold">Due: ₹{pendingDues}</p>}
                                                        </div>
                                                    </td>
                                                    <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                        <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                                            }`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                        <Link
                                                            href={`/dashboard/admin/users/${user.id}`}
                                                            className="text-indigo-600 hover:text-indigo-900 inline-flex items-center border border-indigo-200 bg-indigo-50 px-2 py-1 rounded"
                                                        >
                                                            <Eye className="w-4 h-4 mr-1" /> View
                                                        </Link>
                                                    </td>
                                                </tr>
                                            )
                                        })
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
