// components/admin/annual-report-modal.tsx
"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Download, TrendingUp, TrendingDown, Minus } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import { buildAnnualRows, fmtCurrency, downloadCSV, type AnnualRow } from "@/lib/report-utils"

const MONTHS_SHORT = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

function TrendIcon({ cur, prev }: { cur: number; prev: number }) {
  if (prev === 0 || Math.abs(cur - prev) < 0.5) return <Minus className="h-3 w-3 text-muted-foreground/30" />
  return cur > prev
    ? <TrendingUp   className="h-3 w-3 text-emerald-500" />
    : <TrendingDown className="h-3 w-3 text-red-400" />
}

function MiniBar({ value, max, color }: { value: number; max: number; color: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="h-1.5 w-full bg-muted/40 rounded-full overflow-hidden">
      <div className={cn("h-full rounded-full transition-all", color)} style={{ width: `${pct}%` }} />
    </div>
  )
}

interface Props { open: boolean; onClose: () => void; collaborators: Collaborator[] }

export function AnnualReportModal({ open, onClose, collaborators }: Props) {
  const [year, setYear] = useState(new Date().getFullYear())

  const rows: AnnualRow[] = useMemo(
    () => buildAnnualRows(collaborators, year),
    [collaborators, year]
  )

  // Monthly totals across all collaborators
  const monthlyTotals = useMemo(() => {
    return Array.from({ length: 12 }, (_, mi) => {
      const h = rows.reduce((s, r) => s + r.months[mi].horas, 0)
      const c = rows.reduce((s, r) => s + r.months[mi].custo, 0)
      const p = rows.reduce((s, r) => s + r.months[mi].pago,  0)
      return { horas: h, custo: c, pago: p }
    })
  }, [rows])

  const maxH    = Math.max(...monthlyTotals.map(m => m.horas), 1)
  const maxCost = Math.max(...monthlyTotals.map(m => m.custo), 1)

  const grandTotals = useMemo(() => ({
    horas: rows.reduce((s, r) => s + r.totH,    0),
    custo: rows.reduce((s, r) => s + r.totCost,  0),
    pago:  rows.reduce((s, r) => s + r.totPaid,  0),
  }), [rows])

  const handleCSV = () => {
    const headers = ["Colaborador", ...MONTHS_SHORT.map(m => `${m} Horas`), ...MONTHS_SHORT.map(m => `${m} Custo`), "Total Horas", "Total Custo", "Total Pago"]
    const csvRows = rows.map(r => [
      r.name,
      ...r.months.map(m => m.horas.toFixed(1)),
      ...r.months.map(m => m.custo.toFixed(2)),
      r.totH.toFixed(1), r.totCost.toFixed(2), r.totPaid.toFixed(2),
    ])
    downloadCSV(`relatorio-anual-${year}.csv`, headers, csvRows)
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-6xl w-[calc(100vw-1rem)] max-h-[90dvh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-muted/10 shrink-0">
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => setYear(y => y - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-black w-14 text-center">{year}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => setYear(y => y + 1)} disabled={year >= new Date().getFullYear()}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex-1" />
          <Button size="sm" variant="outline" className="h-8 rounded-xl gap-1.5 text-xs" onClick={handleCSV} disabled={false || !rows.length}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="sr-only">Relatório Anual {year}</DialogTitle>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-0">

          {/* KPI strip */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: "Horas totais",  value: `${grandTotals.horas.toFixed(0)}h`, color: "text-blue-600 dark:text-blue-400" },
              { label: "Custo total",   value: fmtCurrency(grandTotals.custo),      color: "text-violet-600 dark:text-violet-400" },
              { label: "Total pago",    value: fmtCurrency(grandTotals.pago),       color: "text-emerald-600 dark:text-emerald-400" },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-border/50 bg-card p-3 text-center">
                <p className={cn("text-lg font-black tabular-nums", k.color)}>{k.value}</p>
                <p className="text-[10px] text-muted-foreground/50 mt-0.5">{k.label}</p>
              </div>
            ))}
          </div>

          {/* Monthly bar chart */}
          <div className="rounded-xl border border-border/50 bg-card p-3 sm:p-4">
            <p className="text-xs font-bold text-muted-foreground/60 mb-3 uppercase tracking-widest">Evolução Mensal — {year}</p>
            <div className="grid grid-cols-12 gap-1">
              {monthlyTotals.map((m, mi) => (
                <div key={mi} className="flex flex-col items-center gap-1">
                  {/* Horas bar */}
                  <div className="w-full flex flex-col justify-end" style={{ height: 48 }}>
                    <div
                      className="w-full rounded-t bg-blue-400/70 dark:bg-blue-500/50 transition-all"
                      style={{ height: maxH > 0 ? `${(m.horas / maxH) * 48}px` : 0 }}
                      title={`${m.horas.toFixed(0)}h`}
                    />
                  </div>
                  {/* Label */}
                  <span className="text-[8px] text-muted-foreground/40 font-bold">{MONTHS_SHORT[mi]}</span>
                  {/* Value */}
                  <span className="text-[9px] text-blue-600 dark:text-blue-400 font-black tabular-nums">
                    {m.horas > 0 ? `${m.horas.toFixed(0)}h` : "—"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Per-collaborator table */}
          {false ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(4)].map((_,i) => <div key={i} className="h-16 bg-muted/40 rounded-xl" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground/60 text-sm">Sem dados para {year}</div>
          ) : (
            <div className="space-y-2">
              <p className="text-xs font-bold text-muted-foreground/60 uppercase tracking-widest">Por Colaborador</p>
              {rows.map(r => (
                <div key={r.id} className="rounded-xl border border-border/40 bg-card overflow-hidden">
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <p className="text-sm font-bold flex-1 min-w-0 truncate">{r.name}</p>
                    <div className="flex items-center gap-3 shrink-0 text-xs">
                      <span className="text-blue-600 dark:text-blue-400 font-black tabular-nums">{r.totH.toFixed(0)}h</span>
                      <span className="text-violet-600 dark:text-violet-400 font-black tabular-nums">{fmtCurrency(r.totCost)}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 tabular-nums hidden sm:block">{fmtCurrency(r.totPaid)}</span>
                    </div>
                  </div>
                  {/* Month mini-bars */}
                  <div className="grid grid-cols-12 gap-px bg-muted/20 border-t border-border/20">
                    {r.months.map((m, mi) => {
                      const prev = mi > 0 ? r.months[mi - 1] : null
                      return (
                        <div key={mi} className="flex flex-col items-center py-2 px-0.5 gap-1 bg-card">
                          <span className="text-[7px] text-muted-foreground/30">{MONTHS_SHORT[mi]}</span>
                          <div className="w-full">
                            <MiniBar value={m.horas} max={Math.max(...r.months.map(x => x.horas), 1)} color="bg-blue-400/60" />
                          </div>
                          <span className="text-[8px] tabular-nums text-muted-foreground/50 font-medium">
                            {m.horas > 0 ? `${m.horas.toFixed(0)}h` : "—"}
                          </span>
                          {prev !== null && <TrendIcon cur={m.horas} prev={prev.horas} />}
                        </div>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
