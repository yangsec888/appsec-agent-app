/**
 * Threat Modeling Component for AppSec Agent Dashboard
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

interface ThreatModelingResult {
  status: string;
  reportPath?: string;
  reportContent?: string;
}

export function ThreatModeling() {
  const [repoPath, setRepoPath] = useState('')
  const [query, setQuery] = useState('Perform threat modeling analysis')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ThreatModelingResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await api.threatModeling(repoPath, query)
      setResult(response)
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Failed to perform threat modeling');
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Threat Modeling</CardTitle>
          <CardDescription>
            View threat modeling reports for your applications
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
                Analysis Query
              </label>
              <Textarea
                id="query"
                placeholder="Enter your threat modeling query..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                rows={4}
              />
            </div>
            <Button type="submit" disabled={loading}>
              {loading ? 'Running Analysis...' : 'Run Threat Modeling'}
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
            <CardTitle>Threat Modeling Results</CardTitle>
            <CardDescription>Analysis completed successfully</CardDescription>
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

