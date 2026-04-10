import { Sidebar } from "./Sidebar"
import { Header } from "./Header"
import { useSidebar } from "@/lib/sidebar-context"
import { cn } from "@/lib/utils"

interface MainLayoutProps {
  children: React.ReactNode
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isOpen, toggleSidebar } = useSidebar()

  return (
    <div className="flex min-h-screen overflow-hidden bg-muted/25">
      {/* Mobile backdrop */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={toggleSidebar}
        className={cn(
          "fixed inset-0 z-30 bg-zinc-950/40 backdrop-blur-[2px] transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0",
        )}
      />

      {/* Sidebar: drawer on mobile; persistent rail on md+ */}
      <div
        className={cn(
          "flex h-screen w-[min(17rem,88vw)] flex-shrink-0 flex-col transition-transform duration-300 ease-out",
          isOpen ? "translate-x-0" : "-translate-x-full",
          "fixed inset-y-0 left-0 z-40 md:relative md:z-auto md:translate-x-0",
        )}
      >
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="relative flex-1 overflow-y-auto">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.35] dark:opacity-25"
            aria-hidden
            style={{
              backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--muted-foreground) / 0.12) 1px, transparent 0)`,
              backgroundSize: "24px 24px",
            }}
          />
          <div className="relative mx-auto max-w-[1600px] px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  )
}
