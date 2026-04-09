import { NextRequest, NextResponse } from 'next/server'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type { ColumnMapping } from '@/lib/import/resident-validator'

type ExistingResidentRow = {
  first_name: string
  last_name: string
  room_number: string | null
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()

    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: currentUser, error: userError } = await supabase
      .from('users')
      .select('role, organisation_id')
      .eq('id', authUser.id)
      .single()

    if (userError || !currentUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (currentUser.role !== 'admin' && currentUser.role !== 'manager') {
      return NextResponse.json(
        { error: 'Only managers can validate imports' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { rows, columnMapping } = body as {
      rows: Record<string, string>[]
      columnMapping: ColumnMapping
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows provided' }, { status: 400 })
    }

    if (!columnMapping) {
      return NextResponse.json(
        { error: 'Column mapping is required' },
        { status: 400 },
      )
    }

    const { data: existingResidents, error: existingError } = await supabase
      .from('residents')
      .select('first_name, last_name, room_number')
      .eq('organisation_id', currentUser.organisation_id)

    if (existingError) {
      return NextResponse.json(
        { error: 'Failed to load existing residents' },
        { status: 500 },
      )
    }

    const existingResidentRows = (existingResidents || []) as ExistingResidentRow[]

    const existingRoomNumbers = new Set(
      existingResidentRows
        .map((r: ExistingResidentRow) => r.room_number?.toLowerCase())
        .filter(Boolean) as string[],
    )

    const existingNames = new Set(
      existingResidentRows.map(
        (r: ExistingResidentRow) =>
          `${r.first_name.toLowerCase()}_${r.last_name.toLowerCase()}`,
      ),
    )

    const duplicateNamesInFile = new Set<string>()
    const seenNamesInFile = new Set<string>()

    let validRows = 0
    let invalidRows = 0
    let duplicateRows = 0

    const results = rows.map((row, index) => {
      const mappedData: Record<string, string | null> = {}
      const errors: Array<{ field: string; message: string }> = []
      const warnings: Array<{ field: string; message: string }> = []

      const getMappedValue = (field: keyof ColumnMapping) => {
        const sourceColumn = columnMapping[field]
        if (!sourceColumn) return ''
        return String(row[sourceColumn] || '').trim()
      }

      const firstName = getMappedValue('first_name')
      const lastName = getMappedValue('last_name')
      const preferredName = getMappedValue('preferred_name')
      const roomNumber = getMappedValue('room_number')
      const dateOfBirth = getMappedValue('date_of_birth')
      const gender = getMappedValue('gender')
      const status = getMappedValue('status')
      const notes = getMappedValue('notes')

      if (!firstName) {
        errors.push({ field: 'first_name', message: 'First name is required' })
      }

      if (!lastName) {
        errors.push({ field: 'last_name', message: 'Last name is required' })
      }

      if (roomNumber && existingRoomNumbers.has(roomNumber.toLowerCase())) {
        warnings.push({
          field: 'room_number',
          message: 'Room number already exists for another resident',
        })
      }

      const nameKey = `${firstName.toLowerCase()}_${lastName.toLowerCase()}`

      if (firstName && lastName) {
        if (existingNames.has(nameKey)) {
          warnings.push({
            field: 'name',
            message: 'Resident with this name already exists',
          })
        }

        if (seenNamesInFile.has(nameKey)) {
          duplicateNamesInFile.add(nameKey)
          warnings.push({
            field: 'name',
            message: 'Duplicate resident name found in uploaded file',
          })
        } else {
          seenNamesInFile.add(nameKey)
        }
      }

      if (dateOfBirth) {
        const parsed = new Date(dateOfBirth)
        if (Number.isNaN(parsed.getTime())) {
          errors.push({
            field: 'date_of_birth',
            message: 'Date of birth is not a valid date',
          })
        } else {
          mappedData.date_of_birth = parsed.toISOString().split('T')[0]
        }
      }

      if (status) {
        const normalisedStatus = status.toLowerCase()
        if (['active', 'inactive', 'discharged', 'archived'].includes(normalisedStatus)) {
          mappedData.status = normalisedStatus
        } else {
          warnings.push({
            field: 'status',
            message: 'Unknown status supplied, active will be used',
          })
          mappedData.status = 'active'
        }
      } else {
        mappedData.status = 'active'
      }

      mappedData.first_name = firstName || null
      mappedData.last_name = lastName || null
      mappedData.preferred_name = preferredName || null
      mappedData.room_number = roomNumber || null
      mappedData.gender = gender || null
      mappedData.notes = notes || null

      const isValid = errors.length === 0

      if (isValid) {
        validRows++
      } else {
        invalidRows++
      }

      if (warnings.some((w) => w.message.toLowerCase().includes('duplicate'))) {
        duplicateRows++
      }

      return {
        row_number: index + 1,
        raw_data: row,
        mapped_data: isValid ? mappedData : null,
        is_valid: isValid,
        errors,
        warnings,
      }
    })

    return NextResponse.json({
      success: true,
      summary: {
        total_rows: rows.length,
        valid_rows: validRows,
        invalid_rows: invalidRows,
        duplicate_rows: duplicateRows,
      },
      results,
    })
  } catch (error) {
    console.error('Import validation error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred during validation' },
      { status: 500 },
    )
  }
}