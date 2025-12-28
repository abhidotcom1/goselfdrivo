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
            console.log("Fetching admin stats...");

            // Run all independent queries in parallel
            const [
                paymentsRes,
                expensesRes,
                bookingsRes,
                activeBookingsRes,
                fleetSizeRes
            ] = await Promise.all([
                supabase.from('payments').select('amount'),
                supabase.from('expenses').select('amount'),
                supabase.from('bookings').select('due_amount'),
                supabase.from('bookings').select('*', { count: 'exact', head: true }).eq('status', 'ON_TRIP'),
                supabase.from('cars').select('*', { count: 'exact', head: true })
            ]);

            // Process Payments
            if (paymentsRes.error) console.error("Payments Error:", paymentsRes.error);
            const totalCollected = paymentsRes.data?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

            // Process Expenses
            if (expensesRes.error) console.error("Expenses Error:", expensesRes.error);
            const totalExpenses = expensesRes.data?.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0) || 0;

            // Process Dues
            const totalDues = bookingsRes.data?.reduce((acc, curr) => acc + (Number(curr.due_amount) || 0), 0) || 0;

            // Process Counts
            const activeBookings = activeBookingsRes.count || 0;
            const fleetSize = fleetSizeRes.count || 0;

            // Derived
            const netProfit = totalCollected - totalExpenses;
            setFinancialMetrics({ revenue: totalCollected, expenses: totalExpenses });

            setStats([
                { name: 'Total Collected', value: `₹${totalCollected.toLocaleString()}`, icon: DollarSign, color: 'text-[#F5B301]', loading: false },
                { name: 'Total Expenses', value: `₹${totalExpenses.toLocaleString()}`, icon: DollarSign, color: 'text-red-500', loading: false },
                { name: 'Net Profit', value: `₹${netProfit.toLocaleString()}`, icon: Activity, color: 'text-black', loading: false },
                { name: 'Pending Dues', value: `₹${totalDues.toLocaleString()}`, icon: Calendar, color: 'text-red-500', loading: false },
                { name: 'Active Trips', value: String(activeBookings), icon: Activity, color: 'text-[#F5B301]', loading: false },
                { name: 'Fleet Size', value: String(fleetSize), icon: Car, color: 'text-black', loading: false },
            ]);
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            // Even on error, stop loading state to avoid UI freeze perception
            setStats(prev => prev.map(item => ({ ...item, loading: false, value: 'Error' })));
        }
    }

    // Helper to calculate margin safely
    const margin = financialMetrics.revenue > 0
        ? ((financialMetrics.revenue - financialMetrics.expenses) / financialMetrics.revenue * 100).toFixed(1)
        : 0

    return (
        <div>
            <h1 className="text-2xl font-semibold text-gray-900">Dashboard Overview</h1>

            {/* DEBUG PANEL - REMOVE AFTER FIXING */}
            <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-md text-xs font-mono">
                <p><strong>Debug Info:</strong></p>
                <p>Status: {stats[0].loading ? 'Loading Stats...' : 'Stats Loaded'}</p>
                {/* We need to fetch profile client-side to show role here if not passed via props, 
                    but stats loading status is a good proxy for connection health. 
                    Let's also try to read the profile from Supabase directly here for debug. */}
            </div>

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

