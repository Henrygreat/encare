import { headers } from 'next/headers'
import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST() {
  const supabase = createClient()
  await supabase.auth.signOut()
  const origin = headers().get('origin') || process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  return NextResponse.redirect(new URL('/login', origin))
}
