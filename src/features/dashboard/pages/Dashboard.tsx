import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Users,
  UserCog,
  Key,
  Settings,
  ArrowRight,
  RefreshCw,
  FileText,
  Sparkles,
} from "lucide-react"
import { dashboardService, DashboardStats } from "../services/dashboard.service"
import { authService } from "@/features/auth/services/auth.service"
import { cn } from "@/lib/utils"

const statTiles = [
  {
    title: "Total users",
    description: "Registered accounts",
    icon: Users,
    key: "totalUsers" as const,
    className:
      "from-violet-500/[0.12] via-transparent to-transparent ring-violet-500/20 dark:from-violet-400/15",
    iconClass: "bg-violet-500/15 text-violet-600 dark:text-violet-300",
  },
  {
    title: "Member levels",
    description: "Configured tiers",
    icon: UserCog,
    key: "memberLevels" as const,
    className:
      "from-emerald-500/[0.12] via-transparent to-transparent ring-emerald-500/20 dark:from-emerald-400/15",
    iconClass: "bg-emerald-500/15 text-emerald-600 dark:text-emerald-300",
  },
  // Hidden from UI – set hidden: false to show again
  {
    title: "Voice notes",
    description: "Stored notes",
    icon: FileText,
    key: "voiceNotes" as const,
    className: "",
    iconClass: "",
    hidden: true,
  },
] as const

const shortcuts = [
  {
    title: "Users",
    description: "Search and manage accounts",
    href: "/users",
    icon: Users,
  },
  {
    title: "Member levels",
    description: "Tiers and entitlements",
    href: "/member-levels",
    icon: UserCog,
  },
  {
    title: "Level codes",
    description: "Provision access codes",
    href: "/member-level-codes",
    icon: Key,
  },
  {
    title: "Settings",
    description: "Workspace preferences",
    href: "/settings",
    icon: Settings,
  },
] as const

export function Dashboard() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)

  const fetchStats = useCallback(async () => {
    try {
      setIsLoading(true)
      setError(null)
      const data = await dashboardService.getStats()
      setStats(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load dashboard stats")
      console.error("Failed to fetch dashboard stats:", err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    setUserEmail(authService.getUser()?.email ?? null)
    void fetchStats()
  }, [fetchStats])

  const greetingName = userEmail?.split("@")[0] || "there"

  return (
    <div className="space-y-10">
      {/* Hero */}
      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card p-6 shadow-sm sm:p-8">
        <div
          className="pointer-events-none absolute -right-24 -top-24 h-64 w-64 rounded-full bg-sidebar-accent/20 blur-3xl"
          aria-hidden
        />
        <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="secondary" className="rounded-lg px-2.5 font-medium">
                <Sparkles className="mr-1.5 h-3 w-3" aria-hidden />
                Overview
              </Badge>
              <span className="text-xs text-muted-foreground">Live counts from the API</span>
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
                Hi, {greetingName}
              </h1>
              <p className="mt-1 max-w-xl text-sm text-muted-foreground sm:text-base">
                Here is a snapshot of your platform. Use shortcuts below to jump into day-to-day
                admin tasks.
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-10 shrink-0 gap-2 self-start rounded-xl border-border/80 bg-background/80 lg:self-center"
            onClick={() => void fetchStats()}
            disabled={isLoading}
          >
            <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} aria-hidden />
            Refresh
          </Button>
        </div>
      </div>

      {error && (
        <div
          role="alert"
          className="rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive sm:px-5"
        >
          {error}
        </div>
      )}

      {/* Stats */}
      <section className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <h2 className="text-lg font-semibold tracking-tight">At a glance</h2>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {statTiles
            .filter((stat) => !("hidden" in stat && stat.hidden))
            .map((stat) => {
              const Icon = stat.icon
              const raw = stats?.[stat.key]
              const value =
                raw !== undefined && raw !== null ? raw.toLocaleString() : isLoading ? null : "—"

              return (
                <Card
                  key={stat.key}
                  className={cn(
                    "relative overflow-hidden border-border/70 bg-gradient-to-br shadow-sm ring-1 ring-inset ring-transparent",
                    stat.className,
                  )}
                >
                  <CardContent className="p-6 sm:p-7">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-1">
                        <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                        <div className="text-3xl font-semibold tracking-tight tabular-nums sm:text-4xl">
                          {isLoading || value === null ? (
                            <Skeleton className="h-10 w-28 sm:h-11" />
                          ) : (
                            value
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground sm:text-sm">{stat.description}</p>
                      </div>
                      <div
                        className={cn(
                          "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl",
                          stat.iconClass,
                        )}
                      >
                        <Icon className="h-6 w-6" aria-hidden />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
        </div>
      </section>

      {/* Shortcuts */}
      <section className="space-y-4">
        <h2 className="text-lg font-semibold tracking-tight">Shortcuts</h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {shortcuts.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                to={item.href}
                className="group relative flex flex-col rounded-2xl border border-border/70 bg-card p-5 shadow-sm transition-colors hover:border-sidebar-accent/35 hover:bg-muted/20"
              >
                <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-muted/80 text-foreground ring-1 ring-border/60 transition-colors group-hover:bg-sidebar-accent/10 group-hover:text-sidebar-accent">
                  <Icon className="h-5 w-5" aria-hidden />
                </div>
                <p className="font-medium leading-none">{item.title}</p>
                <p className="mt-1.5 text-sm text-muted-foreground">{item.description}</p>
                <span className="mt-4 inline-flex items-center text-sm font-medium text-sidebar-accent">
                  Open
                  <ArrowRight className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </span>
              </Link>
            )
          })}
        </div>
      </section>
    </div>
  )
}
