'use server'

import { createClient } from '@/utils/supabase/server'

export async function createSubjectAction(customName?: string) {
    try {
        const supabase = await createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return { id: 'guest-local' }

        const { data, error } = await supabase
            .from('subjects')
            .insert([{ 
                name: customName || `Study Plan ${new Date().toISOString().split('T')[0]}`,
                user_id: user.id
            }])
            .select()
            .single()

        if (error) throw error
        return { id: data.id }
    } catch (err: unknown) {
        console.error('Failed to create subject', err)
        return { error: 'Could not initialize subject container' }
    }
}
