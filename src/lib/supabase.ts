import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

function getClient(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
    _client = createClient(url, key)
  }
  return _client
}

export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_: SupabaseClient, prop: string | symbol): unknown {
    const c = getClient()
    const val = Reflect.get(c, prop)
    return typeof val === 'function' ? (val as (...args: unknown[]) => unknown).bind(c) : val
  },
})
