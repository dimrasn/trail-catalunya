import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

let supabase = null

export function getSupabase() {
  if (!supabaseUrl || !supabaseKey) return null
  if (!supabase) {
    supabase = createClient(supabaseUrl, supabaseKey)
  }
  return supabase
}
