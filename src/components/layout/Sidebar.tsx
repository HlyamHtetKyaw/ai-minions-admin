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
  // Hidden from UI – remove hidden: true to show again
  { title: "Voice Notes", icon: Mic, href: "/voice-notes", hidden: true },
  {
    title: "Member Levels",
    icon: UserCog,
    href: "/member-levels",
  },
  {
    title: "Member Level Codes",
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
    <div className="flex h-full w-64 flex-col">
      <div className="flex h-14 shrink-0 items-center border-b px-4 sm:px-6">
        <h1 className="truncate text-lg font-semibold sm:text-xl">
          <span className="text-foreground">AI </span>
          <span className="text-brand-gold">Minions</span>
        </h1>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems.filter((item) => !("hidden" in item && item.hidden)).map((item) => {
          const Icon = item.icon
          // For voice-notes, also check if pathname starts with /voice-notes
          const isActive = item.href === "/voice-notes" 
            ? location.pathname.startsWith("/voice-notes")
            : location.pathname === item.href
          
          return (
            <Link
              key={item.href}
              to={item.href}
              onClick={closeSidebarOnMobile}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="h-5 w-5 shrink-0" />
              {item.title}
            </Link>
          )
        })}
      </nav>

      <div className="shrink-0 border-t p-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              className="w-full justify-start gap-3 hover:bg-muted/50 hover:text-foreground"
            >
              <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src="" alt={profileName || email} />
                <AvatarFallback>{(profileName || email || "U").slice(0, 2).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1 flex flex-col items-start text-left">
                <span className="block truncate text-sm font-medium">{profileName || email || "User"}</span>
                <span className="block truncate text-xs text-muted-foreground">{email}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
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
