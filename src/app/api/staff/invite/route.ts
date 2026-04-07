import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { Database, UserRole } from '@/lib/database.types'

export async function POST(request: NextRequest) {
  try {
    // Get the current user's session to verify they're a manager
    const serverSupabase = createServerClient()
    const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get the current user's profile to check role and org
    const { data: currentUser, error: userError } = await serverSupabase
      .from('users')
      .select('role, organisation_id')
      .eq('id', authUser.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Verify the user is a manager or admin
    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can invite staff' }, { status: 403 })
    }

    const body = await request.json()
    const { email, full_name, role, phone } = body

    // Validate required fields
    if (!email || !full_name || !role) {
      return NextResponse.json(
        { error: 'Email, full name, and role are required' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: 'Invalid email address' }, { status: 400 })
    }

    // Validate role
    const validRoles: UserRole[] = ['carer', 'senior_carer', 'manager', 'admin']
    if (!validRoles.includes(role)) {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
    }

    // Only admins can create other admins
    if (role === 'admin' && currentUser.role !== 'admin') {
      return NextResponse.json(
        { error: 'Only administrators can create admin accounts' },
        { status: 403 }
      )
    }

    // Create admin Supabase client with service role
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      console.error('SUPABASE_SERVICE_ROLE_KEY not configured')
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      )
    }

    const adminSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )

    // Check if user already exists in this organisation
    const { data: existingUser } = await adminSupabase
      .from('users')
      .select('id, email')
      .eq('email', email.toLowerCase())
      .eq('organisation_id', currentUser.organisation_id)
      .maybeSingle()

    if (existingUser) {
      return NextResponse.json(
        { error: 'A staff member with this email already exists in your organisation' },
        { status: 409 }
      )
    }

    // Generate a secure temporary password
    const tempPassword = generateSecurePassword()

    // Create the auth user
    const { data: authData, error: createAuthError } = await adminSupabase.auth.admin.createUser({
      email: email.toLowerCase(),
      password: tempPassword,
      email_confirm: true, // Auto-confirm since it's an admin invite
      user_metadata: {
        full_name,
        invited_by: authUser.id,
        organisation_id: currentUser.organisation_id,
      },
    })

    if (createAuthError) {
      // Check if user already exists in auth
      if (createAuthError.message.includes('already been registered')) {
        return NextResponse.json(
          { error: 'This email is already registered. Please contact support.' },
          { status: 409 }
        )
      }
      console.error('Auth creation error:', createAuthError)
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    if (!authData.user) {
      return NextResponse.json(
        { error: 'Failed to create user account' },
        { status: 500 }
      )
    }

    // Create the user profile in the users table
    const { error: insertError } = await adminSupabase.from('users').insert({
      id: authData.user.id,
      organisation_id: currentUser.organisation_id,
      email: email.toLowerCase(),
      full_name: full_name.trim(),
      role: role as UserRole,
      phone: phone?.trim() || null,
      is_active: true,
    })

    if (insertError) {
      // Clean up the auth user if profile creation fails
      await adminSupabase.auth.admin.deleteUser(authData.user.id)
      console.error('User profile creation error:', insertError)
      return NextResponse.json(
        { error: 'Failed to create user profile' },
        { status: 500 }
      )
    }

    // In production, you would send an email here with login instructions
    // For now, we'll return the temp password (this should be removed in production)
    return NextResponse.json({
      success: true,
      message: 'Staff member invited successfully',
      user: {
        id: authData.user.id,
        email: email.toLowerCase(),
        full_name: full_name.trim(),
        role,
      },
      // WARNING: Remove this in production - temp password should be sent via email only
      tempPassword: process.env.NODE_ENV === 'development' ? tempPassword : undefined,
    })
  } catch (error) {
    console.error('Staff invite error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

function generateSecurePassword(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%'
  let password = ''
  const array = new Uint8Array(16)
  crypto.getRandomValues(array)
  for (let i = 0; i < 16; i++) {
    password += chars[array[i] % chars.length]
  }
  return password
}
