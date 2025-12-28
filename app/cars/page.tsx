'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'
import Link from 'next/link'
import { Car, Filter, Fuel, Gauge, SlidersHorizontal, Users, Search, Calendar, MapPin, ChevronDown } from 'lucide-react'

// Enhanced Mock Data
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
        seats: 5,
        type: 'LUXURY'
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
        seats: 5,
        type: 'LUXURY'
    },
    {
        id: 'mock-3',
        name: 'Hyundai Creta',
        image_url: 'https://images.unsplash.com/photo-1609529669235-c07e4e1bd6e9?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hourly_rate: 15,
        min_booking_hours: 4,
        status: 'AVAILABLE',
        fuel_type: 'DIESEL',
        transmission: 'MANUAL',
        seats: 5,
        type: 'SUV'
    },
    {
        id: 'mock-4',
        name: 'Maruti Suzuki Swift',
        image_url: 'https://images.unsplash.com/photo-1502877338535-766e1452684a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hourly_rate: 8,
        min_booking_hours: 4,
        status: 'AVAILABLE',
        fuel_type: 'PETROL',
        transmission: 'MANUAL',
        seats: 4,
        type: 'HATCHBACK'
    },
    {
        id: 'mock-5',
        name: 'Toyota Fortuner',
        image_url: 'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hourly_rate: 40,
        min_booking_hours: 12,
        status: 'AVAILABLE',
        fuel_type: 'DIESEL',
        transmission: 'AUTOMATIC',
        seats: 7,
        type: 'SUV'
    },
    {
        id: 'mock-6',
        name: 'Mahindra Thar',
        image_url: 'https://images.unsplash.com/photo-1619682817481-e994891cd1f5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
        hourly_rate: 22,
        min_booking_hours: 6,
        status: 'AVAILABLE',
        fuel_type: 'DIESEL',
        transmission: 'MANUAL',
        seats: 4,
        type: 'SUV'
    }
]

export default function CarsPage() {
    const [cars, setCars] = useState<any[]>([])
    const [loading, setLoading] = useState(true)
    const [filters, setFilters] = useState({
        type: [] as string[],
        fuel: [] as string[],
        transmission: [] as string[],
        seats: [] as string[]
    })
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchCars = async () => {
            try {
                const { data, error } = await supabase
                    .from('cars')
                    .select('*')
                    .eq('status', 'AVAILABLE')

                if (error || !data || data.length === 0) {
                    console.log('Fetching cars failed or empty, using mock data');
                    setCars(MOCK_CARS);
                } else {
                    setCars(data);
                }
            } catch (err) {
                console.error('Error:', err);
                setCars(MOCK_CARS);
            } finally {
                setLoading(false);
            }
        }
        fetchCars()
    }, [])

    const toggleFilter = (category: keyof typeof filters, value: string) => {
        setFilters(prev => ({
            ...prev,
            [category]: prev[category].includes(value)
                ? prev[category].filter(item => item !== value)
                : [...prev[category], value]
        }))
    }

    // Filter Logic
    const filteredCars = cars.filter(car => {
        // Search
        if (searchTerm && !car.name.toLowerCase().includes(searchTerm.toLowerCase())) return false

        // Car Type (Mock data has type, DB might not yet. If missing in car, ignore filter or show all)
        if (filters.type.length > 0) {
            // If db car doesn't have 'type', we might want to skip this filter or assume 'sedan' default?
            // For now, only filter if the property exists or if using mock.
            if (car.type && !filters.type.includes(car.type)) return false
        }

        // Fuel
        if (filters.fuel.length > 0 && !filters.fuel.includes(car.fuel_type)) return false

        // Transmission
        if (filters.transmission.length > 0 && !filters.transmission.includes(car.transmission)) return false

        // Seats
        if (filters.seats.length > 0 && !filters.seats.includes(String(car.seats))) return false

        return true
    })

    const SidebarFilter = ({ title, options, category }: { title: string, options: string[], category: keyof typeof filters }) => (
        <div className="mb-8">
            <h3 className="text-white font-bold mb-4 flex items-center justify-between">
                {title}
                <ChevronDown className="w-4 h-4 text-gray-500" />
            </h3>
            <div className="space-y-3">
                {options.map(option => (
                    <label key={option} className="flex items-center group cursor-pointer">
                        <div className="relative flex items-center">
                            <input
                                type="checkbox"
                                className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-gray-600 bg-[#252525] transition-all checked:border-[#F5B301] checked:bg-[#F5B301]"
                                checked={filters[category].includes(option)}
                                onChange={() => toggleFilter(category, option)}
                            />
                            <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 opacity-0 transition-opacity peer-checked:opacity-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5 text-black" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                </svg>
                            </div>
                        </div>
                        <span className="ml-3 text-sm text-gray-400 group-hover:text-white transition-colors">{option}</span>
                    </label>
                ))}
            </div>
        </div>
    )

    return (
        <div className="min-h-screen bg-[#0F0F0F] font-sans pt-20">
            {/* HER HERO / SEARCH BAR */}
            <div className="bg-[#1C1C1C] border-b border-gray-800 sticky top-20 z-30 shadow-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="flex items-center gap-2 text-white">
                            <span className="w-2 h-8 bg-[#F5B301] rounded-full"></span>
                            <h1 className="text-xl font-bold uppercase tracking-wide">Choose Your Ride</h1>
                        </div>

                        <div className="relative w-full md:w-96">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                            <input
                                type="text"
                                placeholder="Search by car name..."
                                className="w-full bg-[#121212] text-white pl-12 pr-4 py-3 rounded-xl border border-gray-700 focus:border-[#F5B301] focus:ring-1 focus:ring-[#F5B301] outline-none text-sm transition-all"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex flex-col lg:flex-row gap-8">

                    {/* SIDEBAR */}
                    <aside className="w-full lg:w-64 flex-shrink-0">
                        <div className="bg-[#1C1C1C] rounded-2xl p-6 border border-gray-800 sticky top-40">
                            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-800">
                                <h2 className="text-white font-bold flex items-center gap-2">
                                    <Filter className="w-4 h-4 text-[#F5B301]" /> Filters
                                </h2>
                                <button
                                    onClick={() => setFilters({ type: [], fuel: [], transmission: [], seats: [] })}
                                    className="text-xs text-[#F5B301] hover:text-white transition-colors"
                                >
                                    Reset All
                                </button>
                            </div>

                            <SidebarFilter
                                title="Car Type"
                                options={['HATCHBACK', 'SEDAN', 'SUV', 'LUXURY']}
                                category="type"
                            />
                            <SidebarFilter
                                title="Fuel Type"
                                options={['PETROL', 'DIESEL', 'ELECTRIC']}
                                category="fuel"
                            />
                            <SidebarFilter
                                title="Transmission"
                                options={['MANUAL', 'AUTOMATIC']}
                                category="transmission"
                            />
                            <SidebarFilter
                                title="Seats"
                                options={['4', '5', '7']}
                                category="seats"
                            />
                        </div>
                    </aside>

                    {/* MAIN GRID */}
                    <div className="flex-1">
                        {loading ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                {[1, 2, 3, 4, 5, 6].map(i => (
                                    <div key={i} className="bg-[#1C1C1C] rounded-2xl h-80 animate-pulse"></div>
                                ))}
                            </div>
                        ) : (
                            <>
                                <div className="mb-6 flex items-center justify-between">
                                    <p className="text-gray-400 text-sm">
                                        Showing <span className="text-white font-bold">{filteredCars.length}</span> available cars
                                    </p>
                                    <button className="flex items-center gap-2 text-sm text-gray-400 hover:text-white bg-[#1C1C1C] px-4 py-2 rounded-lg border border-gray-800">
                                        Sort by: Recommended <ChevronDown className="w-4 h-4" />
                                    </button>
                                </div>

                                {filteredCars.length === 0 ? (
                                    <div className="text-center py-20 bg-[#1C1C1C] rounded-2xl border border-gray-800">
                                        <Car className="w-16 h-16 text-gray-700 mx-auto mb-4" />
                                        <h3 className="text-xl font-bold text-white mb-2">No Cars Found</h3>
                                        <p className="text-gray-500">Try adjusting your filters or search terms.</p>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                                        {filteredCars.map(car => (
                                            <div key={car.id} className="group bg-[#1C1C1C] rounded-2xl border border-gray-800 overflow-hidden hover:border-[#F5B301]/50 transition-all hover:shadow-[0_0_30px_rgba(0,0,0,0.5)] flex flex-col">
                                                <div className="relative aspect-[16/10] overflow-hidden">
                                                    <img
                                                        src={car.image_urls?.[0] || car.image_url || 'https://via.placeholder.com/800'}
                                                        alt={car.name}
                                                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                                    />
                                                    <div className="absolute top-3 right-3 bg-black/80 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-[#F5B301] border border-[#F5B301]/20">
                                                        {car.hourly_rate} ₹/hr
                                                    </div>
                                                </div>

                                                <div className="p-5 flex-1 flex flex-col">
                                                    <div className="mb-4">
                                                        <h3 className="text-lg font-bold text-white mb-1 leading-tight group-hover:text-[#F5B301] transition-colors">{car.name}</h3>
                                                        <p className="text-xs text-gray-500">{car.fuel_type} • {car.transmission}</p>
                                                    </div>

                                                    <div className="grid grid-cols-3 gap-2 mb-6">
                                                        <div className="bg-[#252525] rounded-lg p-2 text-center">
                                                            <Fuel className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                                            <span className="text-[10px] text-gray-500 uppercase">{car.fuel_type}</span>
                                                        </div>
                                                        <div className="bg-[#252525] rounded-lg p-2 text-center">
                                                            <Gauge className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                                            <span className="text-[10px] text-gray-500 uppercase">{car.transmission.substring(0, 4)}</span>
                                                        </div>
                                                        <div className="bg-[#252525] rounded-lg p-2 text-center">
                                                            <Users className="w-4 h-4 text-gray-400 mx-auto mb-1" />
                                                            <span className="text-[10px] text-gray-500 uppercase">{car.seats} Seat</span>
                                                        </div>
                                                    </div>

                                                    <Link
                                                        href={`/cars/${car.id}`}
                                                        className="mt-auto w-full block text-center py-3 bg-white text-black font-bold rounded-xl hover:bg-[#F5B301] transition-colors text-sm"
                                                    >
                                                        Book Now
                                                    </Link>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
