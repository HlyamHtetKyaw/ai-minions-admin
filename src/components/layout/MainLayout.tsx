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
    <div className="flex h-screen overflow-hidden">
      {/* Mobile backdrop when sidebar open */}
      <button
        type="button"
        aria-label="Close menu"
        onClick={toggleSidebar}
        className={cn(
          "fixed inset-0 z-30 bg-black/50 transition-opacity md:hidden",
          isOpen ? "opacity-100" : "pointer-events-none opacity-0"
        )}
      />

      {/* Sidebar: overlay on mobile, in-flow on desktop */}
      <div
        className={cn(
          "flex h-screen w-64 flex-shrink-0 flex-col border-r bg-card transition-transform duration-200 ease-in-out",
          isOpen
            ? "translate-x-0"
            : "-translate-x-full",
          "fixed inset-y-0 left-0 z-40 md:relative md:z-auto md:translate-x-0",
          !isOpen && "md:hidden"
        )}
      >
        <Sidebar />
      </div>

      <div className="flex min-w-0 flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  )
}
