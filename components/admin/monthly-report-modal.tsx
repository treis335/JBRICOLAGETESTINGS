// components/admin/monthly-report-modal.tsx
"use client"

import { useState, useMemo } from "react"
import { X, Download, ChevronLeft, ChevronRight, Clock, Euro, TrendingDown, TrendingUp, Users, AlertCircle, CheckCircle2, Info } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import { buildMonthRows, fmtMonthLabel, fmtCurrency, downloadCSV, monthKey, type MonthRow } from "@/lib/report-utils"

function todayKey() { const d = new Date(); return monthKey(d.getFullYear(), d.getMonth()) }
function prevMK(k: string) { const y=+k.slice(0,4),m=+k.slice(5,7)-1; const d=new Date(y,m-1,1); return monthKey(d.getFullYear(),d.getMonth()) }
function nextMK(k: string) { const y=+k.slice(0,4),m=+k.slice(5,7)-1; const d=new Date(y,m+1,1); return monthKey(d.getFullYear(),d.getMonth()) }

function PendentePill({ v }: { v: number }) {
  if (Math.abs(v) < 0.01) return <span className="text-[11px] text-muted-foreground/30 font-medium">—</span>
  const pos = v > 0
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[11px] font-black tabular-nums",
      pos ? "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-900/40"
          : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-900/40"
    )}>
      {pos ? <TrendingDown className="h-2.5 w-2.5"/> : <CheckCircle2 className="h-2.5 w-2.5"/>}
      {pos ? fmtCurrency(v) : `+${fmtCurrency(Math.abs(v))}`}
    </span>
  )
}

// Avatar letter
const GRADS = ["from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-violet-500 to-purple-600","from-orange-500 to-amber-500","from-pink-500 to-rose-600","from-cyan-500 to-sky-600"]
function Av({ name }: { name: string }) {
  const i = name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()
  const g = GRADS[name.charCodeAt(0) % GRADS.length]
  return <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm",g)}>{i}</div>
}

interface Props { open: boolean; onClose: () => void; collaborators: Collaborator[] }

export function MonthlyReportModal({ open, onClose, collaborators }: Props) {
  const [mk, setMk] = useState(todayKey)
  const isCurrent = mk === todayKey()

  const rows = useMemo(() => buildMonthRows(collaborators, mk), [collaborators, mk])
  const tot = useMemo(() => ({
    h: rows.reduce((s,r)=>s+r.totalH,0),
    c: rows.reduce((s,r)=>s+r.custo,0),
    p: rows.reduce((s,r)=>s+r.pago,0),
    pend: rows.reduce((s,r)=>s+r.pendente,0),
    n: rows.length,
  }), [rows])

  const handleCSV = () => downloadCSV(`relatorio-${mk}.csv`,
    ["Nome","Email","Dias","H.Norm","H.Extra","H.Total","Taxa Méd.","Ganhou","Pago","Pendente"],
    rows.map(r=>[r.name,r.email,String(r.diasTrab),r.normalH.toFixed(1),r.extraH.toFixed(1),r.totalH.toFixed(1),r.avgRate.toFixed(2),r.custo.toFixed(2),r.pago.toFixed(2),r.pendente.toFixed(2)])
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      {/* Sheet */}
      <div
        className="relative w-full sm:max-w-2xl max-h-[92dvh] sm:max-h-[88dvh] flex flex-col bg-card rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0">
          {/* Drag handle mobile */}
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          <div className="flex items-center gap-2 px-4 pt-2 pb-3 sm:pt-4 sm:pb-3 border-b border-border/30">
            {/* Month nav */}
            <button onClick={() => setMk(prevMK)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/70 transition-colors active:scale-90">
              <ChevronLeft className="h-4 w-4 text-muted-foreground/60" />
            </button>
            <span className="text-sm font-black capitalize flex-1 text-center tracking-tight">{fmtMonthLabel(mk)}</span>
            <button onClick={() => setMk(nextMK)} disabled={isCurrent}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/70 disabled:opacity-25 transition-colors active:scale-90">
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            </button>

            <div className="w-px h-5 bg-border/40 mx-1 shrink-0" />

            <button onClick={handleCSV} disabled={!rows.length}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border/50 text-xs font-semibold text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-all active:scale-95">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/70 transition-colors active:scale-90 shrink-0">
              <X className="h-4 w-4 text-muted-foreground/60" />
            </button>
          </div>

          {/* KPI strip */}
          <div className="grid grid-cols-4 divide-x divide-border/30 border-b border-border/25 bg-muted/5">
            {[
              { label: "Pessoas",  value: String(tot.n),                color: "text-foreground",                         icon: <Users className="h-3 w-3"/> },
              { label: "Horas",    value: `${tot.h.toFixed(0)}h`,       color: "text-blue-600 dark:text-blue-400",        icon: <Clock className="h-3 w-3"/> },
              { label: "Custo",    value: fmtCurrency(tot.c),           color: "text-violet-600 dark:text-violet-400",    icon: <Euro className="h-3 w-3"/> },
              { label: "Pendente", value: fmtCurrency(Math.abs(tot.pend)), color: tot.pend>0 ? "text-red-600 dark:text-red-400" : "text-emerald-600 dark:text-emerald-400", icon: tot.pend>0 ? <TrendingDown className="h-3 w-3"/> : <CheckCircle2 className="h-3 w-3"/> },
            ].map(k => (
              <div key={k.label} className="flex flex-col items-center py-3 px-1">
                <div className={cn("flex items-center gap-1 mb-1", k.color)}>{k.icon}</div>
                <span className={cn("text-base font-black tabular-nums leading-none", k.color)}>{k.value}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/35 mt-1">{k.label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-16 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-muted/30 flex items-center justify-center">
                <AlertCircle className="h-6 w-6 text-muted-foreground/25" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground/50">Sem dados para {fmtMonthLabel(mk)}</p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              {/* Info note */}
              <div className="flex gap-2 px-4 py-2.5 bg-blue-50/50 dark:bg-blue-950/10 border-b border-blue-100/50 dark:border-blue-900/20">
                <Info className="h-3.5 w-3.5 text-blue-400 shrink-0 mt-0.5" />
                <p className="text-[11px] text-blue-700/70 dark:text-blue-300/60 leading-relaxed">
                  Taxa histórica real por dia · Pendente = Ganhou − Pago neste mês · Verde = pago em excesso
                </p>
              </div>

              {/* Rows */}
              {rows.map((r) => (
                <div key={r.id} className="px-4 py-3.5 hover:bg-muted/15 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <Av name={r.name} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-bold truncate leading-tight">{r.name}</p>
                      <p className="text-[10px] text-muted-foreground/45 mt-0.5 truncate">{r.email}</p>
                    </div>
                    <PendentePill v={r.pendente} />
                  </div>

                  {/* Stats row */}
                  <div className="mt-2.5 ml-11 grid grid-cols-4 gap-x-3 gap-y-1">
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/30">Dias</p>
                      <p className="text-xs font-black tabular-nums">{r.diasTrab}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/30">Horas</p>
                      <p className="text-xs font-black tabular-nums text-blue-600 dark:text-blue-400">
                        {r.totalH.toFixed(1)}h
                        {r.extraH > 0 && <span className="text-orange-500 ml-1 font-bold text-[10px]">+{r.extraH.toFixed(1)}ext</span>}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/30">Ganhou</p>
                      <p className="text-xs font-black tabular-nums text-violet-600 dark:text-violet-400">{fmtCurrency(r.custo)}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/30">Pago</p>
                      <p className={cn("text-xs font-black tabular-nums", r.pago > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground/30")}>
                        {r.pago > 0 ? fmtCurrency(r.pago) : "—"}
                      </p>
                    </div>
                  </div>

                  {/* Progress bar pago vs ganhou */}
                  {r.custo > 0 && (
                    <div className="mt-2 ml-11">
                      <div className="h-1.5 bg-muted/40 rounded-full overflow-hidden">
                        <div
                          className={cn("h-full rounded-full transition-all", r.pago >= r.custo ? "bg-emerald-400" : "bg-blue-400")}
                          style={{ width: `${Math.min(100, (r.pago / r.custo) * 100)}%` }}
                        />
                      </div>
                      <p className="text-[9px] text-muted-foreground/30 mt-0.5 tabular-nums">
                        {Math.min(100, Math.round((r.pago / r.custo) * 100))}% pago · taxa média {r.avgRate.toFixed(2)}€/h
                      </p>
                    </div>
                  )}
                </div>
              ))}

              {/* Footer total */}
              <div className="px-4 py-3.5 bg-muted/10 flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-muted/50 border border-border/40 flex items-center justify-center shrink-0">
                  <Users className="h-3.5 w-3.5 text-muted-foreground/40" />
                </div>
                <span className="text-[11px] font-black uppercase tracking-wider text-muted-foreground/40 flex-1">Total</span>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-black tabular-nums text-blue-600 dark:text-blue-400">{tot.h.toFixed(1)}h</span>
                  <span className="text-xs font-black tabular-nums text-violet-600 dark:text-violet-400">{fmtCurrency(tot.c)}</span>
                  <span className="text-xs font-black tabular-nums text-emerald-600 dark:text-emerald-400">{fmtCurrency(tot.p)}</span>
                  <PendentePill v={tot.pend} />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
