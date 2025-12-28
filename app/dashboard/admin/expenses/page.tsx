'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash, Search, DollarSign, Filter, Wrench, Fuel } from 'lucide-react'
import { supabase } from '@/lib/supabaseClient'

interface Expense {
    id: string
    car_id: string
    amount: number
    category: 'FUEL' | 'MAINTENANCE' | 'CLEANING' | 'TOLL' | 'INSURANCE' | 'OTHER'
    date: string
    description: string
    created_at: string
    car?: { name: string, car_number: string }
}

interface Car {
    id: string
    name: string
    car_number: string
}

export default function ExpensesPage() {
    const [expenses, setExpenses] = useState<Expense[]>([])
    const [cars, setCars] = useState<Car[]>([])
    const [loading, setLoading] = useState(true)
    const [isAddModalOpen, setIsAddModalOpen] = useState(false)
    const [submitting, setSubmitting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    // Form State
    const [formData, setFormData] = useState({
        car_id: '',
        amount: '',
        category: 'FUEL',
        date: new Date().toISOString().split('T')[0],
        description: ''
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        setLoading(true)
        // Fetch Expenses
        const { data: expensesData, error: expensesError } = await supabase
            .from('expenses')
            .select('*, car:cars(name, car_number)')
            .order('date', { ascending: false })

        if (expensesError) console.error('Error fetching expenses:', expensesError)
        else setExpenses(expensesData || [])

        // Fetch Cars for Dropdown
        const { data: carsData, error: carsError } = await supabase
            .from('cars')
            .select('id, name, car_number')
            .order('name')

        if (carsError) console.error('Error fetching cars:', carsError)
        else setCars(carsData || [])

        setLoading(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setSubmitting(true)

        const { error } = await supabase
            .from('expenses')
            .insert([{
                car_id: formData.car_id,
                amount: parseFloat(formData.amount),
                category: formData.category,
                date: formData.date,
                description: formData.description
            }])

        if (error) {
            alert('Error adding expense: ' + error.message)
        } else {
            setIsAddModalOpen(false)
            setFormData({
                car_id: '',
                amount: '',
                category: 'FUEL',
                date: new Date().toISOString().split('T')[0],
                description: ''
            })
            fetchData() // Refresh list
        }
        setSubmitting(false)
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this expense entry?')) return

        const { error } = await supabase
            .from('expenses')
            .delete()
            .eq('id', id)

        if (error) {
            alert('Error deleting expense')
        } else {
            setExpenses(expenses.filter(ex => ex.id !== id))
        }
    }

    const filteredExpenses = expenses.filter(ex =>
        (ex.car?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        (ex.car?.car_number?.toLowerCase().includes(searchTerm.toLowerCase()) || '') ||
        ex.category.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const totalStats = filteredExpenses.reduce((sum, ex) => sum + Number(ex.amount), 0)

    return (
        <div>
            {/* Header */}
            <div className="sm:flex sm:items-center justify-between">
                <div>
                    <h1 className="text-2xl font-semibold text-gray-900">Fleet Expenses</h1>
                    <p className="mt-2 text-sm text-gray-700">Track fuel, maintenance, and other operational costs.</p>
                </div>
                <div className="mt-4 sm:mt-0">
                    <button
                        onClick={() => setIsAddModalOpen(true)}
                        className="inline-flex items-center justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:w-auto"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Log Expense
                    </button>
                </div>
            </div>

            {/* Total Banner */}
            <div className="mt-6 bg-white overflow-hidden shadow rounded-lg border border-gray-200">
                <div className="px-4 py-5 sm:p-6 flex items-center">
                    <div className="rounded-md bg-red-100 p-3">
                        <DollarSign className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="ml-5">
                        <dt className="truncate text-sm font-medium text-gray-500">Total Expenses (Visible)</dt>
                        <dd className="mt-1 text-3xl font-semibold tracking-tight text-gray-900">₹{totalStats.toLocaleString()}</dd>
                    </div>
                </div>
            </div>

            {/* List */}
            <div className="mt-8 flex flex-col">
                <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
                    <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
                        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                            <table className="min-w-full divide-y divide-gray-300">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Date</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Car</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Type</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Amount</th>
                                        <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Notes</th>
                                        <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6"><span className="sr-only">Actions</span></th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200 bg-white">
                                    {loading ? (
                                        <tr><td colSpan={6} className="text-center py-10 text-gray-500">Loading...</td></tr>
                                    ) : filteredExpenses.length === 0 ? (
                                        <tr><td colSpan={6} className="text-center py-10 text-gray-500">No expenses recorded.</td></tr>
                                    ) : (
                                        filteredExpenses.map((expense) => (
                                            <tr key={expense.id}>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    {new Date(expense.date).toLocaleDateString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm font-medium text-gray-900">
                                                    {expense.car?.name} <span className="text-gray-500 font-normal">({expense.car?.car_number})</span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                                                    <span className={`inline-flex rounded-full px-2 text-xs font-semibold leading-5 
                                                        ${expense.category === 'FUEL' ? 'bg-yellow-100 text-yellow-800' :
                                                            expense.category === 'MAINTENANCE' ? 'bg-red-100 text-red-800' :
                                                                'bg-gray-100 text-gray-800'}`}>
                                                        {expense.category}
                                                    </span>
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-900">
                                                    ₹{expense.amount.toLocaleString()}
                                                </td>
                                                <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500 max-w-xs truncate">
                                                    {expense.description}
                                                </td>
                                                <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                                                    <button
                                                        onClick={() => handleDelete(expense.id)}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash className="w-4 h-4" />
                                                    </button>
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

            {/* Add Modal */}
            {isAddModalOpen && (
                <div className="relative z-10" aria-labelledby="modal-title" role="dialog" aria-modal="true">
                    <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"></div>
                    <div className="fixed inset-0 z-10 overflow-y-auto">
                        <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
                            <div className="relative transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left shadow-xl transition-all sm:my-8 sm:w-full sm:max-w-lg sm:p-6">
                                <div className="absolute top-0 right-0 hidden pt-4 pr-4 sm:block">
                                    <button
                                        type="button"
                                        className="rounded-md bg-white text-gray-400 hover:text-gray-500 focus:outline-none"
                                        onClick={() => setIsAddModalOpen(false)}
                                    >
                                        <span className="sr-only">Close</span>
                                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="currentColor" aria-hidden="true">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>
                                <div>
                                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
                                        <DollarSign className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                                    </div>
                                    <div className="mt-3 text-center sm:mt-5">
                                        <h3 className="text-lg font-medium leading-6 text-gray-900" id="modal-title">Log Expense</h3>
                                    </div>
                                </div>
                                <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                                    <div>
                                        <label htmlFor="car" className="block text-sm font-medium text-gray-700">Select Car</label>
                                        <select
                                            id="car"
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            value={formData.car_id}
                                            onChange={(e) => setFormData({ ...formData, car_id: e.target.value })}
                                        >
                                            <option value="">-- Choose Car --</option>
                                            {cars.map(c => (
                                                <option key={c.id} value={c.id}>{c.name} ({c.car_number})</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label htmlFor="amount" className="block text-sm font-medium text-gray-700">Amount (₹)</label>
                                            <input
                                                type="number"
                                                id="amount"
                                                required
                                                min="0"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                value={formData.amount}
                                                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="date" className="block text-sm font-medium text-gray-700">Date</label>
                                            <input
                                                type="date"
                                                id="date"
                                                required
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                                value={formData.date}
                                                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label htmlFor="type" className="block text-sm font-medium text-gray-700">Expense Type</label>
                                        <select
                                            id="type"
                                            required
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            value={formData.category}
                                            onChange={(e) => setFormData({ ...formData, category: e.target.value as any })}
                                        >
                                            <option value="FUEL">Fuel</option>
                                            <option value="MAINTENANCE">Maintenance</option>
                                            <option value="CLEANING">Cleaning</option>
                                            <option value="TOLL">Toll</option>
                                            <option value="INSURANCE">Insurance</option>
                                            <option value="OTHER">Other</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">Description</label>
                                        <textarea
                                            id="notes"
                                            rows={3}
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm border p-2"
                                            value={formData.description}
                                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                        ></textarea>
                                    </div>

                                    <div className="mt-5 sm:mt-6">
                                        <button
                                            type="submit"
                                            disabled={submitting}
                                            className="inline-flex w-full justify-center rounded-md border border-transparent bg-indigo-600 px-4 py-2 text-base font-medium text-white shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 sm:text-sm disabled:opacity-50"
                                        >
                                            {submitting ? 'Saving...' : 'Save Expense'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
