/**
 * Code Review Component for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { api } from '@/lib/api'

export function CodeReview() {
  const [repoPath, setRepoPath] = useState('')
  const [query, setQuery] = useState('Review this codebase for security vulnerabilities')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await api.codeReview(repoPath, query)
      setResult(response)
    } catch (err: any) {
      setError(err.message || 'Failed to perform code review')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Code Review</CardTitle>
          <CardDescription>
            Run security code reviews on uploaded repositories
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="repoPath" className="text-sm font-medium mb-2 block">
                Repository Path
              </label>
              <Input
                id="repoPath"
                type="text"
                placeholder="/path/to/repository"
                value={repoPath}
                onChange={(e) => setRepoPath(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="query" className="text-sm font-medium mb-2 block">
                Review Query
              </label>
              <Textarea
                id="query"
                placeholder="Enter your review query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Running Review...' : 'Run Code Review'}
            </Button>
          </form>
        </CardContent>
      </Card>

      {error && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-destructive">{error}</div>
          </CardContent>
        </Card>
      )}

      {result && (
        <Card>
          <CardHeader>
            <CardTitle>Review Results</CardTitle>
            <CardDescription>Code review completed successfully</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Status:</p>
                <p className="text-sm text-muted-foreground">{result.status}</p>
              </div>
              {result.reportPath && (
                <div>
                  <p className="text-sm font-medium mb-2">Report Path:</p>
                  <p className="text-sm text-muted-foreground">{result.reportPath}</p>
                </div>
              )}
              {result.reportContent && (
                <div>
                  <p className="text-sm font-medium mb-2">Report Preview:</p>
                  <div className="bg-muted p-4 rounded-md max-h-96 overflow-auto">
                    <pre className="text-sm whitespace-pre-wrap">{result.reportContent}</pre>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

