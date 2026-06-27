// components/admin/annual-report-modal.tsx
"use client"

<<<<<<< HEAD
import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { X, FileSpreadsheet, FileText, ChevronLeft, ChevronRight, TrendingUp, Clock, Euro, Users } from "lucide-react"
import { cn, fmt } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"
import { buildCollabMonthData, resolveEntryTaxaFull } from "@/lib/report-utils"

function currentYear() { return new Date().getFullYear() }

interface MonthSummary { month: string; label: string; horas: number; custo: number; pago: number; pendente: number; nAtivos: number }
interface CollabAnnual { name: string; totalH: number; totalCusto: number; totalPago: number; totalPend: number; meses: number }

function buildAnnualData(collaborators: any[], year: number) {
  const months: MonthSummary[] = Array.from({length:12},(_,i)=>{
    const m = String(i+1).padStart(2,"0")
    const key = `${year}-${m}`
    const label = new Date(year,i,1).toLocaleDateString("pt-PT",{month:"short"})
    return { month:key, label, horas:0, custo:0, pago:0, pendente:0, nAtivos:0 }
  })

  const collabs: CollabAnnual[] = []

  collaborators.filter(c=>c.ativo!==false).forEach(collab=>{
    const monthData = buildCollabMonthData(collab)
    let totalH=0, totalC=0, totalP=0, totalPend=0, mesesAtivos=0

    months.forEach(ms=>{
      const md = monthData.find(m=>m.periodo===ms.month)
      if (!md) return
      ms.horas    += md.hours
      ms.custo    += md.cost
      ms.pago     += md.paid
      ms.pendente += md.pending
      if (md.hours>0) { ms.nAtivos++; mesesAtivos++ }
      totalH    += md.hours
      totalC    += md.cost
      totalP    += md.paid
      totalPend += md.pending
    })

    if (totalH>0||totalP>0) collabs.push({ name:collab.name, totalH, totalCusto:totalC, totalPago:totalP, totalPend, meses:mesesAtivos })
  })

  collabs.sort((a,b)=>b.totalH-a.totalH)
  return { months, collabs }
}

// ── Export CSV ────────────────────────────────────────────────────────────────
function exportCSV(months: MonthSummary[], collabs: CollabAnnual[], year: number) {
  const sep=";", n=(v:number)=>String(v).replace(".",",")
  const lines=[
    `Relatório Anual JBricolage${sep}${year}`,
    "",
    "RESUMO MENSAL",
    ["Mês","Horas","Custo (€)","Pago (€)","Pendente (€)","Colaboradores Ativos"].join(sep),
    ...months.filter(m=>m.horas>0||m.pago>0).map(m=>[m.label,n(m.horas),n(m.custo),n(m.pago),n(m.pendente),m.nAtivos].join(sep)),
    ["TOTAL","",n(months.reduce((s,m)=>s+m.horas,0)),n(months.reduce((s,m)=>s+m.custo,0)),n(months.reduce((s,m)=>s+m.pago,0)),n(months.reduce((s,m)=>s+m.pendente,0)),""].join(sep),
    "",
    "RANKING COLABORADORES",
    ["Colaborador","Total Horas","Custo Total (€)","Pago (€)","Pendente (€)","Meses Ativos"].join(sep),
    ...collabs.map(c=>[c.name,n(c.totalH),n(c.totalCusto),n(c.totalPago),n(c.totalPend),c.meses].join(sep)),
  ]
  const blob=new Blob(["\uFEFF"+lines.join("\r\n")],{type:"text/csv;charset=utf-8;"})
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob)
  a.download=`relatorio-anual-${year}.csv`; a.click(); URL.revokeObjectURL(a.href)
}

// ── Export PDF ────────────────────────────────────────────────────────────────
async function exportPDF(months: MonthSummary[], collabs: CollabAnnual[], year: number) {
  const {default:jsPDF}=await import("jspdf")
  const {default:autoTable}=await import("jspdf-autotable")
  const doc=new jsPDF({orientation:"landscape",unit:"mm",format:"a4"})

  doc.setFontSize(18); doc.setFont("helvetica","bold")
  doc.text(`JBricolage — Relatório Anual ${year}`,14,18)
  doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(100)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-PT")}`,14,25)

  const activeMonths=months.filter(m=>m.horas>0||m.pago>0)
  autoTable(doc,{
    startY:30,
    head:[["Mês","Horas","Custo","Pago","Pendente","Ativos"]],
    body:[
      ...activeMonths.map(m=>[m.label,`${m.horas.toFixed(1)}h`,`${m.custo.toFixed(2)}€`,`${m.pago.toFixed(2)}€`,`${m.pendente.toFixed(2)}€`,m.nAtivos]),
      [{content:"TOTAL",styles:{fontStyle:"bold"}},"",
        {content:`${months.reduce((s,m)=>s+m.custo,0).toFixed(2)}€`,styles:{fontStyle:"bold"}},
        {content:`${months.reduce((s,m)=>s+m.pago,0).toFixed(2)}€`,styles:{fontStyle:"bold"}},
        {content:`${months.reduce((s,m)=>s+m.pendente,0).toFixed(2)}€`,styles:{fontStyle:"bold"}},
        "",
      ],
    ],
    styles:{fontSize:9,cellPadding:2.5},
    headStyles:{fillColor:[30,41,59],textColor:255,fontStyle:"bold"},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{1:{halign:"right"},2:{halign:"right"},3:{halign:"right"},4:{halign:"right"},5:{halign:"center"}},
  })

  const y2 = (doc as any).lastAutoTable.finalY+10
  doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(0)
  doc.text("Ranking de Colaboradores",14,y2)

  autoTable(doc,{
    startY:y2+5,
    head:[["Colaborador","Total Horas","Custo Total","Pago","Pendente","Meses Ativos"]],
    body:collabs.map(c=>[c.name,`${c.totalH.toFixed(1)}h`,`${c.totalCusto.toFixed(2)}€`,`${c.totalPago.toFixed(2)}€`,`${c.totalPend.toFixed(2)}€`,c.meses]),
    styles:{fontSize:9,cellPadding:2.5},
    headStyles:{fillColor:[15,23,42],textColor:255,fontStyle:"bold"},
    alternateRowStyles:{fillColor:[248,250,252]},
    columnStyles:{1:{halign:"right"},2:{halign:"right"},3:{halign:"right"},4:{halign:"right"},5:{halign:"center"}},
  })
  doc.save(`relatorio-anual-${year}.pdf`)
}

// ── Component ─────────────────────────────────────────────────────────────────
export function AnnualReportModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { collaborators, loading } = useCollaborators()
  const [year, setYear]     = useState(currentYear)
  const [tab,  setTab]      = useState<"mensal"|"colaboradores">("mensal")
  const [exporting, setExp] = useState<"csv"|"pdf"|null>(null)
  useEffect(()=>{ if(open) setYear(currentYear()) },[open])

  const { months, collabs } = useMemo(()=>buildAnnualData(collaborators,year),[collaborators,year])

  const totals = useMemo(()=>({
    horas:    months.reduce((s,m)=>s+m.horas,0),
    custo:    months.reduce((s,m)=>s+m.custo,0),
    pago:     months.reduce((s,m)=>s+m.pago,0),
    pendente: months.reduce((s,m)=>s+m.pendente,0),
  }),[months])

  async function doExport(type:"csv"|"pdf") {
    setExp(type)
    try {
      if(type==="csv") exportCSV(months,collabs,year)
      else await exportPDF(months,collabs,year)
    } finally { setExp(null) }
  }

  const hasData = totals.horas>0||totals.pago>0

  return (
    <Dialog open={open} onOpenChange={v=>!v&&onClose()}>
      <DialogContent className={cn(
        "p-0 gap-0 border-0 shadow-2xl overflow-hidden flex flex-col [&>button]:hidden",
        "max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0",
        "sm:w-[860px] sm:max-w-[96vw] sm:max-h-[90dvh] sm:rounded-3xl",
      )}>
        <DialogTitle className="sr-only">Relatório Anual</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-violet-100 dark:bg-violet-950/40 flex items-center justify-center">
              <TrendingUp className="h-4 w-4 text-violet-600 dark:text-violet-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Relatório Anual</p>
              <p className="text-xs text-muted-foreground">Tendências e KPIs por mês</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Year nav */}
        <div className="flex items-center justify-between px-5 py-3 border-b bg-muted/20 shrink-0">
          <button onClick={()=>setYear(y=>y-1)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <p className="text-sm font-bold">{year}</p>
          <button onClick={()=>setYear(y=>y+1)} disabled={year>=currentYear()}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none">
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* KPIs */}
        {!loading && hasData && (
          <div className="grid grid-cols-4 divide-x border-b shrink-0">
            {[
              {icon:Users,       label:"Colaboradores", value:`${collabs.length}`,          color:"text-foreground"},
              {icon:Clock,       label:"Horas Anuais",  value:`${totals.horas.toFixed(1)}h`,color:"text-blue-600 dark:text-blue-400"},
              {icon:Euro,        label:"Custo Total",   value:fmt(totals.custo),             color:"text-violet-600 dark:text-violet-400"},
              {icon:TrendingUp,  label:"Pendente",      value:fmt(totals.pendente),          color:totals.pendente>0?"text-amber-600 dark:text-amber-400":"text-emerald-600 dark:text-emerald-400"},
            ].map(({icon:Icon,label,value,color})=>(
              <div key={label} className="px-3 py-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className={cn("text-sm font-bold tabular-nums truncate",color)}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b shrink-0 px-5">
          {(["mensal","colaboradores"] as const).map(t=>(
            <button key={t} onClick={()=>setTab(t)}
              className={cn("py-2.5 px-3 text-xs font-semibold border-b-2 transition-colors capitalize",
                t===tab ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground")}>
              {t==="mensal" ? "Por Mês" : "Por Colaborador"}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : !hasData ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <TrendingUp className="h-10 w-10 opacity-15" />
              <p className="text-sm font-medium">Sem dados para {year}</p>
            </div>
          ) : tab==="mensal" ? (
            <table className="w-full text-sm min-w-[500px]">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                <tr className="border-b border-border/30">
                  {["Mês","Horas","Custo","Pago","Pendente","Ativos"].map(h=>(
                    <th key={h} className={cn("text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3",
                      h==="Mês"?"text-left pl-5":"text-right",h==="Ativos"&&"pr-5")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {months.map((m,i)=>(
                  <tr key={m.month} className={cn("border-b border-border/15 hover:bg-muted/20",
                    i%2===1&&"bg-muted/10", m.horas===0&&m.pago===0&&"opacity-30")}>
                    <td className="py-2.5 pl-5 pr-3 font-semibold capitalize">{m.label}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">{m.horas>0?`${m.horas.toFixed(1)}h`:"—"}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-violet-600 dark:text-violet-400">{m.custo>0?fmt(m.custo):"—"}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{m.pago>0?fmt(m.pago):"—"}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {m.pendente>0
                        ? <span className="text-amber-600 dark:text-amber-400 font-semibold">{fmt(m.pendente)}</span>
                        : m.custo>0 ? <span className="text-emerald-500 text-xs">✓ Pago</span> : "—"}
                    </td>
                    <td className="py-2.5 pl-3 pr-5 text-right tabular-nums text-muted-foreground">{m.nAtivos>0?m.nAtivos:"—"}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-border/40 bg-muted/30">
                  <td className="py-3 pl-5 pr-3 text-xs font-bold uppercase text-muted-foreground">Total</td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums">{totals.horas.toFixed(1)}h</td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums text-violet-600 dark:text-violet-400">{fmt(totals.custo)}</td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(totals.pago)}</td>
                  <td className="py-3 px-3 text-right font-bold tabular-nums text-amber-600 dark:text-amber-400">{fmt(totals.pendente)}</td>
                  <td className="py-3 pl-3 pr-5 text-right font-bold tabular-nums text-muted-foreground">{collabs.length}</td>
                </tr>
              </tfoot>
            </table>
          ) : (
            <table className="w-full text-sm min-w-[500px]">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                <tr className="border-b border-border/30">
                  {["#","Colaborador","Total Horas","Custo Total","Pago","Pendente","Meses Ativos"].map(h=>(
                    <th key={h} className={cn("text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3",
                      h==="Colaborador"||h==="#"?"text-left":h==="Meses Ativos"?"text-right pr-5":"text-right")}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {collabs.map((c,i)=>(
                  <tr key={c.name} className={cn("border-b border-border/15 hover:bg-muted/20",i%2===1&&"bg-muted/10")}>
                    <td className="py-2.5 pl-5 pr-2 text-muted-foreground/40 text-xs font-bold tabular-nums">{i+1}</td>
                    <td className="py-2.5 pr-3 font-semibold">{c.name}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold text-blue-600 dark:text-blue-400">{c.totalH.toFixed(1)}h</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-violet-600 dark:text-violet-400">{fmt(c.totalCusto)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-emerald-600 dark:text-emerald-400">{fmt(c.totalPago)}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {c.totalPend>0
                        ? <span className="text-amber-600 dark:text-amber-400 font-semibold">{fmt(c.totalPend)}</span>
                        : <span className="text-emerald-500 text-xs">✓</span>}
                    </td>
                    <td className="py-2.5 pl-3 pr-5 text-right tabular-nums text-muted-foreground">{c.meses}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        {hasData && (
          <div className="shrink-0 px-5 py-4 border-t bg-background flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">{year} · {collabs.length} colaboradores</p>
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
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
=======
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
>>>>>>> 3a5b66b859f3a0b5609fab17915379d15e1752c7
  )
}
