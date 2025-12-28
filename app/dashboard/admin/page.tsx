'use client'

import { useState, useEffect } from 'react'
import { Car, Users, Calendar, DollarSign, Activity } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState([
        { name: 'Total Collected', value: '₹0', icon: DollarSign, color: 'text-[#F5B301]', loading: true },
        { name: 'Total Expenses', value: '₹0', icon: DollarSign, color: 'text-red-500', loading: true },
        { name: 'Net Profit', value: '₹0', icon: Activity, color: 'text-black', loading: true },
        { name: 'Pending Dues', value: '₹0', icon: Calendar, color: 'text-red-500', loading: true },
        { name: 'Active Trips', value: '0', icon: Activity, color: 'text-[#F5B301]', loading: true },
        { name: 'Fleet Size', value: '0', icon: Car, color: 'text-black', loading: true },
    ])
    const [financialMetrics, setFinancialMetrics] = useState({ revenue: 0, expenses: 0 })

    useEffect(() => {
        fetchStats()
    }, [])

    const fetchStats = async () => {
        try {
            // 1. Total Collected (Payments Table)
            const { data: paymentsData } = await supabase.from('payments').select('amount')
            const totalCollected = paymentsData?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0

            // 2. Total Expenses
            const { data: expensesData } = await supabase.from('expenses').select('amount')
            const totalExpenses = expensesData?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0

            // 3. Pending Dues (Bookings)
            const { data: bookingsData } = await supabase.from('bookings').select('due_amount')
            const totalDues = bookingsData?.reduce((acc, curr) => acc + (Number(curr.due_amount) || 0), 0) || 0

            // 4. Counts
            const { count: activeBookings } = await supabase
                .from('bookings')
                .select('*', { count: 'exact', head: true })
                .eq('status', 'ON_TRIP')

            const { count: fleetSize } = await supabase
                .from('cars')
                .select('*', { count: 'exact', head: true })

            // Derived
            const netProfit = totalCollected - totalExpenses
            setFinancialMetrics({ revenue: totalCollected, expenses: totalExpenses })

            setStats([
                { name: 'Total Collected', value: `₹${totalCollected.toLocaleString()}`, icon: DollarSign, color: 'text-[#F5B301]', loading: false },
                { name: 'Total Expenses', value: `₹${totalExpenses.toLocaleString()}`, icon: DollarSign, color: 'text-red-500', loading: false },
                { name: 'Net Profit', value: `₹${netProfit.toLocaleString()}`, icon: Activity, color: 'text-black', loading: false },
                { name: 'Pending Dues', value: `₹${totalDues.toLocaleString()}`, icon: Calendar, color: 'text-red-500', loading: false },
                { name: 'Active Trips', value: String(activeBookings || 0), icon: Activity, color: 'text-[#F5B301]', loading: false },
                { name: 'Fleet Size', value: String(fleetSize || 0), icon: Car, color: 'text-black', loading: false },
            ])

        } catch (error) {
            console.error('Error fetching dashboard stats:', error)
        }
    }

    // Helper to calculate margin safely
    const margin = financialMetrics.revenue > 0
        ? ((financialMetrics.revenue - financialMetrics.expenses) / financialMetrics.revenue * 100).toFixed(1)
        : 0

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>

            <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {stats.map((item) => (
                    <div key={item.name} className="bg-white overflow-hidden shadow-sm rounded-lg border-t-4 border-[#F5B301]">
                        <div className="p-5">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <item.icon className={`h-6 w-6 ${item.color}`} aria-hidden="true" />
                                </div>
                                <div className="ml-5 w-0 flex-1">
                                    <dl>
                                        <dt className="text-sm font-medium text-gray-500 truncate">{item.name}</dt>
                                        <dd>
                                            <div className="text-lg font-medium text-gray-900">
                                                {item.loading ? <span className="animate-pulse">...</span> : item.value}
                                            </div>
                                        </dd>
                                    </dl>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* System Status / Quick Tips */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
                <div className="bg-white shadow rounded-lg p-6">
                    <h3 className="text-sm font-medium text-gray-900">Financial Health</h3>
                    <div className="mt-4">
                        <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-500">Net Profit Margin</span>
                            <span className={`font-semibold ${Number(margin) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                {margin}%
                            </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2.5 mt-2 overflow-hidden">
                            {/* Simple visual representation of expenses vs profit */}
                            <div className="flex h-2.5 rounded-full">
                                <div style={{ width: `${financialMetrics.revenue > 0 ? (financialMetrics.expenses / financialMetrics.revenue * 100) : 0}%` }} className="bg-red-400 h-full"></div>
                                <div style={{ width: `${Number(margin) > 0 ? Number(margin) : 0}%` }} className="bg-green-500 h-full"></div>
                            </div>
                        </div>
                        <p className="mt-2 text-xs text-gray-500">Red: Expenses, Green: Profit. {financialMetrics.revenue === 0 && 'No revenue yet.'}</p>
                    </div>
                </div>

                <div className="bg-white shadow rounded-lg p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse"></div>
                        <span className="text-sm font-medium text-gray-900">System Operational</span>
                    </div>
                    <p className="text-sm text-gray-500">
                        Real-time tracking is active for Fleet, Bookings, and Financials.
                    </p>
                </div>
            </div>
        </div>
    )
}

