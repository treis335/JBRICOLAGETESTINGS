// components/admin/monthly-report-modal.tsx
"use client"

import { useState, useMemo, useEffect } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import {
  X, FileSpreadsheet, FileText, ChevronLeft, ChevronRight,
  Download, Users, Clock, Euro, TrendingUp, CheckCircle2, AlertCircle,
} from "lucide-react"
import { cn, fmt, resolveEntryTaxa } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"

// ── Types ─────────────────────────────────────────────────────────────────────
interface MonthRow {
  name: string
  email: string
  rate: number
  normalHoras: number
  extraHoras: number
  totalHoras: number
  custo: number
  pago: number
  pendente: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function getTodayKey() { return new Date().toISOString().slice(0, 7) }

function fmtMonthLabel(key: string) {
  const [y, m] = key.split("-").map(Number)
  return new Date(y, m - 1, 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" })
}

function buildRows(collaborators: any[], monthKey: string): MonthRow[] {
  return collaborators
    .filter(c => c.ativo !== false)
    .map(collab => {
      const rate = collab.currentRate || 0
      const entries = (collab.entries || []).filter((e: any) => {
        const d = e.date || ""
        return d.startsWith(monthKey)
      })
      const payments = (collab.payments || []).filter((p: any) => {
        const d = p.date || ""
        return d.startsWith(monthKey)
      })

      let normalHoras = 0, extraHoras = 0, totalHoras = 0, custo = 0
      entries.forEach((e: any) => {
        const h = e.totalHoras || 0
        const n = e.normalHoras || 0
        const x = e.extraHoras || 0
        totalHoras += h
        normalHoras += n || Math.min(h, 8)
        extraHoras += x || Math.max(0, h - 8)
        custo += h * resolveEntryTaxa(e, rate)
      })

      const pago = payments.reduce((s: number, p: any) => s + (p.valor || 0), 0)

      return {
        name: collab.name,
        email: collab.email,
        rate,
        normalHoras: Math.round(normalHoras * 10) / 10,
        extraHoras: Math.round(extraHoras * 10) / 10,
        totalHoras: Math.round(totalHoras * 10) / 10,
        custo: Math.round(custo * 100) / 100,
        pago: Math.round(pago * 100) / 100,
        pendente: Math.round(Math.max(0, custo - pago) * 100) / 100,
      }
    })
    .filter(r => r.totalHoras > 0 || r.pago > 0)
    .sort((a, b) => b.totalHoras - a.totalHoras)
}

// ── Export Excel ──────────────────────────────────────────────────────────────
async function exportExcel(rows: MonthRow[], monthKey: string, monthLabel: string) {
  const XLSX = await import("xlsx")

  const header = ["Colaborador", "Email", "Taxa €/h", "Horas Normais", "Horas Extra", "Total Horas", "Custo Total", "Pago", "Pendente"]
  const data = rows.map(r => [
    r.name, r.email, r.rate,
    r.normalHoras, r.extraHoras, r.totalHoras,
    r.custo, r.pago, r.pendente,
  ])

  // Totals row
  const totals = ["TOTAL", "", "",
    rows.reduce((s, r) => s + r.normalHoras, 0),
    rows.reduce((s, r) => s + r.extraHoras, 0),
    rows.reduce((s, r) => s + r.totalHoras, 0),
    rows.reduce((s, r) => s + r.custo, 0),
    rows.reduce((s, r) => s + r.pago, 0),
    rows.reduce((s, r) => s + r.pendente, 0),
  ]

  const ws = XLSX.utils.aoa_to_sheet([header, ...data, [], totals])

  // Column widths
  ws["!cols"] = [
    { wch: 28 }, { wch: 32 }, { wch: 10 }, { wch: 14 }, { wch: 12 },
    { wch: 12 }, { wch: 14 }, { wch: 14 }, { wch: 14 },
  ]

  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, `Relatório ${monthKey}`)
  XLSX.writeFile(wb, `relatorio-mensal-${monthKey}.xlsx`)
}

// ── Export PDF ────────────────────────────────────────────────────────────────
async function exportPDF(rows: MonthRow[], monthKey: string, monthLabel: string) {
  const { default: jsPDF } = await import("jspdf")
  const { default: autoTable } = await import("jspdf-autotable")

  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" })

  // Header
  doc.setFontSize(18)
  doc.setFont("helvetica", "bold")
  doc.text("JBricolage — Relatório Mensal", 14, 18)

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(100)
  doc.text(`Período: ${monthLabel}`, 14, 26)
  doc.text(`Gerado em: ${new Date().toLocaleDateString("pt-PT")}`, 14, 32)

  const totCusto   = rows.reduce((s, r) => s + r.custo, 0)
  const totPago    = rows.reduce((s, r) => s + r.pago, 0)
  const totPend    = rows.reduce((s, r) => s + r.pendente, 0)
  const totHoras   = rows.reduce((s, r) => s + r.totalHoras, 0)

  doc.setTextColor(0)
  doc.setFontSize(10)
  doc.text(`Colaboradores ativos: ${rows.length}   |   Total horas: ${totHoras.toFixed(1)}h   |   Custo total: ${totCusto.toFixed(2)} €   |   Pago: ${totPago.toFixed(2)} €   |   Pendente: ${totPend.toFixed(2)} €`, 14, 40)

  autoTable(doc, {
    startY: 46,
    head: [["Colaborador", "Taxa €/h", "H. Normais", "H. Extra", "Total H.", "Custo Total", "Pago", "Pendente"]],
    body: [
      ...rows.map(r => [
        r.name,
        `${r.rate.toFixed(2)} €`,
        `${r.normalHoras.toFixed(1)}h`,
        `${r.extraHoras.toFixed(1)}h`,
        `${r.totalHoras.toFixed(1)}h`,
        `${r.custo.toFixed(2)} €`,
        `${r.pago.toFixed(2)} €`,
        `${r.pendente.toFixed(2)} €`,
      ]),
      // totals
      [
        { content: "TOTAL", styles: { fontStyle: "bold" } }, "",
        { content: `${rows.reduce((s, r) => s + r.normalHoras, 0).toFixed(1)}h`, styles: { fontStyle: "bold" } },
        { content: `${rows.reduce((s, r) => s + r.extraHoras, 0).toFixed(1)}h`, styles: { fontStyle: "bold" } },
        { content: `${totHoras.toFixed(1)}h`, styles: { fontStyle: "bold" } },
        { content: `${totCusto.toFixed(2)} €`, styles: { fontStyle: "bold" } },
        { content: `${totPago.toFixed(2)} €`, styles: { fontStyle: "bold" } },
        { content: `${totPend.toFixed(2)} €`, styles: { fontStyle: "bold" } },
      ],
    ],
    styles: { fontSize: 9, cellPadding: 3 },
    headStyles: { fillColor: [30, 41, 59], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 48 },
      1: { halign: "right" },
      2: { halign: "right" },
      3: { halign: "right" },
      4: { halign: "right" },
      5: { halign: "right" },
      6: { halign: "right" },
      7: { halign: "right" },
    },
    didParseCell: (data) => {
      // Highlight pending > 0 in amber
      if (data.column.index === 7 && data.section === "body" && data.row.index < rows.length) {
        const row = rows[data.row.index]
        if (row && row.pendente > 0) data.cell.styles.textColor = [180, 83, 9]
      }
    },
  })

  doc.save(`relatorio-mensal-${monthKey}.pdf`)
}

// ── Main Component ─────────────────────────────────────────────────────────────
interface MonthlyReportModalProps {
  open: boolean
  onClose: () => void
}

export function MonthlyReportModal({ open, onClose }: MonthlyReportModalProps) {
  const { collaborators, loading } = useCollaborators()
  const [monthKey, setMonthKey] = useState(getTodayKey)
  const [exporting, setExporting] = useState<"excel" | "pdf" | null>(null)

  // Reset month when opened
  useEffect(() => { if (open) setMonthKey(getTodayKey()) }, [open])

  const rows = useMemo(() => buildRows(collaborators, monthKey), [collaborators, monthKey])
  const monthLabel = fmtMonthLabel(monthKey)

  const totals = useMemo(() => ({
    horas:   rows.reduce((s, r) => s + r.totalHoras, 0),
    custo:   rows.reduce((s, r) => s + r.custo, 0),
    pago:    rows.reduce((s, r) => s + r.pago, 0),
    pendente: rows.reduce((s, r) => s + r.pendente, 0),
  }), [rows])

  function handleMonthChange(dir: 1 | -1) {
    const [y, m] = monthKey.split("-").map(Number)
    const d = new Date(y, m - 1 + dir, 1)
    setMonthKey(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`)
  }

  async function handleExport(type: "excel" | "pdf") {
    setExporting(type)
    try {
      if (type === "excel") await exportExcel(rows, monthKey, monthLabel)
      else await exportPDF(rows, monthKey, monthLabel)
    } finally {
      setExporting(null)
    }
  }

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className={cn(
        "p-0 gap-0 border-0 shadow-2xl overflow-hidden",
        "max-sm:fixed max-sm:inset-0 max-sm:w-full max-sm:h-full max-sm:max-w-full max-sm:max-h-full max-sm:rounded-none max-sm:translate-x-0 max-sm:translate-y-0",
        "sm:w-[820px] sm:max-w-[96vw] sm:max-h-[90dvh] sm:rounded-3xl",
        "flex flex-col [&>button]:hidden",
      )}>
        <DialogTitle className="sr-only">Relatório Mensal</DialogTitle>

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-border/30 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/40 flex items-center justify-center shrink-0">
              <FileSpreadsheet className="h-4.5 w-4.5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-sm font-bold">Relatório Mensal</p>
              <p className="text-xs text-muted-foreground">Horas, custos e pagamentos por colaborador</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl hover:bg-muted flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── Month Navigator ── */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/20 bg-muted/20 shrink-0">
          <button onClick={() => handleMonthChange(-1)} className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors">
            <ChevronLeft className="h-4 w-4 text-muted-foreground" />
          </button>
          <p className="text-sm font-bold capitalize">{monthLabel}</p>
          <button
            onClick={() => handleMonthChange(1)}
            disabled={monthKey >= getTodayKey()}
            className="w-8 h-8 rounded-lg hover:bg-muted flex items-center justify-center transition-colors disabled:opacity-30 disabled:pointer-events-none"
          >
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* ── KPIs ── */}
        {!loading && rows.length > 0 && (
          <div className="grid grid-cols-4 gap-0 divide-x border-b border-border/20 shrink-0">
            {[
              { icon: Users,       label: "Ativos",  value: `${rows.length}`,          color: "text-foreground" },
              { icon: Clock,       label: "Horas",   value: `${totals.horas.toFixed(1)}h`, color: "text-blue-600 dark:text-blue-400" },
              { icon: Euro,        label: "Custo",   value: fmt(totals.custo),          color: "text-violet-600 dark:text-violet-400" },
              { icon: TrendingUp,  label: "Pendente",value: fmt(totals.pendente),       color: totals.pendente > 0 ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="px-3 py-3 text-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-medium mb-1">{label}</p>
                <p className={cn("text-sm font-bold tabular-nums", color)}>{value}</p>
              </div>
            ))}
          </div>
        )}

        {/* ── Table ── */}
        <div className="flex-1 overflow-y-auto overflow-x-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-7 h-7 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            </div>
          ) : rows.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 gap-3 text-muted-foreground">
              <Clock className="h-10 w-10 opacity-15" />
              <p className="text-sm font-medium">Sem registos para {monthLabel}</p>
            </div>
          ) : (
            <table className="w-full text-sm min-w-[640px]">
              <thead className="sticky top-0 bg-muted/60 backdrop-blur-sm">
                <tr className="border-b border-border/30">
                  <th className="text-left text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 pl-5 pr-3">Colaborador</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3">Taxa</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3">H. Norm.</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3">H. Extra</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3">Total H.</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3">Custo</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 px-3">Pago</th>
                  <th className="text-right text-[11px] font-bold uppercase tracking-wide text-muted-foreground py-2.5 pl-3 pr-5">Pendente</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.email} className={cn("border-b border-border/15 hover:bg-muted/20 transition-colors", i % 2 === 0 ? "" : "bg-muted/10")}>
                    <td className="py-3 pl-5 pr-3">
                      <p className="font-semibold text-sm leading-tight">{r.name}</p>
                      <p className="text-[11px] text-muted-foreground truncate max-w-[160px]">{r.email}</p>
                    </td>
                    <td className="py-3 px-3 text-right text-[11px] text-muted-foreground tabular-nums">{r.rate.toFixed(2)} €</td>
                    <td className="py-3 px-3 text-right tabular-nums font-medium">{r.normalHoras.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {r.extraHoras > 0
                        ? <span className="text-amber-600 dark:text-amber-400 font-medium">{r.extraHoras.toFixed(1)}h</span>
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="py-3 px-3 text-right tabular-nums font-bold">{r.totalHoras.toFixed(1)}h</td>
                    <td className="py-3 px-3 text-right tabular-nums font-semibold text-violet-600 dark:text-violet-400">{fmt(r.custo)}</td>
                    <td className="py-3 px-3 text-right tabular-nums">
                      {r.pago > 0
                        ? <span className="text-emerald-600 dark:text-emerald-400 font-semibold">{fmt(r.pago)}</span>
                        : <span className="text-muted-foreground/40">—</span>}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right tabular-nums">
                      {r.pendente > 0
                        ? <span className="inline-flex items-center gap-1 font-bold text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-3 w-3" />{fmt(r.pendente)}
                          </span>
                        : <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                            <CheckCircle2 className="h-3 w-3" />Pago
                          </span>}
                    </td>
                  </tr>
                ))}
              </tbody>
              {/* Totals row */}
              <tfoot>
                <tr className="border-t-2 border-border/40 bg-muted/30">
                  <td className="py-3 pl-5 pr-3 text-xs font-bold uppercase tracking-wide text-muted-foreground" colSpan={2}>Total</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold">{rows.reduce((s, r) => s + r.normalHoras, 0).toFixed(1)}h</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-amber-600 dark:text-amber-400">
                    {rows.reduce((s, r) => s + r.extraHoras, 0).toFixed(1)}h
                  </td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold">{totals.horas.toFixed(1)}h</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-violet-600 dark:text-violet-400">{fmt(totals.custo)}</td>
                  <td className="py-3 px-3 text-right tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{fmt(totals.pago)}</td>
                  <td className="py-3 pl-3 pr-5 text-right tabular-nums font-bold text-amber-600 dark:text-amber-400">{fmt(totals.pendente)}</td>
                </tr>
              </tfoot>
            </table>
          )}
        </div>

        {/* ── Footer — Export buttons ── */}
        {rows.length > 0 && (
          <div className="shrink-0 px-5 py-4 border-t border-border/20 bg-background flex items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground hidden sm:block">
              {rows.length} colaborador{rows.length !== 1 ? "es" : ""} · {monthLabel}
            </p>
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleExport("excel")}
                disabled={!!exporting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-emerald-600/20"
              >
                <FileSpreadsheet className="h-4 w-4" />
                {exporting === "excel" ? "A exportar…" : "Excel"}
              </button>
              <button
                onClick={() => handleExport("pdf")}
                disabled={!!exporting}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white text-sm font-semibold transition-all disabled:opacity-50 disabled:pointer-events-none shadow-md shadow-blue-600/20"
              >
                <FileText className="h-4 w-4" />
                {exporting === "pdf" ? "A exportar…" : "PDF"}
              </button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
