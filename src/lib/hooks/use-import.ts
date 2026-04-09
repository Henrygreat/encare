'use client'

import { useState, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import type { ImportJob, ImportRow } from '@/lib/database.types'

export function useImportJobs() {
  const [jobs, setJobs] = useState<ImportJob[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const { user } = useAuthStore()

  const fetchJobs = useCallback(async () => {
    if (!user?.organisation_id) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()
      const { data, error: fetchError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('organisation_id', user.organisation_id)
        .order('created_at', { ascending: false })
        .limit(20)

      if (fetchError) throw fetchError
      setJobs(data || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch import jobs'))
    } finally {
      setIsLoading(false)
    }
  }, [user?.organisation_id])

  return { jobs, isLoading, error, refetch: fetchJobs }
}

export function useImportJob(jobId: string | null) {
  const [job, setJob] = useState<ImportJob | null>(null)
  const [rows, setRows] = useState<ImportRow[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const fetchJob = useCallback(async () => {
    if (!jobId) return

    setIsLoading(true)
    setError(null)

    try {
      const supabase = createClient()

      const { data: jobData, error: jobError } = await supabase
        .from('import_jobs')
        .select('*')
        .eq('id', jobId)
        .single()

      if (jobError) throw jobError
      setJob(jobData)

      const { data: rowData, error: rowError } = await supabase
        .from('import_rows')
        .select('*')
        .eq('import_job_id', jobId)
        .order('row_number', { ascending: true })

      if (rowError) throw rowError
      setRows(rowData || [])
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch import job'))
    } finally {
      setIsLoading(false)
    }
  }, [jobId])

  return { job, rows, isLoading, error, refetch: fetchJob, setJob, setRows }
}

export type ImportStep = 'upload' | 'mapping' | 'preview' | 'importing' | 'complete'

export interface ImportState {
  step: ImportStep
  file: File | null
  fileContent: string | null
  headers: string[]
  parsedRows: Array<Record<string, string>>
  parseErrors: Array<{ row: number; message: string }>
  columnMapping: Record<string, string | null>
  validationResults: Array<{
    rowIndex: number
    isValid: boolean
    errors: Array<{ field: string; message: string }>
    warnings: Array<{ field: string; message: string }>
  }>
  jobId: string | null
  importProgress: { imported: number; failed: number; total: number }
}

export function useImportWorkflow() {
  const [state, setState] = useState<ImportState>({
    step: 'upload',
    file: null,
    fileContent: null,
    headers: [],
    parsedRows: [],
    parseErrors: [],
    columnMapping: {},
    validationResults: [],
    jobId: null,
    importProgress: { imported: 0, failed: 0, total: 0 },
  })

  const setStep = useCallback((step: ImportStep) => {
    setState(prev => ({ ...prev, step }))
  }, [])

  const setFile = useCallback((file: File | null, content: string | null) => {
    setState(prev => ({
      ...prev,
      file,
      fileContent: content,
    }))
  }, [])

  const setParsedData = useCallback((
    headers: string[],
    rows: Array<Record<string, string>>,
    errors: Array<{ row: number; message: string }>
  ) => {
    setState(prev => ({
      ...prev,
      headers,
      parsedRows: rows,
      parseErrors: errors,
    }))
  }, [])

  const setColumnMapping = useCallback((mapping: Record<string, string | null>) => {
    setState(prev => ({
      ...prev,
      columnMapping: mapping,
    }))
  }, [])

  const setValidationResults = useCallback((results: ImportState['validationResults']) => {
    setState(prev => ({
      ...prev,
      validationResults: results,
    }))
  }, [])

  const setJobId = useCallback((jobId: string | null) => {
    setState(prev => ({
      ...prev,
      jobId,
    }))
  }, [])

  const setImportProgress = useCallback((progress: ImportState['importProgress']) => {
    setState(prev => ({
      ...prev,
      importProgress: progress,
    }))
  }, [])

  const reset = useCallback(() => {
    setState({
      step: 'upload',
      file: null,
      fileContent: null,
      headers: [],
      parsedRows: [],
      parseErrors: [],
      columnMapping: {},
      validationResults: [],
      jobId: null,
      importProgress: { imported: 0, failed: 0, total: 0 },
    })
  }, [])

  return {
    state,
    setStep,
    setFile,
    setParsedData,
    setColumnMapping,
    setValidationResults,
    setJobId,
    setImportProgress,
    reset,
  }
}
