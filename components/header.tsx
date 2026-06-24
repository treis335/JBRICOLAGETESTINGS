// components/header.tsx
"use client"

import Image from "next/image"
import Link from "next/link"
import { useAuth } from "@/lib/AuthProvider"
import { isAuthorizedAdmin } from "@/lib/admin-config"
import { Button } from "@/components/ui/button"
import { ShieldCheck, LayoutDashboard } from "lucide-react"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"

export function Header() {
  const { user } = useAuth()
  const pathname = usePathname()

  const isAdmin = user ? isAuthorizedAdmin(user.uid) : false
  const isOnAdminPage = pathname?.startsWith("/admin")

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50",
        "border-b border-border/50",
        "bg-card/80 backdrop-blur-xl",
        "animate-fade-in"
      )}
      style={{ WebkitBackdropFilter: "blur(20px)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link
          href="/"
          className="flex items-center gap-3 group press-effect focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded-xl p-1 -ml-1"
        >
          <div className="relative w-9 h-9 rounded-xl overflow-hidden shadow-sm ring-1 ring-border/50 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/apple-icon.png"
              alt="JBRICOLAGE"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex flex-col leading-none">
            <span className="text-base font-black tracking-tight text-foreground">
              JBRICOLAGE
            </span>
            <span className="text-[10px] text-muted-foreground/60 font-medium tracking-widest uppercase">
              Gestão de Obras
            </span>
          </div>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Status indicator */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 tracking-wide">
              Online
            </span>
          </div>

          {/* Admin button */}
          {isAdmin && (
            <Link href={isOnAdminPage ? "/" : "/admin"}>
              <Button
                variant={isOnAdminPage ? "default" : "outline"}
                size="sm"
                className={cn(
                  "gap-2 h-8 rounded-xl font-semibold text-xs press-effect",
                  !isOnAdminPage && "border-primary/30 text-primary hover:bg-primary/5 hover:border-primary/50"
                )}
              >
                {isOnAdminPage ? (
                  <LayoutDashboard className="h-3.5 w-3.5" />
                ) : (
                  <ShieldCheck className="h-3.5 w-3.5" />
                )}
                <span className="hidden sm:inline">
                  {isOnAdminPage ? "App" : "Admin"}
                </span>
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  )
}
