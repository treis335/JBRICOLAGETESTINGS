// app/admin/page.tsx
"use client"

import { useState, useEffect } from "react"
import { useWorkTracker } from "@/lib/work-tracker-context"
import { useAuth } from "@/lib/AuthProvider"
import { useRouter } from "next/navigation"

import dynamic from "next/dynamic"

const loading = () => (
  <div className="min-h-[60vh] flex items-center justify-center">
    <Spinner className="h-7 w-7 text-primary" />
  </div>
)

const AdminDashboardView     = dynamic(() => import("@/components/admin/admin-dashboard-view").then(m => ({ default: m.AdminDashboardView })), { loading })
const AdminCollaboratorsView = dynamic(() => import("@/components/admin/admin-collaborators-view").then(m => ({ default: m.AdminCollaboratorsView })), { loading })
const AdminFinanceView       = dynamic(() => import("@/components/admin/admin-finance-view").then(m => ({ default: m.AdminFinanceView })), { loading })
const AdminObrasView         = dynamic(() => import("@/components/admin/admin-obras-view").then(m => ({ default: m.AdminObrasView })), { loading })
const AdminReportsView       = dynamic(() => import("@/components/admin/admin-reports-view").then(m => ({ default: m.AdminReportsView })), { loading })
const AdminSettingsView      = dynamic(() => import("@/components/admin/admin-settings-view").then(m => ({ default: m.AdminSettingsView })), { loading })
import { AdminBottomNav, type AdminTabType } from "@/components/admin/admin-bottom-nav"
import { Spinner } from "@/components/ui/spinner"
import { Card, CardContent } from "@/components/ui/card"
import { ShieldAlert } from "lucide-react"
import { isAuthorizedAdmin } from "@/lib/admin-config"

function AdminContent() {
  const [activeTab, setActiveTab] = useState<AdminTabType>("dashboard")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  const { isLoading } = useWorkTracker()
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user && !isLoading) { router.push("/"); return }
    if (user) {
      if (!isAuthorizedAdmin(user.uid)) { router.push("/"); return }
      setIsCheckingAuth(false)
    }
  }, [user, isLoading, router])

  if (isLoading || isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Spinner className="h-8 w-8 text-primary" />
          <p className="text-muted-foreground text-sm">A verificar permissões de administrador...</p>
        </div>
      </div>
    )
  }

  if (!user || !isAuthorizedAdmin(user.uid)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="max-w-md w-full border-destructive/50">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="p-3 bg-destructive/10 rounded-full">
                <ShieldAlert className="h-8 w-8 text-destructive" />
              </div>
              <div>
                <h2 className="text-xl font-bold mb-2">Acesso Restrito</h2>
                <p className="text-sm text-muted-foreground">
                  Não tens permissões para aceder ao painel de administração.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <main className="flex-1 pb-16">
        {activeTab === "dashboard"     && <AdminDashboardView onTabChange={setActiveTab} />}
        {activeTab === "collaborators" && <AdminCollaboratorsView />}
        {activeTab === "finance"       && <AdminFinanceView />}
        {activeTab === "obras"         && <AdminObrasView />}
        {activeTab === "reports"       && <AdminReportsView />}
        {activeTab === "settings"      && <AdminSettingsView />}
      </main>
      <AdminBottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  )
}

export default function AdminPage() {
  return <AdminContent />
}