import { Link, useLocation, useNavigate } from "react-router-dom"
import { authService } from "@/features/auth/services/auth.service"
import { profileService } from "@/features/profile/services/profile.service"
import { useSidebar } from "@/lib/sidebar-context"
import { useState, useEffect } from "react"
import {
  LayoutDashboard,
  Users,
  Settings,
  UserCog,
  LogOut,
  Mic,
  Key,
  Shield,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  { title: "Voice Notes", icon: Mic, href: "/voice-notes", hidden: true },
  {
    title: "Member levels",
    icon: UserCog,
    href: "/member-levels",
  },
  {
    title: "Level codes",
    icon: Key,
    href: "/member-level-codes",
  },
  {
    title: "Users",
    icon: Users,
    href: "/users",
  },
  {
    title: "Settings",
    icon: Settings,
    href: "/settings",
  },
]

export function Sidebar() {
  const location = useLocation()
  const navigate = useNavigate()
  const { toggleSidebar } = useSidebar()
  const [profileName, setProfileName] = useState("")
  const [email, setEmail] = useState("")

  const closeSidebarOnMobile = () => {
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      toggleSidebar()
    }
  }

  useEffect(() => {
    const loadProfile = async () => {
      const user = authService.getUser()
      if (!user?.userId) return

      setEmail(user.email || "")

      try {
        const profile = await profileService.getByUserId(user.userId)
        const currentUser = authService.getUser()
        if (currentUser?.userId === user.userId) {
          setProfileName(profile.name || "")
        }
      } catch (error) {
        console.error("Failed to load profile:", error)
      }
    }

    loadProfile()
  }, [])

  const handleLogout = () => {
    authService.logout()
    navigate("/signin")
  }

  return (
    <div className="flex h-full w-full flex-col border-r border-sidebar-foreground/10 bg-sidebar text-sidebar-foreground">
      <div className="flex shrink-0 items-center gap-3 border-b border-sidebar-foreground/10 px-5 py-5">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-accent/15 ring-1 ring-sidebar-accent/25">
          <Shield className="h-5 w-5 text-sidebar-accent" aria-hidden />
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold tracking-tight text-sidebar-foreground">
            AI Minions
          </p>
          <p className="text-[11px] font-medium uppercase tracking-wider text-sidebar-foreground/55">
            Admin
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-sidebar-foreground/45">
          Menu
        </p>
        {menuItems.filter((item) => !("hidden" in item && item.hidden)).map((item) => {
          const Icon = item.icon
          const isActive =
            item.href === "/voice-notes"
              ? location.pathname.startsWith("/voice-notes")
              : location.pathname === item.href

          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={closeSidebarOnMobile}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-sidebar-accent/12 text-sidebar-accent shadow-sm ring-1 ring-sidebar-accent/20"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-foreground/[0.06] hover:text-sidebar-foreground",
              )}
            >
              <span
                className={cn(
                  "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors",
                  isActive
                    ? "bg-sidebar-accent/20 text-sidebar-accent"
                    : "bg-sidebar-foreground/[0.06] text-sidebar-foreground/60 group-hover:bg-sidebar-foreground/10",
                )}
              >
                <Icon className="h-4 w-4" />
              </span>
              <span className="truncate">{item.title}</span>
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 border-t border-sidebar-foreground/10 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="h-auto w-full justify-start gap-3 rounded-xl px-2 py-2.5 hover:bg-sidebar-foreground/[0.06]"
            >
              <Avatar className="h-9 w-9 shrink-0 ring-2 ring-sidebar-foreground/10">
                <AvatarImage src="" alt={profileName || email} />
                <AvatarFallback className="bg-sidebar-accent/20 text-xs font-semibold text-sidebar-accent">
                  {(profileName || email || "U").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 text-left">
                <span className="block truncate text-sm font-medium">
                  {profileName || email || "User"}
                </span>
                <span className="block truncate text-xs text-sidebar-foreground/50">{email}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link to="/settings" className="cursor-pointer">
                Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              <span>Log out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  )
}
