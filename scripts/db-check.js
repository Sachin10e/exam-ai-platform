const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function check() {
    const { data, error } = await supabase.from('chunks').select().limit(1)
    console.log('Chunks:', data, error)
    const { data: sData, error: sError } = await supabase.from('subjects').select().limit(1)
    console.log('Subjects:', sData, sError)
}

check()
