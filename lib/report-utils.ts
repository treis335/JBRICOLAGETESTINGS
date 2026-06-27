// lib/report-utils.ts
// Lógica partilhada pelos relatórios admin

export interface RateHistoryEntry {
  taxa: number
  taxaAnterior: number | null
  data: string // ISO date string
  alteradoPor: string
  motivo?: string
}

/**
 * Resolve a taxa horária correta para uma data específica.
 * Percorre o histórico de taxas e devolve a taxa ativa nessa data.
 * Fallback para currentRate se não houver histórico.
 */
export function resolveTaxaForDate(
  date: string, // "YYYY-MM-DD"
  rateHistory: RateHistoryEntry[],
  currentRate: number
): number {
  if (!rateHistory || rateHistory.length === 0) return currentRate

  // Ordena por data DESC (mais recente primeiro)
  const sorted = [...rateHistory].sort(
    (a, b) => new Date(b.data).getTime() - new Date(a.data).getTime()
  )

  // Encontra a primeira entrada cuja data é <= à data do registo
  for (const h of sorted) {
    if (h.data <= date) return h.taxa
  }

  // Se não encontrou nenhuma (entrada mais antiga que qualquer taxa),
  // usa a taxa mais antiga do histórico
  return sorted[sorted.length - 1]?.taxaAnterior ?? currentRate
}

/**
 * Resolve taxa de uma entry — tenta campos internos primeiro, depois histórico
 */
export function resolveEntryTaxaFull(
  entry: any,
  rateHistory: RateHistoryEntry[],
  currentRate: number
): number {
  // 1. Taxa guardada directamente na entry (mais fiável)
  if (typeof entry.taxaHoraria === "number" && entry.taxaHoraria > 0)
    return entry.taxaHoraria

  // 2. Taxa guardada no primeiro serviço
  if (Array.isArray(entry.services) && entry.services.length > 0) {
    const t = entry.services[0]?.taxaHoraria
    if (typeof t === "number" && t > 0) return t
  }

  // 3. Histórico de taxas para a data da entry
  if (entry.date) {
    return resolveTaxaForDate(entry.date, rateHistory, currentRate)
  }

  return currentRate
}

export interface MonthRow {
  name: string
  email: string
  rate: number         // taxa do mês (histórica)
  normalHoras: number
  extraHoras: number
  totalHoras: number
  custo: number
  pago: number
  pendente: number     // pendente REAL acumulado até este mês
}

export interface MonthData {
  periodo: string      // "YYYY-MM"
  hours: number
  cost: number
  paid: number
  pending: number
}

/**
 * Constrói os dados financeiros mensais de um colaborador
 * com taxa histórica correcta e pendente acumulado real
 */
export function buildCollabMonthData(collab: any): MonthData[] {
  const entries: any[]  = collab.entries  || []
  const payments: any[] = [...(collab.payments || [])].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )
  const rateHistory: RateHistoryEntry[] = collab.rateHistory || []
  const currentRate: number = collab.currentRate || 0

  const monthMap = new Map<string, MonthData>()

  entries.forEach((e: any) => {
    const p = (e.date || "").slice(0, 7)
    if (!p) return
    if (!monthMap.has(p)) monthMap.set(p, { periodo: p, hours: 0, cost: 0, paid: 0, pending: 0 })
    const m = monthMap.get(p)!
    const taxa = resolveEntryTaxaFull(e, rateHistory, currentRate)
    m.hours += e.totalHoras || 0
    m.cost  += taxa * (e.totalHoras || 0)
  })

  // Distribuir pagamentos cronologicamente pelos meses
  const allMonths = Array.from(monthMap.values()).sort((a, b) => a.periodo.localeCompare(b.periodo))

  let pi = 0, rem = 0
  for (const m of allMonths) {
    let left = m.cost
    while (left > 0 && (pi < payments.length || rem > 0)) {
      if (rem <= 0 && pi < payments.length) { rem = payments[pi].valor || 0; pi++ }
      if (rem > 0) {
        const apply = Math.min(left, rem)
        m.paid += apply; left -= apply; rem -= apply
      } else break
    }
    m.pending = Math.max(0, m.cost - m.paid)
  }

  return allMonths
}

/**
 * Constrói as linhas do relatório mensal para um mês específico
 */
export function buildMonthRows(collaborators: any[], monthKey: string): MonthRow[] {
  return collaborators
    .filter(c => c.ativo !== false)
    .map(collab => {
      const entries = (collab.entries || []).filter((e: any) => (e.date || "").startsWith(monthKey))
      const rateHistory: RateHistoryEntry[] = collab.rateHistory || []
      const currentRate = collab.currentRate || 0

      let normalHoras = 0, extraHoras = 0, totalHoras = 0, custo = 0

      entries.forEach((e: any) => {
        const h    = e.totalHoras || 0
        const taxa = resolveEntryTaxaFull(e, rateHistory, currentRate)
        totalHoras += h
        normalHoras += typeof e.normalHoras === "number" ? e.normalHoras : Math.min(h, 8)
        extraHoras  += typeof e.extraHoras  === "number" ? e.extraHoras  : Math.max(0, h - 8)
        custo += h * taxa
      })

      // Pendente real: soma de todos os meses até ao atual
      const allMonths = buildCollabMonthData(collab)
      const thisMonth = allMonths.find(m => m.periodo === monthKey)
      const pago     = thisMonth?.paid    ?? 0
      const pendente = thisMonth?.pending ?? Math.max(0, custo - pago)

      // Taxa representativa do mês (última taxa ativa nesse mês)
      const monthEnd = `${monthKey}-28`
      const taxa     = resolveTaxaForDate(monthEnd, rateHistory, currentRate)

      return {
        name: collab.name,
        email: collab.email,
        rate: taxa,
        normalHoras: Math.round(normalHoras * 10) / 10,
        extraHoras:  Math.round(extraHoras  * 10) / 10,
        totalHoras:  Math.round(totalHoras  * 10) / 10,
        custo:       Math.round(custo       * 100) / 100,
        pago:        Math.round(pago        * 100) / 100,
        pendente:    Math.round(pendente    * 100) / 100,
      }
    })
    .filter(r => r.totalHoras > 0 || r.pago > 0)
    .sort((a, b) => b.totalHoras - a.totalHoras)
}
