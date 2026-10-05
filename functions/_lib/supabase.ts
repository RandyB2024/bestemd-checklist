import { createClient } from '@supabase/supabase-js'

export interface ServerEnv {
  SUPABASE_URL: string
  SUPABASE_SECRET_KEY: string
}

export function getSupabase(env: ServerEnv) {
  return createClient(
    env.SUPABASE_URL,
    env.SUPABASE_SECRET_KEY,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  )
}
