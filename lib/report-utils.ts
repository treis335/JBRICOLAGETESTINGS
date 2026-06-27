// lib/report-utils.ts — shared logic for all admin reports
import type { Collaborator, RateHistoryEntry } from "@/hooks/useCollaborators"
import { resolveRateForDate } from "@/hooks/useCollaborators"

// ── Month key helpers ─────────────────────────────────────────────────────────
export function monthKey(year: number, month: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}`
}
export function parseMonthKey(key: string): { year: number; month: number } {
  const [y, m] = key.split("-").map(Number)
  return { year: y, month: m - 1 }
}
export function fmtMonthLabel(key: string): string {
  const { year, month } = parseMonthKey(key)
  return new Date(year, month, 1).toLocaleDateString("pt-PT", { month: "long", year: "numeric" })
}
export function fmtCurrency(v: number): string {
  return v.toLocaleString("pt-PT", { style: "currency", currency: "EUR", minimumFractionDigits: 2 })
}

// ── Monthly row ───────────────────────────────────────────────────────────────
export interface MonthRow {
  id:         string
  name:       string
  email:      string
  normalH:    number
  extraH:     number
  totalH:     number
  avgRate:    number   // weighted average rate used this month
  custo:      number   // earned this month
  pago:       number   // payments recorded THIS month
  pendente:   number   // custo − pago (this month)
  diasTrab:   number
}

export function buildMonthRows(collaborators: Collaborator[], key: string): MonthRow[] {
  return collaborators
    .filter(c => c.ativo !== false)
    .map(c => {
      const entries  = c.entries.filter(e => (e.date || "").startsWith(key))
      const payments = c.payments.filter(p => (p.date || "").startsWith(key))

      let normalH = 0, extraH = 0, totalH = 0, custo = 0

      entries.forEach(e => {
        const h    = e.totalHoras    || 0
        const exH  = e.extraHoras    || 0
        const normH= e.normalHoras   || Math.max(0, h - exH)
        const rate = resolveRateForDate(e.date || "", c.rateHistory, c.currentRate, (e as any).taxaHoraria)
        normalH += normH
        extraH  += exH
        totalH  += h
        custo   += h * rate
      })

      const pago     = payments.reduce((s, p) => s + p.valor, 0)
      const avgRate  = totalH > 0 ? custo / totalH : c.currentRate
      const pendente = custo - pago   // can be negative if paid in advance

      return {
        id: c.id, name: c.name, email: c.email,
        normalH, extraH, totalH, avgRate, custo, pago, pendente,
        diasTrab: entries.length,
      }
    })
    .filter(r => r.totalH > 0 || r.pago > 0)
}

// ── Annual data ───────────────────────────────────────────────────────────────
export interface AnnualMonthData {
  monthKey: string
  label:    string
  horas:    number
  custo:    number
  pago:     number
}

export interface AnnualRow {
  id:      string
  name:    string
  months:  AnnualMonthData[]
  totH:    number
  totCost: number
  totPaid: number
}

export function buildAnnualRows(collaborators: Collaborator[], year: number): AnnualRow[] {
  return collaborators
    .filter(c => c.ativo !== false)
    .map(c => {
      const months: AnnualMonthData[] = Array.from({ length: 12 }, (_, mi) => {
        const key    = monthKey(year, mi)
        const label  = fmtMonthLabel(key)
        const entries  = c.entries.filter(e  => (e.date  || "").startsWith(key))
        const payments = c.payments.filter(p => (p.date  || "").startsWith(key))

        const horas = entries.reduce((s, e) => s + (e.totalHoras || 0), 0)
        const custo = entries.reduce((s, e) => {
          const h    = e.totalHoras || 0
          const rate = resolveRateForDate(e.date || "", c.rateHistory, c.currentRate, (e as any).taxaHoraria)
          return s + h * rate
        }, 0)
        const pago = payments.reduce((s, p) => s + p.valor, 0)

        return { monthKey: key, label, horas, custo, pago }
      })

      const totH    = months.reduce((s, m) => s + m.horas, 0)
      const totCost = months.reduce((s, m) => s + m.custo, 0)
      const totPaid = months.reduce((s, m) => s + m.pago,  0)

      return { id: c.id, name: c.name, months, totH, totCost, totPaid }
    })
    .filter(r => r.totH > 0)
}

// ── Rate history row ──────────────────────────────────────────────────────────
export interface RateRow {
  collabId:   string
  collabName: string
  date:       string
  rate:       number
  note?:      string
  delta?:     number    // change from previous rate
}

export function buildRateRows(collaborators: Collaborator[]): RateRow[] {
  const rows: RateRow[] = []
  collaborators.forEach(c => {
    const history = [...c.rateHistory].sort((a, b) => a.date.localeCompare(b.date))
    history.forEach((r, i) => {
      const prev  = i > 0 ? history[i - 1].rate : null
      const delta = prev !== null ? r.rate - prev : undefined
      rows.push({ collabId: c.id, collabName: c.name, date: r.date, rate: r.rate, note: r.note, delta })
    })
  })
  return rows.sort((a, b) => b.date.localeCompare(a.date))
}

// ── CSV export ────────────────────────────────────────────────────────────────
export function downloadCSV(filename: string, headers: string[], rows: string[][]): void {
  const bom  = "\uFEFF"   // UTF-8 BOM for Excel
  const body = [headers, ...rows].map(r => r.map(cell => `"${cell}"`).join(";")).join("\r\n")
  const blob = new Blob([bom + body], { type: "text/csv;charset=utf-8;" })
  const url  = URL.createObjectURL(blob)
  const a    = Object.assign(document.createElement("a"), { href: url, download: filename })
  a.click()
  URL.revokeObjectURL(url)
}
