"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { CheckCircle, AlertTriangle, Save, Loader2 } from "lucide-react"
import { useAdminAuth } from "@/lib/admin-auth"
import { useRouter } from "next/navigation"

interface Settings {
  siteName: string
  siteDescription: string
  contactEmail: string
  maintenanceMode: boolean
  allowRegistration: boolean
  emailNotifications: boolean
  userRegistrationAlerts: boolean
  certificateIssuedAlerts: boolean
  sessionTimeout: number
  requireTwoFactor: boolean
  ipRestriction: boolean
}

export default function SettingsPage() {
  const { isAdmin, isLoading: adminLoading, idToken } = useAdminAuth()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [success, setSuccess] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [settings, setSettings] = useState<Settings>({
    siteName: "Cyber Safe Girl",
    siteDescription: "Empowering women with cybersecurity knowledge",
    contactEmail: "contact@cybersafegirl.com",
    maintenanceMode: false,
    allowRegistration: true,
    emailNotifications: true,
    userRegistrationAlerts: true,
    certificateIssuedAlerts: true,
    sessionTimeout: 60,
    requireTwoFactor: false,
    ipRestriction: false
  })

  // Fetch settings when component mounts
  useEffect(() => {
    if (!adminLoading && !isAdmin) {
      router.push("/admin/login")
    } else if (!adminLoading && isAdmin && idToken) {
      fetchSettings()
    }
  }, [adminLoading, isAdmin, idToken, router])

  const fetchSettings = async () => {
    setLoading(true)
    setError(null)

    try {
      // Use only idToken from context for server components
      const token = idToken;
      
      if (!token) {
        console.warn("Authentication token not available, skipping fetch")
        setLoading(false)
        return
      }
      
      const response = await fetch("/api/admin/settings", {
        headers: {
          Authorization: `Bearer ${token}`,
          'x-firebase-auth-token': token // Add custom header as fallback
        }
      })
      
      if (!response.ok) {
        if (response.status === 401) {
          router.push("/admin/login")
          return
        }
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      if (data.settings) {
        setSettings(data.settings)
      }
    } catch (err: any) {
      console.error("Failed to fetch settings:", err)
      setError(err.message || "Failed to fetch settings")
    } finally {
      setLoading(false)
    }
  }

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setSuccess(null)
    setError(null)

    try {
      // Use only idToken from context for server components
      const token = idToken;
      
      if (!token) {
        throw new Error("Not authenticated")
      }
      
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
          "x-firebase-auth-token": token
        },
        body: JSON.stringify(settings)
      })
      
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to save settings")
      }
      
      setSuccess("Settings saved successfully")
    } catch (err: any) {
      console.error("Failed to save settings:", err)
      setError(err.message || "Failed to save settings")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
        <span>Loading settings...</span>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      {success && (
        <Alert className="bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-900">
          <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
          <AlertTitle className="text-green-600 dark:text-green-400">Success</AlertTitle>
          <AlertDescription className="text-green-600 dark:text-green-400">{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs defaultValue="general">
        <TabsList>
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your application's general settings</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="siteName">Site Name</Label>
                    <Input 
                      id="siteName" 
                      value={settings.siteName}
                      onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="siteDescription">Site Description</Label>
                    <Input 
                      id="siteDescription" 
                      value={settings.siteDescription}
                      onChange={(e) => setSettings({...settings, siteDescription: e.target.value})}
                    />
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input 
                      id="contactEmail" 
                      type="email" 
                      value={settings.contactEmail}
                      onChange={(e) => setSettings({...settings, contactEmail: e.target.value})}
                    />
                  </div>

                  <Separator />

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="maintenance" className="font-medium">
                        Maintenance Mode
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, the site will display a maintenance message to all users.
                      </p>
                    </div>
                    <Switch 
                      id="maintenance" 
                      checked={settings.maintenanceMode}
                      onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="registration" className="font-medium">
                        Allow Registration
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        When enabled, new users can register for an account.
                      </p>
                    </div>
                    <Switch 
                      id="registration" 
                      checked={settings.allowRegistration}
                      onCheckedChange={(checked) => setSettings({...settings, allowRegistration: checked})}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Manage your notification preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="emailNotifications" className="font-medium">
                        Email Notifications
                      </Label>
                      <p className="text-sm text-muted-foreground">Receive email notifications for important events.</p>
                    </div>
                    <Switch 
                      id="emailNotifications" 
                      checked={settings.emailNotifications}
                      onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="userRegistration" className="font-medium">
                        User Registration Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">Get notified when a new user registers.</p>
                    </div>
                    <Switch 
                      id="userRegistration" 
                      checked={settings.userRegistrationAlerts}
                      onCheckedChange={(checked) => setSettings({...settings, userRegistrationAlerts: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="certificateIssued" className="font-medium">
                        Certificate Issuance Alerts
                      </Label>
                      <p className="text-sm text-muted-foreground">Get notified when a certificate is issued.</p>
                    </div>
                    <Switch 
                      id="certificateIssued" 
                      checked={settings.certificateIssuedAlerts}
                      onCheckedChange={(checked) => setSettings({...settings, certificateIssuedAlerts: checked})}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your security preferences</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveSettings} className="space-y-6">
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Input 
                      id="sessionTimeout" 
                      type="number" 
                      value={settings.sessionTimeout}
                      onChange={(e) => {
                        const value = parseInt(e.target.value);
                        setSettings({...settings, sessionTimeout: isNaN(value) ? 60 : value});
                      }}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="twoFactor" className="font-medium">
                        Require Two-Factor Authentication
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Require administrators to use two-factor authentication.
                      </p>
                    </div>
                    <Switch 
                      id="twoFactor" 
                      checked={settings.requireTwoFactor}
                      onCheckedChange={(checked) => setSettings({...settings, requireTwoFactor: checked})}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label htmlFor="ipRestriction" className="font-medium">
                        IP Restriction
                      </Label>
                      <p className="text-sm text-muted-foreground">Restrict admin access to specific IP addresses.</p>
                    </div>
                    <Switch 
                      id="ipRestriction" 
                      checked={settings.ipRestriction}
                      onCheckedChange={(checked) => setSettings({...settings, ipRestriction: checked})}
                    />
                  </div>
                </div>

                <Button type="submit" disabled={saving}>
                  {saving ? (
                    <>Saving...</>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Settings
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}