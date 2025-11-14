/**
 * Settings Component for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { updateConfig, getConfig } from '@/config'

export function Settings() {
  const [anthropicApiKey, setAnthropicApiKey] = useState('')
  const [anthropicBaseUrl, setAnthropicBaseUrl] = useState('')
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    // Load current config
    const currentConfig = getConfig()
    setAnthropicApiKey(currentConfig.anthropic.apiKey)
    setAnthropicBaseUrl(currentConfig.anthropic.baseUrl)
  }, [])

  const handleSave = () => {
    try {
      updateConfig({
        anthropic: {
          apiKey: anthropicApiKey,
          baseUrl: anthropicBaseUrl,
        },
      })
      setSaved(true)
      setError('')
      setTimeout(() => setSaved(false), 3000)
    } catch (err: any) {
      setError(err.message || 'Failed to save configuration')
    }
  }

  const handleReset = () => {
    // Reset to default values from environment
    const defaultConfig = {
      anthropic: {
        apiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY || process.env.ANTHROPIC_API_KEY || '',
        baseUrl: process.env.NEXT_PUBLIC_ANTHROPIC_BASE_URL || process.env.ANTHROPIC_BASE_URL || 'https://api.anthropic.com',
      },
    }
    setAnthropicApiKey(defaultConfig.anthropic.apiKey)
    setAnthropicBaseUrl(defaultConfig.anthropic.baseUrl)
    updateConfig(defaultConfig)
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div className="container mx-auto max-w-4xl p-8">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
          <CardDescription>
            Configure application settings. Changes are saved to your browser's local storage.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">
              {error}
            </div>
          )}

          {saved && (
            <div className="p-3 text-sm text-green-600 bg-green-50 rounded-md">
              ✅ Configuration saved successfully!
            </div>
          )}

          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold mb-4">Anthropic API Configuration</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <label htmlFor="anthropic-api-key" className="text-sm font-medium">
                    Anthropic API Key
                  </label>
                  <Input
                    id="anthropic-api-key"
                    type="password"
                    value={anthropicApiKey}
                    onChange={(e) => setAnthropicApiKey(e.target.value)}
                    placeholder="Enter your Anthropic API key"
                  />
                  <p className="text-xs text-muted-foreground">
                    Your API key is stored locally in your browser. It will be used for API calls.
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="anthropic-base-url" className="text-sm font-medium">
                    Anthropic Base URL
                  </label>
                  <Input
                    id="anthropic-base-url"
                    type="text"
                    value={anthropicBaseUrl}
                    onChange={(e) => setAnthropicBaseUrl(e.target.value)}
                    placeholder="https://api.anthropic.com"
                  />
                  <p className="text-xs text-muted-foreground">
                    The base URL for the Anthropic API. Default: https://api.anthropic.com
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-4">
            <Button onClick={handleSave}>
              Save Configuration
            </Button>
            <Button variant="outline" onClick={handleReset}>
              Reset to Defaults
            </Button>
          </div>

          <div className="pt-4 border-t">
            <p className="text-xs text-muted-foreground">
              <strong>Note:</strong> Configuration is stored in your browser's local storage. 
              To use environment variables instead, set NEXT_PUBLIC_ANTHROPIC_API_KEY and 
              NEXT_PUBLIC_ANTHROPIC_BASE_URL in your .env.local file.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

