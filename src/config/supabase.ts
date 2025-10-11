import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
    console.error('🚨 Supabase not configured!')
}

export const supabase = (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null

// Add connection test
if (supabase) {
    console.log('✅ Supabase client created successfully')
    console.log('🔗 Supabase URL:', supabaseUrl)
    console.log('🔑 Anon Key:', supabaseAnonKey?.substring(0, 20) + '...')
    
    // Test the connection
    supabase.storage.from('report-uploads').list('', { limit: 1 })
        .then(({ error }) => {
            if (error) {
                console.warn('⚠️ Supabase storage test failed:', error.message)
                if (error.message.includes('not found')) {
                    console.warn('💡 Create a bucket named "report-uploads" in your Supabase dashboard')
                }
            } else {
                console.log('✅ Supabase storage connection verified')
            }
        })
        .catch(err => {
            console.warn('⚠️ Supabase connection test failed:', err.message)
        })
} else {
    console.error('❌ Supabase client creation failed')
    console.error('URL:', supabaseUrl)
    console.error('Key:', supabaseAnonKey ? 'Present' : 'Missing')
}

export default supabase

