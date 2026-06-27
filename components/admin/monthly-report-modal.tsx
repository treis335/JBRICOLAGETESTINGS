// components/admin/monthly-report-modal.tsx
"use client"

<<<<<<< HEAD
import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { X, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, Clock, Euro, CheckCircle2, AlertCircle, Users } from "lucide-react"
import { cn, fmt } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"
import { buildMonthRows, type MonthRow } from "@/lib/report-utils"

function getTodayKey() { return new Date().toISOString().slice(0, 7) }
function fmtLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  return new Date(y, m-1, 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" })
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(rows: MonthRow[], monthKey: string, label: string) {
  const sep = ";"
  const n   = (v: number) => String(v).replace(".", ",")
  const esc = (v: string|number) => { const s=String(v); return (s.includes(sep)||s.includes('"')) ? `"${s.replace(/"/g,'""')}"` : s }
  const lines = [
    `Relatório Mensal JBricolage${sep}${label}`,
    "",
    ["Colaborador","Email","Taxa €/h","H. Normais","H. Extra","Total Horas","Custo (€)","Pago (€)","Pendente (€)"].map(esc).join(sep),
    ...rows.map(r => [esc(r.name),esc(r.email),n(r.rate),n(r.normalHoras),n(r.extraHoras),n(r.totalHoras),n(r.custo),n(r.pago),n(r.pendente)].join(sep)),
    "",
    ["TOTAL","","",
      n(rows.reduce((s,r)=>s+r.normalHoras,0)),
      n(rows.reduce((s,r)=>s+r.extraHoras,0)),
      n(rows.reduce((s,r)=>s+r.totalHoras,0)),
      n(rows.reduce((s,r)=>s+r.custo,0)),
      n(rows.reduce((s,r)=>s+r.pago,0)),
      n(rows.reduce((s,r)=>s+r.pendente,0)),
    ].join(sep),
  ]
  const blob = new Blob(["\uFEFF"+lines.join("\r\n")], { type:"text/csv;charset=utf-8;" })
  const a = document.createElement("a"); a.href = URL.createObjectURL(blob)
  a.download = `relatorio-mensal-${monthKey}.csv`; a.click(); URL.revokeObjectURL(a.href)
}

// ── Export PDF ────────────────────────────────────────────────────────────────
async function exportPDF(rows: MonthRow[], monthKey: string, label: string) {
  const { default: jsPDF }    = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" })

  doc.setFontSize(18); doc.setFont("helvetica","bold")
  doc.text("JBricolage — Relatório Mensal", 14, 18)
  doc.setFontSize(10); doc.setFont("helvetica","normal"); doc.setTextColor(100)
  doc.text(`Período: ${label}`, 14, 26)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-PT")}`, 14, 31)

  const totH = rows.reduce((s,r)=>s+r.totalHoras,0)
  const totC = rows.reduce((s,r)=>s+r.custo,0)
  const totP = rows.reduce((s,r)=>s+r.pago,0)
  const totPend = rows.reduce((s,r)=>s+r.pendente,0)
  doc.setTextColor(0); doc.setFontSize(9)
  doc.text(`${rows.length} colaboradores · ${totH.toFixed(1)}h · Custo: ${totC.toFixed(2)}€ · Pago: ${totP.toFixed(2)}€ · Pendente: ${totPend.toFixed(2)}€`, 14, 38)

  autoTable(doc, {
    startY: 44,
    head: [["Colaborador","Taxa €/h","H. Norm.","H. Extra","Total H.","Custo","Pago","Pendente"]],
    body: [
      ...rows.map(r=>[
        r.name, `${r.rate.toFixed(2)}€`,
        `${r.normalHoras.toFixed(1)}h`, `${r.extraHoras.toFixed(1)}h`, `${r.totalHoras.toFixed(1)}h`,
        `${r.custo.toFixed(2)}€`, `${r.pago.toFixed(2)}€`, `${r.pendente.toFixed(2)}€`,
      ]),
      [{ content:"TOTAL", styles:{fontStyle:"bold"} },"",
        { content:`${rows.reduce((s,r)=>s+r.normalHoras,0).toFixed(1)}h`, styles:{fontStyle:"bold"} },
        { content:`${rows.reduce((s,r)=>s+r.extraHoras,0).toFixed(1)}h`,  styles:{fontStyle:"bold"} },
        { content:`${totH.toFixed(1)}h`,    styles:{fontStyle:"bold"} },
        { content:`${totC.toFixed(2)}€`,    styles:{fontStyle:"bold"} },
        { content:`${totP.toFixed(2)}€`,    styles:{fontStyle:"bold"} },
        { content:`${totPend.toFixed(2)}€`, styles:{fontStyle:"bold"} },
      ],
    ],
    styles:{ fontSize:9, cellPadding:2.5 },
    headStyles:{ fillColor:[30,41,59], textColor:255, fontStyle:"bold" },
    alternateRowStyles:{ fillColor:[248,250,252] },
    columnStyles:{ 0:{cellWidth:48}, 1:{halign:"right"}, 2:{halign:"right"}, 3:{halign:"right"}, 4:{halign:"right"}, 5:{halign:"right"}, 6:{halign:"right"}, 7:{halign:"right"} },
    didParseCell: (data) => {
      if (data.column.index===7 && data.section==="body" && data.row.index<rows.length) {
        if ((rows[data.row.index]?.pendente??0)>0) data.cell.styles.textColor=[180,83,9]
      }
    },
  })
  doc.save(`relatorio-mensal-${monthKey}.pdf`)
}

// ── Component ─────────────────────────────────────────────────────────────────
export function MonthlyReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { collaborators, loading } = useCollaborators()
  const [monthKey, setMonthKey]   = useState(getTodayKey)
  const [exporting, setExporting] = useState<"csv"|"pdf"|null>(null)
  useEffect(() => { if (open) setMonthKey(getTodayKey()) }, [open])

  const rows  = useMemo(() => buildMonthRows(collaborators, monthKey), [collaborators, monthKey])
  const label = fmtLabel(monthKey)

  const totals = useMemo(() => ({
    horas:    rows.reduce((s,r)=>s+r.totalHoras,0),
    custo:    rows.reduce((s,r)=>s+r.custo,0),
    pago:     rows.reduce((s,r)=>s+r.pago,0),
    pendente: rows.reduce((s,r)=>s+r.pendente,0),
  }), [rows])

  function nav(dir: 1|-1) {
    const [y,m] = monthKey.split("-").map(Number)
    const d = new Date(y,m-1+dir,1)
    setMonthKey(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`)
  }

  async function doExport(type:"csv"|"pdf") {
    setExporting(type)
    try {
      if (type==="csv") exportCSV(rows,monthKey,label)
      else await exportPDF(rows,monthKey,label)
    } finally { setExporting(null) }
  }

  return (
    <Dialog open={open} onOpenChange={v=>!v&&onClose()}>
      <DialogContent className={cn(
        "p-0 gap-0 border-0 shadow-2xl overflow-hidden flex flex-col [&>button]:hidden",
        "max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0",
        "sm:w-[820px] sm:max-w-[96vw] sm:max-h-[90dvh] sm:rounded-3xl",
      )}>
        <DialogTitle className="sr-only">Relatório Mensal</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center">
              <FileSpreadsheet className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Relatório Mensal</p>
              <p className="text-xs text-muted-foreground">Taxa histórica · Pendente real</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Month nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/20 shrink-0">
          <button onClick={()=>nav(-1)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <p className="text-sm font-bold capitalize">{label}</p>
          <button onClick={()=>nav(1)} disabled={monthKey>=getTodayKey()}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* KPIs */}
        {!loading && rows.length>0 && (
          <div className="grid grid-cols-4 divide-x border-b shrink-0">
            {[
              { icon:Users,        label:"Ativos",  value:`${rows.length}`,      color:"text-foreground" },
              { icon:Clock,        label:"Horas",   value:`${totals.horas.toFixed(1)}h`, color:"text-blue-600 dark:text-blue-400" },
              { icon:Euro,         label:"Custo",   value:fmt(totals.custo),     color:"text-violet-600 dark:text-violet-400" },
              { icon:AlertCircle,  label:"Pendente",value:fmt(totals.pendente),  color:totals.pendente>0?"text-amber-600 dark:text-amber-400":"text-emerald-600 dark:text-emerald-400" },
            ].map(({icon:Icon,label,value,color})=>(
              <div key={label} className="px-3 py-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className={cn("text-sm font-bold tabular-nums truncate",color)}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : rows.length===0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Clock className="h-10 w-10 opacity-15" />
              <p className="text-sm font-medium">Sem registos para {label}</p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                <tr className="border-b border-border/30">
                  {["Colaborador","Taxa","H. Norm.","H. Extra","Total H.","Custo","Pago","Pendente"].map(h=>(
                    <th key={h} className={cn("text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3",h==="Colaborador"?"text-left pl-5":"text-right",h==="Pendente"&&"pr-5")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={r.email} className={cn("border-b border-border/15 hover:bg-muted/20", i%2===1&&"bg-muted/10")}>
                    <td className="py-3 pl-5 pr-3">
                      <p className="font-semibold text-sm">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{r.email}</p>
                    </td>
                    <td className="py-3 px-3 text-right text-[11px] text-muted-foreground tabular-nums">{r.rate.toFixed(2)}€</td>
                    <td className="py-3 px-3 text-right tabular-nums font-medium">{r.normalHoras.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {r.extraHoras>0 ? <span className="text-amber-600 dark:text-amber-400 font-medium">{r.extraHoras.toFixed(1)}h</span> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">{r.totalHoras.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold text-violet-600 dark:text-violet-400">{fmt(r.custo)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {r.pago>0 ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(r.pago)}</span> : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right tabular-nums">
                      {r.pendente>0
                        ? <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400"><AlertCircle className="h-3 w-3"/>{fmt(r.pendente)}</span>
                        : <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold"><CheckCircle2 className="h-3 w-3"/>Pago</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/40 bg-muted/30">
                  <td className="py-3 pl-5 pr-3 text-xs font-bold uppercase tracking-wide text-muted-foreground" colSpan={2}>Total</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold">{rows.reduce((s,r)=>s+r.normalHoras,0).toFixed(1)}h</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-amber-600 dark:text-amber-400">{rows.reduce((s,r)=>s+r.extraHoras,0).toFixed(1)}h</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold">{totals.horas.toFixed(1)}h</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-violet-600 dark:text-violet-400">{fmt(totals.custo)}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{fmt(totals.pago)}</td>
                  <td className="py-3 pl-3 pr-5 text-right tabular-nums font-bold text-amber-600 dark:text-amber-400">{fmt(totals.pendente)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* Footer */}
        {rows.length>0 && (
          <div className="shrink-0 px-5 py-4 border-t bg-background flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">{rows.length} colaborador{rows.length!==1?"es":""} · {label}</p>
            <div className="flex gap-2 w-full sm:w-auto">
              <button onClick={()=>doExport("csv")} disabled={!!exporting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-md shadow-emerald-600/20">
                <FileSpreadsheet className="h-4 w-4"/>
                {exporting==="csv"?"A exportar…":"Excel (.csv)"}
              </button>
              <button onClick={()=>doExport("pdf")} disabled={!!exporting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-md shadow-blue-600/20">
                <FileText className="h-4 w-4"/>
                {exporting==="pdf"?"A exportar…":"PDF"}
              </button>
=======
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
>>>>>>> 3a5b66b859f3a0b5609fab17915379d15e1752c7
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
