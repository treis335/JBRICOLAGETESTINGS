// components/admin/rate-history-modal.tsx
"use client"

import { useMemo, useState } from "react"
<<<<<<< HEAD
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { X, FileText, History, TrendingUp, TrendingDown, Minus, Search } from "lucide-react"
import { cn, fmt } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"

interface HistoryRow {
  collaborator: string
  taxa: number
  taxaAnterior: number | null
  data: string
  alteradoPor: string
  motivo?: string
  delta: number
}

function buildRows(collaborators: any[]): HistoryRow[] {
  const rows: HistoryRow[] = []
  collaborators.forEach(c => {
    const hist: any[] = c.rateHistory || []
    hist.forEach(h => {
      rows.push({
        collaborator: c.name,
        taxa:         h.taxa,
        taxaAnterior: h.taxaAnterior ?? null,
        data:         h.data || "",
        alteradoPor:  h.alteradoPor || "—",
        motivo:       h.motivo || "",
        delta:        h.taxaAnterior != null ? h.taxa - h.taxaAnterior : 0,
      })
    })
  })
  return rows.sort((a,b) => b.data.localeCompare(a.data))
}

async function exportPDF(rows: HistoryRow[], collaborators: any[]) {
  const { default: jsPDF }     = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")
  const doc = new jsPDF({ orientation:"landscape", unit:"mm", format:"a4" })

  doc.setFontSize(18); doc.setFont("helvetica","bold")
  doc.text("JBricolage — Histórico de Taxas Horárias", 14, 18)
  doc.setFontSize(9); doc.setFont("helvetica","normal"); doc.setTextColor(100)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-PT")} · ${rows.length} alterações registadas`, 14, 26)

  autoTable(doc, {
    startY: 32,
    head: [["Data","Colaborador","Taxa Anterior","Nova Taxa","Variação","Alterado Por","Motivo"]],
    body: rows.map(r => [
      r.data ? new Date(r.data).toLocaleDateString("pt-PT") : "—",
      r.collaborator,
      r.taxaAnterior != null ? `${r.taxaAnterior.toFixed(2)}€/h` : "—",
      `${r.taxa.toFixed(2)}€/h`,
      r.taxaAnterior != null ? (r.delta>=0?"+":"")+r.delta.toFixed(2)+"€" : "Inicial",
      r.alteradoPor,
      r.motivo || "—",
    ]),
    styles:{ fontSize:8.5, cellPadding:2.5 },
    headStyles:{ fillColor:[30,41,59], textColor:255, fontStyle:"bold" },
    alternateRowStyles:{ fillColor:[248,250,252] },
    columnStyles:{
      0:{cellWidth:24},1:{cellWidth:40},2:{halign:"right",cellWidth:28},
      3:{halign:"right",cellWidth:24},4:{halign:"right",cellWidth:22},
      5:{cellWidth:34},6:{cellWidth:"auto" as any},
    },
    didParseCell:(data)=>{
      if(data.column.index===4&&data.section==="body") {
        const v=data.cell.text[0]
        if(v.startsWith("+")) data.cell.styles.textColor=[22,163,74]
        else if(v.startsWith("-")) data.cell.styles.textColor=[220,38,38]
      }
    },
  })

  // Summary per collaborator
  const finalY = (doc as any).lastAutoTable.finalY + 10
  if (finalY < 190) {
    doc.setFontSize(12); doc.setFont("helvetica","bold"); doc.setTextColor(0)
    doc.text("Taxa Atual por Colaborador", 14, finalY)

    autoTable(doc, {
      startY: finalY + 5,
      head: [["Colaborador","Taxa Atual","Nº Alterações"]],
      body: collaborators.filter(c=>c.ativo!==false&&c.currentRate>0).sort((a,b)=>b.currentRate-a.currentRate).map(c=>[
        c.name, `${c.currentRate.toFixed(2)}€/h`, (c.rateHistory||[]).length,
      ]),
      styles:{ fontSize:9, cellPadding:2.5 },
      headStyles:{ fillColor:[15,23,42], textColor:255, fontStyle:"bold" },
      alternateRowStyles:{ fillColor:[248,250,252] },
      columnStyles:{ 1:{halign:"right"}, 2:{halign:"center"} },
    })
  }
  doc.save("historico-taxas.pdf")
}

// ── Component ─────────────────────────────────────────────────────────────────
export function RateHistoryModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { collaborators, loading } = useCollaborators()
  const [search, setSearch]   = useState("")
  const [exporting, setExp]   = useState(false)

  const allRows = useMemo(() => buildRows(collaborators), [collaborators])

  const rows = useMemo(() => {
    if (!search.trim()) return allRows
    const q = search.toLowerCase()
    return allRows.filter(r =>
      r.collaborator.toLowerCase().includes(q) ||
      r.alteradoPor.toLowerCase().includes(q)  ||
      (r.motivo||"").toLowerCase().includes(q)
    )
  }, [allRows, search])

  async function doExport() {
    setExp(true)
    try { await exportPDF(allRows, collaborators) }
    finally { setExp(false) }
  }

  return (
    <Dialog open={open} onOpenChange={v=>!v&&onClose()}>
      <DialogContent className={cn(
        "p-0 gap-0 border-0 shadow-2xl overflow-hidden flex flex-col [&>button]:hidden",
        "max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0",
        "sm:w-[780px] sm:max-w-[96vw] sm:max-h-[90dvh] sm:rounded-3xl",
      )}>
        <DialogTitle className="sr-only">Histórico de Taxas</DialogTitle>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/40 flex items-center justify-center">
              <History className="h-4 w-4 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Histórico de Taxas</p>
              <p className="text-xs text-muted-foreground">{allRows.length} alterações registadas</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Search */}
        <div className="px-5 py-3 border-b shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground/50" />
            <input value={search} onChange={e=>setSearch(e.target.value)}
              placeholder="Filtrar por colaborador, motivo…"
              className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/50 bg-muted/30 text-sm placeholder:text-muted-foreground/40 focus:outline-none focus:ring-2 focus:ring-primary/20" />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : rows.length===0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <History className="h-10 w-10 opacity-15" />
              <p className="text-sm font-medium">{search ? "Sem resultados" : "Sem histórico de taxas"}</p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[560px]">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                <tr className="border-b border-border/30">
                  {["Data","Colaborador","Anterior","Nova Taxa","Δ","Alterado Por","Motivo"].map(h=>(
                    <th key={h} className={cn(
                      "text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3",
                      h==="Data"||h==="Colaborador"||h==="Alterado Por"||h==="Motivo" ? "text-left" : "text-right",
                      h==="Data"&&"pl-5", h==="Motivo"&&"pr-5"
                    )}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r,i)=>(
                  <tr key={i} className={cn("border-b border-border/15 hover:bg-muted/20",i%2===1&&"bg-muted/10")}>
                    <td className="py-2.5 pl-5 pr-3 text-[11px] text-muted-foreground tabular-nums whitespace-nowrap">
                      {r.data ? new Date(r.data).toLocaleDateString("pt-PT") : "—"}
                    </td>
                    <td className="py-2.5 px-3 font-semibold">{r.collaborator}</td>
                    <td className="py-2.5 px-3 text-right tabular-nums text-muted-foreground text-[11px]">
                      {r.taxaAnterior != null ? `${r.taxaAnterior.toFixed(2)}€/h` : <span className="text-muted-foreground/30">—</span>}
                    </td>
                    <td className="py-2.5 px-3 text-right tabular-nums font-bold">{r.taxa.toFixed(2)}€/h</td>
                    <td className="py-2.5 px-3 text-right tabular-nums">
                      {r.taxaAnterior == null ? (
                        <span className="text-[10px] text-muted-foreground/50">Inicial</span>
                      ) : r.delta > 0 ? (
                        <span className="flex items-center justify-end gap-0.5 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px]">
                          <TrendingUp className="h-3 w-3"/>+{r.delta.toFixed(2)}€
                        </span>
                      ) : r.delta < 0 ? (
                        <span className="flex items-center justify-end gap-0.5 text-red-500 font-semibold text-[11px]">
                          <TrendingDown className="h-3 w-3"/>{r.delta.toFixed(2)}€
                        </span>
                      ) : (
                        <span className="flex items-center justify-end gap-0.5 text-muted-foreground/40 text-[11px]">
                          <Minus className="h-3 w-3"/>0€
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-[11px] text-muted-foreground">{r.alteradoPor}</td>
                    <td className="py-2.5 pl-3 pr-5 text-[11px] text-muted-foreground/60 max-w-[140px] truncate">{r.motivo||"—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 px-5 py-4 border-t bg-background flex items-center justify-between gap-3">
          <p className="text-xs text-muted-foreground hidden sm:block">
            {rows.length} {search?"resultado":"alteração"}{rows.length!==1?"s":""}
          </p>
          <button onClick={doExport} disabled={exporting||allRows.length===0}
            className="flex items-center justify-center gap-2 h-10 px-5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-sm font-semibold transition-all disabled:opacity-50 shadow-md shadow-amber-600/20">
            <FileText className="h-4 w-4"/>
            {exporting ? "A exportar…" : "Exportar PDF"}
          </button>
        </div>
      </DialogContent>
    </Dialog>
=======
import { X, Download, TrendingUp, TrendingDown, Search, Euro, History } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import { buildRateRows, fmtCurrency, downloadCSV, type RateRow } from "@/lib/report-utils"

const GRADS = ["from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-violet-500 to-purple-600","from-orange-500 to-amber-500","from-pink-500 to-rose-600","from-cyan-500 to-sky-600"]
function Av({ name, size="sm" }: { name: string; size?: "xs"|"sm" }) {
  const i = name.split(" ").filter(Boolean).slice(0,2).map(w=>w[0]).join("").toUpperCase()
  const g = GRADS[name.charCodeAt(0) % GRADS.length]
  const d = size==="xs" ? "w-6 h-6 text-[8px]" : "w-8 h-8 text-[10px]"
  return <div className={cn("rounded-xl bg-gradient-to-br flex items-center justify-center font-black text-white shrink-0 shadow-sm",d,g)}>{i}</div>
}

function DeltaBadge({ delta }: { delta?: number }) {
  if (delta === undefined || Math.abs(delta) < 0.01) return (
    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 border border-blue-200/60 dark:border-blue-800/40">
      Inicial
    </span>
  )
  const up = delta > 0
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black border",
      up ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200/60 dark:border-emerald-800/40"
         : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200/60 dark:border-red-800/40"
    )}>
      {up ? <TrendingUp className="h-2.5 w-2.5"/> : <TrendingDown className="h-2.5 w-2.5"/>}
      {up ? "+" : ""}{delta.toFixed(2)}€/h
    </span>
  )
}

interface Props { open: boolean; onClose: () => void; collaborators: Collaborator[] }

export function RateHistoryModal({ open, onClose, collaborators }: Props) {
  const [search, setSearch] = useState("")

  const rows = useMemo(() => buildRateRows(collaborators), [collaborators])

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(r =>
      r.collabName.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      (r.note||"").toLowerCase().includes(q)
    )
  }, [rows, search])

  const summary = useMemo(() => {
    const map = new Map<string, { name:string; count:number; initial:number; current:number; delta:number }>()
    collaborators.filter(c=>c.ativo!==false).forEach(c => {
      const s = [...c.rateHistory].sort((a,b)=>a.date.localeCompare(b.date))
      if (s.length > 0) {
        const initial = s[0].rate
        const current = s[s.length-1].rate
        map.set(c.id, { name:c.name, count:s.length, initial, current, delta: current-initial })
      }
    })
    return [...map.values()].sort((a,b)=>a.name.localeCompare(b.name,"pt"))
  }, [collaborators])

  const handleCSV = () => downloadCSV("historico-taxas.csv",
    ["Colaborador","Data","Taxa €/h","Alteração","Nota"],
    filtered.map(r=>[r.collabName, r.date, r.rate.toFixed(2),
      r.delta!==undefined ? (r.delta>=0?`+${r.delta.toFixed(2)}`:r.delta.toFixed(2)) : "Inicial",
      r.note||""
    ])
  )

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div
        className="relative w-full sm:max-w-xl max-h-[92dvh] sm:max-h-[88dvh] flex flex-col bg-card rounded-t-3xl sm:rounded-3xl border border-border/50 shadow-2xl overflow-hidden animate-slide-up sm:animate-scale-in"
        onClick={e => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="shrink-0">
          <div className="flex justify-center pt-3 pb-1 sm:hidden">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>

          <div className="flex items-center gap-2 px-4 pt-2 pb-3 sm:pt-4 sm:pb-3 border-b border-border/30">
            <div className="w-8 h-8 rounded-xl bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
              <History className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-sm font-black flex-1">Histórico de Taxas</p>
            <button onClick={handleCSV} disabled={!filtered.length}
              className="flex items-center gap-1.5 h-8 px-3 rounded-xl border border-border/50 text-xs font-semibold text-muted-foreground hover:bg-muted/50 disabled:opacity-30 transition-all active:scale-95">
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>
            <button onClick={onClose}
              className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/70 transition-colors active:scale-90 shrink-0">
              <X className="h-4 w-4 text-muted-foreground/60" />
            </button>
          </div>

          {/* Summary chips */}
          {summary.length > 0 && (
            <div className="px-4 py-3 border-b border-border/25 bg-muted/5">
              <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/35 mb-2">Taxa atual por colaborador</p>
              <div className="flex flex-wrap gap-2">
                {summary.map(s => (
                  <div key={s.name} className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl border border-border/35 bg-card hover:border-border/60 transition-colors">
                    <Av name={s.name} size="xs" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold truncate leading-tight">{s.name.split(" ")[0]}</p>
                      <p className="text-[10px] font-black tabular-nums text-orange-600 dark:text-orange-400 leading-tight">{fmtCurrency(s.current)}/h</p>
                    </div>
                    {s.delta !== 0 && (
                      <span className={cn(
                        "text-[9px] font-black",
                        s.delta > 0 ? "text-emerald-500" : "text-red-400"
                      )}>
                        {s.delta > 0 ? "▲" : "▼"}{Math.abs(s.delta).toFixed(2)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="px-4 py-2.5 border-b border-border/25">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/35" />
              <input
                type="text"
                placeholder="Pesquisar por nome, data ou nota…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full h-9 pl-9 pr-3 rounded-xl border border-border/50 bg-muted/20 text-sm placeholder:text-muted-foreground/35 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary/40 transition-all"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-muted-foreground/20 flex items-center justify-center hover:bg-muted-foreground/30 transition-colors">
                  <X className="h-2.5 w-2.5 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-y-auto min-h-0">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center gap-3 py-14 text-center px-4">
              <div className="w-12 h-12 rounded-2xl bg-muted/25 flex items-center justify-center">
                <Euro className="h-6 w-6 text-muted-foreground/20" />
              </div>
              <p className="text-sm font-semibold text-muted-foreground/40">
                {rows.length === 0 ? "Sem histórico de taxas" : "Sem resultados"}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border/20">
              <div className="px-4 py-2 bg-muted/5">
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/30">
                  {filtered.length} entrada{filtered.length !== 1 ? "s" : ""}
                </p>
              </div>

              {filtered.map((r, i) => {
                const fmtDate = new Date(r.date + "T00:00:00").toLocaleDateString("pt-PT",{day:"2-digit",month:"short",year:"numeric"})
                return (
                  <div key={i} className="flex items-center gap-3 px-4 py-3.5 hover:bg-muted/15 transition-colors">
                    <Av name={r.collabName} />
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[13px] font-bold leading-none">{r.collabName}</span>
                        <DeltaBadge delta={r.delta} />
                      </div>
                      {r.note && (
                        <p className="text-[11px] text-muted-foreground/50 truncate">{r.note}</p>
                      )}
                      <p className="text-[10px] text-muted-foreground/35">{fmtDate}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black tabular-nums">{fmtCurrency(r.rate)}<span className="text-[10px] font-bold text-muted-foreground/40">/h</span></p>
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
