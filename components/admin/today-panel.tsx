// components/admin/today-panel.tsx
"use client"

import { useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"
import {
  Clock, HardHat, CheckCircle2, AlertCircle,
  ChevronRight, ChevronLeft, Camera, ZoomIn, X,
  ChevronDown, Sun, Users2,
} from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

function initials(name: string) {
  return name.split(" ").slice(0,2).map((w:string) => w[0]).join("").toUpperCase()
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ fotos, start, onClose }: { fotos: any[]; start: number; onClose: () => void }) {
  const [cur, setCur] = useState(start)
  const tx = useRef<number|null>(null)
  const isAntes = fotos[cur]?.tipo === "antes"
  return (
    <div className="fixed inset-0 z-[300] bg-black/96 flex flex-col"
      onClick={onClose}
      onTouchStart={e => { tx.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (tx.current===null) return
        const dx = e.changedTouches[0].clientX - tx.current
        if (dx > 50) setCur(c => Math.max(0, c-1))
        else if (dx < -50) setCur(c => Math.min(fotos.length-1, c+1))
        tx.current = null
      }}>
      <div className="flex items-center justify-between px-4 pt-4 pb-2 shrink-0" onClick={e => e.stopPropagation()}>
        <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
          isAntes
            ? "bg-sky-500/15 text-sky-300 border-sky-500/25"
            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25")}>
          {isAntes ? "Antes" : "Depois"} · {cur+1}/{fotos.length}
        </span>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all">
          <X className="h-4 w-4 text-white/70" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative" onClick={e => e.stopPropagation()}>
        {cur > 0 && (
          <button onClick={() => setCur(c => c-1)} className="absolute left-2 z-10 w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center">
            <ChevronLeft className="h-4 w-4 text-white/70" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotos[cur]?.url} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        {cur < fotos.length-1 && (
          <button onClick={() => setCur(c => c+1)} className="absolute right-2 z-10 w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-white/70" />
          </button>
        )}
      </div>
      {fotos.length > 1 && (
        <div className="flex justify-center gap-1.5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          {fotos.map((_:any, i:number) => (
            <button key={i} onClick={() => setCur(i)}
              className={cn("rounded-full transition-all", i===cur ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/25")} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Foto thumbnails ───────────────────────────────────────────────────────────
function FotoRow({ label, fotos, accent }: { label: string; fotos: any[]; accent: "sky"|"emerald" }) {
  const [lb, setLb] = useState<number|null>(null)
  if (!fotos.length) return null
  const MAX = 4
  return (
    <>
      <div className="flex items-center gap-2 min-w-0">
        <span className={cn(
          "text-[9px] font-black uppercase tracking-widest shrink-0 w-8",
          accent === "sky" ? "text-sky-500" : "text-emerald-500"
        )}>{label}</span>
        <div className="flex gap-1 min-w-0">
          {fotos.slice(0, MAX).map((f:any, i:number) => (
            <button key={f.publicId ?? i} type="button" onClick={() => setLb(i)}
              className="relative w-8 h-8 rounded-lg overflow-hidden border border-white/10 shrink-0 group">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                <ZoomIn className="h-2.5 w-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
            </button>
          ))}
          {fotos.length > MAX && (
            <div className="w-8 h-8 rounded-lg bg-muted/60 border border-border/30 flex items-center justify-center shrink-0">
              <span className="text-[9px] font-bold text-muted-foreground">+{fotos.length - MAX}</span>
            </div>
          )}
        </div>
      </div>
      {lb !== null && <Lightbox fotos={fotos} start={lb} onClose={() => setLb(null)} />}
    </>
  )
}

// ── Collab card ───────────────────────────────────────────────────────────────
function CollabCard({ collab, todayKey, onClick }: { collab: any; todayKey: string; onClick: () => void }) {
  const [open, setOpen] = useState(false)

  const entry    = collab.entries?.find((e:any) => e.date === todayKey) ?? null
  const worked   = !!entry
  const horas    = entry?.totalHoras ?? 0
  const services = entry?.services ?? []
  const obras    = [...new Set(services.map((s:any) => s.obraNome).filter(Boolean))] as string[]
  const equipa   = [...new Set(services.flatMap((s:any) => s.equipa ?? []))] as string[]
  const fotosA   = services.flatMap((s:any) => (s.fotos ?? []).filter((f:any) => f.tipo === "antes"))
  const fotosD   = services.flatMap((s:any) => (s.fotos ?? []).filter((f:any) => f.tipo === "depois"))
  const hasDetails = equipa.length > 0 || fotosA.length > 0 || fotosD.length > 0

  return (
    <div className={cn(
      "rounded-2xl border overflow-hidden transition-all",
      worked ? "bg-card border-border/50" : "bg-muted/15 border-border/20"
    )}>
      {/* Row */}
      <div className="flex items-center gap-3 px-3 py-2.5 min-w-0">
        {/* Avatar */}
        <div className={cn(
          "w-9 h-9 rounded-xl flex items-center justify-center text-[11px] font-black shrink-0",
          worked
            ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-sm shadow-emerald-500/20"
            : "bg-muted text-muted-foreground/30"
        )}>
          {initials(collab.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-[13px] font-bold truncate", !worked && "text-muted-foreground/40")}>
            {collab.name}
          </p>
          {worked ? (
            <div className="flex items-center gap-2 flex-wrap mt-0.5 min-w-0">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 shrink-0">
                <Clock className="h-3 w-3" />{horas.toFixed(1)}h
              </span>
              {obras.length > 0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/50 min-w-0">
                  <HardHat className="h-2.5 w-2.5 shrink-0" />
                  <span className="truncate">{obras[0]}{obras.length > 1 ? ` +${obras.length-1}` : ""}</span>
                </span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/30 mt-0.5">Sem registo</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {worked
            ? <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
            : <AlertCircle className="h-4 w-4 text-muted-foreground/20 shrink-0" />
          }
          {worked && hasDetails && (
            <button onClick={() => setOpen(o => !o)}
              className="w-7 h-7 rounded-lg hover:bg-muted/60 flex items-center justify-center transition-all shrink-0">
              <ChevronDown className={cn("h-3.5 w-3.5 text-muted-foreground/40 transition-transform duration-200", open && "rotate-180")} />
            </button>
          )}
          <button onClick={onClick}
            className="w-7 h-7 rounded-lg hover:bg-muted/60 flex items-center justify-center transition-all shrink-0">
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/30" />
          </button>
        </div>
      </div>

      {/* Expandable */}
      {worked && open && (
        <div className="border-t border-border/15 px-3 pb-3 pt-2.5 space-y-2 min-w-0 overflow-hidden">
          {equipa.length > 0 && (
            <div className="flex items-start gap-2 min-w-0">
              <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground/40 w-8 shrink-0 pt-0.5">Eq.</span>
              <div className="flex flex-wrap gap-1 min-w-0">
                {equipa.map((e:string, i:number) => (
                  <span key={i} className="px-1.5 py-0.5 rounded-md bg-muted/50 text-[11px] text-muted-foreground font-medium">
                    {e}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(fotosA.length > 0 || fotosD.length > 0) && (
            <div className="space-y-1.5 min-w-0">
              <FotoRow label="Antes"  fotos={fotosA} accent="sky" />
              <FotoRow label="Depois" fotos={fotosD} accent="emerald" />
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function TodayPanel() {
  const { collaborators, loading } = useCollaborators()
  const router = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const today        = new Date()
  const todayReal    = toKey(today)
  const [selectedDate, setSelectedDate] = useState<Date>(today)
  const todayKey  = toKey(selectedDate)
  const isToday   = todayKey === todayReal

  const dayLabel  = selectedDate.toLocaleDateString("pt-PT", { weekday: "long", day: "numeric", month: "long" })

  const goDay = (dir: -1 | 1) => {
    setSelectedDate(d => {
      const next = new Date(d)
      next.setDate(next.getDate() + dir)
      return next
    })
  }

  const { worked, idle, totalH, totalF } = useMemo(() => {
    const active = collaborators.filter(c => c.ativo !== false)
    const w = active.filter(c => c.entries?.some((e:any) => e.date === todayKey))
    const i = active.filter(c => !c.entries?.some((e:any) => e.date === todayKey))
    const h = w.reduce((s, c) => {
      const e = c.entries?.find((e:any) => e.date === todayKey)
      return s + (e?.totalHoras ?? 0)
    }, 0)
    const f = w.reduce((s, c) => {
      const e = c.entries?.find((e:any) => e.date === todayKey)
      return s + (e?.services ?? []).flatMap((sv:any) => sv.fotos ?? []).length
    }, 0)
    return { worked: w, idle: i, totalH: h, totalF: f }
  }, [collaborators, todayKey])

  const active = collaborators.filter(c => c.ativo !== false)
  const pct = active.length > 0 ? Math.round((worked.length / active.length) * 100) : 0

  if (loading) return (
    <div className="rounded-3xl bg-card border border-border/40 p-4 space-y-3 animate-pulse">
      <div className="h-4 w-36 bg-muted rounded-full" />
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i => <div key={i} className="h-14 bg-muted rounded-2xl" />)}
      </div>
      <div className="space-y-2">
        {[1,2].map(i => <div key={i} className="h-14 bg-muted rounded-2xl" />)}
      </div>
    </div>
  )

  return (
    <div className="rounded-3xl bg-card border border-border/40 overflow-hidden shadow-sm w-full max-w-full">

      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.15),_transparent_55%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.08),_transparent_55%)]" />

        <div className="relative px-4 pt-4 pb-4 min-w-0 overflow-hidden">
          {/* Top row */}
          <div className="flex items-center gap-2 mb-4 min-w-0">
            {/* Prev day */}
            <button onClick={() => goDay(-1)}
              className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all shrink-0">
              <ChevronLeft className="h-4 w-4 text-white/50" />
            </button>

            {/* Date label */}
            <div className="flex-1 min-w-0 text-center">
              <div className="flex items-center justify-center gap-1.5 min-w-0">
                {isToday && (
                  <div className="relative shrink-0">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50" />
                  </div>
                )}
                <p className="text-white/90 text-sm font-black capitalize truncate">{dayLabel}</p>
              </div>
              <p className="text-white/30 text-[10px]">{isToday ? "hoje · tempo real" : "histórico"}</p>
            </div>

            {/* Next day — disabled if today */}
            <button onClick={() => goDay(1)} disabled={isToday}
              className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all shrink-0 disabled:opacity-25 disabled:pointer-events-none">
              <ChevronRight className="h-4 w-4 text-white/50" />
            </button>

            {/* Collapse */}
            <button onClick={() => setCollapsed(c => !c)}
              className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all shrink-0">
              <ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform duration-300", collapsed && "rotate-180")} />
            </button>
          </div>

          {/* KPI grid */}
          <div className="grid grid-cols-3 gap-2 min-w-0">
            {[
              { label: "Em campo",   value: worked.length,         sub: `de ${active.length}`, icon: Users2,  color: "text-emerald-400", bg: "bg-emerald-500/12 border-emerald-500/20" },
              { label: "Horas",      value: `${totalH.toFixed(1)}h`, sub: "hoje",              icon: Clock,   color: "text-sky-400",     bg: "bg-sky-500/12 border-sky-500/20" },
              { label: "Fotos",      value: totalF,                sub: "tiradas",             icon: Camera,  color: "text-violet-400",  bg: "bg-violet-500/12 border-violet-500/20" },
            ].map(({ label, value, sub, icon: Icon, color, bg }) => (
              <div key={label} className={cn("rounded-2xl border px-2 py-2.5 text-center min-w-0 overflow-hidden", bg)}>
                <Icon className={cn("h-3.5 w-3.5 mx-auto mb-1", color)} />
                <p className={cn("text-base font-black tabular-nums leading-none truncate", color)}>{value}</p>
                <p className="text-white/25 text-[10px] mt-0.5 truncate">{label}</p>
              </div>
            ))}
          </div>

          {/* Progress */}
          <div className="mt-3.5 min-w-0">
            <div className="flex justify-between items-center mb-1">
              <span className="text-white/25 text-[10px]">Presença</span>
              <span className="text-white/40 text-[10px] font-bold">{pct}%</span>
            </div>
            <div className="h-1 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${pct}%` }} />
            </div>
            {/* Avatar dots */}
            <div className="flex gap-1 mt-2 flex-wrap min-w-0">
              {active.map(c => {
                const has = c.entries?.some((e:any) => e.date === todayKey)
                return (
                  <div key={c.id} title={c.name}
                    className={cn(
                      "w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black transition-all select-none",
                      has
                        ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/25"
                        : "bg-white/6 text-white/15"
                    )}>
                    {initials(c.name)}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Cards ── */}
      {!collapsed && (
        <div className="p-3 space-y-2 min-w-0 overflow-hidden">
          {worked.map(c => (
            <CollabCard key={c.id} collab={c} todayKey={todayKey}
              onClick={() => router.push(`/admin/collaborator/${c.id}`)} />
          ))}

          {worked.length > 0 && idle.length > 0 && (
            <div className="flex items-center gap-2 py-0.5">
              <div className="flex-1 h-px bg-border/25" />
              <span className="text-[10px] text-muted-foreground/30 shrink-0">sem registo</span>
              <div className="flex-1 h-px bg-border/25" />
            </div>
          )}

          {idle.map(c => (
            <CollabCard key={c.id} collab={c} todayKey={todayKey}
              onClick={() => router.push(`/admin/collaborator/${c.id}`)} />
          ))}

          {active.length === 0 && (
            <div className="py-10 text-center">
              <Sun className="h-7 w-7 text-muted-foreground/15 mx-auto mb-2" />
              <p className="text-sm text-muted-foreground/30">Nenhum colaborador ativo</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
