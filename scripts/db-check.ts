/* eslint-disable */
require('dotenv').config()
const { createClient } = require('@supabase/supabase-js')
const supabaseDb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || ""
)
