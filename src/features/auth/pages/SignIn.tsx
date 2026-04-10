import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { authService } from "../services/auth.service"
import { toast } from "sonner"
import { Loader2, Lock, Sparkles } from "lucide-react"

export function SignIn() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
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

  return (
    <div className="relative flex min-h-screen flex-col lg:flex-row">
      {/* Brand panel — distinct from a generic “card in the middle” layout */}
      <div className="relative flex flex-1 flex-col justify-between overflow-hidden bg-zinc-950 px-8 py-10 text-white lg:max-w-[46%] lg:px-12 lg:py-14">
        <div
          className="pointer-events-none absolute inset-0 opacity-90"
          aria-hidden
          style={{
            background:
              "radial-gradient(ellipse 120% 80% at 20% -20%, hsl(262 83% 58% / 0.45), transparent 50%), radial-gradient(ellipse 80% 60% at 100% 0%, hsl(199 89% 48% / 0.25), transparent 45%), linear-gradient(165deg, hsl(240 10% 4%) 0%, hsl(224 40% 8%) 100%)",
          }}
        />
        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 ring-1 ring-white/15 backdrop-blur">
            <Sparkles className="h-5 w-5 text-violet-200" aria-hidden />
          </div>
          <div>
            <p className="text-sm font-semibold tracking-tight">AI Minions</p>
            <p className="text-xs text-zinc-400">Admin console</p>
          </div>
        </div>
        <div className="relative z-10 mt-12 max-w-md space-y-4 lg:mt-0">
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Operations dashboard
          </h1>
          <p className="text-sm leading-relaxed text-zinc-400 sm:text-base">
            Sign in with your administrator account.
          </p>
        </div>
        <p className="relative z-10 mt-10 text-xs text-zinc-500 lg:mt-0">
          Restricted access. Activity may be logged.
        </p>
      </div>

      {/* Form */}
      <div className="flex flex-1 items-center justify-center bg-muted/40 px-4 py-12 lg:py-0">
        <div className="w-full max-w-[400px] space-y-8">
          <div className="space-y-2 lg:hidden">
            <h2 className="text-2xl font-semibold tracking-tight">Sign in</h2>
            <p className="text-sm text-muted-foreground">Administrator credentials only.</p>
          </div>
          <div className="hidden space-y-2 lg:block">
            <h2 className="text-2xl font-semibold tracking-tight">Welcome back</h2>
            <p className="text-sm text-muted-foreground">
              Enter your admin email or username and password.
            </p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email or username</Label>
              <Input
                id="email"
                type="text"
                autoComplete="username"
                placeholder="you@company.com"
                className="h-11 rounded-xl border-border/80 bg-background shadow-sm"
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
                className="h-11 rounded-xl border-border/80 bg-background shadow-sm"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-xl text-[15px] font-medium" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                <>
                  <Lock className="mr-2 h-4 w-4 opacity-80" />
                  Sign in
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
