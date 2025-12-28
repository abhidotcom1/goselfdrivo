'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Car, Key, MapPin, Shield, Zap, Star, ChevronRight, Phone, Clock, CheckCircle } from 'lucide-react'

// Mock data for development when DB is empty
const MOCK_CARS = [
    {
        id: 'mock-1',
        name: 'Tesla Model 3 Performance',
        image_url: 'https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hourly_rate: 25,
        min_booking_hours: 4,
        status: 'AVAILABLE',
        fuel_type: 'ELECTRIC',
        transmission: 'AUTOMATIC',
        seats: 5
    },
    {
        id: 'mock-2',
        name: 'Mercedes-Benz C-Class',
        image_url: 'https://images.unsplash.com/photo-1618843479313-40f8afb4b4d8?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hourly_rate: 35,
        min_booking_hours: 6,
        status: 'AVAILABLE',
        fuel_type: 'PETROL',
        transmission: 'AUTOMATIC',
        seats: 5
    },
]

const FEATURES = [
    { icon: Shield, title: 'Safety & Support', desc: '24/7 Roadside Assistance & Comprehensive Insurance' },
    { icon: MapPin, title: 'Anywhere Delivery', desc: 'Doorstep delivery & pickup across the city' },
    { icon: Clock, title: 'Instant Booking', desc: 'Book in 2 minutes, purely digital process' },
    { icon: Zap, title: 'Well Maintained', desc: 'Regularly serviced fleet for trouble-free rides' },
]

const SERVICES = [
    { title: 'Self Drive Cars', desc: 'Choose from our wide range of well-maintained self-drive cars.', icon: Car },
    { title: 'Corporate Rentals', desc: 'Reliable and professional car rental solutions for business.', icon: Shield },
    { title: 'Wedding Cars', desc: 'Arrive in style with our luxury collection for your special day.', icon: Star },
    { title: 'Outstation Trips', desc: 'Explore new destinations with our unlimited kilometers plan.', icon: MapPin },
    { title: 'Airport Transfers', desc: 'Hassle-free pickups and drops to start your flight on time.', icon: Clock },
]

export default function HomePage() {
    const [cars, setCars] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [activeTab, setActiveTab] = useState('ALL')

    useEffect(() => {
        let mounted = true;

        const fetchCars = async () => {
            try {
                // Ensure auth session is ready if needed by RLS, though standard client handles it.
                // We add a small delay or check? No, shared client should have state if initialized.

                const { data, error } = await supabase
                    .from('cars')
                    .select('*')
                    .eq('status', 'AVAILABLE')
                    .limit(6)

                if (!mounted) return;

                if (error) {
                    console.error('Error fetching cars:', error);
                    setCars(MOCK_CARS);
                } else if (!data || data.length === 0) {
                    // If no cars in DB, show Mock cars so the homepage isn't empty during demo
                    console.log('No cars found, using mock data');
                    setCars(MOCK_CARS);
                } else {
                    setCars(data);
                }
            } catch (err) {
                console.error('Exception fetching cars:', err);
                if (mounted) setCars(MOCK_CARS);
            } finally {
                if (mounted) setLoading(false);
            }
        }

        fetchCars()

        return () => { mounted = false };
    }, [])

    const filteredCars = activeTab === 'ALL'
        ? cars
        : cars // Visual only for now, as category doesn't exist in schema yet

    return (
        <div className="min-h-screen bg-gray-50 font-sans">

            {/* HER HERO SECTION */}
            <div className="relative bg-[#0F0F0F] pt-20 pb-12 lg:pt-32 lg:pb-28 overflow-hidden">
                {/* Background Pattern */}
                <div className="absolute inset-0 z-0 opacity-20">
                    <img
                        src="https://images.unsplash.com/photo-1493238792015-164e8502561c?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80"
                        alt="Background"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-black via-[#0F0F0F] to-transparent"></div>
                </div>

                <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="lg:w-2/3">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#F5B301]/10 border border-[#F5B301]/20 mb-6">
                            <span className="w-2 h-2 rounded-full bg-[#F5B301] animate-pulse"></span>
                            <span className="text-[#F5B301] text-xs font-bold tracking-wide uppercase">Premium Fleet Available</span>
                        </div>
                        <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white tracking-tight leading-tight mb-6">
                            Self Drive Car Rental <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#F5B301] to-yellow-200">
                                in Delhi NCR
                            </span>
                        </h1>
                        <p className="text-lg text-gray-400 mb-10 max-w-2xl leading-relaxed">
                            Experience the ultimate freedom with GoSelfDrivo. Premium vehicles,
                            transparent pricing, and seamless booking for your perfect self-drive car hire in Delhi.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 mb-16">
                            <a href="#fleet" className="inline-flex justify-center items-center px-8 py-4 bg-[#F5B301] text-black font-bold rounded-full hover:bg-[#D89E00] transition-all transform hover:-translate-y-1 shadow-[0_0_20px_rgba(245,179,1,0.4)]">
                                Book Now
                                <ChevronRight className="ml-2 w-5 h-5" />
                            </a>
                            <a href="#how-it-works" className="inline-flex justify-center items-center px-8 py-4 bg-white/5 backdrop-blur-sm border border-white/10 text-white font-semibold rounded-full hover:bg-white/10 transition-all">
                                Explore Fleet
                            </a>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-8 border-t border-gray-800 pt-8 max-w-3xl">
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">100%</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Verified Cars</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">24/7</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">Available</div>
                            </div>
                            <div>
                                <div className="text-3xl font-bold text-white mb-1">4.9</div>
                                <div className="text-sm text-gray-500 uppercase tracking-widest">User Rating</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* FLEET SECTION */}
            <div id="fleet" className="py-20 bg-[#161616]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-16">
                        <h2 className="text-[#F5B301] font-semibold tracking-wide uppercase text-sm mb-3">Our Collection</h2>
                        <h3 className="text-3xl md:text-4xl font-bold text-white">Our Self Drive Car Hire Delhi Fleet</h3>
                        <p className="text-gray-400 mt-4 max-w-2xl mx-auto">
                            Choose from our premium collection of well-maintained vehicles for every occasion.
                        </p>
                    </div>

                    {/* Filter Tabs (Visual) */}
                    <div className="flex justify-center flex-wrap gap-2 mb-12">
                        {['ALL', 'HATCHBACK', 'SEDAN', 'SUV', 'LUXURY'].map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${activeTab === tab
                                    ? 'bg-[#F5B301] text-black'
                                    : 'bg-white/5 text-gray-400 hover:bg-white/10'
                                    }`}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    {/* Cars Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {loading ? (
                            [1, 2, 3].map(i => <div key={i} className="h-96 bg-gray-800 rounded-2xl animate-pulse" />)
                        ) : filteredCars.map((car) => (
                            <div key={car.id} className="group bg-[#1C1C1C] rounded-2xl overflow-hidden border border-gray-800 hover:border-gray-700 transition-all hover:shadow-2xl hover:shadow-black/50">
                                <div className="relative h-56 overflow-hidden">
                                    <img
                                        src={car.image_urls?.[0] || car.image_url || 'https://via.placeholder.com/800'}
                                        alt={car.name}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                                    />
                                    <div className="absolute top-4 left-4 bg-black/80 px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10 shadow-sm">
                                        {car.fuel_type} • {car.transmission}
                                    </div>
                                </div>
                                <div className="p-6">
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h4 className="text-xl font-bold text-white mb-1">{car.name}</h4>
                                            <div className="flex items-center text-gray-500 text-xs gap-2">
                                                <span>{car.seats} Seats</span>
                                                <span>•</span>
                                                <span>{car.fuel_type}</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold text-[#F5B301]">₹{car.hourly_rate}</div>
                                            <div className="text-xs text-gray-500">/hour</div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-3 mb-6">
                                        <div className="bg-black/30 p-2 rounded text-xs text-gray-400 text-center">
                                            AC Available
                                        </div>
                                        <div className="bg-black/30 p-2 rounded text-xs text-gray-400 text-center">
                                            Music System
                                        </div>
                                    </div>

                                    <div className="flex gap-3">
                                        <Link href={`/cars/${car.id}`} className="flex-1 text-center py-3 rounded-xl bg-white/5 text-white font-semibold hover:bg-white/10 text-sm transition-colors border border-white/5">
                                            Details
                                        </Link>
                                        <Link href={`/cars/${car.id}`} className="flex-1 text-center py-3 rounded-xl bg-[#F5B301] text-black font-bold hover:bg-[#D89E00] text-sm transition-colors shadow-lg shadow-orange-500/20">
                                            Book Now
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="mt-12 text-center">
                        <Link href="/cars" className="inline-flex items-center px-8 py-3 border border-gray-700 rounded-full text-white font-medium hover:bg-white/5 transition-colors">
                            View All Cars
                            <ChevronRight className="ml-2 w-4 h-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* CONTENT SECTION */}
            <div className="py-20 bg-[#121212] border-t border-gray-900">
                <div className="max-w-4xl mx-auto px-4 text-center">
                    <h2 className="text-3xl font-bold text-white mb-6">Your Guide to Self Drive Car Rental in Delhi</h2>
                    <p className="text-gray-400 mb-8 leading-relaxed">
                        Everything you need to know about hiring a self-drive car in Delhi, from booking your ride to exploring the city with freedom.
                        Delhi, a hub of sprawling history and vibrant culture, is best explored at your own pace. With a self-drive car, you can explore iconic landmarks like India Gate, Qutub Minar, and Humayun's Tomb on your own schedule.
                    </p>

                    <div className="grid md:grid-cols-2 gap-6 text-left">
                        <div className="bg-[#1C1C1C] p-6 rounded-xl border border-gray-800">
                            <div className="w-10 h-10 rounded-lg bg-[#F5B301]/20 flex items-center justify-center mb-4 text-[#F5B301]">
                                <Shield className="w-5 h-5" />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">Safe & Compare</h4>
                            <p className="text-sm text-gray-400">Our fleet is strictly verified and insured. Compare prices and features to find your perfect ride.</p>
                        </div>
                        <div className="bg-[#1C1C1C] p-6 rounded-xl border border-gray-800">
                            <div className="w-10 h-10 rounded-lg bg-[#F5B301]/20 flex items-center justify-center mb-4 text-[#F5B301]">
                                <Clock className="w-5 h-5" />
                            </div>
                            <h4 className="text-lg font-bold text-white mb-2">Flexible Bookings</h4>
                            <p className="text-sm text-gray-400">Book for a few hours or a few weeks. We offer flexible hourly rates and weekly plans.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* SERVICES GRID */}
            <div className="py-20 bg-[#0F0F0F]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="mb-12">
                        <h2 className="text-3xl font-bold text-white mb-4">Our Services</h2>
                        <p className="text-gray-400">Beyond just rentals, we offer comprehensive travel solutions.</p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {SERVICES.map((service, idx) => (
                            <div key={idx} className="group p-8 bg-[#181818] rounded-2xl border border-gray-800 hover:border-[#F5B301]/50 transition-all hover:bg-[#202020]">
                                <service.icon className="w-10 h-10 text-[#F5B301] mb-6 group-hover:scale-110 transition-transform" />
                                <h4 className="text-xl font-bold text-white mb-3">{service.title}</h4>
                                <p className="text-gray-400 text-sm leading-relaxed mb-6">{service.desc}</p>
                                <a href="#" className="text-[#F5B301] text-sm font-bold flex items-center group-hover:gap-2 transition-all">
                                    Learn More <ChevronRight className="w-4 h-4" />
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="bg-black text-white pt-20 pb-10 border-t border-gray-900">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
                        <div className="col-span-1 md:col-span-1">
                            <div className="flex items-center gap-2 mb-6">
                                <div className="w-8 h-8 rounded bg-[#F5B301] flex items-center justify-center">
                                    <span className="text-black font-bold text-lg">G</span>
                                </div>
                                <span className="font-bold text-xl tracking-tight">GoSelfDrivo</span>
                            </div>
                            <p className="text-gray-500 text-sm leading-relaxed mb-6">
                                Your trusted partner for premium self-drive car rentals. Experience freedom, comfort, and reliability on every journey.
                            </p>
                            <div className="text-sm text-gray-400 space-y-2">
                                <div className="flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-[#F5B301]" /> +91 9625109442
                                </div>
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-4 h-4 text-[#F5B301]" /> Delhi NCR, India
                                </div>
                            </div>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Quick Links</h4>
                            <ul className="space-y-4 text-sm text-gray-500">
                                <li><Link href="/about" className="hover:text-[#F5B301] transition-colors">About Us</Link></li>
                                <li><Link href="/cars" className="hover:text-[#F5B301] transition-colors">Our Fleet</Link></li>
                                <li><Link href="/services" className="hover:text-[#F5B301] transition-colors">Services</Link></li>
                                <li><Link href="/contact" className="hover:text-[#F5B301] transition-colors">Contact Us</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Our Services</h4>
                            <ul className="space-y-4 text-sm text-gray-500">
                                <li><Link href="#" className="hover:text-[#F5B301] transition-colors">Self Drive Cars</Link></li>
                                <li><Link href="#" className="hover:text-[#F5B301] transition-colors">Corporate Rentals</Link></li>
                                <li><Link href="#" className="hover:text-[#F5B301] transition-colors">Wedding Cars</Link></li>
                                <li><Link href="#" className="hover:text-[#F5B301] transition-colors">Airport Transfers</Link></li>
                            </ul>
                        </div>

                        <div>
                            <h4 className="font-bold text-white mb-6">Legal</h4>
                            <ul className="space-y-4 text-sm text-gray-500">
                                <li><Link href="#" className="hover:text-[#F5B301] transition-colors">Privacy Policy</Link></li>
                                <li><Link href="#" className="hover:text-[#F5B301] transition-colors">Terms & Conditions</Link></li>
                                <li><Link href="#" className="hover:text-[#F5B301] transition-colors">Refund Policy</Link></li>
                            </ul>
                        </div>
                    </div>

                    <div className="border-t border-gray-900 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-gray-600 text-sm">© 2025 GoSelfDrivo. All rights reserved.</p>
                        <div className="flex gap-6 text-sm text-gray-600">
                            <Link href="#" className="hover:text-white">Privacy</Link>
                            <Link href="#" className="hover:text-white">Terms</Link>
                            <Link href="#" className="hover:text-white">Sitemap</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    )
}
