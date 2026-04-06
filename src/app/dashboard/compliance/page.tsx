'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useAuthStore } from '@/lib/stores/auth-store'
import { FileX, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { MobileHeader, PageContainer } from '@/components/layout/mobile-header'
import { Card } from '@/components/ui/card'
import { Avatar } from '@/components/ui/avatar'

export default function DashboardCompliancePage() {
  const { user } = useAuthStore()
  const [missingLogs, setMissingLogs] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    async function fetchMissingLogs() {
      if (!user?.organisation_id) return

      setIsLoading(true)

      try {
        const supabase = createClient()
        const today = new Date().toISOString().split('T')[0]
        const startOfDay = new Date()
        startOfDay.setHours(0, 0, 0, 0)

        const { data: residents } = await supabase
          .from('residents')
          .select('id, first_name, last_name, preferred_name, room_number')
          .eq('organisation_id', user.organisation_id)
          .eq('status', 'active')

        const { data: logs } = await supabase
          .from('daily_logs')
          .select('resident_id, log_type')
          .eq('organisation_id', user.organisation_id)
          .gte('logged_at', startOfDay.toISOString())

        const logsByResident = new Map<string, Set<string>>()
        logs?.forEach((log: any) => {
          if (!logsByResident.has(log.resident_id)) {
            logsByResident.set(log.resident_id, new Set())
          }
          logsByResident.get(log.resident_id)!.add(log.log_type)
        })

        const requiredLogs = ['meal', 'medication', 'personal_care']
        const incomplete = (residents || []).filter((r: any) => {
          const residentLogs = logsByResident.get(r.id) || new Set()
          return requiredLogs.some((type) => !residentLogs.has(type))
        }).map((r: any) => {
          const residentLogs = logsByResident.get(r.id) || new Set()
          const missing = requiredLogs.filter((type) => !residentLogs.has(type))
          return { ...r, missingTypes: missing }
        })

        setMissingLogs(incomplete)
      } catch (err) {
        console.error('Error fetching compliance data:', err)
      } finally {
        setIsLoading(false)
      }
    }

    fetchMissingLogs()
  }, [user?.organisation_id])

  return (
    <PageContainer header={<MobileHeader title="Compliance" backHref="/dashboard" />}>
      <div className="space-y-3">
        {isLoading ? (
          <div className="p-4 text-center text-gray-500">Loading compliance data...</div>
        ) : missingLogs.length === 0 ? (
          <div className="p-4 text-center text-gray-500">All logs complete</div>
        ) : (
          missingLogs.map((item) => (
            <Card key={item.id} padding="md">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                  <Avatar name={item.first_name} size="sm" />
                  <div>
                    <p className="font-medium text-gray-900">{item.preferred_name || item.first_name}</p>
                    <p className="text-sm text-gray-500">Room {item.room_number || 'N/A'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-care-amber">{item.missingTypes.join(', ')}</p>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </PageContainer>
  )
}
