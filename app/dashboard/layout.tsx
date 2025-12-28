'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Car, Users, Settings, LogOut, Calendar, Wallet, CreditCard, User, History } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const pathname = usePathname()
    const { isAdmin, loading } = useAuth()

    const adminNavigation = [
        { name: 'Dashboard', href: '/dashboard/admin', icon: LayoutDashboard },
        { name: 'Fleet / Cars', href: '/dashboard/admin/cars', icon: Car },
        { name: 'Bookings', href: '/dashboard/admin/bookings', icon: Calendar },
        { name: 'Expenses', href: '/dashboard/admin/expenses', icon: Wallet },
        { name: 'Payments', href: '/dashboard/admin/payments', icon: CreditCard },
        { name: 'Leads', href: '/dashboard/admin/users', icon: Users },
        { name: 'Settings', href: '/dashboard/admin/settings', icon: Settings },
    ]

    const customerNavigation = [
        { name: 'My Dashboard', href: '/dashboard', icon: LayoutDashboard },
        { name: 'My Bookings', href: '/dashboard', icon: History }, // Temporarily same as dash, can create separate if needed
        { name: 'Profile', href: '/profile', icon: User },
    ]

    const navigation = isAdmin ? adminNavigation : customerNavigation

    if (loading) {
        return (
            <div className="flex h-screen items-center justify-center bg-gray-100">
                <div className="w-8 h-8 rounded-full border-2 border-[#F5B301] border-t-transparent animate-spin" />
            </div>
        )
    }

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <div className="hidden md:flex md:w-64 md:flex-col">
                <div className="flex flex-col flex-grow pt-5 bg-white border-r border-gray-200 overflow-y-auto">
                    <div className="flex items-center flex-shrink-0 px-4 mb-4">
                        <Link href="/" className="flex items-center text-xl font-bold text-black">
                            GoSelfDrivo
                            <span className={`ml-2 text-xs font-medium text-black px-2 py-0.5 rounded-full ${isAdmin ? 'bg-[#F5B301]' : 'bg-gray-200'}`}>
                                {isAdmin ? 'Admin' : 'Customer'}
                            </span>
                        </Link>
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                        <nav className="flex-1 px-2 pb-4 space-y-1">
                            {navigation.map((item) => {
                                const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))
                                return (
                                    <Link
                                        key={item.name}
                                        href={item.href}
                                        className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors ${isActive
                                            ? 'bg-[#F5B301] text-black shadow-sm'
                                            : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                            }`}
                                    >
                                        <item.icon
                                            className={`mr-3 flex-shrink-0 h-5 w-5 ${isActive ? 'text-black' : 'text-gray-400 group-hover:text-gray-500'
                                                }`}
                                            aria-hidden="true"
                                        />
                                        {item.name}
                                    </Link>
                                )
                            })}
                        </nav>
                        <div className="px-2 pb-4">
                            <Link
                                href="/"
                                className="group flex items-center px-2 py-2 text-sm font-medium text-red-600 rounded-md hover:bg-red-50 hover:text-red-700 transition-colors"
                            >
                                <LogOut
                                    className="mr-3 flex-shrink-0 h-5 w-5 text-red-400 group-hover:text-red-500"
                                    aria-hidden="true"
                                />
                                Exit Dashboard
                            </Link>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main content */}
            <div className="flex flex-col flex-1 overflow-hidden">
                <main className="flex-1 relative overflow-y-auto focus:outline-none">
                    <div className="py-6">
                        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
                            {children}
                        </div>
                    </div>
                </main>
            </div>
        </div>
    )
}
