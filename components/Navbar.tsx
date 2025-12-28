'use client'

import Link from 'next/link'
import { useAuth } from '../components/providers/AuthProvider'

export default function Navbar() {
  const { user, signOut, loading, isAdmin } = useAuth()

  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm shadow-sm z-50 border-b border-gray-100">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-20 justify-between items-center">
          <div className="flex items-center">
            <Link href="/" className="flex flex-shrink-0 items-center gap-2">
              <div className="w-8 h-8 rounded bg-[#F5B301] flex items-center justify-center">
                <span className="text-black font-bold text-lg">G</span>
              </div>
              <span className="font-bold text-xl text-gray-900 tracking-tight">GoSelfDrivo</span>
            </Link>
            <div className="hidden md:ml-10 md:flex md:space-x-8">
              <Link href="/" className="text-sm font-medium text-gray-900 hover:text-[#F5B301] transition-colors">Home</Link>
              <Link href="/cars" className="text-sm font-medium text-gray-500 hover:text-[#F5B301] transition-colors">Cars</Link>
              <div className="group relative">
                <button className="text-sm font-medium text-gray-500 hover:text-[#F5B301] flex items-center gap-1 transition-colors">
                  Services
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
              </div>
              <Link href="/about" className="text-sm font-medium text-gray-500 hover:text-[#F5B301] transition-colors">About</Link>
              <Link href="/blog" className="text-sm font-medium text-gray-500 hover:text-[#F5B301] transition-colors">Blog</Link>
              <Link href="/contact" className="text-sm font-medium text-gray-500 hover:text-[#F5B301] transition-colors">Contact</Link>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isAdmin && (
              <Link
                href="/dashboard/admin"
                className="hidden sm:inline-flex items-center px-4 py-2 border border-transparent text-xs font-bold rounded-full text-black bg-[#F5B301] hover:bg-[#D89E00] transition-all shadow-sm"
              >
                Admin Panel
              </Link>
            )}
            <div className="flex items-center">
              {loading ? (
                <div className="h-8 w-8 rounded-full bg-gray-200 animate-pulse"></div>
              ) : user ? (
                <div className="flex items-center gap-4">
                  <div className="hidden md:flex flex-col items-end mr-2">
                    <span className="text-sm font-semibold text-gray-900">{user.email?.split('@')[0]}</span>
                    <Link href="/dashboard" className="text-xs text-gray-500 hover:text-[#F5B301]">My Dashboard</Link>
                  </div>
                  <button
                    onClick={() => signOut()}
                    className="rounded-full bg-gray-100 p-2 text-gray-600 hover:bg-gray-200"
                    title="Sign Out"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/auth/login"
                    className="text-gray-900 hover:text-[#F5B301] text-sm font-medium px-3 py-2"
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/signup"
                    className="rounded-full bg-[#1C1C1C] px-5 py-2.5 text-sm font-semibold text-white shadow-lg hover:bg-gray-800 transition-all transform hover:-translate-y-0.5"
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
