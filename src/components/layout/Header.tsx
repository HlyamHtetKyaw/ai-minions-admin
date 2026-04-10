import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ui/theme-toggle"
import { useSidebar } from "@/lib/sidebar-context"
import { useLocation } from "react-router-dom"
import { cn } from "@/lib/utils"

const ROUTE_TITLES: { prefix: string; title: string }[] = [
  { prefix: "/dashboard", title: "Dashboard" },
  { prefix: "/member-levels", title: "Member levels" },
  { prefix: "/member-level-codes", title: "Level codes" },
  { prefix: "/users", title: "Users" },
  { prefix: "/settings", title: "Settings" },
  { prefix: "/voice-notes", title: "Voice notes" },
]

function titleForPath(pathname: string): string {
  const hit = ROUTE_TITLES.find((r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`))
  if (hit) return hit.title
  if (pathname === "/") return "Dashboard"
  return "Admin"
}

export function Header() {
  const { toggleSidebar } = useSidebar()
  const { pathname } = useLocation()
  const pageTitle = titleForPath(pathname)

  return (
    <header
      className={cn(
        "sticky top-0 z-20 flex h-14 shrink-0 items-center justify-between gap-4",
        "border-b border-border/60 bg-background/75 px-4 backdrop-blur-md sm:px-6",
      )}
    >
      <div className="flex min-w-0 items-center gap-3">
        <Button variant="ghost" size="icon" className="shrink-0 md:hidden" onClick={toggleSidebar}>
          <Menu className="h-5 w-5" />
        </Button>
        <div className="min-w-0">
          <p className="truncate text-[15px] font-semibold tracking-tight sm:text-base">{pageTitle}</p>
          <p className="hidden truncate text-xs text-muted-foreground sm:block">AI Minions admin</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <ThemeToggle />
      </div>
    </header>
  )
}
