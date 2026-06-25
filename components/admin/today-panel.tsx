// components/admin/today-panel.tsx
"use client"

import { useMemo, useState } from "react"
import {
  Clock, HardHat, Users, Camera, ChevronDown, ChevronUp,
  CircleCheck, CircleDashed, AlertCircle, Image as ImageIcon,
  MapPin, Euro, Sun, Sunrise, Sunset,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { resolveEntryTaxa } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import type { DayEntry, Service, ServiceFoto } from "@/lib/types"

// ── helpers ──────────────────────────────────────────────────────────────────
const todayISO = () => {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

const todayLabel = () =>
  new Date().toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })

function getServicesFromEntry(entry: DayEntry): Service[] {
  if (Array.isArray(entry.services) && entry.services.length > 0) return entry.services
  // Legacy: build synthetic service from flat fields
  return [{
    id: "legacy",
    obraNome: entry.descricao || "Sem obra",
    obraId: undefined,
    descricao: entry.descricao || "",
    equipa: entry.equipa || [],
    materiais: entry.materiais || [],
    totalHoras: entry.totalHoras,
  }]
}

function getAllFotos(entry: DayEntry): (ServiceFoto & { serviceName: string })[] {
  if (!Array.isArray(entry.services)) return []
  return entry.services.flatMap(s =>
    (s.fotos || []).map(f => ({ ...f, serviceName: s.obraNome }))
  )
}

// ── sub-components ────────────────────────────────────────────────────────────
function Avatar({ name, photo, size = "sm" }: { name: string; photo?: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]).join("").toUpperCase()
  const sz = size === "lg" ? "w-12 h-12 text-sm" : size === "md" ? "w-9 h-9 text-xs" : "w-7 h-7 text-[10px]"
  if (photo) {
    return <img src={photo} alt={name} className={cn("rounded-xl object-cover ring-2 ring-background shrink-0", sz)} />
  }
  const colors = ["from-blue-500 to-indigo-600","from-emerald-500 to-teal-600","from-violet-500 to-purple-600","from-orange-500 to-amber-600","from-pink-500 to-rose-600"]
  const color = colors[name.charCodeAt(0) % colors.length]
  return (
    <div className={cn("rounded-xl bg-gradient-to-br flex items-center justify-center text-white font-black shrink-0 ring-2 ring-background", sz, color)}>
      {initials}
    </div>
  )
}

function HorasBadge({ horas, extra }: { horas: number; extra: number }) {
  if (horas === 0) return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 dark:bg-amber-950/40 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-800">
      Ausência
    </span>
  )
  return (
    <span className={cn(
      "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border",
      extra > 0
        ? "bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-800"
        : "bg-blue-50 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-800"
    )}>
      <Clock className="h-2.5 w-2.5" />
      {horas}h{extra > 0 && <span className="text-orange-500 dark:text-orange-400">+{extra}ext</span>}
    </span>
  )
}

function FotoGrid({ fotos }: { fotos: (ServiceFoto & { serviceName: string })[] }) {
  const [lightbox, setLightbox] = useState<string | null>(null)
  if (!fotos.length) return null

  const antes = fotos.filter(f => f.tipo === "antes")
  const depois = fotos.filter(f => f.tipo === "depois")

  return (
    <>
      {lightbox && (
        <div
          className="fixed inset-0 z-[200] bg-black/92 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={() => setLightbox(null)}
        >
          <img src={lightbox} alt="" className="max-w-full max-h-[90dvh] object-contain rounded-2xl shadow-2xl" />
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        {antes.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
              <Sunrise className="h-2.5 w-2.5" /> Antes
            </p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(antes.length, 2)}, 1fr)` }}>
              {antes.map(f => (
                <button key={f.publicId} onClick={() => setLightbox(f.url)}
                  className="aspect-square rounded-xl overflow-hidden border border-border/30 hover:border-primary/40 hover:shadow-md transition-all group">
                  <img src={f.url} alt={f.serviceName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </button>
              ))}
            </div>
          </div>
        )}
        {depois.length > 0 && (
          <div className="space-y-1.5">
            <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50 flex items-center gap-1">
              <Sunset className="h-2.5 w-2.5" /> Depois
            </p>
            <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${Math.min(depois.length, 2)}, 1fr)` }}>
              {depois.map(f => (
                <button key={f.publicId} onClick={() => setLightbox(f.url)}
                  className="aspect-square rounded-xl overflow-hidden border border-border/30 hover:border-primary/40 hover:shadow-md transition-all group">
                  <img src={f.url} alt={f.serviceName} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  )
}

// ── Collabo card ──────────────────────────────────────────────────────────────
interface CollabCardProps {
  collab: Collaborator
  entry: DayEntry | null
  isExpanded: boolean
  onToggle: () => void
}

function CollabCard({ collab, entry, isExpanded, onToggle }: CollabCardProps) {
  const services = entry ? getServicesFromEntry(entry) : []
  const fotos = entry ? getAllFotos(entry) : []
  const hasRegistered = !!entry
  const isAbsence = hasRegistered && entry.totalHoras === 0
  const valor = entry
    ? (entry.totalHoras || 0) * resolveEntryTaxa(entry, collab.currentRate)
    : 0

  // All obra names today
  const obras = [...new Set(services.map(s => s.obraNome).filter(Boolean))]

  // All team members today (across services)
  const equipaAll = [...new Set(services.flatMap(s => s.equipa || []))]

  return (
    <div className={cn(
      "rounded-2xl border transition-all duration-200",
      !hasRegistered
        ? "border-border/30 bg-muted/20"
        : isAbsence
          ? "border-amber-200 dark:border-amber-800/60 bg-amber-50/50 dark:bg-amber-950/10"
          : "border-border/50 bg-card"
    )}>
      {/* Header row */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 px-4 py-3.5 text-left"
      >
        <div className="relative shrink-0">
          <Avatar name={collab.name} size="md" />
          {/* Status dot */}
          <span className={cn(
            "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
            !hasRegistered ? "bg-muted-foreground/30"
            : isAbsence ? "bg-amber-500"
            : "bg-emerald-500"
          )} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-bold text-foreground truncate">{collab.name}</span>
            {hasRegistered && (
              <HorasBadge horas={entry!.totalHoras} extra={entry!.extraHoras || 0} />
            )}
          </div>
          <div className="flex items-center gap-2 mt-0.5 flex-wrap">
            {!hasRegistered ? (
              <span className="text-[11px] text-muted-foreground/50 italic">Sem registo hoje</span>
            ) : obras.length > 0 ? (
              <span className="text-[11px] text-muted-foreground/70 flex items-center gap-1 truncate">
                <HardHat className="h-3 w-3 shrink-0" />
                {obras.slice(0, 2).join(" · ")}
                {obras.length > 2 && ` +${obras.length - 2}`}
              </span>
            ) : null}
          </div>
        </div>

        {/* Right side */}
        <div className="shrink-0 flex items-center gap-2">
          {hasRegistered && !isAbsence && valor > 0 && (
            <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 tabular-nums hidden sm:block">
              {valor.toFixed(0)}€
            </span>
          )}
          {fotos.length > 0 && (
            <span className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground/60 bg-muted/50 px-1.5 py-0.5 rounded-lg">
              <ImageIcon className="h-3 w-3" />{fotos.length}
            </span>
          )}
          {hasRegistered ? (
            isExpanded
              ? <ChevronUp className="h-4 w-4 text-muted-foreground/50" />
              : <ChevronDown className="h-4 w-4 text-muted-foreground/50" />
          ) : null}
        </div>
      </button>

      {/* Expanded detail */}
      {isExpanded && hasRegistered && (
        <div className="px-4 pb-4 space-y-4 border-t border-border/30 pt-3">
          {/* Services */}
          {services.map((s, idx) => (
            <div key={s.id || idx} className="space-y-2">
              {services.length > 1 && (
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  Serviço {idx + 1}
                </p>
              )}
              {s.obraNome && (
                <div className="flex items-center gap-2">
                  <HardHat className="h-3.5 w-3.5 text-muted-foreground/50 shrink-0" />
                  <span className="text-sm font-semibold text-foreground">{s.obraNome}</span>
                </div>
              )}
              {s.descricao && (
                <p className="text-xs text-muted-foreground/80 leading-relaxed pl-5">{s.descricao}</p>
              )}
              {(s.equipa || []).length > 0 && (
                <div className="flex items-center gap-2 pl-5 flex-wrap">
                  <Users className="h-3 w-3 text-muted-foreground/40 shrink-0" />
                  {(s.equipa || []).map(m => (
                    <span key={m} className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/8 border border-primary/15 text-primary/80">
                      {m}
                    </span>
                  ))}
                </div>
              )}
              {(s.materiais || []).length > 0 && (
                <div className="pl-5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 mb-1">Materiais</p>
                  <div className="flex flex-wrap gap-1">
                    {(s.materiais || []).map(m => (
                      <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-muted/60 border border-border/40 text-muted-foreground">
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}

          {/* Fotos */}
          {fotos.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 flex items-center gap-1.5">
                <Camera className="h-3 w-3" /> Fotos do dia
              </p>
              <FotoGrid fotos={fotos} />
            </div>
          )}

          {/* Cost */}
          {valor > 0 && (
            <div className="flex items-center justify-between pt-2 border-t border-border/20">
              <span className="text-xs text-muted-foreground/60 flex items-center gap-1.5">
                <Euro className="h-3 w-3" /> Custo do dia
              </span>
              <span className="text-sm font-black text-emerald-600 dark:text-emerald-400">
                {valor.toFixed(2)}€
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main TodayPanel ───────────────────────────────────────────────────────────
interface TodayPanelProps {
  collaborators: Collaborator[]
}

export function TodayPanel({ collaborators }: TodayPanelProps) {
  const [collapsed, setCollapsed] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const today = todayISO()

  const { registered, absent, pending, totalHours, totalCost, totalFotos } = useMemo(() => {
    const registered: { collab: Collaborator; entry: DayEntry }[] = []
    const absent: Collaborator[] = []

    collaborators.forEach(c => {
      const entry = c.entries.find(e => e.date === today)
      if (entry) {
        registered.push({ collab: c, entry })
      } else {
        absent.push(c)
      }
    })

    const totalHours = registered.reduce((s, r) => s + (r.entry.totalHoras || 0), 0)
    const totalCost = registered.reduce((s, r) => {
      return s + (r.entry.totalHoras || 0) * resolveEntryTaxa(r.entry, r.collab.currentRate)
    }, 0)
    const totalFotos = registered.reduce((s, r) => s + getAllFotos(r.entry).length, 0)

    return {
      registered,
      absent,
      pending: absent,
      totalHours,
      totalCost,
      totalFotos,
    }
  }, [collaborators, today])

  const toggleExpanded = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const expandAll = () => setExpanded(new Set(registered.map(r => r.collab.id)))
  const collapseAll = () => setExpanded(new Set())

  return (
    <div className="rounded-2xl border border-border/50 bg-card overflow-hidden shadow-sm">
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed(v => !v)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-muted/20 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-orange-500/20">
            <Sun className="h-5 w-5 text-white" />
          </div>
          <div className="text-left">
            <h2 className="text-base font-black text-foreground leading-tight capitalize">
              {todayLabel()}
            </h2>
            <p className="text-xs text-muted-foreground/60 mt-0.5">
              {registered.length} de {collaborators.length} registos
              {totalFotos > 0 && ` · ${totalFotos} foto${totalFotos !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>

        {/* Stats + toggle */}
        <div className="flex items-center gap-3">
          {/* Quick stats */}
          <div className="hidden sm:flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60">
              <CircleCheck className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-xs font-black text-emerald-700 dark:text-emerald-400">{registered.length}</span>
            </div>
            {pending.length > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-muted/50 border border-border/40">
                <CircleDashed className="h-3.5 w-3.5 text-muted-foreground/50" />
                <span className="text-xs font-bold text-muted-foreground/60">{pending.length}</span>
              </div>
            )}
            {totalHours > 0 && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800/60">
                <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
                <span className="text-xs font-black text-blue-700 dark:text-blue-400">{totalHours}h</span>
              </div>
            )}
          </div>
          {collapsed ? (
            <ChevronDown className="h-5 w-5 text-muted-foreground/40 shrink-0" />
          ) : (
            <ChevronUp className="h-5 w-5 text-muted-foreground/40 shrink-0" />
          )}
        </div>
      </button>

      {/* Body */}
      {!collapsed && (
        <div className="border-t border-border/30">
          {/* Summary strip */}
          <div className="grid grid-cols-3 divide-x divide-border/30 bg-muted/10">
            <div className="flex flex-col items-center py-3 gap-0.5">
              <span className="text-base font-black text-emerald-600 dark:text-emerald-400">{registered.length}</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">registaram</span>
            </div>
            <div className="flex flex-col items-center py-3 gap-0.5">
              <span className="text-base font-black text-blue-600 dark:text-blue-400">{totalHours}h</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">total horas</span>
            </div>
            <div className="flex flex-col items-center py-3 gap-0.5">
              <span className="text-base font-black text-orange-600 dark:text-orange-400">{totalCost.toFixed(0)}€</span>
              <span className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground/50">custo hoje</span>
            </div>
          </div>

          {/* Cards */}
          <div className="p-3 space-y-2">
            {/* Controls */}
            {registered.length > 1 && (
              <div className="flex items-center justify-between px-1 mb-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40">
                  {registered.length} colaboradore{registered.length !== 1 ? "s" : ""} com registo
                </p>
                <div className="flex items-center gap-2">
                  <button onClick={expandAll} className="text-[10px] font-bold text-primary/70 hover:text-primary transition-colors">
                    Expandir todos
                  </button>
                  <span className="text-muted-foreground/30">·</span>
                  <button onClick={collapseAll} className="text-[10px] font-bold text-muted-foreground/50 hover:text-muted-foreground transition-colors">
                    Recolher
                  </button>
                </div>
              </div>
            )}

            {/* Registered */}
            {registered.map(({ collab, entry }) => (
              <CollabCard
                key={collab.id}
                collab={collab}
                entry={entry}
                isExpanded={expanded.has(collab.id)}
                onToggle={() => toggleExpanded(collab.id)}
              />
            ))}

            {/* Pending / Not registered */}
            {absent.length > 0 && (
              <div className="space-y-1.5 mt-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/40 px-1 flex items-center gap-1.5">
                  <AlertCircle className="h-3 w-3" />
                  Sem registo hoje ({absent.length})
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {absent.map(c => (
                    <div key={c.id} className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border border-border/20 bg-muted/10">
                      <div className="relative shrink-0">
                        <Avatar name={c.name} size="sm" />
                        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-muted-foreground/25 border-2 border-background" />
                      </div>
                      <span className="text-xs font-medium text-muted-foreground/70 truncate">{c.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {collaborators.length === 0 && (
              <div className="py-8 text-center space-y-2">
                <Users className="h-8 w-8 text-muted-foreground/20 mx-auto" />
                <p className="text-sm text-muted-foreground/60">Sem colaboradores</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
