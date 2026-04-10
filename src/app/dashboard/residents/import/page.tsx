'use client'

import { useState, useCallback, useEffect } from 'react'
import Link from 'next/link'
import {
  ArrowLeft,
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Download,
  ArrowRight,
  RotateCcw,
  Users,
  Clock,
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useAuth, useRequireManager } from '@/lib/hooks/use-auth'
import { useImportWorkflow, useImportJobs } from '@/lib/hooks/use-import'
import { parseCSV } from '@/lib/import/csv-parser'
import { autoMapColumns, RESIDENT_FIELDS, type ColumnMapping } from '@/lib/import/resident-validator'

export default function ImportDataPage() {
  const { organisation, user, isLoading: authLoading } = useAuth()
  const { isManager, isLoading: managerLoading } = useRequireManager()
  const { jobs, refetch: refetchJobs } = useImportJobs()
  const {
    state,
    setStep,
    setFile,
    setParsedData,
    setColumnMapping,
    setValidationResults,
    setImportProgress,
    reset,
  } = useImportWorkflow()

  const [isValidating, setIsValidating] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => {
    refetchJobs()
  }, [refetchJobs])

  const handleFileSelect = useCallback(async (file: File) => {
    setError(null)

    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB')
      return
    }

    try {
      const content = await file.text()
      const result = parseCSV(content)

      if (result.rows.length === 0) {
        setError('No data rows found in file')
        return
      }

      setFile(file, content)
      setParsedData(result.headers, result.rows, result.errors)

      const mapping = autoMapColumns(result.headers)
      setColumnMapping(mapping)

      setStep('mapping')
    } catch (err) {
      setError('Failed to read file')
    }
  }, [setFile, setParsedData, setColumnMapping, setStep])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileSelect(file)
  }, [handleFileSelect])

  const handleValidate = useCallback(async () => {
    if (!state.fileContent) return

    setIsValidating(true)
    setError(null)

    try {
      const response = await fetch('/api/import/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content: state.fileContent,
          fileName: state.file?.name,
          columnMapping: state.columnMapping,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Validation failed')
      }

      setValidationResults(data.validationResults)
      setStep('preview')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Validation failed')
    } finally {
      setIsValidating(false)
    }
  }, [state.fileContent, state.file?.name, state.columnMapping, setValidationResults, setStep])

  const handleImport = useCallback(async () => {
    const validRows = state.validationResults.filter(r => r.isValid)
    if (validRows.length === 0) return

    setIsImporting(true)
    setError(null)
    setStep('importing')
    setImportProgress({ imported: 0, failed: 0, total: validRows.length })

    try {
      const rowsToImport = validRows.map(v => state.parsedRows[v.rowIndex])

      const response = await fetch('/api/import/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rows: rowsToImport,
          columnMapping: state.columnMapping,
          fileName: state.file?.name,
          fileSize: state.file?.size,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Import failed')
      }

      setImportProgress({
        imported: data.summary.imported,
        failed: data.summary.failed + data.summary.skipped,
        total: data.summary.total,
      })

      setStep('complete')
      refetchJobs()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed')
      setStep('preview')
    } finally {
      setIsImporting(false)
    }
  }, [state.validationResults, state.parsedRows, state.columnMapping, state.file, setStep, setImportProgress, refetchJobs])

  const handleMappingChange = useCallback((field: string, value: string | null) => {
    setColumnMapping({
      ...state.columnMapping,
      [field]: value,
    })
  }, [state.columnMapping, setColumnMapping])

  if (authLoading || managerLoading) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-slate-500">Loading...</p>
      </div>
    )
  }

  if (!isManager) {
    return (
      <div className="mx-auto max-w-4xl py-12 text-center">
        <p className="text-slate-500">You do not have permission to import data.</p>
        <Link href="/dashboard">
          <Button variant="secondary" className="mt-4">Back to Dashboard</Button>
        </Link>
      </div>
    )
  }

  const validCount = state.validationResults.filter(r => r.isValid).length
  const invalidCount = state.validationResults.filter(r => !r.isValid).length

  return (
    <div className="min-h-screen bg-surface-50">
      <header className="sticky top-0 z-10 border-b border-white/60 bg-white/80 px-4 py-3 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="-ml-2 rounded-full p-2 transition-colors hover:bg-surface-100"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600" />
          </Link>
          <div>
            <h1 className="text-lg font-semibold text-slate-900">Import Data</h1>
            <p className="text-sm text-slate-500">{organisation?.name}</p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 p-4">
        <div className="flex items-center gap-2 text-sm">
          <StepIndicator step={1} label="Upload" active={state.step === 'upload'} complete={state.step !== 'upload'} />
          <ArrowRight className="h-4 w-4 text-slate-300" />
          <StepIndicator step={2} label="Map columns" active={state.step === 'mapping'} complete={['preview', 'importing', 'complete'].includes(state.step)} />
          <ArrowRight className="h-4 w-4 text-slate-300" />
          <StepIndicator step={3} label="Preview" active={state.step === 'preview'} complete={['importing', 'complete'].includes(state.step)} />
          <ArrowRight className="h-4 w-4 text-slate-300" />
          <StepIndicator step={4} label="Import" active={state.step === 'importing' || state.step === 'complete'} complete={state.step === 'complete'} />
        </div>

        {error && (
          <div className="flex items-center gap-2 rounded-2xl border border-red-100 bg-red-50 px-4 py-3 text-sm text-red-700">
            <AlertCircle className="h-4 w-4 shrink-0" />
            {error}
          </div>
        )}

        {state.step === 'upload' && (
          <>
            <Card padding="lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-primary-600" />
                  Import Residents
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-slate-600">
                  Upload a CSV file containing resident information. Required fields are first name and last name.
                </p>

                <div
                  className={`relative rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
                    dragOver ? 'border-primary-400 bg-primary-50' : 'border-slate-200 hover:border-slate-300'
                  }`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={handleDrop}
                >
                  <Upload className="mx-auto h-10 w-10 text-slate-400" />
                  <p className="mt-3 text-sm text-slate-600">
                    Drag and drop your CSV file here, or
                  </p>
                  <label className="mt-2 inline-block cursor-pointer text-sm font-medium text-primary-600 hover:text-primary-700">
                    browse to upload
                    <input
                      type="file"
                      accept=".csv"
                      className="hidden"
                      onChange={(e) => e.target.files?.[0] && handleFileSelect(e.target.files[0])}
                    />
                  </label>
                  <p className="mt-2 text-xs text-slate-400">CSV files only, max 5MB</p>
                </div>

                <div className="flex justify-center">
                  <a
                    href="/api/import/template?type=residents"
                    className="inline-flex items-center gap-1.5 text-sm text-slate-500 transition hover:text-slate-700"
                    download
                  >
                    <Download className="h-4 w-4" />
                    Download CSV template
                  </a>
                </div>
              </CardContent>
            </Card>

            {jobs.length > 0 && (
              <Card padding="lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-slate-500" />
                    Recent Imports
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {jobs.slice(0, 5).map(job => (
                      <div key={job.id} className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3">
                        <div className="flex items-center gap-3">
                          <FileSpreadsheet className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{job.file_name}</p>
                            <p className="text-xs text-slate-500">
                              {new Date(job.created_at).toLocaleDateString()} at {new Date(job.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <span className="text-emerald-600">{job.imported_rows} imported</span>
                          {job.failed_rows > 0 && (
                            <span className="text-red-500">{job.failed_rows} failed</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </>
        )}

        {state.step === 'mapping' && (
          <Card padding="lg">
            <CardHeader>
              <CardTitle>Map Columns</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-slate-600">
                Match your file columns to the required fields. We've auto-mapped what we could.
              </p>

              <div className="rounded-xl border border-slate-200 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Field</th>
                      <th className="px-4 py-2 text-left font-medium text-slate-700">Your Column</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {RESIDENT_FIELDS.map(field => (
                      <tr key={field.key} className="hover:bg-slate-50/50">
                        <td className="px-4 py-3">
                          <span className="font-medium text-slate-900">{field.label}</span>
                          {field.required && <span className="ml-1 text-red-500">*</span>}
                        </td>
                        <td className="px-4 py-3">
                          <select
                            value={state.columnMapping[field.key] || ''}
                            onChange={(e) => handleMappingChange(field.key, e.target.value || null)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          >
                            <option value="">-- Not mapped --</option>
                            {state.headers.map(header => (
                              <option key={header} value={header}>{header}</option>
                            ))}
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-between pt-2">
                <Button variant="secondary" onClick={reset}>
                  <RotateCcw className="h-4 w-4" />
                  Start over
                </Button>
                <Button onClick={handleValidate} isLoading={isValidating}>
                  Validate & Preview
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {state.step === 'preview' && (
          <>
            <div className="grid gap-4 sm:grid-cols-3">
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-slate-100 p-2">
                    <FileSpreadsheet className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-slate-900">{state.parsedRows.length}</p>
                    <p className="text-sm text-slate-500">Total rows</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-emerald-100 p-2">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-emerald-600">{validCount}</p>
                    <p className="text-sm text-slate-500">Ready to import</p>
                  </div>
                </div>
              </Card>
              <Card padding="md">
                <div className="flex items-center gap-3">
                  <div className="rounded-full bg-red-100 p-2">
                    <AlertCircle className="h-5 w-5 text-red-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-red-600">{invalidCount}</p>
                    <p className="text-sm text-slate-500">Have errors</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card padding="lg">
              <CardHeader>
                <CardTitle>Preview</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="max-h-96 overflow-auto rounded-xl border border-slate-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50">
                      <tr>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Row</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Status</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">First Name</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Last Name</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Room</th>
                        <th className="px-3 py-2 text-left font-medium text-slate-700">Issues</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {state.validationResults.map((result, idx) => {
                        const row = state.parsedRows[result.rowIndex]
                        const firstName = state.columnMapping.first_name ? row[state.columnMapping.first_name] : ''
                        const lastName = state.columnMapping.last_name ? row[state.columnMapping.last_name] : ''
                        const room = state.columnMapping.room_number ? row[state.columnMapping.room_number] : ''

                        return (
                          <tr key={idx} className={result.isValid ? '' : 'bg-red-50/50'}>
                            <td className="px-3 py-2 text-slate-500">{result.rowIndex + 1}</td>
                            <td className="px-3 py-2">
                              {result.isValid ? (
                                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <AlertCircle className="h-4 w-4 text-red-500" />
                              )}
                            </td>
                            <td className="px-3 py-2 text-slate-900">{firstName}</td>
                            <td className="px-3 py-2 text-slate-900">{lastName}</td>
                            <td className="px-3 py-2 text-slate-600">{room || '-'}</td>
                            <td className="px-3 py-2">
                              {result.errors.length > 0 && (
                                <span className="text-xs text-red-600">
                                  {result.errors.map(e => e.message).join(', ')}
                                </span>
                              )}
                              {result.warnings.length > 0 && result.errors.length === 0 && (
                                <span className="flex items-center gap-1 text-xs text-amber-600">
                                  <AlertTriangle className="h-3 w-3" />
                                  {result.warnings.map(w => w.message).join(', ')}
                                </span>
                              )}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="secondary" onClick={() => setStep('mapping')}>
                    <ArrowLeft className="h-4 w-4" />
                    Back to mapping
                  </Button>
                  <Button
                    onClick={handleImport}
                    disabled={validCount === 0}
                    isLoading={isImporting}
                  >
                    Import {validCount} resident{validCount !== 1 ? 's' : ''}
                    <CheckCircle2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}

        {state.step === 'importing' && (
          <Card padding="lg">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              <p className="text-lg font-medium text-slate-900">Importing residents...</p>
              <p className="mt-1 text-sm text-slate-500">
                {state.importProgress.imported} of {state.importProgress.total} imported
              </p>
            </CardContent>
          </Card>
        )}

        {state.step === 'complete' && (
          <Card padding="lg">
            <CardContent className="py-12 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <p className="text-xl font-semibold text-slate-900">Import Complete</p>
              <p className="mt-2 text-slate-600">
                Successfully imported {state.importProgress.imported} resident{state.importProgress.imported !== 1 ? 's' : ''}.
                {state.importProgress.failed > 0 && (
                  <span className="text-red-600"> {state.importProgress.failed} skipped or failed.</span>
                )}
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Button variant="secondary" onClick={reset}>
                  Import more
                </Button>
                <Link href="/dashboard/residents">
                  <Button>
                    View residents
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}

function StepIndicator({ step, label, active, complete }: { step: number; label: string; active: boolean; complete: boolean }) {
  return (
    <div className={`flex items-center gap-2 ${active ? 'text-primary-600' : complete ? 'text-emerald-600' : 'text-slate-400'}`}>
      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
        active ? 'bg-primary-100 text-primary-700' : complete ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-500'
      }`}>
        {complete ? <CheckCircle2 className="h-4 w-4" /> : step}
      </span>
      <span className="hidden font-medium sm:inline">{label}</span>
    </div>
  )
}
