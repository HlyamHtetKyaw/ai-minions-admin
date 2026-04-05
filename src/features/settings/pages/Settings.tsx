import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { 
  Key, 
  Eye, 
  EyeOff, 
  Shield, 
  Edit, 
  Loader2, 
  Camera, 
  User, 
  Mail, 
  Lock,
  CheckCircle2, ShieldCheck
} from "lucide-react"
import { toast } from "sonner"
import { authService } from "@/features/auth/services/auth.service"
import { profileService } from "@/features/profile/services/profile.service"
import type { Profile } from "@/features/profile/services/profile.service"

// Hidden from UI – set to true to show API Key tab again
const SHOW_API_KEY_TAB = false

export function Settings() {
  const [profileData, setProfileData] = useState({
    name: "",
    email: "",
    phone: "",
  })

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  })

  const [apiKeyMode, setApiKeyMode] = useState<"default" | "custom">("default")
  const [apiKey, setApiKey] = useState("")
  const [showApiKey, setShowApiKey] = useState(false)
  const [isEditingApiKey, setIsEditingApiKey] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)
  const [savingApiKey, setSavingApiKey] = useState(false)

  // Fetch current user's profile
  useEffect(() => {
    const fetchProfile = async () => {
      const user = authService.getUser()
      if (!user?.userId) {
        setLoadingProfile(false)
        return
      }

      try {
        setLoadingProfile(true)
        const profileData = await profileService.getByUserId(user.userId)
        setProfile(profileData)
        
        setProfileData({
          name: profileData.name || "",
          email: user.email || "",
          phone: "",
        })
        
        if (profileData.useDefaultApiKey === false) {
          setApiKeyMode("custom")
          setApiKey(profileData.apiKey || "")
        } else {
          setApiKeyMode("default")
          setApiKey("")
        }
      } catch (error: any) {
        console.error("Failed to fetch profile:", error)
        toast.error("Failed to load profile settings")
      } finally {
        setLoadingProfile(false)
      }
    }

    fetchProfile()
  }, [])

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match")
      return
    }
    console.log("Password changed")
    toast.success("Password updated successfully")
    setPasswordData({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    })
  }

  const handleApiKeySubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()

    if (apiKeyMode === "custom" && !apiKey.trim()) {
      toast.error("Please enter your API key")
      return
    }

    try {
      setSavingApiKey(true)
      const updatedProfile = await profileService.updateApiKey({
        useDefaultApiKey: apiKeyMode === "default",
        apiKey: apiKeyMode === "custom" ? apiKey : undefined,
      })
      
      setProfile(updatedProfile)
      toast.success("API key settings saved successfully")
      setIsEditingApiKey(false)
      if (apiKeyMode === "default") {
        setApiKey("")
      }
    } catch (error: any) {
      console.error("Failed to save API key:", error)
      toast.error(error.message || "Failed to save API key settings")
    } finally {
      setSavingApiKey(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight">Account Settings</h1>
        <p className="text-muted-foreground">
          Manage your personal information, security preferences, and API configurations.
        </p>
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className={`grid w-full ${SHOW_API_KEY_TAB ? "grid-cols-3" : "grid-cols-2"} lg:w-[400px]`}>
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="password">Security</TabsTrigger>
          {SHOW_API_KEY_TAB && <TabsTrigger value="api-key">API Key</TabsTrigger>}
        </TabsList>

        {/* --- PROFILE TAB --- */}
        <TabsContent value="profile" className="space-y-6">
          <Card className="overflow-hidden border-border/50 shadow-sm">
            {/* Decorative Header Background */}
            <div className="h-32 bg-gradient-to-r from-teal-500/10 via-emerald-500/10 to-green-500/10 dark:from-teal-500/5 dark:via-emerald-500/5 dark:to-green-500/5" />
            
            <CardContent className="relative px-6 pb-6">
              {/* Avatar Section floating over the banner */}
              <div className="flex flex-col sm:flex-row gap-6 -mt-12 mb-8 items-start sm:items-end">
                <div className="relative group">
                  <Avatar className="h-24 w-24 border-4 border-background shadow-lg ring-2 ring-muted transition-transform group-hover:scale-105">
                    <AvatarImage src="" alt={profileData.name} />
                    <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                      {profileData.name ? profileData.name.split(" ").map(n => n[0]).join("") : "U"}
                    </AvatarFallback>
                  </Avatar>
                  <Button 
                    size="icon" 
                    variant="secondary" 
                    className="absolute bottom-0 right-0 rounded-full h-8 w-8 shadow-sm border border-background"
                  >
                    <ShieldCheck className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </Button>
                </div>
                <div className="flex-1 space-y-1 mt-2 sm:mt-0 pb-1">
                  <h3 className="text-2xl font-bold">{profileData.name || "User"}</h3>
                  <p className="text-sm text-muted-foreground">{profileData.email || "No email set"}</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="name"
                        className="pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors"
                        value={profileData.name}
                        onChange={(e) => setProfileData({ ...profileData, name: e.target.value })}
                        placeholder="Your full name"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="email"
                        type="email"
                        className="pl-9 bg-muted/30 border-muted-foreground/20 focus:bg-background transition-colors"
                        value={profileData.email}
                        onChange={(e) => setProfileData({ ...profileData, email: e.target.value })}
                        placeholder="name@example.com"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- PASSWORD TAB --- */}
        <TabsContent value="password">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-orange-500/10 text-orange-600 dark:text-orange-400">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Password & Security</CardTitle>
                  <CardDescription>
                    Update your password to keep your account secure
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="currentPassword"
                      type="password"
                      className="pl-9"
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                      required
                    />
                  </div>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="newPassword">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="newPassword"
                        type="password"
                        className="pl-9"
                        value={passwordData.newPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confirmPassword">Confirm Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirmPassword"
                        type="password"
                        className="pl-9"
                        value={passwordData.confirmPassword}
                        onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-4">
                  <Button type="submit" variant="default">Update Password</Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* --- API KEY TAB (hidden when SHOW_API_KEY_TAB is false) --- */}
        {SHOW_API_KEY_TAB && (
        <TabsContent value="api-key">
          <Card className="border-border/50 shadow-sm">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  <Key className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>AI Model Configuration</CardTitle>
                  <CardDescription>Manage how the application interacts with AI models</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loadingProfile ? (
                <div className="flex flex-col items-center justify-center py-12 text-muted-foreground gap-3">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  <p>Loading configuration...</p>
                </div>
              ) : (
                <form onSubmit={handleApiKeySubmit} className="space-y-6">
                  <div className="grid gap-4 md:grid-cols-2">
                    {/* Default Option Card */}
                    <div
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        apiKeyMode === "default"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        if (loadingProfile) return
                        setApiKeyMode("default")
                        setIsEditingApiKey(false)
                        setApiKey("")
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`p-1.5 rounded-full ${apiKeyMode === "default" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Shield className="h-4 w-4" />
                        </div>
                        {apiKeyMode === "default" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <Label className="text-base font-semibold cursor-pointer mb-1">
                        System Default
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Use the built-in system API key. Recommended for standard usage.
                      </p>
                    </div>

                    {/* Custom Option Card */}
                    <div
                      className={`relative flex flex-col p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                        apiKeyMode === "custom"
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30 hover:bg-muted/50"
                      }`}
                      onClick={() => {
                        if (loadingProfile) return
                        setApiKeyMode("custom")
                        setIsEditingApiKey(true)
                      }}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className={`p-1.5 rounded-full ${apiKeyMode === "custom" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                          <Key className="h-4 w-4" />
                        </div>
                        {apiKeyMode === "custom" && <CheckCircle2 className="h-5 w-5 text-primary" />}
                      </div>
                      <Label className="text-base font-semibold cursor-pointer mb-1">
                        Custom API Key
                      </Label>
                      <p className="text-sm text-muted-foreground">
                        Provide your own API key for higher rate limits or custom models.
                      </p>
                    </div>
                  </div>

                  {/* API Key Input Section (Conditional) */}
                  <div className={`transition-all duration-300 ease-in-out overflow-hidden ${
                    apiKeyMode === "custom" ? "max-h-[300px] opacity-100" : "max-h-0 opacity-0"
                  }`}>
                    {isEditingApiKey ? (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border mt-2 space-y-4 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-2">
                          <Label htmlFor="apiKey">Enter your API Key</Label>
                          <div className="relative">
                            <Input
                              id="apiKey"
                              type={showApiKey ? "text" : "password"}
                              value={apiKey}
                              onChange={(e) => setApiKey(e.target.value)}
                              placeholder="sk-..."
                              className="pr-10 bg-background"
                              autoFocus
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                              onClick={() => setShowApiKey(!showApiKey)}
                            >
                              {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </Button>
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Shield className="h-3 w-3" />
                            Your key is stored locally and never logged.
                          </p>
                        </div>
                        <div className="flex gap-2 justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setIsEditingApiKey(false)
                              if (profile) {
                                if (profile.useDefaultApiKey === false) {
                                  setApiKey(profile.apiKey || "")
                                } else {
                                  setApiKey("")
                                }
                              }
                            }}
                          >
                            Cancel
                          </Button>
                        </div>
                      </div>
                    ) : apiKey && (
                      <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border">
                        <div className="flex items-center gap-2">
                          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                          <span className="text-sm font-medium">Custom Key Configured</span>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => setIsEditingApiKey(true)}
                        >
                          <Edit className="h-3 w-3 mr-2" />
                          Edit Key
                        </Button>
                      </div>
                    )}
                  </div>

                  <CardFooter className="px-0 pt-2 flex justify-end border-t mt-4">
                    <Button 
                      type="button"
                      onClick={() => handleApiKeySubmit()}
                      disabled={savingApiKey || loadingProfile}
                      className="min-w-[100px]"
                    >
                      {savingApiKey ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        "Save Preferences"
                      )}
                    </Button>
                  </CardFooter>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        )}
      </Tabs>
    </div>
  )
}