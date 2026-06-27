// components/admin/admin-reports-view.tsx
"use client"

import { useState } from "react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Calendar, BarChart3, TrendingUp, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"
import { MonthlyReportModal } from "@/components/admin/monthly-report-modal"
import { AnnualReportModal }  from "@/components/admin/annual-report-modal"
import { RateHistoryModal }   from "@/components/admin/rate-history-modal"

type ModalType = "monthly" | "annual" | "rate-history" | null

const REPORTS = [
  {
    id: "monthly" as const,
    icon: Calendar,
    title: "Relatório Mensal",
    description: "Horas, custos e pendentes por colaborador com taxa histórica correta.",
    tags: ["Horas", "Custos", "Pendente"],
    bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40",
    iconBg: "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400",
  },
  {
    id: "annual" as const,
    icon: BarChart3,
    title: "Relatório Anual",
    description: "Análise do ano fiscal com gráfico mensal e comparação por colaborador.",
    tags: ["Anual", "Tendências", "KPIs"],
    bg: "bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/40",
    iconBg: "bg-violet-100 dark:bg-violet-900/40 text-violet-600 dark:text-violet-400",
  },
  {
    id: "rate-history" as const,
    icon: TrendingUp,
    title: "Histórico de Taxas",
    description: "Registo completo de todas as alterações de taxas horárias com deltas.",
    tags: ["Taxas", "Histórico", "Auditoria"],
    bg: "bg-orange-50 dark:bg-orange-950/20 border-orange-100 dark:border-orange-900/40",
    iconBg: "bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400",
  },
] as const

export function AdminReportsView() {
  const [open, setOpen] = useState<ModalType>(null)
  // Single source — same data as dashboard, no extra Firebase calls
  const { collaborators } = useCollaborators()

  return (
    <>
      <ScrollArea className="h-full w-full">
        <div className="p-3 sm:p-5 pb-24 space-y-3 max-w-2xl mx-auto">
          <div className="mb-5">
            <h1 className="text-xl font-black tracking-tight">Relatórios</h1>
            <p className="text-xs text-muted-foreground/60 mt-0.5">Análise e exportação de dados da equipa</p>
          </div>

          {REPORTS.map(r => {
            const Icon = r.icon
            return (
              <button key={r.id} onClick={() => setOpen(r.id)}
                className={cn(
                  "w-full text-left flex items-center gap-4 p-4 rounded-2xl border transition-all",
                  "hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-none",
                  r.bg
                )}>
                <div className={cn("w-11 h-11 rounded-2xl flex items-center justify-center shrink-0", r.iconBg)}>
                  <Icon className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-foreground">{r.title}</p>
                  <p className="text-xs text-muted-foreground/70 mt-0.5 leading-relaxed">{r.description}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {r.tags.map(tag => (
                      <span key={tag} className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/50 dark:bg-white/5 border border-black/5 text-muted-foreground/60">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground/40 shrink-0" />
              </button>
            )
          })}
        </div>
      </ScrollArea>

      {/* Modals receive collaborators as props — no extra Firebase queries */}
      <MonthlyReportModal open={open === "monthly"}      onClose={() => setOpen(null)} collaborators={collaborators} />
      <AnnualReportModal  open={open === "annual"}       onClose={() => setOpen(null)} collaborators={collaborators} />
      <RateHistoryModal   open={open === "rate-history"} onClose={() => setOpen(null)} collaborators={collaborators} />
    </>
  )
}
