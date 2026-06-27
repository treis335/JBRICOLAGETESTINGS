// components/admin/monthly-report-modal.tsx
"use client"

import { useState, useMemo } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, X, Download, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"
import {
  buildMonthRows, fmtMonthLabel, fmtCurrency, downloadCSV, monthKey,
  type MonthRow,
} from "@/lib/report-utils"

// ── helpers ───────────────────────────────────────────────────────────────────
function todayMonthKey(): string {
  const d = new Date()
  return monthKey(d.getFullYear(), d.getMonth())
}

function prevMonth(key: string): string {
  const { year, month } = { year: +key.slice(0,4), month: +key.slice(5,7) - 1 }
  const d = new Date(year, month - 1, 1)
  return monthKey(d.getFullYear(), d.getMonth())
}
function nextMonth(key: string): string {
  const { year, month } = { year: +key.slice(0,4), month: +key.slice(5,7) - 1 }
  const d = new Date(year, month + 1, 1)
  return monthKey(d.getFullYear(), d.getMonth())
}

// ── sub-components ────────────────────────────────────────────────────────────
function PendenteCell({ value }: { value: number }) {
  if (Math.abs(value) < 0.01) return <span className="text-muted-foreground/40">—</span>
  return (
    <span className={cn(
      "font-bold tabular-nums",
      value < 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"
    )}>
      {value < 0 ? `+${fmtCurrency(Math.abs(value))}` : fmtCurrency(value)}
    </span>
  )
}

function SummaryCard({ label, value, sub, accent }: { label: string; value: string; sub?: string; accent: string }) {
  return (
    <div className={cn("rounded-xl border p-3 space-y-0.5", accent)}>
      <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">{label}</p>
      <p className="text-xl font-black tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-muted-foreground/50">{sub}</p>}
    </div>
  )
}

// ── main ──────────────────────────────────────────────────────────────────────
interface Props { open: boolean; onClose: () => void }

export function MonthlyReportModal({ open, onClose }: Props) {
  const [monthK, setMonthK] = useState(todayMonthKey)
  const { collaborators, loading } = useCollaborators()
  const isCurrentMonth = monthK === todayMonthKey()

  const rows: MonthRow[] = useMemo(
    () => buildMonthRows(collaborators, monthK),
    [collaborators, monthK]
  )

  const totals = useMemo(() => ({
    horas:    rows.reduce((s, r) => s + r.totalH, 0),
    custo:    rows.reduce((s, r) => s + r.custo,  0),
    pago:     rows.reduce((s, r) => s + r.pago,   0),
    pendente: rows.reduce((s, r) => s + r.pendente, 0),
    pessoas:  rows.length,
  }), [rows])

  const handleCSV = () => {
    const label = fmtMonthLabel(monthK)
    downloadCSV(
      `relatorio-mensal-${monthK}.csv`,
      ["Nome", "Email", "Dias", "H.Normais", "H.Extra", "H.Total", "Taxa Média", "Ganhou", "Pago", "Pendente"],
      rows.map(r => [
        r.name, r.email,
        String(r.diasTrab),
        r.normalH.toFixed(1), r.extraH.toFixed(1), r.totalH.toFixed(1),
        r.avgRate.toFixed(2),
        r.custo.toFixed(2), r.pago.toFixed(2), r.pendente.toFixed(2),
      ])
    )
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-4xl w-[calc(100vw-1rem)] max-h-[90dvh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-muted/10 shrink-0">
          <div className="flex items-center gap-1 shrink-0">
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => setMonthK(prevMonth)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-black capitalize min-w-[150px] text-center">{fmtMonthLabel(monthK)}</span>
            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={() => setMonthK(nextMonth)} disabled={isCurrentMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex-1" />

          <Button size="sm" variant="outline" className="h-8 rounded-xl gap-1.5 text-xs" onClick={handleCSV} disabled={loading || !rows.length}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl shrink-0" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="sr-only">Relatório Mensal</DialogTitle>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-0">

          {/* Note about pending */}
          <div className="flex gap-2.5 px-3 py-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/40 text-xs text-blue-700 dark:text-blue-300">
            <Info className="h-3.5 w-3.5 shrink-0 mt-0.5 text-blue-500" />
            <span>
              <strong>Taxa histórica:</strong> cada entrada usa a taxa vigente nesse dia. 
              <strong> Pendente deste mês</strong> = Ganhou − Pagamentos registados neste mês 
              (verde = pago em excesso / adiantado).
            </span>
          </div>

          {/* Summary strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <SummaryCard label="Colaboradores" value={String(totals.pessoas)}    accent="bg-card border-border/50" />
            <SummaryCard label="Horas Totais"  value={`${totals.horas.toFixed(0)}h`} accent="bg-blue-50 dark:bg-blue-950/20 border-blue-100 dark:border-blue-900/40" />
            <SummaryCard label="Custo Total"   value={fmtCurrency(totals.custo)} accent="bg-violet-50 dark:bg-violet-950/20 border-violet-100 dark:border-violet-900/40" />
            <SummaryCard label="Pendente"      value={fmtCurrency(totals.pendente)}
              sub={totals.pendente < 0 ? "pago em excesso" : undefined}
              accent={cn(
                totals.pendente < 0
                  ? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-100 dark:border-emerald-900/40"
                  : totals.pendente > 0
                    ? "bg-red-50 dark:bg-red-950/20 border-red-100 dark:border-red-900/40"
                    : "bg-card border-border/50"
              )}
            />
          </div>

          {/* Table */}
          {loading ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(4)].map((_,i) => <div key={i} className="h-12 bg-muted/40 rounded-xl" />)}
            </div>
          ) : rows.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground/60 text-sm">
              Sem dados para {fmtMonthLabel(monthK)}
            </div>
          ) : (
            <div className="rounded-xl border border-border/50 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm" style={{ minWidth: 600 }}>
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/40">
                      {["Colaborador","Dias","H.Norm","H.Extra","H.Total","Taxa Méd.","Ganhou","Pago","Pendente"].map(h => (
                        <th key={h} className="px-3 py-2.5 text-left text-[10px] font-black uppercase tracking-wider text-muted-foreground/60 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30">
                    {rows.map((r, i) => (
                      <tr key={r.id} className={cn("transition-colors hover:bg-muted/20", i % 2 === 0 ? "" : "bg-muted/5")}>
                        <td className="px-3 py-2.5 font-semibold whitespace-nowrap">{r.name}</td>
                        <td className="px-3 py-2.5 tabular-nums text-muted-foreground/70 text-right">{r.diasTrab}</td>
                        <td className="px-3 py-2.5 tabular-nums text-right">{r.normalH.toFixed(1)}h</td>
                        <td className="px-3 py-2.5 tabular-nums text-right text-orange-600 dark:text-orange-400">{r.extraH.toFixed(1)}h</td>
                        <td className="px-3 py-2.5 tabular-nums font-bold text-right text-blue-600 dark:text-blue-400">{r.totalH.toFixed(1)}h</td>
                        <td className="px-3 py-2.5 tabular-nums text-right text-muted-foreground/60 text-xs">{r.avgRate.toFixed(2)}€</td>
                        <td className="px-3 py-2.5 tabular-nums font-bold text-right text-violet-700 dark:text-violet-300">{fmtCurrency(r.custo)}</td>
                        <td className="px-3 py-2.5 tabular-nums text-right text-emerald-600 dark:text-emerald-400">{r.pago > 0 ? fmtCurrency(r.pago) : <span className="text-muted-foreground/30">—</span>}</td>
                        <td className="px-3 py-2.5 text-right"><PendenteCell value={r.pendente} /></td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 border-t-2 border-border/50 font-black">
                      <td className="px-3 py-3 text-xs uppercase tracking-wider">TOTAL</td>
                      <td />
                      <td className="px-3 py-3 tabular-nums text-right">{rows.reduce((s,r)=>s+r.normalH,0).toFixed(1)}h</td>
                      <td className="px-3 py-3 tabular-nums text-right text-orange-600">{rows.reduce((s,r)=>s+r.extraH,0).toFixed(1)}h</td>
                      <td className="px-3 py-3 tabular-nums text-right text-blue-600">{totals.horas.toFixed(1)}h</td>
                      <td />
                      <td className="px-3 py-3 tabular-nums text-right text-violet-700 dark:text-violet-300">{fmtCurrency(totals.custo)}</td>
                      <td className="px-3 py-3 tabular-nums text-right text-emerald-600">{fmtCurrency(totals.pago)}</td>
                      <td className="px-3 py-3 text-right"><PendenteCell value={totals.pendente} /></td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
