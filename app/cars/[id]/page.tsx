'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabaseClient'
import { Car, Fuel, Zap, Users, ArrowLeft, Shield, MapPin, Check, ChevronRight, Star, Clock } from 'lucide-react'
import { useAuth } from '@/components/providers/AuthProvider'

// Mock car for dev if not found
const MOCK_CAR = {
    id: 'mock-1',
    name: 'Tesla Model 3 Performance',
    image_urls: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80', 'https://images.unsplash.com/photo-1536700503339-1e4b0652077e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
    hourly_rate: 250,
    min_booking_hours: 4,
    status: 'AVAILABLE',
    fuel_type: 'ELECTRIC',
    transmission: 'AUTOMATIC',
    seats: 5,
    description: "Experience the thrill of instant torque and cutting-edge technology. The Tesla Model 3 Performance delivers unmatched acceleration, premium comfort, and advanced safety features for a driving experience like no other."
}

export default function CarDetailsPage() {
    const params = useParams()
    const [car, setCar] = useState<any>(null)
    const [loading, setLoading] = useState(true)
    const [selectedImageIndex, setSelectedImageIndex] = useState(0)
    const { user } = useAuth()
    const router = useRouter()

    const handleBookNow = () => {
        if (!user) {
            router.push('/auth/login')
        } else {
            router.push(`/book/${car.id}`)
        }
    }

    useEffect(() => {
        const fetchCar = async () => {
            if (!params?.id) return

            const { data, error } = await supabase
                .from('cars')
                .select('*')
                .eq('id', params.id)
                .single()

            if (data) {
                setCar(data)
            } else {
                console.log('Error fetching car, using mock:', error)
                if (params.id === 'mock-1') setCar(MOCK_CAR) // Fallback for testing
            }
            setLoading(false)
        }

        fetchCar()
    }, [params?.id])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#0F0F0F]">
                <div className="w-8 h-8 rounded-full border-2 border-[#F5B301] border-t-transparent animate-spin" />
            </div>
        )
    }

    if (!car) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F0F0F] p-4 text-white">
                <h2 className="text-2xl font-bold mb-2">Vehicle Not Found</h2>
                <Link href="/cars" className="text-[#F5B301] hover:underline flex items-center">
                    <ArrowLeft className="w-4 h-4 mr-1" /> Back to Fleet
                </Link>
            </div>
        )
    }

    const images = car.image_urls && car.image_urls.length > 0
        ? car.image_urls
        : [car.image_url || 'https://via.placeholder.com/800x600?text=No+Image']

    return (
        <div className="min-h-screen bg-[#0F0F0F] text-gray-100 font-sans pb-20">
            {/* Breadcrumb */}
            <div className="bg-[#161616] py-4 border-b border-gray-800">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Link href="/" className="text-gray-500 hover:text-[#F5B301] flex items-center text-sm font-medium transition-colors w-fit">
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back to Fleet
                    </Link>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="lg:grid lg:grid-cols-2 lg:gap-x-12 xl:gap-x-16">

                    {/* LEFT COLUMN: IMAGES */}
                    <div className="flex flex-col gap-4">
                        <div className="aspect-w-16 aspect-h-10 w-full overflow-hidden rounded-2xl bg-[#1C1C1C] border border-gray-800 relative group">
                            <img
                                src={images[selectedImageIndex]}
                                alt={car.name}
                                className="h-full w-full object-cover object-center transition-transform duration-500 group-hover:scale-105"
                            />
                            <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-bold text-white border border-white/10">
                                {car.fuel_type} • {car.transmission}
                            </div>
                        </div>

                        {/* Thumbnails */}
                        {images.length > 1 && (
                            <div className="flex gap-4 overflow-x-auto py-2">
                                {images.map((img: string, idx: number) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`relative w-24 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx
                                            ? 'border-[#F5B301] opacity-100'
                                            : 'border-transparent opacity-50 hover:opacity-80'
                                            }`}
                                    >
                                        <img src={img} alt={`View ${idx}`} className="h-full w-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Description Block (Desktop) */}
                        <div className="hidden lg:block mt-8 bg-[#161616] p-6 rounded-2xl border border-gray-800">
                            <h3 className="text-lg font-bold text-white mb-4">About this car</h3>
                            <p className="text-gray-400 leading-relaxed text-sm">
                                {car.description || `Experience the ultimate comfort and performance with our ${car.name}. Perfectly maintained and sanitized for your safety. Ideal for weekend getaways, business trips, or just a fun drive around the city.`}
                            </p>
                        </div>
                    </div>

                    {/* RIGHT COLUMN: DETAILS */}
                    <div className="mt-8 lg:mt-0">
                        <div className="mb-6">
                            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight mb-2">{car.name}</h1>
                            <div className="flex items-center gap-4 text-sm text-gray-400">
                                <div className="flex items-center text-[#F5B301]">
                                    <Star className="w-4 h-4 fill-current mr-1" />
                                    <span className="font-bold">4.9</span>
                                    <span className="text-gray-500 ml-1">(45 reviews)</span>
                                </div>
                                <span>•</span>
                                <span className="text-green-500 flex items-center font-medium">
                                    <Check className="w-3 h-3 mr-1" /> {car.status}
                                </span>
                            </div>
                        </div>

                        {/* Price Card */}
                        <div className="bg-[#1C1C1C] p-6 rounded-2xl border border-gray-800 mb-8 flex items-center justify-between">
                            <div>
                                <p className="text-gray-400 text-sm">Starting from</p>
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold text-white">₹{car.hourly_rate}</span>
                                    <span className="text-gray-500">/hour</span>
                                </div>
                            </div>
                            <button onClick={handleBookNow} className="px-8 py-3 bg-[#F5B301] text-black font-bold rounded-xl hover:bg-[#D89E00] transition-colors shadow-lg shadow-orange-500/20 flex items-center">
                                Book Now <ChevronRight className="ml-2 w-5 h-5" />
                            </button>
                        </div>

                        {/* Specs Grid */}
                        <h3 className="text-lg font-bold text-white mb-4">Car Specifications</h3>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
                            <div className="bg-[#181818] p-4 rounded-xl border border-gray-800 flex flex-col items-center text-center hover:border-[#F5B301]/30 transition-colors">
                                <Car className="w-6 h-6 text-[#F5B301] mb-2" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Type</span>
                                <span className="font-semibold text-white">Sedan</span>
                            </div>
                            <div className="bg-[#181818] p-4 rounded-xl border border-gray-800 flex flex-col items-center text-center hover:border-[#F5B301]/30 transition-colors">
                                <Users className="w-6 h-6 text-[#F5B301] mb-2" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Seats</span>
                                <span className="font-semibold text-white">{car.seats}</span>
                            </div>
                            <div className="bg-[#181818] p-4 rounded-xl border border-gray-800 flex flex-col items-center text-center hover:border-[#F5B301]/30 transition-colors">
                                <Fuel className="w-6 h-6 text-[#F5B301] mb-2" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Fuel</span>
                                <span className="font-semibold text-white capitalize">{car.fuel_type.toLowerCase()}</span>
                            </div>
                            <div className="bg-[#181818] p-4 rounded-xl border border-gray-800 flex flex-col items-center text-center hover:border-[#F5B301]/30 transition-colors">
                                <Zap className="w-6 h-6 text-[#F5B301] mb-2" />
                                <span className="text-xs text-gray-500 uppercase tracking-wider">Transmission</span>
                                <span className="font-semibold text-white capitalize">{car.transmission.toLowerCase()}</span>
                            </div>
                        </div>

                        {/* Extra Info Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
                            <div className="flex items-center p-4 bg-[#181818] rounded-xl border border-gray-800">
                                <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center mr-4 text-gray-400">
                                    <Clock className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Min Booking</h4>
                                    <p className="text-xs text-gray-500">Minimum {car.min_booking_hours} hours required</p>
                                </div>
                            </div>
                            <div className="flex items-center p-4 bg-[#181818] rounded-xl border border-gray-800">
                                <div className="w-10 h-10 rounded-full bg-[#1C1C1C] flex items-center justify-center mr-4 text-gray-400">
                                    <Shield className="w-5 h-5" />
                                </div>
                                <div>
                                    <h4 className="font-bold text-white text-sm">Insurance Included</h4>
                                    <p className="text-xs text-gray-500">Basic damage protection</p>
                                </div>
                            </div>
                        </div>

                        {/* Features List */}
                        <div className="mb-8">
                            <h3 className="text-lg font-bold text-white mb-4">Features</h3>
                            <div className="flex flex-wrap gap-2">
                                {['Bluetooth', 'Reverse Camera', 'Air Conditioning', 'Power Windows', 'USB Charger', 'Music System'].map((feature, i) => (
                                    <span key={i} className="px-3 py-1.5 rounded-full bg-[#1C1C1C] text-gray-300 text-xs border border-gray-800">
                                        {feature}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <p className="text-xs text-gray-500">
                            *Additional features are available. Please contact us for details.
                        </p>

                    </div>
                </div>
            </div>
        </div>
    )
}
