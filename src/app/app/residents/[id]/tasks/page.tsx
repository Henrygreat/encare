'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Check, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { formatRelativeTime } from '@/lib/utils'

export default function ResidentTasksPage({ params }: { params: { id: string } }) {
  const [tasks, setTasks] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchTasks() {
      setIsLoading(true)

      try {
        const supabase = createClient()
        const { data, error } = await supabase
          .from('tasks')
          .select('*')
          .eq('resident_id', params.id)
          .order('due_at', { ascending: true })

        if (error) throw error
        setTasks(data || [])
      } catch (err) {
        console.error('Error fetching tasks:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTasks()
  }, [params.id])

  return (
    <PageContainer
      header={
        <MobileHeader
          title="Resident Tasks"
          backHref={`/app/residents/${params.id}`}
        />
      }
    >
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading tasks...</div>
        ) : tasks.length === 0 ? (
          <div className="p-4 text-center text-gray-500">No tasks for this resident</div>
        ) : (
          tasks.map((task) => (
            <Link key={task.id} href={`/app/tasks/${task.id}`}>
              <Card padding="md" className="cursor-pointer hover:shadow-card-hover transition-shadow">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {task.status === 'completed' && (
                        <Check className="h-4 w-4 text-care-green" />
                      )}
                      <span className="font-medium text-gray-900">{task.title}</span>
                      <Chip
                        variant={
                          task.priority === 'urgent'
                            ? 'danger'
                            : task.priority === 'high'
                            ? 'warning'
                            : 'default'
                        }
                        size="sm"
                      >
                        {task.priority}
                      </Chip>
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{task.description || 'No description'}</p>
                    <div className="flex gap-2">
                      <Chip
                        variant={
                          task.status === 'completed'
                            ? 'success'
                            : task.status === 'pending'
                            ? 'danger'
                            : 'default'
                        }
                        size="sm"
                      >
                        {task.status}
                      </Chip>
                      <span className="text-xs text-gray-500">Due {formatRelativeTime(task.due_at)}</span>
                    </div>
                  </div>
                  <ChevronRight className="h-5 w-5 text-gray-400 flex-shrink-0" />
                </div>
              </Card>
            </Link>
          ))
        )}
      </div>
    </PageContainer>
  )
}
