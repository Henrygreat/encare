export type ParsedRow = Record<string, string>

export interface ParseResult {
  headers: string[]
  rows: ParsedRow[]
  errors: Array<{ row: number; message: string }>
}

export function parseCSV(content: string): ParseResult {
  const lines = content.split(/\r?\n/).filter(line => line.trim())
  const errors: ParseResult['errors'] = []

  if (lines.length === 0) {
    return { headers: [], rows: [], errors: [{ row: 0, message: 'File is empty' }] }
  }

  const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase())

  if (headers.length === 0) {
    return { headers: [], rows: [], errors: [{ row: 1, message: 'No headers found' }] }
  }

  const rows: ParsedRow[] = []

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line.trim()) continue

    try {
      const values = parseCSVLine(line)
      const row: ParsedRow = {}

      headers.forEach((header, index) => {
        row[header] = values[index]?.trim() ?? ''
      })

      rows.push(row)
    } catch (err) {
      errors.push({ row: i + 1, message: `Failed to parse row: ${err instanceof Error ? err.message : 'Unknown error'}` })
    }
  }

  return { headers, rows, errors }
}

function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const nextChar = line[i + 1]

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        current += '"'
        i++
      } else if (char === '"') {
        inQuotes = false
      } else {
        current += char
      }
    } else {
      if (char === '"') {
        inQuotes = true
      } else if (char === ',') {
        values.push(current)
        current = ''
      } else {
        current += char
      }
    }
  }

  values.push(current)
  return values
}

export function generateCSV(headers: string[], rows: Array<Record<string, string>>): string {
  const escapeField = (field: string): string => {
    if (field.includes(',') || field.includes('"') || field.includes('\n')) {
      return `"${field.replace(/"/g, '""')}"`
    }
    return field
  }

  const headerLine = headers.map(escapeField).join(',')
  const dataLines = rows.map(row =>
    headers.map(h => escapeField(row[h] ?? '')).join(',')
  )

  return [headerLine, ...dataLines].join('\n')
}
