import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { authService } from "../services/auth.service"
import { toast } from "sonner"
import { KeyRound, Loader2, Lock } from "lucide-react"

export function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [accessCode, setAccessCode] = useState("")
  const [loading, setLoading] = useState(false)

  async function finishSession(token: string, refreshToken?: string) {
    authService.setToken(token)
    if (refreshToken) {
      authService.setRefreshToken(refreshToken)
    }
    const me = await authService.fetchMe()
    authService.setUser({
      email: me.email,
      userId: me.userId,
      role: me.role,
    })
    toast.success("Login successful!")
    window.location.href = "/dashboard"
  }

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, refreshToken } = await authService.login({
        usernameOrEmail: email,
        password,
      })
      await finishSession(token, refreshToken)
    } catch (error: unknown) {
      authService.logout()
      toast.error(
        error instanceof Error ? error.message : "Login failed. Please check your credentials.",
      )
      setLoading(false)
    }
  }

  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    try {
      const { token, refreshToken } = await authService.loginWithCode({
        code: accessCode,
      })
      await finishSession(token, refreshToken)
    } catch (error: unknown) {
      authService.logout()
      toast.error(
        error instanceof Error ? error.message : "Invalid access code.",
      )
      setLoading(false)
    }
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-muted/50 via-background to-muted/30 p-4">
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-primary/5 via-transparent to-transparent"
        aria-hidden
      />
      <Card className="relative w-full max-w-md border-border/80 shadow-lg shadow-black/5 dark:shadow-black/20">
        <CardHeader className="space-y-1 pb-2">
          <CardTitle className="text-2xl font-bold tracking-tight">
            AI Minions Admin
          </CardTitle>
          <CardDescription>
            Sign in with your admin credentials, or use an access code if your account was
            provisioned with one.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="password" className="w-full">
            <TabsList className="mb-6 grid w-full grid-cols-2 gap-1 rounded-lg bg-muted/80 p-1">
              <TabsTrigger
                value="password"
                className="gap-2 data-[state=active]:ring-1 data-[state=active]:ring-ring/40"
              >
                <Lock className="h-3.5 w-3.5 opacity-70" />
                Password
              </TabsTrigger>
              <TabsTrigger
                value="code"
                className="gap-2 data-[state=active]:ring-1 data-[state=active]:ring-ring/40"
              >
                <KeyRound className="h-3.5 w-3.5 opacity-70" />
                Access code
              </TabsTrigger>
            </TabsList>

            <TabsContent value="password" className="mt-0 outline-none">
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email or username</Label>
                  <Input
                    id="email"
                    type="text"
                    autoComplete="username"
                    placeholder="admin@example.com or admin"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign in"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="code" className="mt-0 outline-none">
              <form onSubmit={handleCodeSubmit} className="space-y-4">
                <div className="flex justify-center pb-1">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-muted">
                    <KeyRound className="h-6 w-6 text-primary opacity-90" />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="accessCode">Access code</Label>
                  <Input
                    id="accessCode"
                    type="text"
                    autoComplete="one-time-code"
                    spellCheck={false}
                    placeholder="Enter your code"
                    className="text-center font-mono tracking-widest"
                    value={accessCode}
                    onChange={(e) => setAccessCode(e.target.value)}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Use the login code from user provisioning. Admin access still requires an ADMIN
                    account.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Verifying...
                    </>
                  ) : (
                    "Continue with code"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
