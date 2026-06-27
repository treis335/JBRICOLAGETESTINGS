// components/admin/today-panel.tsx
"use client"

import { useMemo, useState, useRef, useCallback, useEffect } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { resolveEntryTaxa } from "@/lib/utils"
import type { Collaborator } from "@/hooks/useCollaborators"
import type { ServiceFoto } from "@/lib/types"
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Clock, Camera, ZoomIn, X, Users2, Euro,
  HardHat, FileText, Users, Package, AlertCircle,
  ArrowLeft, ArrowRight, Sun, CalendarDays,
} from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

const fmtDay = (d: Date) =>
  d.toLocaleDateString("pt-PT", { weekday:"long", day:"numeric", month:"long" })

const isToday = (key: string) => key === toKey(new Date())
const isWeekend = (d: Date) => { const w = d.getDay(); return w === 0 || w === 6 }

const GRADS = [
  "from-blue-500 to-indigo-600","from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600","from-orange-500 to-amber-500",
  "from-pink-500 to-rose-600","from-cyan-400 to-sky-600",
  "from-lime-500 to-green-600","from-fuchsia-500 to-pink-600",
]
const initials = (name: string) =>
  name.split(" ").filter(Boolean).slice(0,2).map(w => w[0]).join("").toUpperCase()
const grad = (name: string) => GRADS[name.charCodeAt(0) % GRADS.length]

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ fotos, start, onClose }: {
  fotos: (ServiceFoto & { svc?: string })[]
  start: number
  onClose: () => void
}) {
  const [cur, setCur] = useState(start)
  const tx = useRef<number|null>(null)
  const f = fotos[cur]

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key==="Escape") onClose()
      if (e.key==="ArrowLeft")  setCur(c => Math.max(0,c-1))
      if (e.key==="ArrowRight") setCur(c => Math.min(fotos.length-1,c+1))
    }
    window.addEventListener("keydown", h)
    return () => window.removeEventListener("keydown", h)
  }, [onClose, fotos.length])

  if (!f) return null
  return (
    <div className="fixed inset-0 z-[400] bg-black/97 flex flex-col animate-fade-in"
      onClick={onClose}
      onTouchStart={e => { tx.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (!tx.current) return
        const dx = e.changedTouches[0].clientX - tx.current
        if (dx > 50) setCur(c => Math.max(0,c-1))
        else if (dx < -50) setCur(c => Math.min(fotos.length-1,c+1))
        tx.current = null
      }}>
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 h-14 shrink-0 border-b border-white/5" onClick={e=>e.stopPropagation()}>
        <div className="flex items-center gap-2.5 min-w-0">
          <span className={cn("px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border shrink-0",
            f.tipo==="antes" ? "bg-amber-500/15 text-amber-400 border-amber-500/20"
                             : "bg-emerald-500/15 text-emerald-400 border-emerald-500/20")}>
            {f.tipo==="antes" ? "Antes" : "Depois"}
          </span>
          {f.svc && <span className="text-[12px] text-white/35 truncate">{f.svc}</span>}
          <span className="text-[11px] text-white/20 tabular-nums font-mono">{cur+1}/{fotos.length}</span>
        </div>
        <button type="button" onClick={onClose}
          className="w-9 h-9 rounded-xl bg-white/6 hover:bg-white/12 flex items-center justify-center transition-colors">
          <X className="h-4 w-4 text-white/60" />
        </button>
      </div>
      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-6 min-h-0 relative" onClick={e=>e.stopPropagation()}>
        {cur > 0 && (
          <button onClick={()=>setCur(c=>c-1)}
            className="absolute left-2 z-10 w-10 h-10 rounded-2xl bg-white/8 hover:bg-white/16 flex items-center justify-center transition-all active:scale-90">
            <ArrowLeft className="h-5 w-5 text-white/60" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img key={f.url} src={f.url} alt=""
          className="max-w-full max-h-full object-contain rounded-2xl select-none shadow-2xl animate-scale-in"
          style={{ maxHeight:"calc(100dvh - 130px)" }} />
        {cur < fotos.length-1 && (
          <button onClick={()=>setCur(c=>c+1)}
            className="absolute right-2 z-10 w-10 h-10 rounded-2xl bg-white/8 hover:bg-white/16 flex items-center justify-center transition-all active:scale-90">
            <ArrowRight className="h-5 w-5 text-white/60" />
          </button>
        )}
      </div>
      {/* Dots */}
      {fotos.length > 1 && (
        <div className="flex justify-center gap-1.5 py-4 shrink-0" onClick={e=>e.stopPropagation()}>
          {fotos.map((_,i) => (
            <button key={i} onClick={()=>setCur(i)}
              className={cn("rounded-full transition-all duration-200",
                i===cur ? "w-5 h-[7px] bg-white" : "w-[7px] h-[7px] bg-white/25 hover:bg-white/50")} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Collab Card ───────────────────────────────────────────────────────────────
function CollabCard({ collab, dateKey }: { collab: Collaborator; dateKey: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lb, setLb]     = useState<{ fotos: (ServiceFoto & { svc?:string })[]; idx:number }|null>(null)

  const entry    = collab.entries?.find(e => e.date === dateKey) ?? null
  const horas    = Number(entry?.totalHoras ?? 0)
  const extras   = Number(entry?.extraHoras ?? 0)
  const normais  = entry?.normalHoras ?? 0
  const taxa     = Number(entry ? resolveEntryTaxa(entry, collab.currentRate) : (collab.currentRate ?? 0))
  const valor    = Number(horas) * Number(taxa)
  const services = Array.isArray(entry?.services) && entry!.services!.length > 0
    ? entry!.services! : []
  const obras    = [...new Set(services.map(s => s.obraNome).filter(Boolean))]
  const equipa   = [...new Set(services.flatMap(s => s.equipa ?? []))]
  const materiais= [...new Set(services.flatMap(s => s.materiais ?? []))]
  const allFotos = services.flatMap(s => (s.fotos ?? []).map(f => ({ ...f, svc: s.obraNome })))
  const fotosA   = allFotos.filter(f => f.tipo === "antes")
  const fotosD   = allFotos.filter(f => f.tipo === "depois")
  const isAbs    = horas === 0 && entry !== null
  const hasExtra = equipa.length > 0 || allFotos.length > 0 || materiais.length > 0 || (entry?.descricao)

  return (
    <>
      <div className={cn(
        "rounded-2xl border overflow-hidden w-full transition-all duration-150",
        "bg-white/3 dark:bg-white/3",
        isAbs ? "border-amber-500/20" : open ? "border-white/15" : "border-white/8 hover:border-white/12"
      )}>
        {/* Main row */}
        <div className="flex items-center gap-3 px-3.5 py-3 w-full min-w-0 overflow-hidden">
          {/* Avatar */}
          <div className={cn(
            "w-9 h-9 rounded-xl bg-gradient-to-br flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-lg",
            grad(collab.name)
          )}>
            {initials(collab.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white/90 truncate leading-tight">{collab.name}</p>
            <div className="flex items-center gap-2 mt-0.5 min-w-0 overflow-hidden flex-wrap">
              {isAbs ? (
                <span className="text-[11px] font-bold text-amber-400/80">Ausência</span>
              ) : (
                <>
                  <span className={cn("text-[11px] font-black tabular-nums shrink-0",
                    extras > 0 ? "text-orange-400" : "text-emerald-400")}>
                    {Number(horas || 0).toFixed(1)}h
                  </span>
                  {valor > 0 && (
                    <span className="text-[11px] text-white/25 tabular-nums shrink-0">{Number(valor || 0).toFixed(0)}€</span>
                  )}
                  {obras[0] && (
                    <span className="text-[11px] text-white/30 truncate flex items-center gap-1 min-w-0">
                      <HardHat className="h-2.5 w-2.5 shrink-0" />
                      {obras[0]}{obras.length>1 ? ` +${obras.length-1}` : ""}
                    </span>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Badges + actions */}
          <div className="flex items-center gap-1 shrink-0">
            {extras > 0 && (
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-lg bg-orange-500/15 text-orange-400 border border-orange-500/20">
                +{extras}h ext
              </span>
            )}
            {allFotos.length > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-violet-400/70 shrink-0">
                <Camera className="h-3 w-3" />{allFotos.length}
              </span>
            )}
            {hasExtra && (
              <button onClick={() => setOpen(o => !o)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90">
                <ChevronDown className={cn("h-3.5 w-3.5 text-white/30 transition-transform duration-200", open && "rotate-180")} />
              </button>
            )}
            <button onClick={() => router.push(`/admin/collaborator/${collab.id}`)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all active:scale-90">
              <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            </button>
          </div>
        </div>

        {/* Expandable detail */}
        {open && hasExtra && (
          <div className="border-t border-white/6 px-3.5 pb-3.5 pt-3 space-y-3 w-full overflow-hidden animate-fade-in">
            {/* Hours breakdown */}
            {!isAbs && horas > 0 && (
              <div className="flex items-center gap-2 flex-wrap">
                <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-sky-500/10 border border-sky-500/15 text-[11px] font-bold text-sky-400">
                  <Clock className="h-3 w-3" />{normais}h norm.
                </span>
                {extras > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-orange-500/10 border border-orange-500/15 text-[11px] font-bold text-orange-400">
                    +{extras}h extra
                  </span>
                )}
                {valor > 0 && (
                  <span className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/15 text-[11px] font-black text-emerald-400 ml-auto">
                    <Euro className="h-3 w-3" />{Number(valor || 0).toFixed(2)}€
                  </span>
                )}
              </div>
            )}

            {/* Descrição (legado) */}
            {entry?.descricao && services.length === 0 && (
              <div className="flex gap-2">
                <FileText className="h-3 w-3 text-white/20 shrink-0 mt-0.5" />
                <p className="text-[11px] text-white/40 leading-relaxed">{entry.descricao}</p>
              </div>
            )}

            {/* Services */}
            {services.map((s, si) => (
              <div key={s.id||si} className="space-y-2">
                {s.obraNome && (
                  <div className="flex items-center gap-1.5">
                    <HardHat className="h-3 w-3 text-orange-400/60 shrink-0" />
                    <span className="text-[12px] font-bold text-white/60 truncate">{s.obraNome}</span>
                  </div>
                )}
                {s.descricao && (
                  <div className="flex gap-2 ml-4">
                    <FileText className="h-3 w-3 text-white/15 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-white/35 leading-relaxed">{s.descricao}</p>
                  </div>
                )}
              </div>
            ))}

            {/* Equipa */}
            {equipa.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 flex items-center gap-1">
                  <Users className="h-2.5 w-2.5" />Equipa
                </p>
                <div className="flex flex-wrap gap-1">
                  {equipa.map((e,i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-white/5 border border-white/8 text-[11px] text-white/40 font-medium">{e}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Materiais */}
            {materiais.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 flex items-center gap-1">
                  <Package className="h-2.5 w-2.5" />Materiais
                </p>
                <div className="flex flex-wrap gap-1">
                  {materiais.map((m,i) => (
                    <span key={i} className="px-2 py-0.5 rounded-lg bg-white/4 border border-white/6 text-[10px] text-white/30">{m}</span>
                  ))}
                </div>
              </div>
            )}

            {/* Fotos */}
            {allFotos.length > 0 && (
              <div className="space-y-2">
                <p className="text-[9px] font-black uppercase tracking-widest text-white/20 flex items-center gap-1">
                  <Camera className="h-2.5 w-2.5" />Fotos
                  {fotosA.length>0 && <span className="text-amber-400/50 ml-1">{fotosA.length} antes</span>}
                  {fotosD.length>0 && <span className="text-emerald-400/50 ml-1">{fotosD.length} depois</span>}
                </p>
                <div className="flex gap-2 flex-wrap">
                  {allFotos.map((f, fi) => (
                    <button key={f.publicId||fi} type="button"
                      onClick={() => setLb({ fotos: allFotos, idx: fi })}
                      className="relative w-12 h-12 rounded-xl overflow-hidden group border border-white/10 hover:border-white/25 hover:scale-105 active:scale-95 transition-all shadow-md">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={f.url} alt="" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                        <ZoomIn className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 drop-shadow transition-opacity" />
                      </div>
                      <div className={cn("absolute top-1 left-1 w-1.5 h-1.5 rounded-full border border-black/20",
                        f.tipo==="antes" ? "bg-amber-400" : "bg-emerald-400")} />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {lb && <Lightbox fotos={lb.fotos} start={lb.idx} onClose={() => setLb(null)} />}
    </>
  )
}

// ── Absent pill ───────────────────────────────────────────────────────────────
function AbsentPill({ collab }: { collab: Collaborator }) {
  return (
    <div className="flex items-center gap-2 px-2.5 py-2 rounded-xl border border-white/6 bg-white/3 min-w-0 overflow-hidden">
      <div className="relative shrink-0">
        <div className={cn("w-7 h-7 rounded-lg bg-gradient-to-br flex items-center justify-center text-[9px] font-black text-white", grad(collab.name))}>
          {initials(collab.name)}
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-white/15 border border-background" />
      </div>
      <span className="text-[11px] font-semibold text-white/35 truncate">{collab.name.split(" ")[0]}</span>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function TodayPanel({ collaborators }: { collaborators: Collaborator[] }) {
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [collapsed,    setCollapsed]    = useState(false)

  const dateKey    = toKey(selectedDate)
  const todayKey   = toKey(new Date())
  const isTodayDay = dateKey === todayKey
  const isWeekendDay = isWeekend(selectedDate)

  const goDay = useCallback((dir: -1|1) => {
    setSelectedDate(d => {
      const n = new Date(d)
      n.setDate(n.getDate() + dir)
      return n
    })
  }, [])

  const active   = collaborators.filter(c => c.ativo !== false)
  const worked   = active.filter(c => c.entries?.some(e => e.date === dateKey))
  const absent   = active.filter(c => !c.entries?.some(e => e.date === dateKey))
  const totalH   = worked.reduce((s,c) => { const e=c.entries?.find((e:any)=>e.date===dateKey); return s+Number(e?.totalHoras??0) }, 0)
  const totalCost= worked.reduce((s,c) => { const e=c.entries?.find((e:any)=>e.date===dateKey); if(!e)return s; return s+Number(e.totalHoras??0)*Number(resolveEntryTaxa(e,c.currentRate)||0) }, 0)
  const totalF   = worked.reduce((s,c) => { const e=c.entries?.find(e=>e.date===dateKey); return s+(e?.services??[]).flatMap((sv:any)=>sv.fotos??[]).length }, 0)
  const pct      = active.length > 0 ? Math.round((worked.length/active.length)*100) : 0

  return (
    <div className="rounded-3xl overflow-hidden w-full shadow-2xl"
      style={{ background:"linear-gradient(135deg,#0a1628 0%,#0f2044 40%,#0a1628 100%)" }}>

      {/* ── Header ── */}
      <div className="relative px-4 pt-4 pb-3 overflow-hidden">
        {/* Ambient glows */}
        <div className="absolute -top-8 -right-8 w-40 h-40 rounded-full bg-emerald-500/8 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-blue-500/8 blur-3xl pointer-events-none" />
        {isWeekendDay && <div className="absolute top-0 right-0 w-48 h-48 rounded-full bg-violet-500/6 blur-3xl pointer-events-none" />}

        {/* Day nav */}
        <div className="relative flex items-center gap-2 min-w-0 mb-3">
          {/* Day type icon */}
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            isTodayDay ? "bg-amber-400/15 border border-amber-400/20"
            : isWeekendDay ? "bg-violet-500/15 border border-violet-500/20"
            : "bg-white/5 border border-white/8"
          )}>
            {isTodayDay
              ? <Sun className="h-4 w-4 text-amber-400" />
              : <CalendarDays className="h-4 w-4 text-white/40" />}
          </div>

          <button onClick={() => goDay(-1)}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all active:scale-90 shrink-0">
            <ChevronLeft className="h-3.5 w-3.5 text-white/40" />
          </button>

          <div className="flex-1 text-center min-w-0">
            <p className="text-sm font-black text-white/85 capitalize truncate">{fmtDay(selectedDate)}</p>
            <p className="text-[10px] text-white/20 mt-0.5">
              {isTodayDay ? "tempo real" : isWeekendDay ? "fim de semana" : "histórico"}
            </p>
          </div>

          <button onClick={() => goDay(1)} disabled={isTodayDay}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all active:scale-90 shrink-0 disabled:opacity-20">
            <ChevronRight className="h-3.5 w-3.5 text-white/40" />
          </button>

          {!isTodayDay && (
            <button onClick={() => setSelectedDate(new Date())}
              className="text-[10px] font-black text-primary/70 hover:text-primary px-2 py-1 rounded-lg bg-primary/8 border border-primary/15 transition-all shrink-0">
              Hoje
            </button>
          )}

          <button onClick={() => setCollapsed(c => !c)}
            className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 border border-white/8 flex items-center justify-center transition-all active:scale-90 shrink-0">
            <ChevronDown className={cn("h-3.5 w-3.5 text-white/30 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* KPI strip */}
        <div className="relative grid grid-cols-4 gap-1.5">
          {[
            { label:"Em campo",  value:`${worked.length}/${active.length}`, icon:Users2,  color:"text-emerald-400", sub:`${pct}%` },
            { label:"Horas",     value:`${Number(totalH || 0).toFixed(1)}h`,             icon:Clock,   color:"text-sky-400",     sub:"total" },
            { label:"Custo",     value:`${Number(totalCost || 0).toFixed(0)}€`,          icon:Euro,    color:"text-violet-400",  sub:"est." },
            { label:"Fotos",     value:`${totalF}`,                         icon:Camera,  color:"text-pink-400",    sub:"upload" },
          ].map(({ label, value, icon:Icon, color, sub }) => (
            <div key={label} className="rounded-xl bg-white/3 border border-white/6 px-2 py-2.5 text-center min-w-0 overflow-hidden">
              <Icon className={cn("h-3 w-3 mx-auto mb-1 opacity-50", color)} />
              <p className={cn("text-[13px] font-black tabular-nums truncate leading-none", color)}>{value}</p>
              <p className="text-[8px] text-white/18 mt-1 truncate font-bold uppercase tracking-wider">{label}</p>
            </div>
          ))}
        </div>

        {/* Progress bar */}
        {!collapsed && active.length > 0 && (
          <div className="mt-3 h-0.5 bg-white/6 rounded-full overflow-hidden">
            <div
              className={cn("h-full rounded-full transition-all duration-700",
                pct===100 ? "bg-emerald-400" : "bg-primary/60"
              )}
              style={{ width:`${pct}%` }}
            />
          </div>
        )}
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-1.5 overflow-hidden w-full animate-fade-in">

          {/* Empty */}
          {worked.length === 0 && (
            <div className="py-10 text-center">
              <AlertCircle className="h-6 w-6 text-white/12 mx-auto mb-2" />
              <p className="text-sm text-white/20 font-semibold">
                {isTodayDay ? "Aguarda registos da equipa" : "Sem registos neste dia"}
              </p>
            </div>
          )}

          {/* Worked cards */}
          {worked.map(c => (
            <CollabCard key={c.id} collab={c} dateKey={dateKey} />
          ))}

          {/* Absent grid */}
          {absent.length > 0 && worked.length > 0 && (
            <div className="pt-1.5 space-y-2">
              <div className="flex items-center gap-1.5 px-0.5">
                <AlertCircle className="h-3 w-3 text-white/20" />
                <span className="text-[9px] font-black uppercase tracking-widest text-white/20">
                  {isTodayDay ? "Ainda sem registo" : "Sem registo"} · {absent.length}
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
                {absent.map(c => <AbsentPill key={c.id} collab={c} />)}
              </div>
            </div>
          )}

          {/* All absent */}
          {absent.length > 0 && worked.length === 0 && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 pt-1">
              {absent.map(c => <AbsentPill key={c.id} collab={c} />)}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
