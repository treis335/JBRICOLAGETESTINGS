// hooks/useCollaborators.ts
import { useState, useEffect } from "react"
import { collection, getDocs, query, where } from "firebase/firestore"
import { db } from "@/lib/firebase"

export interface RateHistoryEntry {
  rate: number
  date: string   // ISO "YYYY-MM-DD" — dia a partir do qual esta taxa vigorou
  note?: string
}

export interface Payment {
  id: string
  date: string
  valor: number
  metodo: string
}

export interface Collaborator {
  id: string
  name: string
  username: string
  legacyName: string
  email: string
  photoURL?: string
  currentRate: number
  /** Histórico ordenado do mais antigo para o mais recente */
  rateHistory: RateHistoryEntry[]
  totalHoursThisMonth: number
  totalHoursAllTime: number
  totalCostThisMonth: number
  role: string
  createdAt: string | null
  migrated?: boolean
  ativo: boolean
  pendingAmount: number
  entries: import("@/lib/types").DayEntry[]
  payments: Payment[]
}

function resolveDisplayName(userData: any): string {
  const username = (userData.username || "").trim()
  const name     = (userData.name     || "").trim()
  return username || name || "Sem nome"
}

/** Resolve a taxa correcta para uma data de entrada usando o histórico */
export function resolveRateForDate(
  dateISO: string,
  rateHistory: RateHistoryEntry[],
  currentRate: number,
  entryTaxa?: number
): number {
  // 1. Se a própria entrada guardou a taxa, usamos essa (mais preciso)
  if (typeof entryTaxa === "number" && entryTaxa > 0) return entryTaxa

  // 2. Tenta resolver via rateHistory
  if (rateHistory.length > 0) {
    // Ordena por data crescente
    const sorted = [...rateHistory].sort((a, b) => a.date.localeCompare(b.date))
    // Última entrada cuja data seja <= à data da entrada
    let resolved = sorted[0].rate
    for (const r of sorted) {
      if (r.date <= dateISO) resolved = r.rate
      else break
    }
    return resolved
  }

  // 3. Fallback para taxa actual
  return currentRate
}

export function useCollaborators() {
  const [collaborators, setCollaborators] = useState<Collaborator[]>([])
  const [loading,       setLoading]       = useState(true)
  const [error,         setError]         = useState<string | null>(null)

  const fetchCollaborators = async () => {
    setLoading(true)
    setError(null)
    try {
      const snap = await getDocs(query(collection(db, "users"), where("role", "==", "worker")))
      const list: Collaborator[] = []

      for (const doc of snap.docs) {
        const d      = doc.data()
        const uid    = doc.id
        const ativo  = d.ativo !== false
        const name   = resolveDisplayName(d)

        const entries    = d.workData?.entries   || []
        const currentRate = d.workData?.settings?.taxaHoraria || 0
        const rawPayments: Payment[] = (d.workData?.payments || []).map((p: any) => ({
          id:     p.id     || "",
          date:   p.date   || "",
          valor:  p.valor  || 0,
          metodo: p.metodo || "Desconhecido",
        }))

        // ── Rate history ────────────────────────────────────────────────────
        // Pode estar em: d.rateHistory, d.workData.rateHistory ou campo taxaHistory
        const rawHistory: any[] =
          d.rateHistory          ||
          d.workData?.rateHistory ||
          d.taxaHistory          ||
          []

        const rateHistory: RateHistoryEntry[] = rawHistory
          .filter((r: any) => r && typeof r.rate === "number" && r.date)
          .map((r: any) => ({ rate: r.rate, date: r.date, note: r.note }))
          .sort((a, b) => a.date.localeCompare(b.date))

        // If no history but currentRate > 0, synthesise one from createdAt
        if (rateHistory.length === 0 && currentRate > 0) {
          rateHistory.push({ rate: currentRate, date: d.createdAt?.slice(0,10) || "2024-01-01" })
        }

        // ── Month aggregation ───────────────────────────────────────────────
        const now          = new Date()
        const curMonth     = now.getMonth()
        const curYear      = now.getFullYear()
        let totalHoursThis = 0, totalHoursAll = 0, totalCostThis = 0

        entries.forEach((e: any) => {
          const h = e.totalHoras || 0
          totalHoursAll += h
          if (e.date) {
            const [y, m] = e.date.split("-").map(Number)
            if (y === curYear && m - 1 === curMonth) {
              totalHoursThis  += h
              const rate = resolveRateForDate(e.date, rateHistory, currentRate, e.taxaHoraria)
              totalCostThis   += h * rate
            }
          }
        })

        // ── Pending amount (ALL time, not just this month) ──────────────────
        const totalPaid    = rawPayments.reduce((s, p) => s + p.valor, 0)
        const totalEarned  = entries.reduce((s: number, e: any) => {
          const h    = e.totalHoras || 0
          const rate = resolveRateForDate(e.date || "", rateHistory, currentRate, e.taxaHoraria)
          return s + h * rate
        }, 0)
        const pendingAmount = Math.max(0, totalEarned - totalPaid)

        list.push({
          id: uid, name, username: d.username || "", legacyName: d.name || "",
          email: d.email || "", photoURL: d.photoURL,
          currentRate, rateHistory,
          totalHoursThisMonth: totalHoursThis,
          totalHoursAllTime:   totalHoursAll,
          totalCostThisMonth:  totalCostThis,
          role: d.role || "worker", createdAt: d.createdAt || null,
          migrated: d.migrated || false, ativo, pendingAmount,
          entries, payments: rawPayments,
        })
      }

      list.sort((a, b) => {
        if (a.ativo !== b.ativo) return a.ativo ? -1 : 1
        return a.name.localeCompare(b.name, "pt")
      })

      setCollaborators(list)
    } catch (err) {
      setError("Erro ao carregar colaboradores.")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCollaborators() }, [])
  return { collaborators, loading, error, refetch: fetchCollaborators }
}
