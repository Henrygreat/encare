'use client'

import { useEffect, useState } from 'react'
import { FileText, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card } from '@/components/ui/card'
import { formatDate, formatTime } from '@/lib/utils'

export default function ResidentNotesPage({ params }: { params: { id: string } }) {
  const [notes, setNotes] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchNotes() {
      setIsLoading(true)

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('daily_logs')
          .select(`
            id,
            log_type,
            notes,
            logged_at,
            users!logged_by (full_name)
          `)
          .eq('resident_id', params.id)
          .eq('log_type', 'note')
          .order('logged_at', { ascending: false })
          .limit(50)

        if (error) throw error
        setNotes(data || [])
      } catch (err) {
        console.error('Error fetching notes:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchNotes()
  }, [params.id])

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Notes"
          backHref={`/app/residents/${params.id}`}
        />
      }
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading notes...</div>
        ) : notes.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No notes recorded yet</div>
        ) : (
          notes.map((note) => {
            const logger = Array.isArray(note.users) ? note.users[0] : note.users

            return (
              <Card key={note.id} padding="md">
                <div className="flex gap-3">
                  <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <FileText className="h-4 w-4 text-primary-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-medium text-gray-900 text-sm">{logger?.full_name || 'Staff'}</p>
                      <span className="text-xs text-gray-500 flex-shrink-0">
                        {formatTime(note.logged_at)}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">{note.notes || 'Note'}</p>
                    <p className="text-xs text-gray-400 mt-1">{formatDate(note.logged_at)}</p>
                  </div>
                </div>
              </Card>
            )
          })
        )}
      </div>
    </PageContainer>
  )
}
