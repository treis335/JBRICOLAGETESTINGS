// components/admin/rate-history-modal.tsx
"use client"

import { useMemo, useState } from "react"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { X, Download, TrendingUp, TrendingDown, Minus, Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import { buildRateRows, fmtCurrency, downloadCSV, type RateRow } from "@/lib/report-utils"

function DeltaBadge({ delta }: { delta?: number }) {
  if (delta === undefined || Math.abs(delta) < 0.01) return null
  const up = delta > 0
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full text-[10px] font-bold border",
      up
        ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
        : "bg-red-50 dark:bg-red-950/30 text-red-700 dark:text-red-400 border-red-200 dark:border-red-800"
    )}>
      {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
      {up ? "+" : ""}{fmtCurrency(delta)}/h
    </span>
  )
}

interface Props { open: boolean; onClose: () => void; collaborators: Collaborator[] }

export function RateHistoryModal({ open, onClose, collaborators }: Props) {
  const [search, setSearch] = useState("")

  const rows: RateRow[] = useMemo(
    () => buildRateRows(collaborators),
    [collaborators]
  )

  const filtered = useMemo(() => {
    if (!search.trim()) return rows
    const q = search.toLowerCase()
    return rows.filter(r =>
      r.collabName.toLowerCase().includes(q) ||
      r.date.includes(q) ||
      (r.note || "").toLowerCase().includes(q)
    )
  }, [rows, search])

  const handleCSV = () => {
    downloadCSV(
      "historico-taxas.csv",
      ["Colaborador", "Data", "Taxa (€/h)", "Alteração", "Nota"],
      filtered.map(r => [
        r.collabName,
        r.date,
        r.rate.toFixed(2),
        r.delta !== undefined ? (r.delta >= 0 ? `+${r.delta.toFixed(2)}` : r.delta.toFixed(2)) : "Inicial",
        r.note || "",
      ])
    )
  }

  // Group by collaborator for summary
  const summary = useMemo(() => {
    const map = new Map<string, { name: string; count: number; current: number; initial: number }>()
    collaborators.filter(c => c.ativo !== false).forEach(c => {
      const sorted = [...c.rateHistory].sort((a, b) => a.date.localeCompare(b.date))
      if (sorted.length > 0) {
        map.set(c.id, {
          name: c.name,
          count: sorted.length,
          initial: sorted[0].rate,
          current: sorted[sorted.length - 1].rate,
        })
      }
    })
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name))
  }, [collaborators])

  return (
    <Dialog open={open} onOpenChange={v => !v && onClose()}>
      <DialogContent className="max-w-2xl w-[calc(100vw-1rem)] max-h-[90dvh] flex flex-col p-0 gap-0 rounded-2xl overflow-hidden">

        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b bg-muted/10 shrink-0">
          <p className="text-sm font-black flex-1">Histórico de Taxas</p>
          <Button size="sm" variant="outline" className="h-8 rounded-xl gap-1.5 text-xs" onClick={handleCSV} disabled={false || !filtered.length}>
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-xl" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
          <DialogTitle className="sr-only">Histórico de Taxas</DialogTitle>
        </div>

        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4 min-h-0">

          {/* Summary cards */}
          {!false && summary.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Resumo atual por colaborador</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {summary.map(s => (
                  <div key={s.name} className="flex items-center gap-3 px-3 py-2.5 rounded-xl border border-border/40 bg-card">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-[11px] font-black text-white shrink-0">
                      {s.name.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold truncate">{s.name}</p>
                      <p className="text-[10px] text-muted-foreground/50">{s.count} entrada{s.count !== 1 ? "s" : ""}</p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black tabular-nums text-blue-600 dark:text-blue-400">{fmtCurrency(s.current)}/h</p>
                      {s.initial !== s.current && (
                        <p className="text-[10px] text-muted-foreground/40 tabular-nums">era {fmtCurrency(s.initial)}/h</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/40" />
            <Input
              placeholder="Filtrar por nome, data ou nota…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-9 rounded-xl border-border/50 text-sm"
            />
          </div>

          {/* Log */}
          {false ? (
            <div className="space-y-2 animate-pulse">
              {[...Array(6)].map((_,i) => <div key={i} className="h-14 bg-muted/40 rounded-xl" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground/60 text-sm">
              {rows.length === 0 ? "Nenhum histórico de taxas registado" : "Sem resultados para a pesquisa"}
            </div>
          ) : (
            <div className="space-y-1">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                Registo de alterações · {filtered.length} entrada{filtered.length !== 1 ? "s" : ""}
              </p>
              <div className="rounded-xl border border-border/40 overflow-hidden divide-y divide-border/30">
                {filtered.map((r, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-bold truncate">{r.collabName}</span>
                        <DeltaBadge delta={r.delta} />
                        {r.delta === undefined && (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400 border border-blue-100 dark:border-blue-900 font-bold">
                            Inicial
                          </span>
                        )}
                      </div>
                      {r.note && <p className="text-[11px] text-muted-foreground/60 mt-0.5 truncate">{r.note}</p>}
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-sm font-black tabular-nums">{fmtCurrency(r.rate)}/h</p>
                      <p className="text-[10px] text-muted-foreground/40 tabular-nums">
                        {new Date(r.date + "T00:00:00").toLocaleDateString("pt-PT", { day: "2-digit", month: "short", year: "numeric" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
