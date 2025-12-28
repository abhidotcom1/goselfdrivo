import { useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { User, Car } from 'lucide-react'

export default function LoginPage() {
    const [role, setRole] = useState<'customer' | 'owner' | null>(null)
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const router = useRouter()

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError(null)

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            // Role specific redirection could happen here if roles enforced
            router.push('/')
            router.refresh()
        }
    }

    if (!role) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
                <div className="w-full max-w-md space-y-8 text-center">
                    <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900">
                        Welcome to GoSelfDrivo
                    </h2>
                    <p className="text-gray-500 mb-8">Please select how you want to continue</p>

                    <div className="grid grid-cols-2 gap-6">
                        <button
                            onClick={() => setRole('customer')}
                            className="flex flex-col items-center justify-center p-6 bg-white border-2 border-transparent hover:border-[#F5B301] hover:bg-yellow-50 rounded-xl shadow-sm transition-all group"
                        >
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#F5B301] transition-colors">
                                <User className="w-8 h-8 text-gray-600 group-hover:text-black" />
                            </div>
                            <span className="font-bold text-gray-900">Customer</span>
                            <span className="text-xs text-gray-500 mt-1">Book a car</span>
                        </button>

                        <button
                            onClick={() => setRole('owner')}
                            className="flex flex-col items-center justify-center p-6 bg-white border-2 border-transparent hover:border-[#F5B301] hover:bg-yellow-50 rounded-xl shadow-sm transition-all group"
                        >
                            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-[#F5B301] transition-colors">
                                <Car className="w-8 h-8 text-gray-600 group-hover:text-black" />
                            </div>
                            <span className="font-bold text-gray-900">Car Owner</span>
                            <span className="text-xs text-gray-500 mt-1">List your vehicle</span>
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
            <div className="w-full max-w-md space-y-8">
                <div>
                    <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:text-gray-900 mb-4">
                        &larr; Back to selection
                    </button>
                    <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-gray-900">
                        {role === 'owner' ? 'Partner Login' : 'Customer Login'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600">
                        Sign in to access your {role} dashboard
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="-space-y-px rounded-md shadow-sm">
                        <div>
                            <label htmlFor="email-address" className="sr-only">
                                Email address
                            </label>
                            <input
                                id="email-address"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                className="relative block w-full rounded-t-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="Email address"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>
                        <div>
                            <label htmlFor="password" className="sr-only">
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                autoComplete="current-password"
                                required
                                className="relative block w-full rounded-b-md border-0 py-1.5 text-gray-900 ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="text-red-500 text-sm text-center">{error}</div>
                    )}

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:opacity-50"
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </div>
                    <div className="text-center text-sm">
                        <Link href="/auth/signup" className="font-medium text-indigo-600 hover:text-indigo-500">
                            Don't have an account? Sign up
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
