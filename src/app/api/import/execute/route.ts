import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import type {
  Database,
  ResidentInsert,
  ImportStatus,
  ImportRowStatus,
  Json,
} from '@/lib/database.types'
import { validateRow, type ColumnMapping } from '@/lib/import/resident-validator'

type ImportRowInsertShape = {
  import_job_id: string
  row_number: number
  raw_data: Json
  mapped_data: Json | null
  status: ImportRowStatus
  errors: Json
  warnings: Json
  created_entity_id: string | null
}

type ExistingResidentRow = {
  first_name: string
  last_name: string
  room_number: string | null
}

export async function POST(request: NextRequest) {
  try {
    const serverSupabase = createServerClient()
    const {
      data: { user: authUser },
      error: authError,
    } = await serverSupabase.auth.getUser()

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
      return NextResponse.json(
        { error: 'Only managers can import data' },
        { status: 403 },
      )
    }

    const body = await request.json()
    const { rows, columnMapping, fileName, fileSize } = body as {
      rows: Record<string, string>[]
      columnMapping: ColumnMapping
      fileName?: string
      fileSize?: number | null
    }

    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: 'No rows to import' }, { status: 400 })
    }

    if (!columnMapping) {
      return NextResponse.json(
        { error: 'Column mapping is required' },
        { status: 400 },
      )
    }

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceRoleKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 },
      )
    }

    const adminSupabase = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceRoleKey,
      { auth: { autoRefreshToken: false, persistSession: false } },
    )

    const { data: jobData, error: jobError } = await adminSupabase
      .from('import_jobs')
      .insert({
        organisation_id: currentUser.organisation_id,
        created_by: authUser.id,
        entity_type: 'residents',
        status: 'importing' as ImportStatus,
        file_name: fileName || 'import.csv',
        file_size: fileSize || null,
        total_rows: rows.length,
        column_mapping: columnMapping as unknown as Json,
        started_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (jobError || !jobData) {
      console.error('Failed to create import job:', jobError)
      return NextResponse.json(
        { error: 'Failed to create import job' },
        { status: 500 },
      )
    }

    const { data: existingResidents } = await adminSupabase
      .from('residents')
      .select('first_name, last_name, room_number')
      .eq('organisation_id', currentUser.organisation_id)

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

    let importedCount = 0
    let skippedCount = 0
    let failedCount = 0

    const importRowsData: ImportRowInsertShape[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]

      const validation = validateRow(
        row,
        columnMapping,
        currentUser.organisation_id,
        existingRoomNumbers,
      )

      if (!validation.isValid || !validation.mappedData) {
        failedCount++
        importRowsData.push({
          import_job_id: jobData.id,
          row_number: i + 1,
          raw_data: row as unknown as Json,
          mapped_data: null,
          status: 'invalid',
          errors: validation.errors as unknown as Json,
          warnings: validation.warnings as unknown as Json,
          created_entity_id: null,
        })
        continue
      }

      const nameKey = `${validation.mappedData.first_name?.toLowerCase()}_${validation.mappedData.last_name?.toLowerCase()}`

      if (existingNames.has(nameKey)) {
        skippedCount++
        importRowsData.push({
          import_job_id: jobData.id,
          row_number: i + 1,
          raw_data: row as unknown as Json,
          mapped_data: validation.mappedData as unknown as Json,
          status: 'skipped',
          errors: [] as unknown as Json,
          warnings: [
            {
              field: 'name',
              message: 'Resident with this name already exists',
            },
          ] as unknown as Json,
          created_entity_id: null,
        })
        continue
      }

      try {
        const { data: insertedResident, error: insertError } = await adminSupabase
          .from('residents')
          .insert(validation.mappedData as ResidentInsert)
          .select('id')
          .single()

        if (insertError) {
          throw insertError
        }

        importedCount++
        existingNames.add(nameKey)

        if (validation.mappedData.room_number) {
          existingRoomNumbers.add(validation.mappedData.room_number.toLowerCase())
        }

        importRowsData.push({
          import_job_id: jobData.id,
          row_number: i + 1,
          raw_data: row as unknown as Json,
          mapped_data: validation.mappedData as unknown as Json,
          status: 'imported',
          errors: [] as unknown as Json,
          warnings: validation.warnings as unknown as Json,
          created_entity_id: insertedResident.id,
        })
      } catch (err) {
        failedCount++
        importRowsData.push({
          import_job_id: jobData.id,
          row_number: i + 1,
          raw_data: row as unknown as Json,
          mapped_data: validation.mappedData as unknown as Json,
          status: 'failed',
          errors: [
            {
              field: 'general',
              message: err instanceof Error ? err.message : 'Failed to insert',
            },
          ] as unknown as Json,
          warnings: validation.warnings as unknown as Json,
          created_entity_id: null,
        })
      }
    }

    if (importRowsData.length > 0) {
      const { error: rowsError } = await adminSupabase
        .from('import_rows')
        .insert(importRowsData)

      if (rowsError) {
        console.error('Failed to save import rows:', rowsError)
      }
    }

    const finalStatus: ImportStatus =
      failedCount === rows.length ? 'failed' : 'completed'

    await adminSupabase
      .from('import_jobs')
      .update({
        status: finalStatus,
        imported_rows: importedCount,
        skipped_rows: skippedCount,
        failed_rows: failedCount,
        valid_rows: importedCount + skippedCount,
        invalid_rows: failedCount,
        completed_at: new Date().toISOString(),
      })
      .eq('id', jobData.id)

    return NextResponse.json({
      success: true,
      jobId: jobData.id,
      summary: {
        total: rows.length,
        imported: importedCount,
        skipped: skippedCount,
        failed: failedCount,
      },
    })
  } catch (error) {
    console.error('Import execution error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 },
    )
  }
}