"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  X,
  Package,
  BarChart3,
  Home,
  Users,
  Users2,
  ShoppingCart,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/auth/user-menu";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";

const navItems = [
  {
    title: "Business Intelligence",
    href: "/dashboard",
    icon: BarChart3,
    description: "Analytics & insights",
  },
  {
    title: "Inventory Management",
    href: "/inventory",
    icon: Package,
    description: "Track and manage stock",
  },
  {
    title: "Purchase Orders",
    href: "/purchase-orders",
    icon: ShoppingCart,
    description: "Manage procurement",
  },
  {
    title: "Customer Management",
    href: "/customers",
    icon: Users2,
    description: "Client relationships",
  },
  {
    title: "Supplier Management",
    href: "/suppliers",
    icon: Users,
    description: "Vendor partnerships",
  },
];

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

export function Sidebar({ isOpen, setIsOpen }: SidebarProps) {
  const pathname = usePathname();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper function to check if a nav item is active
  const isItemActive = (itemHref: string) => {
    if (pathname === itemHref) return true;
    if (pathname?.startsWith(itemHref + "/")) return true;
    if (itemHref === "/dashboard" && pathname === "/") return false;
    return false;
  };

  if (!mounted) return null;

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
          "fixed sm:sticky top-0 h-screen bg-background border-r flex-shrink-0 z-50 sm:z-auto",
          isOpen ? "w-64" : "w-0 border-r-0",
        )}>
        <div
          className={cn("flex flex-col h-full w-64", !isOpen && "invisible")}>
          {/* Header */}
          <div className="p-3 sm:p-6 border-b">
            <div className="flex items-center justify-between gap-2">
              <Link
                href="/"
                className="flex items-center gap-1.5 sm:gap-2 text-lg sm:text-xl font-bold min-w-0 group">
                <Home className="h-5 w-5 sm:h-6 sm:w-6 flex-shrink-0 text-blue-600" />
                <span className="text-sm sm:text-xl truncate text-blue-600">
                  Inventory BI
                </span>
              </Link>

              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 h-8 w-8 sm:h-10 sm:w-10 flex-shrink-0 hover:bg-gray-300">
                <X className="h-4 w-4 sm:h-5 sm:w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-2 sm:p-4 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              const isHovered = hoveredItem === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 sm:gap-3 px-2 sm:px-4 py-2 sm:py-3 rounded-lg text-xs sm:text-base relative",
                    isActive
                      ? "bg-blue-600 text-white"
                      : "text-gray-600 hover:bg-gray-100",
                  )}
                  onMouseEnter={() => setHoveredItem(item.href)}
                  onMouseLeave={() => setHoveredItem(null)}>
                  {/* Icon - only animation is scale on hover */}
                  <Icon
                    className={cn(
                      "h-4 w-4 sm:h-5 sm:w-5 flex-shrink-0 transition-transform duration-150",
                      isActive ? "text-white" : "text-gray-500",
                      isHovered && "scale-110",
                    )}
                  />

                  {/* Text content with description on hover */}
                  <div className="flex-1 min-w-0">
                    <span
                      className={cn(
                        "font-medium truncate block",
                        isActive ? "text-white" : "text-gray-700",
                      )}>
                      {item.title}
                    </span>

                    {/* Description - appears on hover */}
                    <span
                      className={cn(
                        "text-xs text-gray-500 overflow-hidden transition-all duration-200 block",
                        isHovered && !isActive
                          ? "max-h-6 opacity-70"
                          : "max-h-0 opacity-0",
                        isActive && "text-white/70 max-h-6 opacity-70", // Show description for active items too
                      )}>
                      {item.description}
                    </span>
                  </div>

                  {/* Active indicator - simple dot, no animation */}
                  {isActive && (
                    <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-2 sm:p-4 border-t">
            <UserMenu />
          </div>
        </div>
      </aside>
    </>
  );
}
