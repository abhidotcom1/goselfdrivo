
'use client'

import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import Link from 'next/link'

export default function Home() {
    const [cars, setCars] = useState<any[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCars = async () => {
            const { data, error } = await supabase
                .from('cars')
                .select('*')
                .eq('status', 'AVAILABLE')

            if (data) setCars(data)
            setLoading(false)
        }

        fetchCars()
    }, [])

    if (loading) {
        return (
            <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                <div className="text-center text-gray-500">Loading cars...</div>
            </div>
        )
    }

    return (
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 gap-y-10 gap-x-6 sm:grid-cols-2 lg:grid-cols-3 xl:gap-x-8">
                {cars.map((car) => (
                    <div key={car.id} className="group relative bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                        <div className="aspect-w-1 aspect-h-1 w-full overflow-hidden rounded-t-lg bg-gray-200 group-hover:opacity-75 lg:aspect-none lg:h-64">
                            <img
                                src={car.image_url || 'https://via.placeholder.com/400x300?text=No+Image'}
                                alt={car.name}
                                className="h-full w-full object-cover object-center lg:h-full lg:w-full"
                            />
                        </div>
                        <div className="p-4">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-lg font-bold text-gray-900">
                                    <span aria-hidden="true" className="absolute inset-0" />
                                    {car.name}
                                </h3>
                                <p className="text-sm font-medium text-gray-900 px-2 py-1 bg-gray-100 rounded-full">
                                    ${car.hourly_rate}/hr
                                </p>
                            </div>
                            <p className="mt-1 text-sm text-gray-500">Min. {car.min_booking_hours} hours</p>
                        </div>
                        <div className="p-4 pt-0">
                            <Link
                                href={`/cars/${car.id}`}
                                className="block w-full text-center bg-indigo-600 text-white font-semibold py-2 px-4 rounded hover:bg-indigo-700 transition-colors z-10 relative"
                            >
                                Book Now
                            </Link>
                        </div>
                    </div>
                ))}
                {cars.length === 0 && (
                    <div className="col-span-full text-center text-gray-500 py-10">
                        No cars available at the moment.
                    </div>
                )}
            </div>
        </div>
    )
}
