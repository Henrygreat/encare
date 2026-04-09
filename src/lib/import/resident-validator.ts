import type { ResidentInsert } from '@/lib/database.types'
import type { ParsedRow } from './csv-parser'

export interface ColumnMapping {
  [targetField: string]: string | null
}

export interface ValidationError {
  field: string
  message: string
}

export interface ValidationResult {
  isValid: boolean
  errors: ValidationError[]
  warnings: ValidationError[]
  mappedData: Partial<ResidentInsert> | null
}

export const RESIDENT_FIELDS = [
  { key: 'first_name', label: 'First Name', required: true },
  { key: 'last_name', label: 'Last Name', required: true },
  { key: 'preferred_name', label: 'Preferred Name', required: false },
  { key: 'date_of_birth', label: 'Date of Birth', required: false },
  { key: 'room_number', label: 'Room Number', required: false },
  { key: 'admission_date', label: 'Admission Date', required: false },
  { key: 'dietary_requirements', label: 'Dietary Requirements', required: false },
  { key: 'mobility_notes', label: 'Mobility Notes', required: false },
  { key: 'communication_needs', label: 'Communication Needs', required: false },
  { key: 'emergency_contact_name', label: 'Emergency Contact Name', required: false },
  { key: 'emergency_contact_phone', label: 'Emergency Contact Phone', required: false },
  { key: 'emergency_contact_relationship', label: 'Emergency Contact Relationship', required: false },
] as const

export type ResidentFieldKey = typeof RESIDENT_FIELDS[number]['key']

const FIELD_ALIASES: Record<ResidentFieldKey, string[]> = {
  first_name: ['first name', 'firstname', 'given name', 'forename'],
  last_name: ['last name', 'lastname', 'surname', 'family name'],
  preferred_name: ['preferred name', 'nickname', 'known as', 'preferred'],
  date_of_birth: ['date of birth', 'dob', 'birth date', 'birthdate', 'birthday'],
  room_number: ['room number', 'room', 'room no', 'room #', 'bed'],
  admission_date: ['admission date', 'admitted', 'admission', 'move in date', 'start date'],
  dietary_requirements: ['dietary requirements', 'dietary', 'diet', 'food requirements', 'allergies'],
  mobility_notes: ['mobility notes', 'mobility', 'mobility status', 'walking'],
  communication_needs: ['communication needs', 'communication', 'language', 'hearing', 'speech'],
  emergency_contact_name: ['emergency contact name', 'emergency contact', 'next of kin', 'nok', 'contact name'],
  emergency_contact_phone: ['emergency contact phone', 'emergency phone', 'nok phone', 'contact phone', 'emergency number'],
  emergency_contact_relationship: ['emergency contact relationship', 'relationship', 'relation', 'nok relationship'],
}

export function autoMapColumns(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {}
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim())

  for (const field of RESIDENT_FIELDS) {
    const aliases = FIELD_ALIASES[field.key]
    const allMatches = [field.key.replace(/_/g, ' '), ...aliases]

    for (const header of normalizedHeaders) {
      if (allMatches.some(alias => header === alias || header.includes(alias))) {
        mapping[field.key] = header
        break
      }
    }

    if (!mapping[field.key]) {
      mapping[field.key] = null
    }
  }

  return mapping
}

export function validateRow(
  row: ParsedRow,
  mapping: ColumnMapping,
  organisationId: string,
  existingRoomNumbers: Set<string> = new Set()
): ValidationResult {
  const errors: ValidationError[] = []
  const warnings: ValidationError[] = []

  const getValue = (field: ResidentFieldKey): string => {
    const sourceCol = mapping[field]
    return sourceCol ? (row[sourceCol] ?? '').trim() : ''
  }

  const firstName = getValue('first_name')
  const lastName = getValue('last_name')

  if (!firstName) {
    errors.push({ field: 'first_name', message: 'First name is required' })
  } else if (firstName.length > 100) {
    errors.push({ field: 'first_name', message: 'First name is too long (max 100 characters)' })
  }

  if (!lastName) {
    errors.push({ field: 'last_name', message: 'Last name is required' })
  } else if (lastName.length > 100) {
    errors.push({ field: 'last_name', message: 'Last name is too long (max 100 characters)' })
  }

  const preferredName = getValue('preferred_name')
  if (preferredName && preferredName.length > 100) {
    errors.push({ field: 'preferred_name', message: 'Preferred name is too long (max 100 characters)' })
  }

  const dateOfBirth = getValue('date_of_birth')
  let parsedDOB: string | null = null
  if (dateOfBirth) {
    parsedDOB = parseDate(dateOfBirth)
    if (!parsedDOB) {
      errors.push({ field: 'date_of_birth', message: 'Invalid date format' })
    } else {
      const dob = new Date(parsedDOB)
      const now = new Date()
      if (dob > now) {
        errors.push({ field: 'date_of_birth', message: 'Date of birth cannot be in the future' })
      }
    }
  }

  const admissionDate = getValue('admission_date')
  let parsedAdmission: string | null = null
  if (admissionDate) {
    parsedAdmission = parseDate(admissionDate)
    if (!parsedAdmission) {
      errors.push({ field: 'admission_date', message: 'Invalid date format' })
    }
  }

  const roomNumber = getValue('room_number')
  if (roomNumber && roomNumber.length > 50) {
    errors.push({ field: 'room_number', message: 'Room number is too long (max 50 characters)' })
  }
  if (roomNumber && existingRoomNumbers.has(roomNumber.toLowerCase())) {
    warnings.push({ field: 'room_number', message: 'Room number already exists' })
  }

  if (errors.length > 0) {
    return { isValid: false, errors, warnings, mappedData: null }
  }

  const emergencyContact: Record<string, string | null> = {}
  const ecName = getValue('emergency_contact_name')
  const ecPhone = getValue('emergency_contact_phone')
  const ecRelation = getValue('emergency_contact_relationship')

  if (ecName || ecPhone || ecRelation) {
    emergencyContact.name = ecName || null
    emergencyContact.phone = ecPhone || null
    emergencyContact.relationship = ecRelation || null
  }

  const mappedData: Partial<ResidentInsert> = {
    organisation_id: organisationId,
    first_name: firstName,
    last_name: lastName,
    preferred_name: preferredName || null,
    date_of_birth: parsedDOB,
    room_number: roomNumber || null,
    admission_date: parsedAdmission || new Date().toISOString().split('T')[0],
    status: 'active',
    dietary_requirements: getValue('dietary_requirements') || null,
    mobility_notes: getValue('mobility_notes') || null,
    communication_needs: getValue('communication_needs') || null,
    emergency_contact: Object.keys(emergencyContact).length > 0 ? emergencyContact : {},
    medical_info: {},
    risk_flags: [],
  }

  return { isValid: true, errors: [], warnings, mappedData }
}

function parseDate(value: string): string | null {
  const datePatterns = [
    /^(\d{4})-(\d{2})-(\d{2})$/,
    /^(\d{2})\/(\d{2})\/(\d{4})$/,
    /^(\d{2})-(\d{2})-(\d{4})$/,
    /^(\d{1,2})\/(\d{1,2})\/(\d{4})$/,
  ]

  for (const pattern of datePatterns) {
    const match = value.match(pattern)
    if (match) {
      let year: string, month: string, day: string

      if (pattern === datePatterns[0]) {
        [, year, month, day] = match
      } else {
        [, day, month, year] = match
      }

      const y = parseInt(year, 10)
      const m = parseInt(month, 10)
      const d = parseInt(day, 10)

      if (m >= 1 && m <= 12 && d >= 1 && d <= 31 && y >= 1900 && y <= 2100) {
        return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`
      }
    }
  }

  const parsed = Date.parse(value)
  if (!isNaN(parsed)) {
    return new Date(parsed).toISOString().split('T')[0]
  }

  return null
}

export function getResidentCSVTemplate(): string {
  const headers = [
    'first_name',
    'last_name',
    'preferred_name',
    'date_of_birth',
    'room_number',
    'admission_date',
    'dietary_requirements',
    'mobility_notes',
    'communication_needs',
    'emergency_contact_name',
    'emergency_contact_phone',
    'emergency_contact_relationship',
  ]

  const exampleRow = [
    'John',
    'Smith',
    'Johnny',
    '1945-03-15',
    '12A',
    '2024-01-15',
    'Diabetic diet',
    'Uses walking frame',
    'Hearing aid in left ear',
    'Jane Smith',
    '07700 900123',
    'Daughter',
  ]

  return [headers.join(','), exampleRow.join(',')].join('\n')
}
