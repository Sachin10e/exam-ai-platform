const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function debugUpload() {
    const subjectId = '8e8124d6-0e20-4990-84dc-7a5ea8cd793d' // using the one from earlier

    const { data, error } = await supabase
        .from('documents')
        .insert([{
            subject_id: subjectId,
            filename: 'TEST_INSERT.pdf',
            full_text: 'test'
        }])
        .select()
        .single()

    console.log("Insert Output:", data, error)
}

debugUpload()
