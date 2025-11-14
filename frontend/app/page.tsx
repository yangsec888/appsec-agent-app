/**
 * Main Dashboard Page for AppSec Agent Dashboard
 * 
 * Author: Sam Li
 */

'use client'

import { useState } from 'react'
import { CodeReview } from '@/components/CodeReview'
import { ThreatModeling } from '@/components/ThreatModeling'
import { ChatInterface } from '@/components/ChatInterface'
import { Settings } from '@/components/Settings'
import { AuthGuard } from '@/components/AuthGuard'
import { ChangePasswordDialog } from '@/components/ChangePasswordDialog'
import { useAuth } from '@/contexts/AuthContext'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'

export default function Home() {
  return (
    <AuthGuard>
      <Dashboard />
    </AuthGuard>
  )
}

function Dashboard() {
  const { user, logout, needsPasswordChange } = useAuth();
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);

  return (
    <main className="min-h-screen bg-background">
      {needsPasswordChange && !showPasswordDialog && (
        <div className="bg-yellow-50 border-b border-yellow-200 p-4">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-yellow-600 font-semibold">⚠️ Security Reminder</span>
                <span className="text-yellow-700 text-sm">
                  You are using the default password. Please change it immediately for security.
                </span>
              </div>
              <Button 
                variant="default" 
                size="sm" 
                onClick={() => setShowPasswordDialog(true)}
                className="bg-yellow-600 hover:bg-yellow-700"
              >
                Change Password
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {showPasswordDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <ChangePasswordDialog 
            onClose={() => setShowPasswordDialog(false)}
            showCloseButton={true}
          />
        </div>
      )}

      <Tabs defaultValue="chat" className="w-full h-screen flex flex-col">
        <div className="border-b">
          <div className="container mx-auto max-w-7xl px-4">
            <div className="flex items-center justify-between h-14">
              <TabsList className="h-14 bg-transparent border-0">
                <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Chat Interface
                </TabsTrigger>
                <TabsTrigger value="threat-modeling" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Threat Modeling
                </TabsTrigger>
                <TabsTrigger value="code-review" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Code Review
                </TabsTrigger>
                <TabsTrigger value="settings" className="data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Settings
                </TabsTrigger>
              </TabsList>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {user?.username}
                </span>
                <Button variant="outline" size="sm" onClick={logout}>
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </div>

        <TabsContent value="chat" className="flex-1 m-0 p-0">
          <ChatInterface />
        </TabsContent>

        <TabsContent value="threat-modeling" className="flex-1 m-0 p-0 overflow-auto">
          <div className="container mx-auto max-w-7xl p-8">
            <ThreatModeling />
          </div>
        </TabsContent>

        <TabsContent value="code-review" className="flex-1 m-0 p-0 overflow-auto">
          <div className="container mx-auto max-w-7xl p-8">
            <CodeReview />
          </div>
        </TabsContent>

        <TabsContent value="settings" className="flex-1 m-0 p-0 overflow-auto">
          <Settings />
        </TabsContent>
      </Tabs>
    </main>
  )
}

