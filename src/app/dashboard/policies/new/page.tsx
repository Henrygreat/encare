'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeft, FileText, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { usePolicyActions } from '@/lib/hooks'

export default function NewPolicyPage() {
  const router = useRouter()
  const { createPolicy, isLoading } = usePolicyActions()

  const [title, setTitle] = useState('')
  const [summary, setSummary] = useState('')
  const [content, setContent] = useState('')
  const [fileUrl, setFileUrl] = useState('')
  const [fileName, setFileName] = useState('')
  const [requiresAcknowledgement, setRequiresAcknowledgement] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent, publish: boolean) => {
    e.preventDefault()
    setError(null)

    if (!title.trim()) {
      setError('Title is required')
      return
    }

    if (!content.trim() && !fileUrl.trim()) {
      setError('Either policy content or a file URL is required')
      return
    }

    try {
      const policy = await createPolicy({
        title: title.trim(),
        summary: summary.trim() || null,
        content: content.trim() || null,
        file_url: fileUrl.trim() || null,
        file_name: fileName.trim() || null,
        requires_acknowledgement: requiresAcknowledgement,
        status: publish ? 'published' : 'draft',
        published_at: publish ? new Date().toISOString() : null,
      })

      router.push(`/dashboard/policies/${policy.id}`)
    } catch (err) {
      console.error('Error creating policy:', err)
      setError(err instanceof Error ? err.message : 'Failed to create policy')
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/policies"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition-colors hover:bg-slate-200"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Create Policy</h1>
          <p className="text-slate-600">Add a new company policy</p>
        </div>
      </div>

      <form onSubmit={(e) => handleSubmit(e, false)}>
        {error && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Policy Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input
              label="Title"
              placeholder="e.g., Health and Safety Policy"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              disabled={isLoading}
            />

            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Summary
              </label>
              <textarea
                placeholder="Brief description of the policy..."
                value={summary}
                onChange={(e) => setSummary(e.target.value)}
                disabled={isLoading}
                rows={2}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50 disabled:text-slate-500"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Policy Content
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-slate-700">
                Content
              </label>
              <textarea
                placeholder="Enter the full policy text here..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                disabled={isLoading}
                rows={10}
                className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 font-mono text-sm text-slate-900 placeholder:text-slate-400 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 disabled:bg-slate-50 disabled:text-slate-500"
              />
              <p className="mt-1.5 text-xs text-slate-500">
                You can paste the policy text directly, or attach a file below
              </p>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-2 text-slate-500">or attach a file</span>
              </div>
            </div>

            <Input
              label="File URL"
              placeholder="https://..."
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              disabled={isLoading}
              icon={<LinkIcon className="h-4 w-4" />}
            />

            <Input
              label="File Name (optional)"
              placeholder="e.g., health-safety-policy.pdf"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              disabled={isLoading}
            />
          </CardContent>
        </Card>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
          </CardHeader>
          <CardContent>
            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={requiresAcknowledgement}
                onChange={(e) => setRequiresAcknowledgement(e.target.checked)}
                disabled={isLoading}
                className="h-5 w-5 rounded border-slate-300 text-primary-600 focus:ring-primary-500"
              />
              <div>
                <span className="font-medium text-slate-900">
                  Require acknowledgement
                </span>
                <p className="text-sm text-slate-500">
                  Staff must confirm they have read and understood this policy
                </p>
              </div>
            </label>
          </CardContent>
        </Card>

        <div className="mt-6 flex justify-end gap-3">
          <Link href="/dashboard/policies">
            <Button variant="ghost" type="button" disabled={isLoading}>
              Cancel
            </Button>
          </Link>
          <Button
            type="submit"
            variant="secondary"
            disabled={isLoading}
            isLoading={isLoading}
          >
            Save as Draft
          </Button>
          <Button
            type="button"
            onClick={(e) => handleSubmit(e, true)}
            disabled={isLoading}
            isLoading={isLoading}
          >
            Publish
          </Button>
        </div>
      </form>
    </div>
  )
}
