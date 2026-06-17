import { createBrowserClient } from '@supabase/ssr'

const GLOBAL_KEY = '__supabase_browser_client'

export function createClient() {
  if (globalThis[GLOBAL_KEY]) return globalThis[GLOBAL_KEY]
  globalThis[GLOBAL_KEY] = createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
  return globalThis[GLOBAL_KEY]
}
