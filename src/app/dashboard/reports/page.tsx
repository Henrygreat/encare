'use client'

import { useState } from 'react'
import {
  FileBarChart,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Users,
  Activity,
  TrendingUp,
  Filter
} from 'lucide-react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Chip } from '@/components/ui/chip'
import { formatDate } from '@/lib/utils'

// Demo data
const DEMO_REPORTS = {
  dailySummary: {
    date: new Date().toISOString().split('T')[0],
    totalLogs: 156,
    logsChange: 12,
    tasksCompleted: 42,
    taskComplianceRate: 87,
    incidentCount: 1,
    residentsWithLogs: 8,
    totalResidents: 8,
    topLogTypes: [
      { type: 'Meal', count: 48 },
      { type: 'Medication', count: 32 },
      { type: 'Personal Care', count: 28 },
      { type: 'Observation', count: 24 },
      { type: 'Mood', count: 24 },
    ],
    staffActivity: [
      { name: 'Sarah Johnson', logs: 45, tasks: 12 },
      { name: 'Mike Taylor', logs: 38, tasks: 10 },
      { name: 'Emma Wilson', logs: 42, tasks: 11 },
      { name: 'James Brown', logs: 31, tasks: 9 },
    ],
  },
  complianceGaps: [
    { type: 'Missing meal log', count: 2, residents: ['Room 101', 'Room 115'] },
    { type: 'Overdue medication', count: 1, residents: ['Room 108'] },
    { type: 'No mood check today', count: 3, residents: ['Room 105', 'Room 112', 'Room 118'] },
  ],
  incidentSummary: {
    total: 5,
    byType: [
      { type: 'Fall', count: 2 },
      { type: 'Behaviour', count: 2 },
      { type: 'Medical', count: 1 },
    ],
    bySeverity: [
      { level: 'Low', count: 2 },
      { level: 'Medium', count: 2 },
      { level: 'High', count: 1 },
    ],
  },
}

type ReportType = 'daily' | 'incidents' | 'compliance' | 'staff'

export default function ReportsPage() {
  const [activeReport, setActiveReport] = useState<ReportType>('daily')
  const [dateRange, setDateRange] = useState('today')

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reports</h1>
          <p className="text-gray-500">Analytics and compliance reports</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="h-10 px-4 rounded-button border border-surface-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="today">Today</option>
            <option value="yesterday">Yesterday</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>
          <Button variant="primary">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <ReportTab
          active={activeReport === 'daily'}
          onClick={() => setActiveReport('daily')}
          icon={<Activity className="h-4 w-4" />}
        >
          Daily Summary
        </ReportTab>
        <ReportTab
          active={activeReport === 'incidents'}
          onClick={() => setActiveReport('incidents')}
          icon={<AlertTriangle className="h-4 w-4" />}
        >
          Incidents
        </ReportTab>
        <ReportTab
          active={activeReport === 'compliance'}
          onClick={() => setActiveReport('compliance')}
          icon={<CheckCircle className="h-4 w-4" />}
        >
          Compliance
        </ReportTab>
        <ReportTab
          active={activeReport === 'staff'}
          onClick={() => setActiveReport('staff')}
          icon={<Users className="h-4 w-4" />}
        >
          Staff Activity
        </ReportTab>
      </div>

      {/* Daily Summary Report */}
      {activeReport === 'daily' && (
        <div className="space-y-6">
          {/* Key Metrics */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <MetricCard
              label="Total Logs"
              value={DEMO_REPORTS.dailySummary.totalLogs}
              change={DEMO_REPORTS.dailySummary.logsChange}
              icon={<Activity className="h-5 w-5 text-primary-500" />}
            />
            <MetricCard
              label="Task Completion"
              value={`${DEMO_REPORTS.dailySummary.taskComplianceRate}%`}
              icon={<CheckCircle className="h-5 w-5 text-care-green" />}
            />
            <MetricCard
              label="Residents Logged"
              value={`${DEMO_REPORTS.dailySummary.residentsWithLogs}/${DEMO_REPORTS.dailySummary.totalResidents}`}
              icon={<Users className="h-5 w-5 text-primary-500" />}
            />
            <MetricCard
              label="Incidents"
              value={DEMO_REPORTS.dailySummary.incidentCount}
              icon={<AlertTriangle className="h-5 w-5 text-care-amber" />}
              variant={DEMO_REPORTS.dailySummary.incidentCount > 0 ? 'warning' : 'default'}
            />
          </div>

          {/* Log Distribution */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Log Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {DEMO_REPORTS.dailySummary.topLogTypes.map((item) => (
                  <div key={item.type} className="flex items-center gap-4">
                    <span className="w-28 text-sm text-gray-600">{item.type}</span>
                    <div className="flex-1 bg-surface-100 rounded-full h-4 overflow-hidden">
                      <div
                        className="h-full bg-primary-500 rounded-full"
                        style={{
                          width: `${(item.count / DEMO_REPORTS.dailySummary.totalLogs) * 100 * 3}%`,
                        }}
                      />
                    </div>
                    <span className="w-12 text-right text-sm font-medium text-gray-700">
                      {item.count}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Staff Performance */}
          <Card padding="md">
            <CardHeader>
              <CardTitle>Staff Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-500 border-b border-surface-100">
                      <th className="pb-3 font-medium">Staff Member</th>
                      <th className="pb-3 font-medium text-center">Logs</th>
                      <th className="pb-3 font-medium text-center">Tasks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-surface-100">
                    {DEMO_REPORTS.dailySummary.staffActivity.map((staff) => (
                      <tr key={staff.name}>
                        <td className="py-3 font-medium text-gray-900">{staff.name}</td>
                        <td className="py-3 text-center">{staff.logs}</td>
                        <td className="py-3 text-center">{staff.tasks}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Incidents Report */}
      {activeReport === 'incidents' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-2 gap-4">
            <Card padding="md">
              <CardHeader>
                <CardTitle>Incidents by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEMO_REPORTS.incidentSummary.byType.map((item) => (
                    <div key={item.type} className="flex items-center justify-between p-3 bg-surface-50 rounded-button">
                      <span className="font-medium text-gray-700">{item.type}</span>
                      <span className="text-lg font-bold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card padding="md">
              <CardHeader>
                <CardTitle>Incidents by Severity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {DEMO_REPORTS.incidentSummary.bySeverity.map((item) => (
                    <div key={item.level} className="flex items-center justify-between p-3 bg-surface-50 rounded-button">
                      <Chip
                        variant={
                          item.level === 'High'
                            ? 'danger'
                            : item.level === 'Medium'
                            ? 'warning'
                            : 'default'
                        }
                      >
                        {item.level}
                      </Chip>
                      <span className="text-lg font-bold text-gray-900">{item.count}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Total Incidents This Period</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-5xl font-bold text-gray-900 mb-2">
                  {DEMO_REPORTS.incidentSummary.total}
                </p>
                <p className="text-gray-500">incidents reported</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Compliance Report */}
      {activeReport === 'compliance' && (
        <div className="space-y-6">
          <Card padding="md">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-care-amber" />
                Compliance Gaps
              </CardTitle>
            </CardHeader>
            <CardContent>
              {DEMO_REPORTS.complianceGaps.length > 0 ? (
                <div className="space-y-4">
                  {DEMO_REPORTS.complianceGaps.map((gap, idx) => (
                    <div key={idx} className="p-4 bg-amber-50 border border-amber-200 rounded-card">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium text-amber-800">{gap.type}</span>
                        <Chip variant="warning" size="sm">{gap.count} residents</Chip>
                      </div>
                      <p className="text-sm text-amber-700">
                        Affected: {gap.residents.join(', ')}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-care-green mx-auto mb-3" />
                  <p className="text-care-green font-medium">Full compliance achieved</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card padding="md">
            <CardHeader>
              <CardTitle>Compliance Rate</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-5xl font-bold text-care-green mb-2">
                  {DEMO_REPORTS.dailySummary.taskComplianceRate}%
                </p>
                <p className="text-gray-500">task completion rate</p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Staff Activity Report */}
      {activeReport === 'staff' && (
        <Card padding="md">
          <CardHeader>
            <CardTitle>Staff Activity Summary</CardTitle>
            <Button variant="secondary" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-sm text-gray-500 border-b border-surface-200">
                    <th className="p-3 font-medium">Staff Member</th>
                    <th className="p-3 font-medium text-center">Total Logs</th>
                    <th className="p-3 font-medium text-center">Tasks Completed</th>
                    <th className="p-3 font-medium text-center">Avg per Resident</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-100">
                  {DEMO_REPORTS.dailySummary.staffActivity.map((staff) => (
                    <tr key={staff.name} className="hover:bg-surface-50">
                      <td className="p-3 font-medium text-gray-900">{staff.name}</td>
                      <td className="p-3 text-center text-lg font-medium">{staff.logs}</td>
                      <td className="p-3 text-center text-lg font-medium text-care-green">{staff.tasks}</td>
                      <td className="p-3 text-center text-gray-600">
                        {(staff.logs / 2).toFixed(1)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function ReportTab({
  children,
  active,
  onClick,
  icon,
}: {
  children: React.ReactNode
  active: boolean
  onClick: () => void
  icon: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-4 py-2 rounded-button text-sm font-medium transition-colors whitespace-nowrap
        ${active
          ? 'bg-primary-600 text-white'
          : 'bg-surface-100 text-gray-700 hover:bg-surface-200'
        }
      `}
    >
      {icon}
      {children}
    </button>
  )
}

function MetricCard({
  label,
  value,
  change,
  icon,
  variant = 'default',
}: {
  label: string
  value: string | number
  change?: number
  icon: React.ReactNode
  variant?: 'default' | 'warning'
}) {
  return (
    <Card
      padding="md"
      className={variant === 'warning' ? 'border-care-amber bg-amber-50' : ''}
    >
      <div className="flex items-center justify-between mb-2">
        {icon}
        {change !== undefined && (
          <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-care-green' : 'text-care-red'}`}>
            <TrendingUp className={`h-4 w-4 ${change < 0 ? 'rotate-180' : ''}`} />
            <span>{change >= 0 ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </Card>
  )
}
