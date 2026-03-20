"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Separator } from "@/components/ui/separator"
import { User, Bell, Shield, Palette, LogOut, Heart, Calendar, MessageCircle, Loader2 } from "lucide-react"
import BottomNav from "@/components/BottomNav"
import { authClient, useSession } from "@/lib/auth-client"
import { toast } from "sonner"

export default function ProfilePage() {
  const { data: session, isPending, refetch } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState(true)
  const [darkMode, setDarkMode] = useState(false)

  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login")
    }
  }, [session, isPending, router])

  const handleSignOut = async () => {
    const { error } = await authClient.signOut()
    if (error?.code) {
      toast.error("Failed to sign out. Please try again.")
    } else {
      localStorage.removeItem("bearer_token")
      refetch()
      toast.success("Signed out successfully")
      router.push("/")
    }
  }

  const stats = [
    { label: "Chat Sessions", value: "47", icon: MessageCircle },
    { label: "Community Posts", value: "12", icon: Heart },
    { label: "Appointments", value: "8", icon: Calendar },
  ]

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <>
      <div className="min-h-screen pb-24">
        {/* Header */}
        <header className="sticky top-0 z-10 border-b bg-white/80 backdrop-blur-xl dark:bg-black/80">
          <div className="mx-auto max-w-4xl px-4 py-4">
            <h1 className="text-2xl font-bold">Profile & Settings</h1>
            <p className="text-sm text-muted-foreground">Manage your account and preferences</p>
          </div>
        </header>

        <div className="mx-auto max-w-4xl px-4 py-6">
          {/* Profile Header */}
          <Card className="mb-6 rounded-3xl p-6">
            <div className="flex flex-col items-center gap-4 sm:flex-row">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-blue-400" />
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-2xl font-bold">{session.user.name}</h2>
                <p className="text-muted-foreground">{session.user.email}</p>
                <div className="mt-2 flex flex-wrap justify-center gap-2 sm:justify-start">
                  <Button variant="outline" size="sm" className="rounded-full">
                    Edit Profile
                  </Button>
                  <Button variant="outline" size="sm" className="rounded-full">
                    Change Avatar
                  </Button>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            <div className="grid gap-4 sm:grid-cols-3">
              {stats.map((stat, index) => {
                const Icon = stat.icon
                return (
                  <div key={index} className="text-center">
                    <div className="mb-2 inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </div>
                )
              })}
            </div>
          </Card>

          {/* Settings Tabs */}
          <Tabs defaultValue="account" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4 rounded-2xl">
              <TabsTrigger value="account" className="rounded-xl">
                Account
              </TabsTrigger>
              <TabsTrigger value="notifications" className="rounded-xl">
                Notifications
              </TabsTrigger>
              <TabsTrigger value="privacy" className="rounded-xl">
                Privacy
              </TabsTrigger>
              <TabsTrigger value="appearance" className="rounded-xl">
                Appearance
              </TabsTrigger>
            </TabsList>

            <TabsContent value="account" className="space-y-4">
              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <User className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Account Information</h3>
                </div>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Display Name</Label>
                    <Input id="name" placeholder={session.user.name} className="rounded-2xl" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      placeholder={session.user.email}
                      className="rounded-2xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      className="rounded-2xl"
                    />
                  </div>
                  <Button className="w-full rounded-full">Save Changes</Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4">
              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Bell className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Notification Preferences</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Push Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Receive notifications about your activity
                      </p>
                    </div>
                    <Switch checked={notifications} onCheckedChange={setNotifications} />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Email Notifications</p>
                      <p className="text-sm text-muted-foreground">
                        Get updates via email
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Appointment Reminders</p>
                      <p className="text-sm text-muted-foreground">
                        Reminders before scheduled sessions
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Community Updates</p>
                      <p className="text-sm text-muted-foreground">
                        New posts and replies to your content
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="privacy" className="space-y-4">
              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Privacy & Security</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Anonymous Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Hide your identity in community posts
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Share Activity Status</p>
                      <p className="text-sm text-muted-foreground">
                        Let others see when you're active
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Data Encryption</p>
                      <p className="text-sm text-muted-foreground">
                        End-to-end encryption for all conversations
                      </p>
                    </div>
                    <Switch defaultChecked disabled />
                  </div>
                  <Separator />
                  <Button variant="outline" className="w-full rounded-full">
                    Download My Data
                  </Button>
                  <Button variant="outline" className="w-full rounded-full text-destructive">
                    Delete Account
                  </Button>
                </div>
              </Card>
            </TabsContent>

            <TabsContent value="appearance" className="space-y-4">
              <Card className="rounded-3xl p-6">
                <div className="mb-4 flex items-center gap-2">
                  <Palette className="h-5 w-5 text-primary" />
                  <h3 className="text-lg font-semibold">Appearance</h3>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Dark Mode</p>
                      <p className="text-sm text-muted-foreground">
                        Switch between light and dark themes
                      </p>
                    </div>
                    <Switch checked={darkMode} onCheckedChange={setDarkMode} />
                  </div>
                  <Separator />
                  <div>
                    <Label className="mb-2 block">Theme Color</Label>
                    <div className="flex gap-2">
                      <button className="h-10 w-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 ring-2 ring-primary ring-offset-2" />
                      <button className="h-10 w-10 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500" />
                      <button className="h-10 w-10 rounded-full bg-gradient-to-br from-green-500 to-emerald-500" />
                      <button className="h-10 w-10 rounded-full bg-gradient-to-br from-orange-500 to-red-500" />
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Reduce Motion</p>
                      <p className="text-sm text-muted-foreground">
                        Minimize animations and transitions
                      </p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Logout Button */}
          <Card className="mt-6 rounded-3xl p-6">
            <Button onClick={handleSignOut} variant="destructive" className="w-full rounded-full">
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>
          </Card>
        </div>
      </div>
      <BottomNav />
    </>
  )
}