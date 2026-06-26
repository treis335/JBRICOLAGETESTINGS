// components/admin/today-panel.tsx
"use client"

import { useMemo, useState, useCallback, useEffect } from "react"
import {
  Clock, HardHat, Users, Camera, ChevronDown, ChevronUp,
  ChevronLeft, ChevronRight, CircleCheck, CircleDashed,
  AlertCircle, Euro, Sun, CalendarDays, X,
  ArrowLeft, ArrowRight, Package, FileText, ZoomIn,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveEntryTaxa } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import type { DayEntry, Service, ServiceFoto } from "@/lib/types"

// ─── Date helpers ─────────────────────────────────────────────────────────────
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

// ─── Data helpers ─────────────────────────────────────────────────────────────
function getServices(entry: DayEntry): Service[] {
  if (Array.isArray(entry.services) && entry.services.length > 0) return entry.services
  return [{ id: "legacy", obraNome: entry.descricao || "Sem obra especificada", obraId: undefined,
    descricao: entry.descricao || "", equipa: entry.equipa || [], materiais: entry.materiais || [], totalHoras: entry.totalHoras }]
}
function getFotos(entry: DayEntry): (ServiceFoto & { serviceName: string })[] {
  if (!Array.isArray(entry.services)) return []
  return entry.services.flatMap(s => (s.fotos || []).map(f => ({ ...f, serviceName: s.obraNome })))
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = "md" }: { name: string; photo?: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const sz = { sm: "w-8 h-8 text-[10px]", md: "w-10 h-10 text-xs", lg: "w-14 h-14 text-sm" }[size]
  const palettes = ["from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-violet-500 to-purple-600","from-orange-500 to-amber-500","from-pink-500 to-rose-600","from-cyan-500 to-blue-500"]
  const palette = palettes[name.charCodeAt(0) % palettes.length]
  if (photo) return <img src={photo} alt={name} className={cn("rounded-2xl object-cover shrink-0", sz)} />
  return <div className={cn("rounded-2xl bg-gradient-to-br flex items-center justify-center text-white font-black shrink-0", sz, palette)}>{initials}</div>
}

// ─── Photo Gallery Popup ──────────────────────────────────────────────────────
function PhotoGallery({ fotos, initialIndex = 0, onClose }: {
  fotos: (ServiceFoto & { serviceName: string })[]
  initialIndex?: number
  onClose: () => void
}) {
  const [idx, setIdx] = useState(initialIndex)
  const foto    = fotos[idx]
  const canPrev = idx > 0
  const canNext = idx < fotos.length - 1
  const prev    = () => setIdx(i => Math.max(0, i - 1))
  const next    = () => setIdx(i => Math.min(fotos.length - 1, i + 1))

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape")      onClose()
      if (e.key === "ArrowLeft")   prev()
      if (e.key === "ArrowRight")  next()
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-[300] bg-black/96 flex flex-col" onClick={onClose}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-2 min-w-0">
          <span className={cn(
            "shrink-0 text-[10px] font-black px-2.5 py-1 rounded-full border",
            foto.tipo === "antes"
              ? "bg-amber-500/20 text-amber-400 border-amber-500/30"
              : "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
          )}>
            {foto.tipo === "antes" ? "ANTES" : "DEPOIS"}
          </span>
          <span className="text-sm text-white/60 truncate">{foto.serviceName}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-xs text-white/35 tabular-nums">{idx + 1} / {fotos.length}</span>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all">
            <X className="h-4 w-4 text-white" />
          </button>
        </div>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0" onClick={e => e.stopPropagation()}>
        <img key={foto.url} src={foto.url} alt="" className="max-w-full max-h-full object-contain rounded-2xl select-none" style={{ maxHeight: "calc(100dvh - 140px)" }} />
      </div>

      {/* Nav */}
      <div className="flex items-center justify-center gap-4 py-4 shrink-0" onClick={e => e.stopPropagation()}>
        <button onClick={prev} disabled={!canPrev} className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center transition-all">
          <ArrowLeft className="h-5 w-5 text-white" />
        </button>
        <div className="flex items-center gap-1.5">
          {fotos.map((_, i) => (
            <button key={i} onClick={() => setIdx(i)} className={cn("rounded-full transition-all", i === idx ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50")} />
          ))}
        </div>
        <button onClick={next} disabled={!canNext} className="w-11 h-11 rounded-2xl bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center transition-all">
          <ArrowRight className="h-5 w-5 text-white" />
        </button>
      </div>
    </div>
  )
}

// ─── Foto trigger button (compact thumbnails → opens popup) ──────────────────
function FotoTrigger({ fotos, onOpen }: {
  fotos: (ServiceFoto & { serviceName: string })[]
  onOpen: (idx: number) => void
}) {
  if (!fotos.length) return null
  const antes  = fotos.filter(f => f.tipo === "antes").length
  const depois = fotos.filter(f => f.tipo === "depois").length
  const first  = fotos[0]

  return (
    <button
      onClick={() => onOpen(0)}
      className="flex items-center gap-2 px-3 py-2 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group w-full sm:w-auto"
    >
      {/* Stacked thumbnails preview */}
      <div className="flex items-center -space-x-2 shrink-0">
        {fotos.slice(0, 3).map((f, i) => (
          <img key={f.publicId} src={f.url} alt=""
            className="w-8 h-8 rounded-lg object-cover border-2 border-background ring-1 ring-border/30"
            style={{ zIndex: 3 - i }} />
        ))}
      </div>
      <div className="text-left min-w-0">
        <p className="text-xs font-bold text-foreground leading-none">
          {fotos.length} foto{fotos.length !== 1 ? "s" : ""}
        </p>
        <p className="text-[10px] text-muted-foreground/60 mt-0.5">
          {antes > 0 && `${antes} antes`}{antes > 0 && depois > 0 && " · "}{depois > 0 && `${depois} depois`}
        </p>
      </div>
      <ZoomIn className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary/60 transition-colors shrink-0 ml-auto" />
    </button>
  )
}

// ─── Collab Card ─────────────────────────────────────────────────────────────
function CollabCard({ collab, entry, isExpanded, onToggle }: {
  collab: Collaborator
  entry: DayEntry
  isExpanded: boolean
  onToggle: () => void
}) {
  const [gallery, setGallery] = useState<{ fotos: (ServiceFoto & { serviceName: string })[]; idx: number } | null>(null)
  const services  = getServices(entry)
  const fotos     = getFotos(entry)
  const isAbsence = entry.totalHoras === 0
  const valor     = (entry.totalHoras || 0) * resolveEntryTaxa(entry, collab.currentRate)
  const obras     = [...new Set(services.map(s => s.obraNome).filter(Boolean))]
  const nFotos    = fotos.length

  return (
    <>
      {gallery && <PhotoGallery fotos={gallery.fotos} initialIndex={gallery.idx} onClose={() => setGallery(null)} />}

      <div className={cn(
        "rounded-2xl border overflow-hidden transition-all",
        isAbsence
          ? "border-amber-200/70 dark:border-amber-800/40 bg-amber-50/30 dark:bg-amber-950/10"
          : isExpanded
            ? "border-primary/20 bg-card shadow-sm"
            : "border-border/40 bg-card hover:border-border/70"
      )}>

        {/* ── Header row ── */}
        <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 px-4 py-3.5 text-left min-w-0">
          <div className="relative shrink-0">
            <Avatar name={collab.name} photo={collab.photoURL} size="md" />
            <span className={cn(
              "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-background shadow-sm",
              isAbsence ? "bg-amber-400" : "bg-emerald-500"
            )} />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">{collab.name}</p>
            <div className="flex items-center gap-1.5 mt-0.5 min-w-0">
              {isAbsence ? (
                <span className="text-[11px] text-amber-600 dark:text-amber-400 font-semibold">Ausência</span>
              ) : obras.length > 0 ? (
                <span className="text-[11px] text-muted-foreground/65 flex items-center gap-1 min-w-0">
                  <HardHat className="h-3 w-3 shrink-0 text-muted-foreground/35" />
                  <span className="truncate">{obras[0]}{obras.length > 1 ? ` +${obras.length - 1}` : ""}</span>
                </span>
              ) : null}
            </div>
          </div>

          {/* Right badges */}
          <div className="shrink-0 flex items-center gap-1.5">
            {!isAbsence && entry.totalHoras > 0 && (
              <span className={cn(
                "text-xs font-black px-2.5 py-1 rounded-xl tabular-nums",
                entry.extraHoras > 0
                  ? "bg-orange-100 dark:bg-orange-950/40 text-orange-700 dark:text-orange-400"
                  : "bg-blue-100 dark:bg-blue-950/40 text-blue-700 dark:text-blue-400"
              )}>
                {entry.totalHoras}h
              </span>
            )}
            {nFotos > 0 && (
              <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400 border border-violet-100 dark:border-violet-900/60">
                <Camera className="h-2.5 w-2.5" />{nFotos}
              </span>
            )}
            <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center transition-colors", isExpanded ? "bg-primary/10" : "bg-muted/40")}>
              {isExpanded
                ? <ChevronUp className="h-3.5 w-3.5 text-primary/60" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground/50" />
              }
            </div>
          </div>
        </button>

        {/* ── Expanded body ── */}
        {isExpanded && (
          <div className="border-t border-border/30 px-4 py-4 space-y-4 bg-muted/5">

            {/* Hour pills */}
            {!isAbsence && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900/60">
                  <Clock className="h-3.5 w-3.5 text-blue-500" />
                  <span className="text-xs font-bold text-blue-700 dark:text-blue-300">{entry.normalHoras || 0}h normais</span>
                </div>
                {(entry.extraHoras || 0) > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/60">
                    <Clock className="h-3.5 w-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-orange-700 dark:text-orange-300">{entry.extraHoras}h extra</span>
                  </div>
                )}
                {valor > 0 && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 ml-auto">
                    <Euro className="h-3.5 w-3.5 text-emerald-500" />
                    <span className="text-xs font-black text-emerald-700 dark:text-emerald-300">{valor.toFixed(2)}€</span>
                  </div>
                )}
              </div>
            )}

            {/* Services */}
            {services.map((s, i) => (
              <div key={s.id || i} className="rounded-xl border border-border/40 bg-card overflow-hidden">
                {/* Service obra header */}
                {s.obraNome && (
                  <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-muted/25 border-b border-border/25">
                    <div className="w-6 h-6 rounded-lg bg-orange-100 dark:bg-orange-950/40 flex items-center justify-center shrink-0">
                      <HardHat className="h-3 w-3 text-orange-600 dark:text-orange-400" />
                    </div>
                    <span className="text-sm font-bold text-foreground truncate flex-1 min-w-0">{s.obraNome}</span>
                    {services.length > 1 && (
                      <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full bg-muted/80 text-muted-foreground/60 uppercase tracking-wide shrink-0">#{i + 1}</span>
                    )}
                  </div>
                )}

                <div className="px-3.5 py-3 space-y-3">
                  {/* Description */}
                  {s.descricao && (
                    <div className="flex items-start gap-2">
                      <FileText className="h-3.5 w-3.5 text-muted-foreground/35 shrink-0 mt-0.5" />
                      <p className="text-xs text-muted-foreground/80 leading-relaxed">{s.descricao}</p>
                    </div>
                  )}

                  {/* Team chips */}
                  {(s.equipa || []).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
                        <Users className="h-2.5 w-2.5" /> Equipa
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {(s.equipa || []).map(m => (
                          <span key={m} className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-primary/8 border border-primary/15 text-primary/80">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Materials */}
                  {(s.materiais || []).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
                        <Package className="h-2.5 w-2.5" /> Materiais
                      </p>
                      <div className="flex flex-wrap gap-1">
                        {(s.materiais || []).map(m => (
                          <span key={m} className="text-[10px] px-2 py-0.5 rounded-lg bg-muted/60 border border-border/40 text-muted-foreground/70">{m}</span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Photos — trigger button → popup gallery */}
                  {(s.fotos || []).length > 0 && (
                    <div className="space-y-1.5">
                      <p className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-widest flex items-center gap-1">
                        <Camera className="h-2.5 w-2.5" /> Fotos
                      </p>
                      <FotoTrigger
                        fotos={(s.fotos || []).map(f => ({ ...f, serviceName: s.obraNome }))}
                        onOpen={localIdx => {
                          const serviceStart = fotos.findIndex(f => f.publicId === (s.fotos || [])[0]?.publicId)
                          setGallery({ fotos, idx: Math.max(0, serviceStart + localIdx) })
                        }}
                      />
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Absence message */}
            {isAbsence && (
              <div className="flex items-center gap-3 px-3.5 py-3 rounded-xl bg-amber-50/80 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/40">
                <span className="text-2xl shrink-0">😔</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-amber-800 dark:text-amber-300">Ausência registada</p>
                  <p className="text-xs text-amber-600/70 dark:text-amber-400/60 mt-0.5">Sem horas trabalhadas neste dia</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  )
}

// ─── Day Navigation ───────────────────────────────────────────────────────────
function DayNav({ selectedDate, onChange, availableDates }: {
  selectedDate: string
  onChange: (d: string) => void
  availableDates: string[]
}) {
  const idx      = availableDates.indexOf(selectedDate)
  const canOlder = idx < availableDates.length - 1
  const canNewer = idx > 0

  return (
    <div className="flex items-center gap-0.5 shrink-0">
      <button onClick={() => canOlder && onChange(availableDates[idx + 1])} disabled={!canOlder}
        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted/70 disabled:opacity-20 transition-all active:scale-95" title="Dia anterior">
        <ChevronLeft className="h-4 w-4 text-muted-foreground" />
      </button>
      {!isToday(selectedDate) && (
        <button onClick={() => onChange(todayISO())}
          className="px-3 h-7 rounded-lg text-[10px] font-black text-primary hover:bg-primary/8 transition-all border border-primary/25">
          Hoje
        </button>
      )}
      <button onClick={() => canNewer && onChange(availableDates[idx - 1])} disabled={!canNewer}
        className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-muted/70 disabled:opacity-20 transition-all active:scale-95" title="Dia seguinte">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  )
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export function TodayPanel({ collaborators }: { collaborators: Collaborator[] }) {
  const [collapsed,    setCollapsed]    = useState(false)
  const [expanded,     setExpanded]     = useState<Set<string>>(new Set())
  const [selectedDate, setSelectedDate] = useState(todayISO())

  const availableDates = useMemo(() => allEntryDates(collaborators), [collaborators])

  const handleDateChange = (d: string) => { setSelectedDate(d); setExpanded(new Set()) }

  const { registered, absent, totalHours, totalCost, totalFotos } = useMemo(() => {
    const registered: { collab: Collaborator; entry: DayEntry }[] = []
    const absent: Collaborator[] = []
    collaborators.forEach(c => {
      const e = c.entries.find(e => e.date === selectedDate)
      e ? registered.push({ collab: c, entry: e }) : absent.push(c)
    })
    const totalHours = registered.reduce((s, r) => s + (r.entry.totalHoras || 0), 0)
    const totalCost  = registered.reduce((s, r) => s + (r.entry.totalHoras || 0) * resolveEntryTaxa(r.entry, r.collab.currentRate), 0)
    const totalFotos = registered.reduce((s, r) => s + getFotos(r.entry).length, 0)
    return { registered, absent, totalHours, totalCost, totalFotos }
  }, [collaborators, selectedDate])

  const toggle      = (id: string) => setExpanded(p => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n })
  const expandAll   = () => setExpanded(new Set(registered.map(r => r.collab.id)))
  const collapseAll = () => setExpanded(new Set())
  const isTodayDay  = isToday(selectedDate)
  const isWeekendDay = isWeekend(selectedDate)

  return (
    <div className="rounded-2xl border border-border/50 bg-card shadow-sm overflow-hidden w-full">

      {/* ── HEADER ── */}
      <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-3 border-b border-border/30">
        {/* Icon */}
        <div className={cn(
          "w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0",
          isTodayDay     ? "bg-gradient-to-br from-amber-400 to-orange-500"
          : isWeekendDay ? "bg-gradient-to-br from-violet-500 to-purple-600"
          :                "bg-gradient-to-br from-slate-500 to-slate-600"
        )}>
          {isTodayDay ? <Sun className="h-4 w-4 text-white" /> : <CalendarDays className="h-4 w-4 text-white" />}
        </div>

        {/* Title */}
        <button type="button" onClick={() => setCollapsed(v => !v)} className="flex-1 min-w-0 text-left">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-sm font-black text-foreground capitalize truncate">{dayLabel(selectedDate)}</span>
            {isTodayDay && (
              <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">Hoje</span>
            )}
            {isWeekendDay && (
              <span className="shrink-0 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-violet-100 dark:bg-violet-950/50 text-violet-700 dark:text-violet-400 border border-violet-200 dark:border-violet-800">Fim de semana</span>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground/50 mt-0.5">
            {registered.length}/{collaborators.length} registos{totalFotos > 0 ? ` · ${totalFotos} foto${totalFotos !== 1 ? "s" : ""}` : ""}
          </p>
        </button>

        {/* Nav + collapse */}
        <div className="flex items-center shrink-0">
          <DayNav selectedDate={selectedDate} onChange={handleDateChange} availableDates={availableDates} />
          <button onClick={() => setCollapsed(v => !v)} className="w-8 h-8 rounded-xl flex items-center justify-center hover:bg-muted/60 transition-all ml-1">
            {collapsed ? <ChevronDown className="h-4 w-4 text-muted-foreground/50" /> : <ChevronUp className="h-4 w-4 text-muted-foreground/50" />}
          </button>
        </div>
      </div>

      {/* ── BODY ── */}
      {!collapsed && (
        <div className="w-full">
          {/* Stats strip */}
          <div className="grid grid-cols-3 divide-x divide-border/30 bg-muted/10 border-b border-border/20">
            {[
              { label: "Registaram",    value: `${registered.length}`, sub: `de ${collaborators.length}`, color: "text-emerald-600 dark:text-emerald-400" },
              { label: "Horas",         value: `${totalHours}h`,       sub: "trabalhadas",                color: "text-blue-600 dark:text-blue-400" },
              { label: "Custo",         value: `${totalCost.toFixed(0)}€`, sub: "estimado",               color: "text-orange-600 dark:text-orange-400" },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center py-3 px-1 gap-0.5">
                <span className={cn("text-lg font-black tabular-nums leading-none", s.color)}>{s.value}</span>
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground/40 text-center">{s.label}</span>
                <span className="text-[9px] text-muted-foreground/30">{s.sub}</span>
              </div>
            ))}
          </div>

          <div className="p-3 space-y-2 w-full">

            {/* Empty state */}
            {registered.length === 0 && collaborators.length > 0 && (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <div className="w-14 h-14 rounded-3xl bg-muted/40 border border-border/30 flex items-center justify-center">
                  <CalendarDays className="h-7 w-7 text-muted-foreground/25" />
                </div>
                <div>
                  <p className="text-sm font-bold text-muted-foreground/60">Sem registos neste dia</p>
                  <p className="text-xs text-muted-foreground/40 mt-1">
                    {isTodayDay ? "Aguarda que a equipa registe o dia" : "Nenhum colaborador registou actividade"}
                  </p>
                </div>
              </div>
            )}

            {/* Controls */}
            {registered.length > 1 && (
              <div className="flex items-center justify-between px-1 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">
                  {registered.length} com registo
                </span>
                <div className="flex items-center gap-3">
                  <button onClick={expandAll}   className="text-[10px] font-black text-primary/70 hover:text-primary transition-colors">Ver todos</button>
                  <span className="text-muted-foreground/20">·</span>
                  <button onClick={collapseAll} className="text-[10px] font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors">Recolher</button>
                </div>
              </div>
            )}

            {/* Registered cards */}
            {registered.map(({ collab, entry }) => (
              <CollabCard key={collab.id} collab={collab} entry={entry}
                isExpanded={expanded.has(collab.id)} onToggle={() => toggle(collab.id)} />
            ))}

            {/* Absent grid */}
            {absent.length > 0 && (
              <div className="space-y-2 pt-1">
                <div className="flex items-center gap-1.5 px-1">
                  <AlertCircle className="h-3 w-3 text-muted-foreground/35" />
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">
                    {isTodayDay ? "Ainda sem registo" : "Sem registo"} · {absent.length}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                  {absent.map(c => (
                    <div key={c.id} className="flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border/20 bg-muted/10 min-w-0">
                      <div className="relative shrink-0">
                        <Avatar name={c.name} photo={c.photoURL} size="sm" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-muted-foreground/20 border-2 border-background" />
                      </div>
                      <span className="text-xs font-semibold text-muted-foreground/60 truncate">{c.name.split(" ")[0]}</span>
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
