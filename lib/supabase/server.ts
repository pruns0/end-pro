import { createClient as createSupabaseClient } from "@supabase/supabase-js"

/**
 * Especially important if using Fluid compute: Don't put this client in a
 * global variable. Always create a new client within each function when using
 * it.
 */
export async function createClient() {
  return createSupabaseClient(
    "https://tfpleowwysvuaijbxmsl.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcGxlb3d3eXN2dWFpamJ4bXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMjM1NjAsImV4cCI6MjA3MTc5OTU2MH0._42yCm4fr-1KS2Ud1-bYuYSrrPBEt0Uo4ekomI17dto",
  )
}

export function createServerClient(cookieStore: any) {
  return createSupabaseClient(
    "https://tfpleowwysvuaijbxmsl.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcGxlb3d3eXN2dWFpamJ4bXNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYyMjM1NjAsImV4cCI6MjA3MTc5OTU2MH0._42yCm4fr-1KS2Ud1-bYuYSrrPBEt0Uo4ekomI17dto",
  )
}

export function createServiceRoleClient() {
  return createSupabaseClient(
    "https://tfpleowwysvuaijbxmsl.supabase.co",
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRmcGxlb3d3eXN2dWFpamJ4bXNsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjIyMzU2MCwiZXhwIjoyMDcxNzk5NTYwfQ.y4iezeRUKPqLnJzL6ZtEvTunR5hHzmiXgBvF39RD1yk",
  )
}
