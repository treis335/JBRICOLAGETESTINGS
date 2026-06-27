// components/admin/admin-reports-view.tsx
"use client"

import { useState } from "react"
<<<<<<< HEAD
import { Calendar, BarChart3, History, Clock, FileSpreadsheet, FileBarChart, Download, ChevronRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"
import { MonthlyReportModal }  from "@/components/admin/monthly-report-modal"
import { AnnualReportModal }   from "@/components/admin/annual-report-modal"
import { RateHistoryModal }    from "@/components/admin/rate-history-modal"

// ── Report definitions ────────────────────────────────────────────────────────
const REPORTS = [
  {
    id: "monthly",
    icon: Calendar,
    title: "Relatório Mensal",
    description: "Horas, custos e pagamentos por colaborador. Taxa histórica correta, pendente real.",
    gradient: "from-blue-500 to-indigo-600",
    glow: "shadow-blue-500/20",
    badge: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
    tags: ["Horas", "Custos", "Pendente"],
    formats: ["Excel", "PDF"],
    ready: true,
  },
  {
    id: "annual",
    icon: BarChart3,
    title: "Relatório Anual",
    description: "Análise do ano completo com tendências mensais e ranking de colaboradores.",
    gradient: "from-violet-500 to-purple-600",
    glow: "shadow-violet-500/20",
    badge: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
    tags: ["Anual", "Tendências", "KPIs"],
    formats: ["Excel", "PDF"],
    ready: true,
  },
  {
    id: "rates",
    icon: History,
    title: "Histórico de Taxas",
    description: "Registo completo de todas as alterações de taxas horárias com auditoria.",
    gradient: "from-amber-500 to-orange-500",
    glow: "shadow-amber-500/20",
    badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
    tags: ["Taxas", "Histórico", "Auditoria"],
    formats: ["PDF"],
    ready: true,
  },
  {
    id: "hours",
    icon: Clock,
    title: "Relatório de Horas",
    description: "Detalhe de todas as entradas de horas com filtros avançados por período e colaborador.",
    gradient: "from-emerald-500 to-teal-500",
    glow: "shadow-emerald-500/20",
    badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
    tags: ["Horas", "Detalhado", "Filtros"],
    formats: ["Excel"],
    ready: false,
  },
  {
    id: "export",
    icon: FileSpreadsheet,
    title: "Exportação de Dados",
    description: "Exportação completa dos dados brutos para integração com sistemas externos.",
    gradient: "from-slate-500 to-slate-600",
    glow: "shadow-slate-500/20",
    badge: "bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/20",
    tags: ["Raw Data", "CSV", "Integração"],
    formats: ["CSV", "JSON"],
    ready: false,
  },
  {
    id: "performance",
    icon: FileBarChart,
    title: "Análise de Performance",
    description: "Métricas de performance da equipa com comparação entre períodos e evolução.",
    gradient: "from-rose-500 to-pink-600",
    glow: "shadow-rose-500/20",
    badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
    tags: ["Performance", "Comparação", "KPIs"],
    formats: ["PDF"],
    ready: false,
  },
]

// ── Report Card ───────────────────────────────────────────────────────────────
function ReportCard({ report, onClick }: { report: typeof REPORTS[0]; onClick?: () => void }) {
  const Icon = report.icon
  return (
    <div className={cn(
      "group relative rounded-3xl border bg-card overflow-hidden transition-all duration-200",
      report.ready
        ? "border-border/60 hover:border-border hover:shadow-lg cursor-pointer active:scale-[0.99]"
        : "border-border/30 opacity-60"
    )}
      onClick={report.ready ? onClick : undefined}
    >
      {/* Top gradient bar */}
      <div className={cn("h-1 w-full bg-gradient-to-r", report.gradient)} />

      <div className="p-5 space-y-4">
        {/* Icon + title */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg shrink-0",
              report.gradient, report.glow
            )}>
              <Icon className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-bold leading-tight">{report.title}</p>
              <div className="flex items-center gap-1 mt-1 flex-wrap">
                {report.formats.map(f => (
                  <span key={f} className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md border",
                    report.badge
                  )}>{f}</span>
                ))}
              </div>
            </div>
          </div>
          {report.ready ? (
            <div className="w-8 h-8 rounded-xl bg-muted/50 group-hover:bg-muted flex items-center justify-center transition-colors shrink-0">
              <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
            </div>
          ) : (
            <span className="text-[10px] font-bold px-2 py-1 rounded-lg bg-muted text-muted-foreground/50 shrink-0 whitespace-nowrap">Em breve</span>
          )}
        </div>

        {/* Description */}
        <p className="text-[13px] text-muted-foreground leading-relaxed">{report.description}</p>

        {/* Tags */}
        <div className="flex gap-1.5 flex-wrap">
          {report.tags.map(tag => (
            <span key={tag} className="text-[11px] text-muted-foreground/50 bg-muted/40 px-2 py-0.5 rounded-lg font-medium">
              {tag}
            </span>
          ))}
        </div>

        {/* CTA */}
        {report.ready && (
          <div className={cn(
            "flex items-center gap-2 pt-1 text-sm font-semibold transition-colors",
            "text-muted-foreground group-hover:text-foreground"
          )}>
            <Download className="h-4 w-4" />
            Gerar relatório
          </div>
        )}
      </div>
    </div>
  )
}
=======
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
>>>>>>> 3a5b66b859f3a0b5609fab17915379d15e1752c7

// ── Main ──────────────────────────────────────────────────────────────────────
export function AdminReportsView() {
<<<<<<< HEAD
  const [open, setOpen] = useState<string|null>(null)

  return (
    <>
      <MonthlyReportModal open={open==="monthly"} onClose={()=>setOpen(null)} />
      <AnnualReportModal  open={open==="annual"}  onClose={()=>setOpen(null)} />
      <RateHistoryModal   open={open==="rates"}   onClose={()=>setOpen(null)} />

      <div className="h-full w-full overflow-y-auto overflow-x-hidden">
        <div className="px-4 sm:px-6 py-6 pb-28 md:py-10 md:pb-12 max-w-5xl mx-auto w-full space-y-8">

          {/* ── Hero header ── */}
          <div className="relative rounded-3xl overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(99,102,241,0.2),transparent_60%)]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,rgba(16,185,129,0.1),transparent_60%)]" />
            <div className="relative px-6 py-7 sm:px-8 sm:py-8">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-xl bg-white/10 flex items-center justify-center">
                      <Sparkles className="h-3.5 w-3.5 text-white/80" />
                    </div>
                    <span className="text-white/40 text-[11px] font-bold uppercase tracking-widest">Centro de Relatórios</span>
                  </div>
                  <h1 className="text-2xl sm:text-3xl font-black text-white/90 tracking-tight">Relatórios</h1>
                  <p className="text-white/35 text-sm mt-1.5 max-w-md">
                    Exporta, analisa e audita todos os dados da empresa em múltiplos formatos.
                  </p>
                </div>
                <div className="shrink-0 hidden sm:flex flex-col items-end gap-1.5">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/25">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span className="text-[11px] font-bold text-emerald-400">3 disponíveis</span>
                  </div>
                  <span className="text-white/20 text-[10px]">3 em breve</span>
                </div>
              </div>

              {/* Quick stats */}
              <div className="grid grid-cols-3 gap-3 mt-6">
                {[
                  { label: "Mensal", desc: "Horas & custos", color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/20", id: "monthly" },
                  { label: "Anual",  desc: "Tendências & KPIs", color: "text-violet-400", bg: "bg-violet-500/10 border-violet-500/20", id: "annual" },
                  { label: "Taxas",  desc: "Auditoria",  color: "text-amber-400", bg: "bg-amber-500/10 border-amber-500/20", id: "rates" },
                ].map(s => (
                  <button key={s.id} onClick={() => setOpen(s.id)}
                    className={cn("rounded-2xl border px-3 py-3 text-left hover:brightness-110 active:scale-95 transition-all", s.bg)}>
                    <p className={cn("text-xs font-black", s.color)}>{s.label}</p>
                    <p className="text-white/25 text-[10px] mt-0.5 truncate">{s.desc}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Available reports ── */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-1">Disponíveis</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORTS.filter(r => r.ready).map(r => (
                <ReportCard key={r.id} report={r} onClick={() => setOpen(r.id)} />
              ))}
            </div>
          </div>

          {/* ── Coming soon ── */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/50 px-1">Em breve</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {REPORTS.filter(r => !r.ready).map(r => (
                <ReportCard key={r.id} report={r} />
              ))}
            </div>
          </div>

        </div>
      </div>
=======
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
>>>>>>> 3a5b66b859f3a0b5609fab17915379d15e1752c7
    </>
  )
}
