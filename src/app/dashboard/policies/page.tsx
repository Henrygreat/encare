'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Plus, FileText, Users, CheckCircle2, Clock, Search } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Chip } from '@/components/ui/chip'
import { Input } from '@/components/ui/input'
import { usePolicies } from '@/lib/hooks'
import { formatRelativeTime } from '@/lib/utils'
import type { PolicyStatus } from '@/lib/database.types'

const statusConfig: Record<PolicyStatus, { label: string; variant: 'default' | 'success' | 'warning' }> = {
  draft: { label: 'Draft', variant: 'warning' },
  published: { label: 'Published', variant: 'success' },
  archived: { label: 'Archived', variant: 'default' },
}

export default function PoliciesPage() {
  const { policies, isLoading, error } = usePolicies()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<PolicyStatus | 'all'>('all')

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch = policy.title.toLowerCase().includes(search.toLowerCase()) ||
      policy.summary?.toLowerCase().includes(search.toLowerCase())
    const matchesStatus = statusFilter === 'all' || policy.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
        Failed to load policies. Please try again.
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Policies</h1>
          <p className="mt-1 text-slate-600">
            Manage company policies and track staff acknowledgements
          </p>
        </div>
        <Link href="/dashboard/policies/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Policy
          </Button>
        </Link>
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="flex-1">
          <Input
            placeholder="Search policies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={<Search className="h-4 w-4" />}
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'draft', 'published', 'archived'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-primary-100 text-primary-700'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {status === 'all' ? 'All' : statusConfig[status].label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-6 w-1/3 rounded bg-slate-200" />
                <div className="mt-2 h-4 w-2/3 rounded bg-slate-100" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : filteredPolicies.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-100">
              <FileText className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-semibold text-slate-900">No policies found</h3>
            <p className="mt-1 text-slate-600">
              {search || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first policy to get started'}
            </p>
            {!search && statusFilter === 'all' && (
              <Link href="/dashboard/policies/new" className="mt-4">
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Policy
                </Button>
              </Link>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {filteredPolicies.map((policy) => {
            const config = statusConfig[policy.status]
            const ackRate = policy.total_assigned > 0
              ? Math.round((policy.total_acknowledged / policy.total_assigned) * 100)
              : 0

            return (
              <Link key={policy.id} href={`/dashboard/policies/${policy.id}`}>
                <Card className="transition-shadow hover:shadow-md">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-3">
                          <h3 className="truncate text-lg font-semibold text-slate-900">
                            {policy.title}
                          </h3>
                          <Chip variant={config.variant} size="sm">
                            {config.label}
                          </Chip>
                          {policy.version > 1 && (
                            <span className="text-xs text-slate-500">v{policy.version}</span>
                          )}
                        </div>
                        {policy.summary && (
                          <p className="mt-1 line-clamp-2 text-slate-600">{policy.summary}</p>
                        )}
                        <div className="mt-3 flex flex-wrap items-center gap-4 text-sm text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-4 w-4" />
                            {formatRelativeTime(policy.created_at)}
                          </span>
                          {policy.creator && (
                            <span>by {policy.creator.full_name}</span>
                          )}
                        </div>
                      </div>

                      {policy.status === 'published' && policy.total_assigned > 0 && (
                        <div className="flex flex-col items-end gap-1">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-slate-400" />
                            <span className="text-sm font-medium text-slate-700">
                              {policy.total_acknowledged}/{policy.total_assigned}
                            </span>
                          </div>
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className={`h-4 w-4 ${
                              ackRate === 100 ? 'text-emerald-500' : 'text-slate-400'
                            }`} />
                            <span className={`text-sm ${
                              ackRate === 100 ? 'text-emerald-600' : 'text-slate-500'
                            }`}>
                              {ackRate}% read
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
