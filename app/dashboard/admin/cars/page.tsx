'use client'

import { useState, useEffect } from 'react'
import { Plus, Pencil, Trash, Search, X, Car as CarIcon, Fuel, Settings, Users, Image as ImageIcon } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

// Types based on SCHEMA_V2
interface Car {
    id: string
    name: string
    car_number: string
    image_urls: string[]
    fuel_type: 'PETROL' | 'DIESEL' | 'ELECTRIC' | 'HYBRID'
    transmission: 'MANUAL' | 'AUTOMATIC'
    seats: number
    hourly_rate: number
    min_booking_hours: number
    status: 'AVAILABLE' | 'ON_TRIP' | 'LOCKED' | 'MAINTENANCE'
    is_active: boolean
}

export default function AdminCarsPage() {
    const [cars, setCars] = useState<Car[]>([])
    const [loading, setLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)

    const [editingCar, setEditingCar] = useState<Car | null>(null)
    const [lockingCar, setLockingCar] = useState<Car | null>(null)

    // Lock Model State
    const [lockDetails, setLockDetails] = useState({
        start_time: '',
        end_time: '',
        reason: 'MAINTENANCE'
    })

    // Form State (Reused for Add/Edit)
    const initialCarState = {
        name: '',
        car_number: '',
        images: ['https://images.unsplash.com/photo-1560958089-b8a1929cea89?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'],
        fuel_type: 'PETROL' as const,
        transmission: 'AUTOMATIC' as const,
        seats: 5,
        hourly_rate: '',
        min_booking_hours: 4
    }
    const [carForm, setCarForm] = useState(initialCarState)

    useEffect(() => {
        fetchCars()
    }, [])

    const fetchCars = async () => {
        setLoading(true)
        const { data, error } = await supabase
            .from('cars')
            .select('*')
            .order('created_at', { ascending: false })

        if (error) {
            console.error('Error fetching cars:', error)
        } else {
            setCars(data || [])
        }
        setLoading(false)
    }

    // Prepare Create Modal
    const openAddModal = () => {
        setEditingCar(null)
        setCarForm(initialCarState)
        setIsAddModalOpen(true)
    }

    // Prepare Edit Modal
    const openEditModal = (car: Car) => {
        setEditingCar(car)
        setCarForm({
            name: car.name,
            car_number: car.car_number,
            images: car.image_urls && car.image_urls.length > 0 ? car.image_urls : [''],
            fuel_type: car.fuel_type as any,
            transmission: car.transmission as any,
            seats: car.seats,
            hourly_rate: String(car.hourly_rate),
            min_booking_hours: car.min_booking_hours
        })
        setIsAddModalOpen(true)
    }

    const handleSaveCar = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        try {
            // Process images
            const processedImages = carForm.images
                .map(url => url.trim())
                .filter(url => url.length > 0)

            const carData = {
                name: carForm.name,
                car_number: carForm.car_number,
                image_urls: processedImages,
                fuel_type: carForm.fuel_type,
                transmission: carForm.transmission,
                seats: Number(carForm.seats),
                min_booking_hours: Number(carForm.min_booking_hours),
                hourly_rate: Number(carForm.hourly_rate),
                // Don't override status on edit unless strictly needed, usually status is managed via actions
                status: editingCar ? editingCar.status : 'AVAILABLE'
            }

            let error
            if (editingCar) {
                // Update
                const { error: updateError } = await supabase
                    .from('cars')
                    .update(carData)
                    .eq('id', editingCar.id)
                error = updateError
            } else {
                // Insert
                const { error: insertError } = await supabase
                    .from('cars')
                    .insert([carData])
                error = insertError
            }

            if (error) {
                alert(`Error ${editingCar ? 'updating' : 'adding'} car: ` + error.message)
            } else {
                fetchCars()
                setIsAddModalOpen(false)
            }
        } catch (err: any) {
            console.error(err)
            alert('An unexpected error occurred: ' + (err.message || 'Unknown error'))
        } finally {
            setIsSubmitting(false)
        }
    }

    // Maintenance Toggle
    const toggleMaintenance = async (car: Car) => {
        const newStatus = car.status === 'MAINTENANCE' ? 'AVAILABLE' : 'MAINTENANCE'
        if (!confirm(`Are you sure you want to set ${car.name} to ${newStatus}?`)) return

        const { error } = await supabase
            .from('cars')
            .update({ status: newStatus })
            .eq('id', car.id)

        if (error) {
            alert('Error updating status: ' + error.message)
        } else {
            fetchCars()
        }
    }

    // Soft Delete Toggle
    const toggleActive = async (car: Car) => {
        const newActive = !car.is_active
        const action = newActive ? 'ENABLE' : 'DISABLE'
        if (!confirm(`Are you sure you want to ${action} ${car.name}?`)) return

        const { error } = await supabase
            .from('cars')
            .update({ is_active: newActive })
            .eq('id', car.id)

        if (error) {
            alert('Error updating status: ' + error.message)
        } else {
            fetchCars()
        }
    }

    // Unlock Logic
    const handleUnlockCar = async (car: Car) => {
        if (!confirm(`Are you sure you want to UNLOCK ${car.name}? This will make it AVAILABLE.`)) return

        // 1. Remove any active locks for this car
        // We technically should find the specific lock, but for "Force Unlock" we can clear active locks
        // OR properly just set status to AVAILABLE.
        // Let's sets status to AVAILABLE. The lock record remains as history but is effectively overridden by car status.
        // Ideally we should close the open lock record, but for MVP speed, status update is key.

        const { error } = await supabase
            .from('cars')
            .update({ status: 'AVAILABLE' })
            .eq('id', car.id)

        if (error) {
            alert('Error unlocking car: ' + error.message)
        } else {
            fetchCars()
        }
    }

    // Manual Lock Logic
    const handleLockCar = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!lockingCar) return

        setIsSubmitting(true)

        // 1. Create Lock Record
        const { error: lockError } = await supabase.from('car_locks').insert([{
            car_id: lockingCar.id,
            start_time: lockDetails.start_time, // ISO string expected from input
            end_time: lockDetails.end_time,
            reason: lockDetails.reason,
            note: 'Manual Admin Lock'
        }])

        if (lockError) {
            alert('Error creating lock: ' + lockError.message)
            setIsSubmitting(false)
            return
        }

        // 2. Update Car Status to LOCKED
        const { error: statusError } = await supabase
            .from('cars')
            .update({ status: 'LOCKED' })
            .eq('id', lockingCar.id)

        if (statusError) {
            alert('Lock created but failed to update car status: ' + statusError.message)
        } else {
            fetchCars()
            setLockingCar(null)
            setLockDetails({ start_time: '', end_time: '', reason: 'MAINTENANCE' })
        }
        setIsSubmitting(false)
    }


    const filteredCars = cars.filter(car =>
        car.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        car.car_number.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div>
            <div className="sm:flex sm:items-center">
                <div className="sm:flex-auto">
                    <h1 className="text-2xl font-semibold text-gray-900">Fleet Management</h1>
                    <p className="mt-2 text-sm text-gray-700">
                        Manage your vehicle fleet. Add new cars, track status, and update pricing.
                    </p>
                </div>
                <div className="mt-4 sm:mt-0 sm:ml-16 sm:flex-none">
                    <button
                        type="button"
                        onClick={openAddModal}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                    >
                        <Plus className="h-4 w-4 mr-2" />
                        Add New Vehicle
                    </button>
                </div>
            </div>

            {/* Search */}
            <div className="mt-6 max-w-md relative rounded-md shadow-sm">
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                </div>
                <input
                    type="text"
                    className="block w-full rounded-md border-gray-300 pl-10 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 shadow-sm border"
                    placeholder="Search by name or number plate..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Vehicle Info</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Specs</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Rate (₹)</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Status</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6 text-right font-semibold text-gray-900">Actions</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-10 text-center text-sm text-gray-500">
                                                Loading fleet data...
                                            </td>
                                        </tr>
                                    ) : filteredCars.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="px-3 py-10 text-center text-sm text-gray-500">
                                                No cars found. Add one to get started.
                                            </td>
                                        </tr>
                                    ) : (
                                        filteredCars.map((car) => (
                                            <tr key={car.id} className={!car.is_active ? 'opacity-50 bg-gray-50' : ''}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <div className="flex items-center">
                                                        <div className="h-10 w-16 flex-shrink-0 relative">
                                                            <img className="h-10 w-16 rounded object-cover" src={car.image_urls?.[0]} alt="" />
                                                        </div>
                                                        <div className="ml-4">
                                                            <div className="font-medium text-gray-900">{car.name}</div>
                                                            <div className="text-gray-500 font-mono text-xs">{car.car_number}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <div className="flex flex-col gap-1 text-xs">
                                                        <span className="flex items-center"><Fuel className="w-3 h-3 mr-1" /> {car.fuel_type}</span>
                                                        <span className="flex items-center"><Settings className="w-3 h-3 mr-1" /> {car.transmission}</span>
                                                        <span className="flex items-center"><Users className="w-3 h-3 mr-1" /> {car.seats} Seats</span>
                                                    </div>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900 font-medium">
                                                    ₹{car.hourly_rate}/hr
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                                                        ${car.status === 'AVAILABLE' ? 'bg-green-100 text-green-800' : ''}
                                                        ${car.status === 'ON_TRIP' ? 'bg-blue-100 text-blue-800' : ''}
                                                        ${car.status === 'MAINTENANCE' ? 'bg-yellow-100 text-yellow-800' : ''}
                                                        ${car.status === 'LOCKED' ? 'bg-red-100 text-red-800' : ''}
                                                    `}>
                                                        {car.status}
                                                    </span>
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <div className="flex justify-end gap-2 items-center">
                                                        {/* Force Unlock (Only if Locked) */}
                                                        {car.status === 'LOCKED' && (
                                                            <button
                                                                onClick={() => handleUnlockCar(car)}
                                                                className="text-xs px-2 py-1 rounded border bg-green-50 text-green-700 border-green-200"
                                                                title="Force Unlock"
                                                            >
                                                                Unlock
                                                            </button>
                                                        )}

                                                        {/* Maintenance Toggle */}
                                                        <button
                                                            onClick={() => toggleMaintenance(car)}
                                                            className={`text-xs px-2 py-1 rounded border ${car.status === 'MAINTENANCE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-600 border-gray-200'}`}
                                                            title="Toggle Maintenance"
                                                        >
                                                            {car.status === 'MAINTENANCE' ? 'Enable' : 'Maint.'}
                                                        </button>

                                                        {/* Lock Button */}
                                                        <button
                                                            onClick={() => setLockingCar(car)}
                                                            className="text-orange-600 hover:text-orange-900 bg-orange-50 p-1.5 rounded"
                                                            title="Manual Lock"
                                                        >
                                                            <Settings className="w-4 h-4" />
                                                        </button>

                                                        {/* Edit Button */}
                                                        <button
                                                            onClick={() => openEditModal(car)}
                                                            className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 p-1.5 rounded"
                                                            title="Edit Car"
                                                        >
                                                            <Pencil className="w-4 h-4" />
                                                        </button>

                                                        {/* Soft Delete Toggle */}
                                                        <button
                                                            onClick={() => toggleActive(car)}
                                                            className={`p-1.5 rounded ${car.is_active ? 'text-red-600 hover:text-red-900 bg-red-50' : 'text-green-600 hover:text-green-900 bg-green-50'}`}
                                                            title={car.is_active ? "Disable Car" : "Enable Car"}
                                                        >
                                                            {car.is_active ? <Trash className="w-4 h-4" /> : <CarIcon className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            {/* Add/Edit Car Modal */}
            {isAddModalOpen && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsAddModalOpen(false)} />

                        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                            <div className="absolute top-0 right-0 pt-4 pr-4">
                                <button
                                    type="button"
                                    className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                    onClick={() => setIsAddModalOpen(false)}
                                >
                                    <span className="sr-only">Close</span>
                                    <X className="h-6 w-6" aria-hidden="true" />
                                </button>
                            </div>

                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <CarIcon className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">{editingCar ? 'Edit Vehicle' : 'Add New Vehicle'}</h3>
                                    <form onSubmit={handleSaveCar} className="mt-6 flex flex-col gap-4">

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Car Name</label>
                                                <input type="text" required
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={carForm.name}
                                                    onChange={e => setCarForm({ ...carForm, name: e.target.value })}
                                                    placeholder="e.g. Maruti Swift"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Number Plate</label>
                                                <input type="text" required
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2 uppercase"
                                                    value={carForm.car_number}
                                                    onChange={e => setCarForm({ ...carForm, car_number: e.target.value.toUpperCase() })}
                                                    placeholder="KA-01-AB-1234"
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Hourly Rate (₹)</label>
                                                <input type="number" required min="0"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={carForm.hourly_rate}
                                                    onChange={e => setCarForm({ ...carForm, hourly_rate: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Min Booking (Hrs)</label>
                                                <input type="number" required min="1"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={carForm.min_booking_hours}
                                                    onChange={e => setCarForm({ ...carForm, min_booking_hours: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Transmission</label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={carForm.transmission}
                                                    onChange={e => setCarForm({ ...carForm, transmission: e.target.value as any })}
                                                >
                                                    <option value="MANUAL">Manual</option>
                                                    <option value="AUTOMATIC">Automatic</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Fuel Type</label>
                                                <select
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={carForm.fuel_type}
                                                    onChange={e => setCarForm({ ...carForm, fuel_type: e.target.value as any })}
                                                >
                                                    <option value="PETROL">Petrol</option>
                                                    <option value="DIESEL">Diesel</option>
                                                    <option value="ELECTRIC">Electric</option>
                                                    <option value="HYBRID">Hybrid</option>
                                                </select>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Seats</label>
                                                <input type="number" required min="1" max="15"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={carForm.seats}
                                                    onChange={e => setCarForm({ ...carForm, seats: Number(e.target.value) })}
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Car Images (URLs)</label>
                                            <div className="mt-2 space-y-3">
                                                {carForm.images.map((url, index) => (
                                                    <div key={index} className="flex gap-2">
                                                        <input
                                                            type="text"
                                                            required
                                                            placeholder="https://example.com/car-image.jpg"
                                                            value={url}
                                                            onChange={(e) => {
                                                                const newImages = [...carForm.images]
                                                                newImages[index] = e.target.value
                                                                setCarForm({ ...carForm, images: newImages })
                                                            }}
                                                            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-[#F5B301] focus:ring-[#F5B301] sm:text-sm border p-2"
                                                        />
                                                        {carForm.images.length > 1 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => {
                                                                    const newImages = carForm.images.filter((_, i) => i !== index)
                                                                    setCarForm({ ...carForm, images: newImages })
                                                                }}
                                                                className="text-red-600 hover:text-red-800 p-2"
                                                            >
                                                                <Trash className="w-5 h-5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                ))}
                                                <button
                                                    type="button"
                                                    onClick={() => setCarForm({ ...carForm, images: [...carForm.images, ''] })}
                                                    className="inline-flex items-center text-sm text-[#F5B301] hover:text-[#D89E00] font-medium"
                                                >
                                                    <Plus className="w-4 h-4 mr-1" />
                                                    Add Another Image
                                                </button>
                                            </div>
                                            <p className="mt-1 text-xs text-gray-500">Enter direct URLs to images. At least one image is required.</p>
                                        </div>

                                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm disabled:bg-gray-400"
                                            >
                                                {isSubmitting ? 'Saving...' : (editingCar ? 'Update Vehicle' : 'Add Vehicle')}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                                onClick={() => setIsAddModalOpen(false)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Lock Modal */}
            {lockingCar && (
                <div className="fixed inset-0 z-10 overflow-y-auto">
                    <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setLockingCar(null)} />

                        <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-md sm:p-6">
                            <div className="sm:flex sm:items-start">
                                <div className="mx-auto flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-orange-100 sm:mx-0 sm:h-10 sm:w-10">
                                    <Settings className="h-6 w-6 text-orange-600" aria-hidden="true" />
                                </div>
                                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                                    <h3 className="text-lg font-medium leading-6 text-gray-900">Manual Lock: {lockingCar.name}</h3>
                                    <p className="text-sm text-gray-500 mt-1">This will prevent customers from booking this car for the specified period.</p>

                                    <form onSubmit={handleLockCar} className="mt-6 flex flex-col gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700">Reason</label>
                                            <select
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                value={lockDetails.reason}
                                                onChange={e => setLockDetails({ ...lockDetails, reason: e.target.value })}
                                            >
                                                <option value="MAINTENANCE">Maintenance</option>
                                                <option value="OWNER_USE">Owner Use</option>
                                                <option value="MANUAL_BLOCK">Other / Manual Block</option>
                                            </select>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">Start Time</label>
                                                <input type="datetime-local" required
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={lockDetails.start_time}
                                                    onChange={e => setLockDetails({ ...lockDetails, start_time: e.target.value })}
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700">End Time</label>
                                                <input type="datetime-local" required
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                    value={lockDetails.end_time}
                                                    onChange={e => setLockDetails({ ...lockDetails, end_time: e.target.value })}
                                                />
                                            </div>
                                        </div>

                                        <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="inline-flex w-full justify-center rounded-md border border-transparent bg-orange-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 sm:ml-3 sm:w-auto sm:text-sm"
                                            >
                                                {isSubmitting ? 'Locking...' : 'Lock Car'}
                                            </button>
                                            <button
                                                type="button"
                                                className="mt-3 inline-flex w-full justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:mt-0 sm:w-auto sm:text-sm"
                                                onClick={() => setLockingCar(null)}
                                            >
                                                Cancel
                                            </button>
                                        </div>
                                    </form>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
