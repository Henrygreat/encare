import { NextRequest, NextResponse } from 'next/server'
import { getResidentCSVTemplate } from '@/lib/import/resident-validator'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const entityType = searchParams.get('type') || 'residents'

  let template: string
  let filename: string

  switch (entityType) {
    case 'residents':
      template = getResidentCSVTemplate()
      filename = 'residents_import_template.csv'
      break
    default:
      return NextResponse.json({ error: 'Unknown entity type' }, { status: 400 })
  }

  return new NextResponse(template, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${filename}"`,
    },
  })
}
