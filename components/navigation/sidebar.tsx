"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { X, Package, BarChart3, Home, Users, Users2, ShoppingCart, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { UserMenu } from "@/components/auth/user-menu"
import { cn } from "@/lib/utils"

const navItems = [
  {
    title: "Inventory Management",
    href: "/inventory",
    icon: Package,
  },
  {
    title: "Purchase Orders",
    href: "/purchase-orders",
    icon: ShoppingCart,
  },
  {
    title: "Customer Management",
    href: "/customers",
    icon: Users2,
  },
  {
    title: "Supplier Management",
    href: "/suppliers",
    icon: Users,
  },
  {
    title: "Business Intelligence",
    href: "/dashboard",
    icon: BarChart3,
  },
]

interface SidebarProps {
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname()

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 sm:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
      
      <aside
        className={cn(
          "fixed sm:sticky top-0 h-screen bg-background border-r transition-all duration-300 ease-in-out flex-shrink-0 z-50 sm:z-auto",
          isOpen ? "w-64" : "w-0 border-r-0",
        )}
      >
        <div className={cn("flex flex-col h-full w-64", !isOpen && "invisible")}>
        <div className="p-3 sm:p-6 border-b flex items-center justify-between gap-2">
          <Link
            href="/"
            className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-bold text-blue-600 min-w-0"
          >
            <Home className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0" />
            <span className="text-sm sm:text-xl truncate">Inventory BI</span>
          </Link>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-gray-500 hover:text-gray-700 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </Button>
        </div>

        <nav className="flex-1 p-2 sm:p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href + "/"))

            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg transition-colors text-xs sm:text-base",
                  isActive
                    ? "bg-blue-600 text-white"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground",
                )}
              >
                <Icon className="h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0" />
                <span className="font-medium truncate">{item.title}</span>
              </Link>
            )
          })}
        </nav>

        <div className="p-2 sm:p-4 border-t">
          <UserMenu />
        </div>
      </div>
    </aside>
    </>
  )
}
