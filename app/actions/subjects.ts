'use server'

import { createClient } from '@supabase/supabase-js'

const serviceSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function createSubjectAction() {
    try {
        const { data, error } = await serviceSupabase
            .from('subjects')
            .insert([{ name: `Knowledge Base ${new Date().toISOString().split('T')[0]}` }])
            .select()
            .single()

        if (error) throw error
        return { id: data.id }
    } catch (err: any) {
        console.error('Failed to create subject', err)
        return { error: 'Could not initialize subject container' }
    }
}
