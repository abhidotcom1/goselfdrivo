
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkAdminStatus(email) {
    const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('email', email)
        .single()

    if (error) {
        console.error('Error fetching profile:', error)
    } else {
        console.log(`User ${email} role:`, data?.role)
    }
}

// Replace with the email the user is trying to use, if known. 
// Since we don't know the exact email, we might need to ask or check if we can list users (usually restricted).
console.log("Use this script to verify admin status if you have the email.")
