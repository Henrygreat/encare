import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { parseCSV } from '@/lib/import/csv-parser'
import { autoMapColumns, validateRow, RESIDENT_FIELDS, type ColumnMapping } from '@/lib/import/resident-validator'

export async function POST(request: NextRequest) {
  try {
    const serverSupabase = createServerClient()
    const { data: { user: authUser }, error: authError } = await serverSupabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser, error: userError } = await serverSupabase
      .from('users')
      .select('role, organisation_id')
      .eq('id', authUser.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json({ error: 'Only managers can import data' }, { status: 403 })
    }

    const body = await request.json()
    const { content, fileName, columnMapping: providedMapping } = body

    if (!content || typeof content !== 'string') {
      return NextResponse.json({ error: 'File content is required' }, { status: 400 })
    }

    const parseResult = parseCSV(content)

    if (parseResult.errors.length > 0 && parseResult.rows.length === 0) {
      return NextResponse.json({
        success: false,
        parseErrors: parseResult.errors,
        headers: [],
        rows: [],
        columnMapping: {},
        validationResults: [],
      })
    }

    const columnMapping: ColumnMapping = providedMapping || autoMapColumns(parseResult.headers)

    const { data: existingResidents } = await serverSupabase
      .from('residents')
      .select('room_number')
      .eq('organisation_id', currentUser.organisation_id)
      .not('room_number', 'is', null)

    const existingRoomNumbers = new Set(
      (existingResidents || [])
        .map(r => r.room_number?.toLowerCase())
        .filter(Boolean) as string[]
    )

    const validationResults = parseResult.rows.map((row, index) => {
      const result = validateRow(row, columnMapping, currentUser.organisation_id, existingRoomNumbers)
      return {
        rowIndex: index,
        isValid: result.isValid,
        errors: result.errors,
        warnings: result.warnings,
        mappedData: result.mappedData,
      }
    })

    const validCount = validationResults.filter(r => r.isValid).length
    const invalidCount = validationResults.filter(r => !r.isValid).length

    return NextResponse.json({
      success: true,
      headers: parseResult.headers,
      rows: parseResult.rows,
      parseErrors: parseResult.errors,
      columnMapping,
      availableFields: RESIDENT_FIELDS,
      validationResults,
      summary: {
        total: parseResult.rows.length,
        valid: validCount,
        invalid: invalidCount,
      },
    })
  } catch (error) {
    console.error('Import validation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}
