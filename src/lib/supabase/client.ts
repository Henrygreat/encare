import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'
import { getSupabaseEnv } from '@/lib/supabase/config'

export function createClient(): any {
  return createBrowserClient<Database>(
    getSupabaseEnv().url,
    getSupabaseEnv().key
  )
}
