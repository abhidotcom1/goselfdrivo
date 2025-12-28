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
            <div className="flex min-h-screen items-center justify-center bg-[#0F0F0F] relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute inset-0 z-0 opacity-30">
                    <div className="absolute top-0 -left-20 w-72 h-72 bg-[#F5B301] rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
                    <div className="absolute bottom-0 -right-20 w-72 h-72 bg-purple-900 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
                </div>

                <div className="w-full max-w-4xl grid md:grid-cols-2 gap-8 p-4 relative z-10">
                    <div className="hidden md:flex flex-col justify-center text-left">
                        <h1 className="text-4xl font-extrabold text-white mb-4">
                            Welcome Back to <span className="text-[#F5B301]">GoSelfDrivo</span>
                        </h1>
                        <p className="text-gray-400 text-lg mb-8">
                            Premium self-drive car rentals in Delhi NCR. Choose your role to continue.
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-center text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center mr-3 text-[#F5B301] border border-gray-800">1</div>
                                <span>Select your role</span>
                            </div>
                            <div className="flex items-center text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center mr-3 text-[#F5B301] border border-gray-800">2</div>
                                <span>Sign in securely</span>
                            </div>
                            <div className="flex items-center text-gray-300">
                                <div className="w-8 h-8 rounded-full bg-[#1C1C1C] flex items-center justify-center mr-3 text-[#F5B301] border border-gray-800">3</div>
                                <span>Start your journey</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-[#1C1C1C] border border-gray-800 rounded-2xl p-8 shadow-2xl">
                        <h2 className="text-2xl font-bold text-white mb-6 text-center">Select Account Type</h2>
                        <div className="grid grid-cols-2 gap-4">
                            <button
                                onClick={() => setRole('customer')}
                                className="flex flex-col items-center justify-center p-6 bg-[#252525] border border-gray-700 hover:border-[#F5B301] hover:bg-[#2A2A2A] rounded-xl transition-all group"
                            >
                                <div className="w-14 h-14 bg-[#151515] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#F5B301] transition-colors">
                                    <User className="w-6 h-6 text-gray-400 group-hover:text-black" />
                                </div>
                                <span className="font-bold text-white">Customer</span>
                                <span className="text-xs text-gray-500 mt-1">I want to book a car</span>
                            </button>

                            <button
                                onClick={() => setRole('owner')}
                                className="flex flex-col items-center justify-center p-6 bg-[#252525] border border-gray-700 hover:border-[#F5B301] hover:bg-[#2A2A2A] rounded-xl transition-all group"
                            >
                                <div className="w-14 h-14 bg-[#151515] rounded-full flex items-center justify-center mb-3 group-hover:bg-[#F5B301] transition-colors">
                                    <Car className="w-6 h-6 text-gray-400 group-hover:text-black" />
                                </div>
                                <span className="font-bold text-white">Car Owner</span>
                                <span className="text-xs text-gray-500 mt-1">I want to list my car</span>
                            </button>
                        </div>
                        <div className="mt-8 text-center">
                            <Link href="/" className="text-gray-500 hover:text-white text-sm">
                                Back to Home
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#0F0F0F] px-4 py-12 sm:px-6 lg:px-8 relative overflow-hidden">
            {/* Background Elements */}
            <div className="absolute inset-0 z-0 opacity-20">
                <img src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" alt="bg" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/80 backdrop-blur-sm"></div>
            </div>

            <div className="w-full max-w-md space-y-8 relative z-10 bg-[#1C1C1C] p-8 rounded-2xl border border-gray-800 shadow-2xl">
                <div>
                    <button onClick={() => setRole(null)} className="text-sm text-gray-500 hover:text-[#F5B301] mb-6 flex items-center transition-colors">
                        &larr; Back to selection
                    </button>
                    <div className="flex justify-center mb-4">
                        <div className="w-12 h-12 rounded-full bg-[#F5B301] flex items-center justify-center text-black font-bold text-xl">
                            {role === 'owner' ? <Car className="w-6 h-6" /> : <User className="w-6 h-6" />}
                        </div>
                    </div>
                    <h2 className="text-center text-3xl font-bold tracking-tight text-white">
                        {role === 'owner' ? 'Partner Login' : 'Customer Login'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-400">
                        Enter your credentials to access your account
                    </p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleLogin}>
                    <div className="space-y-4 rounded-md shadow-sm">
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
                                className="relative block w-full rounded-lg border-0 bg-[#252525] py-3 text-white ring-1 ring-inset ring-gray-700 placeholder:text-gray-500 focus:z-10 focus:ring-2 focus:ring-inset focus:ring-[#F5B301] sm:text-sm sm:leading-6 pl-4"
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

                    <div>
                        <button
                            type="submit"
                            disabled={loading}
                            className="group relative flex w-full justify-center rounded-lg bg-[#F5B301] px-3 py-3 text-sm font-bold text-black hover:bg-[#D89E00] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#F5B301] disabled:opacity-50 transition-all"
                        >
                            {loading ? 'Verifying...' : 'Sign In'}
                        </button>
                    </div>
                    <div className="text-center text-sm">
                        <span className="text-gray-500">Don't have an account? </span>
                        <Link href="/auth/signup" className="font-medium text-[#F5B301] hover:text-yellow-400">
                            Sign up now
                        </Link>
                    </div>
                </form>
            </div>
        </div>
    )
}
