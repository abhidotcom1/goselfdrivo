'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabaseClient'

export default function DiagnosticsPage() {
    const [status, setStatus] = useState<any>({})
    const [logs, setLogs] = useState<string[]>([])

    const log = (msg: string) => setLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`])

    const runDiagnostics = async () => {
        setStatus({})
        setLogs([])
        log('Starting diagnostics...')

        // 1. Check Session
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()
        if (sessionError) log(`Session Error: ${sessionError.message}`)

        if (!session) {
            log('❌ No active session. user is NOT logged in.')
            setStatus((prev: any) => ({ ...prev, auth: 'Failed' }))
            return
        }

        log(`✅ Logged in as: ${session.user.email} (ID: ${session.user.id})`)
        setStatus((prev: any) => ({ ...prev, auth: 'Success' }))

        // 2. Check Profile & Role
        log(`Checking user profile for ID: ${session.user.id}...`)
        const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', session.user.id)
            .single()

        if (profileError) {
            log(`❌ Error fetching profile: ${profileError.message}`)
            if (profileError.code === 'PGRST116') {
                log('⚠️ Profile not found! The handle_new_user trigger might have failed.')
            }
            setStatus((prev: any) => ({ ...prev, profile: 'Failed' }))
        } else {
            log(`✅ Profile found. Role: ${profile.role}`)
            setStatus((prev: any) => ({ ...prev, profile: profile.role === 'admin' ? 'Success (Admin)' : `Failed (Role: ${profile.role})` }))
        }

        // 3. Test Insert (Cars)
        log('Attempting to insert a test car...')
        const testCar = {
            name: 'Test Car - Diagnostics',
            car_number: `TEST-${Math.floor(Math.random() * 1000)}`,
            hourly_rate: 100,
            image_urls: ['https://example.com/test.jpg'], // Using array to check schema
            min_booking_hours: 4,
            seats: 5,
            fuel_type: 'PETROL',
            transmission: 'MANUAL',
            status: 'MAINTENANCE' // safely created as maintenance
        }

        const { data: insertData, error: insertError } = await supabase
            .from('cars')
            .insert([testCar])
            .select()

        if (insertError) {
            log(`❌ INSERT FAILED: ${insertError.message} (Code: ${insertError.code})`)
            log(`Details: ${insertError.details}, Hint: ${insertError.hint}`)
            setStatus((prev: any) => ({ ...prev, insert: 'Failed' }))
        } else {
            log('✅ INSERT SUCCESS! Car added.')
            // Clean up
            if (insertData && insertData[0]) {
                log('Cleaning up (deleting test car)...')
                await supabase.from('cars').delete().eq('id', insertData[0].id)
            }
            setStatus((prev: any) => ({ ...prev, insert: 'Success' }))
        }
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Admin Diagnostics</h1>
            <button
                onClick={runDiagnostics}
                className="bg-blue-600 text-white px-4 py-2 rounded shadow hover:bg-blue-700"
            >
                Run Diagnostics
            </button>

            <div className="mt-8 grid grid-cols-3 gap-4">
                <div className={`p-4 border rounded ${status.auth === 'Success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="font-bold">Auth Session</h3>
                    <p>{status.auth || 'Pending'}</p>
                </div>
                <div className={`p-4 border rounded ${status.profile?.includes('Success') ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="font-bold">Admin Profile</h3>
                    <p>{status.profile || 'Pending'}</p>
                </div>
                <div className={`p-4 border rounded ${status.insert === 'Success' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
                    <h3 className="font-bold">Write Permissions</h3>
                    <p>{status.insert || 'Pending'}</p>
                </div>
            </div>

            <div className="mt-8 bg-gray-900 text-green-400 p-4 rounded font-mono text-sm min-h-[300px] overflow-auto">
                {logs.length === 0 ? <p className="text-gray-500">// Logs will appear here...</p> : logs.map((l, i) => <div key={i}>{l}</div>)}
            </div>
        </div>
    )
}
