// components/admin/annual-report-modal.tsx
"use client"

import { useState, useMemo } from "react"
import { X, Download, ChevronLeft, ChevronRight, TrendingUp, TrendingDown, Minus, BarChart3, Clock, Euro } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import { buildAnnualRows, fmtCurrency, downloadCSV, type AnnualRow } from "@/lib/report-utils"

const MO = ["J","F","M","A","M","J","J","A","S","O","N","D"]
const ML = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"]

const GRADS = ["from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-violet-500 to-purple-600","from-orange-500 to-amber-500","from-pink-500 to-rose-600","from-cyan-500 to-sky-600"]
function Av({ name }: { name: string }) {
  const i = name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()
  const g = GRADS[name.charCodeAt(0) % GRADS.length]
  return <div className={cn("w-8 h-8 rounded-xl bg-gradient-to-br flex items-center justify-center text-[10px] font-black text-white shrink-0 shadow-sm",g)}>{i}</div>
}

function Trend({ cur, prev }: { cur: number; prev: number }) {
  if (prev===0 || Math.abs(cur-prev)<0.5) return <Minus className="h-2.5 w-2.5 text-muted-foreground/20"/>
  return cur > prev
    ? <TrendingUp className="h-2.5 w-2.5 text-emerald-500"/>
    : <TrendingDown className="h-2.5 w-2.5 text-red-400"/>
}

interface Props { open: boolean; onClose: () => void; collaborators: Collaborator[] }

export function AnnualReportModal({ open, onClose, collaborators }: Props) {
  const [year, setYear] = useState(new Date().getFullYear())
  const curYear = new Date().getFullYear()

  const rows = useMemo(() => buildAnnualRows(collaborators, year), [collaborators, year])

  const monthly = useMemo(() => Array.from({length:12},(_,mi) => ({
    h: rows.reduce((s,r)=>s+r.months[mi].horas,0),
    c: rows.reduce((s,r)=>s+r.months[mi].custo,0),
  })), [rows])

  const maxH = Math.max(...monthly.map(m=>m.h), 1)

  const grand = useMemo(() => ({
    h: rows.reduce((s,r)=>s+r.totH,0),
    c: rows.reduce((s,r)=>s+r.totCost,0),
    p: rows.reduce((s,r)=>s+r.totPaid,0),
  }), [rows])

  const handleCSV = () => {
    const hdrs = ["Colaborador",...ML.map(m=>`${m} H`),...ML.map(m=>`${m} €`),"Total H","Total €","Pago €"]
    downloadCSV(`anual-${year}.csv`, hdrs,
      rows.map(r=>[r.name,...r.months.map(m=>m.horas.toFixed(1)),...r.months.map(m=>m.custo.toFixed(2)),r.totH.toFixed(1),r.totCost.toFixed(2),r.totPaid.toFixed(2)])
    )
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full sm:max-w-3xl max-h-[92dvh] sm:max-h-[90dvh] flex flex-col bg-card rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0">
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          <div className="flex items-center gap-2 px-4 pt-2 pb-3 sm:pt-4 sm:pb-3 border-b border-border/30">
            <div className="w-8 h-8 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center shrink-0">
              <BarChart3 className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>

            {/* Year nav */}
            <button onClick={() => setYear(y=>y-1)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/70 transition-colors active:scale-90">
              <ChevronLeft className="h-4 w-4 text-muted-foreground/60" />
            </button>
            <span className="text-sm font-black w-12 text-center">{year}</span>
            <button onClick={() => setYear(y=>y+1)} disabled={year >= curYear}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/70 disabled:opacity-25 transition-colors active:scale-90">
              <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
            </button>

            <span className="text-sm font-black text-muted-foreground/30 hidden sm:block">Relatório Anual</span>
            <div className="flex-1" />

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
          <div className="grid grid-cols-3 divide-x divide-border/25 border-b border-border/25 bg-muted/5">
            {[
              { label: "Horas",  value: `${grand.h.toFixed(0)}h`,  color: "text-blue-600 dark:text-blue-400",     icon: <Clock className="h-3 w-3"/> },
              { label: "Custo",  value: fmtCurrency(grand.c),       color: "text-violet-600 dark:text-violet-400", icon: <Euro className="h-3 w-3"/> },
              { label: "Pago",   value: fmtCurrency(grand.p),       color: "text-emerald-600 dark:text-emerald-400", icon: <TrendingUp className="h-3 w-3"/> },
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

          {/* Bar chart */}
          <div className="px-4 pt-4 pb-3">
            <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/35 mb-3">Horas por mês</p>
            <div className="flex items-end gap-1 h-16">
              {monthly.map((m, mi) => {
                const pct = maxH > 0 ? (m.h / maxH) * 100 : 0
                const isActive = m.h > 0
                return (
                  <div key={mi} className="flex-1 flex flex-col items-center gap-1 group" title={`${ML[mi]}: ${m.h.toFixed(0)}h`}>
                    <span className="text-[8px] text-muted-foreground/40 font-bold tabular-nums opacity-0 group-hover:opacity-100 transition-opacity">
                      {m.h > 0 ? m.h.toFixed(0) : ""}
                    </span>
                    <div className="w-full flex flex-col justify-end" style={{height:48}}>
                      <div
                        className={cn("w-full rounded-t-sm transition-all duration-500",
                          isActive ? "bg-blue-400/80 dark:bg-blue-500/60" : "bg-muted/20"
                        )}
                        style={{ height: `${pct}%`, minHeight: isActive ? 2 : 0 }}
                      />
                    </div>
                    <span className={cn("text-[8px] font-bold", isActive ? "text-muted-foreground/50" : "text-muted-foreground/20")}>
                      {MO[mi]}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Per collab */}
          {rows.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-12 text-center px-4">
              <BarChart3 className="h-8 w-8 text-muted-foreground/15" />
              <p className="text-sm font-semibold text-muted-foreground/40">Sem dados para {year}</p>
            </div>
          ) : (
            <div className="px-4 pb-6 space-y-3 border-t border-border/20 pt-4">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/35">Por colaborador</p>
              {rows.map(r => {
                const maxRM = Math.max(...r.months.map(m=>m.horas), 1)
                return (
                  <div key={r.id} className="rounded-2xl border border-border/35 bg-card overflow-hidden hover:border-border/60 transition-colors">
                    {/* Collab header */}
                    <div className="flex items-center gap-3 px-4 py-3 border-b border-border/20">
                      <Av name={r.name} />
                      <p className="text-[13px] font-bold truncate flex-1 min-w-0">{r.name}</p>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className="text-xs font-black tabular-nums text-blue-600 dark:text-blue-400">{r.totH.toFixed(0)}h</span>
                        <span className="text-xs font-black tabular-nums text-violet-600 dark:text-violet-400 hidden sm:block">{fmtCurrency(r.totCost)}</span>
                        <span className="text-xs tabular-nums text-emerald-600 dark:text-emerald-400 hidden md:block">{fmtCurrency(r.totPaid)}</span>
                      </div>
                    </div>

                    {/* Month bars */}
                    <div className="grid grid-cols-12 px-2 py-2 gap-0.5">
                      {r.months.map((m,mi) => {
                        const pct = maxRM > 0 ? (m.horas/maxRM)*100 : 0
                        const prev = mi > 0 ? r.months[mi-1] : null
                        return (
                          <div key={mi} className="flex flex-col items-center gap-0.5 group" title={`${ML[mi]}: ${m.horas.toFixed(1)}h`}>
                            <div className="w-full flex flex-col justify-end" style={{height:24}}>
                              <div
                                className={cn("w-full rounded-t-sm transition-all",
                                  m.horas > 0 ? "bg-blue-400/60 dark:bg-blue-500/40" : "bg-muted/15"
                                )}
                                style={{ height: `${Math.max(m.horas>0?8:0, pct*0.24)}px` }}
                              />
                            </div>
                            <span className={cn("text-[7px] font-bold", m.horas>0 ? "text-muted-foreground/40" : "text-muted-foreground/15")}>
                              {MO[mi]}
                            </span>
                            {prev !== null && (
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Trend cur={m.horas} prev={prev.horas} />
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
