
'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignupPage() {
    const [fullName, setFullName] = useState('')
    const [phone, setPhone] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleSignup = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        try {
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        phone: phone,
                    },
                },
            })

            if (authError) throw authError

            if (data.user) {
                router.push('/')
                router.refresh()
            }
        } catch (err: any) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0F0F0F] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 opacity-20">
                <img src="https://images.unsplash.com/photo-1494976388531-d1058494cdd8?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="bg" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            </div>

            <div className="w-full max-w-md space-y-8 relative z-10 bg-[#1C1C1C] p-8 rounded-2xl border border-gray-800 shadow-2xl">
                <div>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-white">
                        Create an Account
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Join GoSelfDrivo and start driving today
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSignup}>
                    <div className="space-y-4 rounded-md shadow-sm">
                        <div>
                            <label htmlFor="full-name" className="sr-only">Full Name</label>
                            <input
                                id="full-name"
                                name="full-name"
                                type="text"
                                required
                                className="relative block w-full rounded-lg border-0 bg-[#252525] py-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#F5B301] sm:text-sm sm:leading-6 pl-4"
                                placeholder="Full Name"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="phone" className="sr-only">Phone Number</label>
                            <input
                                id="phone"
                                name="phone"
                                type="tel"
                                required
                                className="relative block w-full rounded-lg border-0 bg-[#252525] py-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#F5B301] sm:text-sm sm:leading-6 pl-4"
                                placeholder="Phone Number"
                                value={phone}
                                onChange={(e) => setFullName(e.target.value)} // Corrected below in next line to setPhone
                                onChange={(e) => setPhone(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="email-address" className="sr-only">Email</label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                required
                                className="relative block w-full rounded-lg border-0 bg-[#252525] py-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#F5B301] sm:text-sm sm:leading-6 pl-4"
                                placeholder="Email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">Password</label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                className="relative block w-full rounded-lg border-0 bg-[#252525] py-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#F5B301] sm:text-sm sm:leading-6 pl-4"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 rounded bg-red-900/30 border border-red-800 text-red-200 text-sm text-center">
                            {error}
                        </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full justify-center rounded-lg bg-[#F5B301] px-3 py-3 text-sm font-bold text-black hover:bg-[#D89E00] transition-all">
                        {loading ? 'Creating account...' : 'Sign Up'}
                    </button>

                    <div className="text-center text-sm">
                        <span className="text-gray-500">Already have an account? </span>
                        <Link href="/auth/login" className="font-medium text-[#F5B301] hover:text-yellow-400">
                            Sign in
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
