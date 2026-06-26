// components/admin/today-panel.tsx
"use client"

import { useMemo, useState, useEffect, useCallback } from "react"
import {
  Clock, HardHat, Users, Camera, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, AlertCircle, Euro, Sun,
  CalendarDays, X, ArrowLeft, ArrowRight, Package,
  FileText, ZoomIn, Sparkles, TrendingUp,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveEntryTaxa } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import type { DayEntry, Service, ServiceFoto } from "@/lib/types"

// ─── Date helpers ──────────────────────────────────────────────────────────────
const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}
const isoToDate = (iso: string) => { const [y, m, d] = iso.split("-").map(Number); return new Date(y, m - 1, d) }
const dayLabel  = (iso: string) => isoToDate(iso).toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })
const isToday   = (iso: string) => iso === todayISO()
const isWeekend = (iso: string) => { const d = isoToDate(iso).getDay(); return d === 0 || d === 6 }

function allEntryDates(collaborators: Collaborator[]): string[] {
  const dates = new Set<string>()
  collaborators.forEach(c => c.entries.forEach(e => { if (e.date) dates.add(e.date) }))
  dates.add(todayISO())
  return Array.from(dates).sort((a, b) => b.localeCompare(a))
}

function getServices(entry: DayEntry): Service[] {
  if (Array.isArray(entry.services) && entry.services.length > 0) return entry.services
  return [{ id: "legacy", obraNome: entry.descricao || "", obraId: undefined,
    descricao: entry.descricao || "", equipa: entry.equipa || [],
    materiais: entry.materiais || [], totalHoras: entry.totalHoras }]
}
function getAllFotos(entry: DayEntry): (ServiceFoto & { serviceName: string })[] {
  if (!Array.isArray(entry.services)) return []
  return entry.services.flatMap(s => (s.fotos || []).map(f => ({ ...f, serviceName: s.obraNome })))
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
const PALETTES = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-orange-500 to-amber-500",
  "from-pink-500 to-rose-600",
  "from-cyan-500 to-blue-500",
  "from-lime-500 to-green-600",
  "from-red-500 to-rose-600",
]
function Avatar({ name, photo, size = "md" }: { name: string; photo?: string; size?: "xs" | "sm" | "md" | "lg" }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const sz = { xs: "w-6 h-6 text-[8px]", sm: "w-8 h-8 text-[10px]", md: "w-10 h-10 text-xs", lg: "w-12 h-12 text-sm" }[size]
  const pal = PALETTES[name.charCodeAt(0) % PALETTES.length]
  if (photo) return <img src={photo} alt={name} className={cn("rounded-xl object-cover ring-2 ring-white/20 dark:ring-black/20 shrink-0", sz)} />
  return (
    <div className={cn("rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-black shrink-0 ring-2 ring-white/20 dark:ring-black/20", sz, pal)}>
      {initials}
    </div>
  )
}

// ─── Photo Lightbox ───────────────────────────────────────────────────────────
function PhotoLightbox({ fotos, initialIndex, onClose }: {
  fotos: (ServiceFoto & { serviceName: string })[]
  initialIndex: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIndex)
  const foto = fotos[idx]
  const prev = useCallback(() => setIdx(i => Math.max(0, i - 1)), [])
  const next = useCallback(() => setIdx(i => Math.min(fotos.length - 1, i + 1)), [fotos.length])

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowLeft") prev()
      if (e.key === "ArrowRight") next()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose, prev, next])

  if (!foto) return null

  return (
    <div className="fixed inset-0 z-[300] bg-black/96 flex flex-col animate-fade-in" onClick={onClose}>
      {/* Bar */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn(
            "shrink-0 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border",
            foto.tipo === "antes"
              ? "bg-amber-500/15 text-amber-400 border-amber-500/25"
              : "bg-emerald-500/15 text-emerald-400 border-emerald-500/25"
          )}>
            {foto.tipo === "antes" ? "Antes" : "Depois"}
          </span>
          {foto.serviceName && (
            <span className="text-sm text-white/50 truncate">{foto.serviceName}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-white/30 tabular-nums">{idx + 1}/{fotos.length}</span>
          <button type="button" onClick={onClose}
            className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/16 flex items-center justify-center transition-colors">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={foto.url} src={foto.url} alt=""
          className="max-w-full max-h-full object-contain rounded-2xl select-none shadow-2xl"
          style={{ maxHeight: "calc(100dvh - 130px)" }} />
      </div>

      {/* Nav */}
      <div className="flex items-center justify-center gap-4 h-16 shrink-0" onClick={e => e.stopPropagation()}>
        <button type="button" onClick={prev} disabled={idx === 0}
          className="w-10 h-10 rounded-2xl bg-white/8 hover:bg-white/16 disabled:opacity-20 flex items-center justify-center transition-all active:scale-90">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex gap-1.5">
          {fotos.map((_, i) => (
            <button key={i} type="button" onClick={() => setIdx(i)}
              className={cn("rounded-full transition-all", i === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/25 hover:bg-white/50")} />
          ))}
        </div>
        <button type="button" onClick={next} disabled={idx === fotos.length - 1}
          className="w-10 h-10 rounded-2xl bg-white/8 hover:bg-white/16 disabled:opacity-20 flex items-center justify-center transition-all active:scale-90">
          <ArrowRight className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  )
}

// ─── Photo Strip (thumbnails inline) ──────────────────────────────────────────
function PhotoStrip({ fotos, onOpen }: {
  fotos: (ServiceFoto & { serviceName: string })[]
  onOpen: (i: number) => void
}) {
  if (!fotos.length) return null
  const antes  = fotos.filter(f => f.tipo === "antes").length
  const depois = fotos.filter(f => f.tipo === "depois").length

  return (
    <div className="space-y-2">
      <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/35 flex items-center gap-1.5">
        <Camera className="h-2.5 w-2.5" />
        Fotos
        <span className="font-medium text-muted-foreground/25">
          {antes > 0 && `${antes} antes`}{antes > 0 && depois > 0 && " · "}{depois > 0 && `${depois} depois`}
        </span>
      </p>
      <div className="flex gap-2 flex-wrap">
        {fotos.map((f, i) => (
          <button key={f.publicId} type="button" onClick={() => onOpen(i)}
            className="relative group w-14 h-14 rounded-xl overflow-hidden border border-border/50 shadow-sm hover:shadow-md hover:scale-105 active:scale-95 transition-all">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={f.url} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
              <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
            </div>
            <div className={cn(
              "absolute top-1 left-1 w-3 h-3 rounded-full border border-white/40 shadow-sm",
              f.tipo === "antes" ? "bg-amber-400" : "bg-emerald-400"
            )} />
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── Service Detail Card ───────────────────────────────────────────────────────
function ServiceCard({ service, idx, total, allFotos, onOpenFoto }: {
  service: Service
  idx: number
  total: number
  allFotos: (ServiceFoto & { serviceName: string })[]
  onOpenFoto: (globalIdx: number) => void
}) {
  const serviceFotos = (service.fotos || []).map(f => ({ ...f, serviceName: service.obraNome }))
  const hasMeta = (service.equipa || []).length > 0 || (service.materiais || []).length > 0 || service.descricao || serviceFotos.length > 0

  if (!hasMeta && !service.obraNome) return null

  return (
    <div className="rounded-xl border border-border/30 bg-background/60 overflow-hidden">
      {/* Obra header */}
      {service.obraNome && (
        <div className="flex items-center gap-2 px-3 py-2.5 bg-muted/20 border-b border-border/20">
          <div className="w-5 h-5 rounded-md bg-orange-100 dark:bg-orange-950/50 flex items-center justify-center shrink-0">
            <HardHat className="h-3 w-3 text-orange-500" />
          </div>
          <span className="text-[13px] font-bold truncate flex-1 min-w-0">{service.obraNome}</span>
          {total > 1 && (
            <span className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground/50 shrink-0">
              {idx + 1}/{total}
            </span>
          )}
        </div>
      )}

      <div className="px-3 py-3 space-y-3">
        {/* Description */}
        {service.descricao && (
          <div className="flex gap-2 items-start">
            <FileText className="h-3 w-3 text-muted-foreground/30 shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground/75 leading-relaxed">{service.descricao}</p>
          </div>
        )}

        {/* Team */}
        {(service.equipa || []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/35 flex items-center gap-1.5">
              <Users className="h-2.5 w-2.5" />Equipa
            </p>
            <div className="flex flex-wrap gap-1.5">
              {(service.equipa || []).map(m => (
                <span key={m} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary/6 border border-primary/12 text-primary/75">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Materials */}
        {(service.materiais || []).length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/35 flex items-center gap-1.5">
              <Package className="h-2.5 w-2.5" />Materiais
            </p>
            <div className="flex flex-wrap gap-1">
              {(service.materiais || []).map(m => (
                <span key={m} className="text-[10px] px-2 py-0.5 rounded-md bg-muted/50 border border-border/30 text-muted-foreground/65">
                  {m}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Photos */}
        {serviceFotos.length > 0 && (
          <PhotoStrip
            fotos={serviceFotos}
            onOpen={localIdx => {
              const firstIdx = allFotos.findIndex(f => f.publicId === serviceFotos[0]?.publicId)
              onOpenFoto(Math.max(0, firstIdx + localIdx))
            }}
          />
        )}
      </div>
    </div>
  )
}

// ─── Collab Row Card ──────────────────────────────────────────────────────────
function CollabCard({ collab, entry, isExpanded, onToggle }: {
  collab: Collaborator
  entry: DayEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  const [lightbox, setLightbox] = useState<number | null>(null)
  const services   = getServices(entry)
  const allFotos   = getAllFotos(entry)
  const isAbsence  = entry.totalHoras === 0
  const taxa       = resolveEntryTaxa(entry, collab.currentRate)
  const valor      = (entry.totalHoras || 0) * taxa
  const nFotos     = allFotos.length
  const obras      = [...new Set(services.map(s => s.obraNome).filter(Boolean))]

  return (
    <>
      {lightbox !== null && (
        <PhotoLightbox fotos={allFotos} initialIndex={lightbox} onClose={() => setLightbox(null)} />
      )}

      <div className={cn(
        "rounded-2xl border overflow-hidden transition-all duration-200 w-full",
        isAbsence
          ? "border-amber-200/60 dark:border-amber-800/30 bg-amber-50/20 dark:bg-amber-950/8"
          : isExpanded
            ? "border-primary/25 bg-card shadow-md shadow-black/5"
            : "border-border/40 bg-card hover:border-border/70 hover:shadow-sm"
      )}>

        {/* ── Header ── */}
        <button type="button" onClick={onToggle}
          className="w-full flex items-center gap-3 px-4 py-3.5 text-left min-w-0 active:bg-muted/20 transition-colors">

          {/* Avatar + status dot */}
          <div className="relative shrink-0">
            <Avatar name={collab.name} photo={undefined} size="md" />
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background shadow",
              isAbsence ? "bg-amber-400" : "bg-emerald-500"
            )} />
          </div>

          {/* Name + sub */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold truncate leading-tight">{collab.name}</p>
            <div className="flex items-center gap-1 mt-0.5 min-w-0">
              {isAbsence ? (
                <span className="text-[11px] text-amber-500 font-semibold">Ausência</span>
              ) : obras.length > 0 ? (
                <span className="text-[11px] text-muted-foreground/55 flex items-center gap-1 min-w-0 truncate">
                  <HardHat className="h-2.5 w-2.5 shrink-0 text-muted-foreground/30" />
                  <span className="truncate">{obras[0]}{obras.length > 1 ? ` +${obras.length - 1}` : ""}</span>
                </span>
              ) : (
                <span className="text-[11px] text-muted-foreground/40">Sem obra registada</span>
              )}
            </div>
          </div>

          {/* Badges */}
          <div className="flex items-center gap-1.5 shrink-0">
            {!isAbsence && entry.totalHoras > 0 && (
              <span className={cn(
                "text-[11px] font-black px-2 py-1 rounded-lg tabular-nums leading-none",
                entry.extraHoras > 0
                  ? "bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400"
                  : "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
              )}>
                {entry.totalHoras}h
              </span>
            )}
            {nFotos > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] font-bold px-1.5 py-1 rounded-lg bg-violet-100 dark:bg-violet-950/40 text-violet-600 dark:text-violet-400">
                <Camera className="h-2.5 w-2.5" />{nFotos}
              </span>
            )}
            <div className={cn(
              "w-6 h-6 rounded-lg flex items-center justify-center transition-all",
              isExpanded ? "bg-primary/10 rotate-180" : "bg-muted/40"
            )}>
              <ChevronDown className={cn("h-3.5 w-3.5 transition-colors", isExpanded ? "text-primary/60" : "text-muted-foreground/40")} />
            </div>
          </div>
        </button>

        {/* ── Expanded body ── */}
        {isExpanded && (
          <div className="border-t border-border/20 bg-muted/5 px-4 pt-4 pb-4 space-y-4 animate-fade-in">

            {/* Hour + value pills */}
            {!isAbsence && entry.totalHoras > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/25 border border-blue-100/80 dark:border-blue-900/40">
                  <Clock className="h-3 w-3 text-blue-500" />
                  <span className="text-[11px] font-bold text-blue-700 dark:text-blue-300">
                    {entry.normalHoras || 0}h normais
                  </span>
                </div>
                {(entry.extraHoras || 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/25 border border-orange-100/80 dark:border-orange-900/40">
                    <TrendingUp className="h-3 w-3 text-orange-500" />
                    <span className="text-[11px] font-bold text-orange-700 dark:text-orange-300">
                      {entry.extraHoras}h extra
                    </span>
                  </div>
                )}
                {valor > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-100/80 dark:border-emerald-900/40 ml-auto">
                    <Euro className="h-3 w-3 text-emerald-500" />
                    <span className="text-[11px] font-black text-emerald-700 dark:text-emerald-300">
                      {valor.toFixed(2)}€
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Services */}
            {!isAbsence && services.length > 0 && (
              <div className="space-y-2.5">
                {services.map((s, i) => (
                  <ServiceCard
                    key={s.id || i}
                    service={s}
                    idx={i}
                    total={services.length}
                    allFotos={allFotos}
                    onOpenFoto={idx => setLightbox(idx)}
                  />
                ))}
              </div>
            )}

            {/* Absence */}
            {isAbsence && (
              <div className="flex items-center gap-3 px-4 py-3.5 rounded-xl bg-amber-50/80 dark:bg-amber-950/15 border border-amber-100 dark:border-amber-900/30">
                <span className="text-2xl shrink-0">😔</span>
                <div>
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Ausência registada</p>
                  <p className="text-xs text-amber-600/60 dark:text-amber-400/50 mt-0.5">Sem horas neste dia</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Day Nav ─────────────────────────────────────────────────────────────────
function DayNav({ selectedDate, onChange, availableDates }: {
  selectedDate: string
  onChange: (d: string) => void
  availableDates: string[]
}) {
  const idx      = availableDates.indexOf(selectedDate)
  const canOlder = idx < availableDates.length - 1
  const canNewer = idx > 0

  return (
    <div className="flex items-center gap-1">
      <button type="button"
        onClick={() => canOlder && onChange(availableDates[idx + 1])}
        disabled={!canOlder}
        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/70 disabled:opacity-20 transition-all active:scale-90">
        <ChevronLeft className="h-4 w-4 text-muted-foreground/70" />
      </button>
      {!isToday(selectedDate) && (
        <button type="button"
          onClick={() => onChange(todayISO())}
          className="px-2.5 h-7 rounded-lg text-[10px] font-black text-primary hover:bg-primary/8 transition-all border border-primary/20">
          Hoje
        </button>
      )}
      <button type="button"
        onClick={() => canNewer && onChange(availableDates[idx - 1])}
        disabled={!canNewer}
        className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/70 disabled:opacity-20 transition-all active:scale-90">
        <ChevronRight className="h-4 w-4 text-muted-foreground/70" />
      </button>
    </div>
  )
}

// ─── Stats Strip ─────────────────────────────────────────────────────────────
function StatsStrip({ registered, total, totalHours, totalCost, totalFotos }: {
  registered: number; total: number; totalHours: number; totalCost: number; totalFotos: number
}) {
  const pct = total > 0 ? Math.round((registered / total) * 100) : 0

  const cells = [
    { label: "Registo",  value: `${registered}/${total}`,     color: "text-emerald-600 dark:text-emerald-400", sub: `${pct}%` },
    { label: "Horas",    value: `${totalHours}h`,             color: "text-blue-600 dark:text-blue-400",     sub: "hoje" },
    { label: "Custo",    value: `${totalCost.toFixed(0)}€`,   color: "text-orange-600 dark:text-orange-400", sub: "est." },
    ...(totalFotos > 0 ? [{ label: "Fotos", value: `${totalFotos}`, color: "text-violet-600 dark:text-violet-400", sub: "upload" }] : []),
  ]

  return (
    <div className={cn("grid divide-x divide-border/25 bg-muted/8 border-b border-border/20", `grid-cols-${cells.length}`)}>
      {cells.map(c => (
        <div key={c.label} className="flex flex-col items-center py-3 gap-0.5 px-1">
          <span className={cn("text-base font-black tabular-nums leading-none", c.color)}>{c.value}</span>
          <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40">{c.label}</span>
          <span className="text-[9px] text-muted-foreground/25">{c.sub}</span>
        </div>
      ))}
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function TodayPanel({ collaborators }: { collaborators: Collaborator[] }) {
  const [collapsed,    setCollapsed]    = useState(false)
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(todayISO)

  const availableDates = useMemo(() => allEntryDates(collaborators), [collaborators])

  const handleDateChange = useCallback((d: string) => {
    setSelectedDate(d)
    setExpanded(new Set())
  }, [])

  const { registered, absent, totalHours, totalCost, totalFotos } = useMemo(() => {
    const registered: { collab: Collaborator; entry: DayEntry }[] = []
    const absent: Collaborator[] = []
    collaborators.forEach(c => {
      const e = c.entries.find(e => e.date === selectedDate)
      e ? registered.push({ collab: c, entry: e }) : absent.push(c)
    })
    const totalHours = registered.reduce((s, r) => s + (r.entry.totalHoras || 0), 0)
    const totalCost  = registered.reduce((s, r) => s + (r.entry.totalHoras || 0) * resolveEntryTaxa(r.entry, r.collab.currentRate), 0)
    const totalFotos = registered.reduce((s, r) => s + getAllFotos(r.entry).length, 0)
    return { registered, absent, totalHours, totalCost, totalFotos }
  }, [collaborators, selectedDate])

  const toggle      = useCallback((id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n }), [])
  const expandAll   = useCallback(() => setExpanded(new Set(registered.map(r => r.collab.id))), [registered])
  const collapseAll = useCallback(() => setExpanded(new Set()), [])

  const isTodayDay   = isToday(selectedDate)
  const isWeekendDay = isWeekend(selectedDate)

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden w-full">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-2 px-4 py-3.5 border-b border-border/30">

        {/* Day icon */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
          isTodayDay
            ? "bg-gradient-to-br from-amber-400 to-orange-500 shadow-orange-500/25"
            : isWeekendDay
              ? "bg-gradient-to-br from-violet-500 to-purple-600 shadow-violet-500/25"
              : "bg-gradient-to-br from-slate-500 to-slate-700 shadow-slate-500/20"
        )}>
          {isTodayDay
            ? <Sun className="h-4 w-4 text-white" />
            : <CalendarDays className="h-4 w-4 text-white" />
          }
        </div>

        {/* Title — clickable to collapse */}
        <button type="button" onClick={() => setCollapsed(v => !v)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-black capitalize truncate">{dayLabel(selectedDate)}</span>
            {isTodayDay && (
              <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                Hoje
              </span>
            )}
            {isWeekendDay && (
              <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-600 dark:text-violet-400 border border-violet-200 dark:border-violet-800/50">
                Fim de semana
              </span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/45 mt-0.5 leading-none">
            {registered.length} de {collaborators.length} registaram
            {totalFotos > 0 && ` · ${totalFotos} foto${totalFotos !== 1 ? "s" : ""}`}
          </p>
        </button>

        {/* Nav + toggle */}
        <div className="flex items-center gap-1 shrink-0">
          <DayNav selectedDate={selectedDate} onChange={handleDateChange} availableDates={availableDates} />
          <button type="button" onClick={() => setCollapsed(v => !v)}
            className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-all">
            <ChevronDown className={cn("h-4 w-4 text-muted-foreground/40 transition-transform duration-200", !collapsed && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      {!collapsed && (
        <div className="w-full animate-fade-in">

          {/* Stats strip */}
          <StatsStrip
            registered={registered.length}
            total={collaborators.length}
            totalHours={totalHours}
            totalCost={totalCost}
            totalFotos={totalFotos}
          />

          <div className="p-3 sm:p-4 space-y-2.5 w-full">

            {/* Empty state */}
            {registered.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <div className="w-14 h-14 rounded-3xl bg-muted/30 border border-border/25 flex items-center justify-center">
                  <Sparkles className="h-7 w-7 text-muted-foreground/20" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground/50">Sem registos</p>
                  <p className="text-xs text-muted-foreground/35 mt-1 max-w-[200px] mx-auto leading-relaxed">
                    {isTodayDay ? "Aguarda que a equipa registe o dia de hoje" : "Nenhum colaborador registou actividade neste dia"}
                  </p>
                </div>
              </div>
            )}

            {/* Expand/collapse controls */}
            {registered.length > 1 && (
              <div className="flex items-center justify-between px-0.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/35">
                  {registered.length} com registo
                </span>
                <div className="flex items-center gap-3">
                  <button type="button" onClick={expandAll}
                    className="text-[10px] font-black text-primary/60 hover:text-primary transition-colors">
                    Ver todos
                  </button>
                  <span className="text-muted-foreground/20 text-xs">·</span>
                  <button type="button" onClick={collapseAll}
                    className="text-[10px] font-semibold text-muted-foreground/40 hover:text-muted-foreground transition-colors">
                    Recolher
                  </button>
                </div>
              </div>
            )}

            {/* Registered collab cards */}
            {registered.map(({ collab, entry }) => (
              <CollabCard
                key={collab.id}
                collab={collab}
                entry={entry}
                isExpanded={expanded.has(collab.id)}
                onToggle={() => toggle(collab.id)}
              />
            ))}

            {/* Absent grid */}
            {absent.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 px-0.5">
                  <AlertCircle className="h-3 w-3 text-muted-foreground/30" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/35">
                    {isTodayDay ? "Ainda sem registo" : "Sem registo"} · {absent.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {absent.map(c => (
                    <div key={c.id}
                      className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/20 bg-muted/10 min-w-0 overflow-hidden">
                      <div className="relative shrink-0">
                        <Avatar name={c.name} photo={undefined} size="sm" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-muted-foreground/15 border-2 border-background" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground/55 truncate">
                        {c.name.split(" ")[0]}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
