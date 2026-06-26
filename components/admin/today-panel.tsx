// components/admin/today-panel.tsx
"use client"

import { useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"
import {
  ChevronLeft, ChevronRight, ChevronDown,
  Clock, Camera, ZoomIn, X, Users2,
} from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

const initials = (name: string) =>
  name.split(" ").slice(0,2).map((w:string) => w[0]).join("").toUpperCase()

// ── Lightbox ──────────────────────────────────────────────────────────────────
function Lightbox({ fotos, start, onClose }: { fotos: any[]; start: number; onClose: () => void }) {
  const [cur, setCur] = useState(start)
  const tx = useRef<number|null>(null)
  return (
    <div className="fixed inset-0 z-[300] bg-black/95 flex flex-col"
      onClick={onClose}
      onTouchStart={e => { tx.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (!tx.current) return
        const dx = e.changedTouches[0].clientX - tx.current
        if (dx > 40) setCur(c => Math.max(0, c-1))
        else if (dx < -40) setCur(c => Math.min(fotos.length-1, c+1))
        tx.current = null
      }}>
      <div className="flex items-center justify-between px-4 pt-5 pb-2 shrink-0" onClick={e => e.stopPropagation()}>
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[10px] font-black tracking-widest uppercase border",
          fotos[cur]?.tipo === "antes"
            ? "bg-sky-500/15 text-sky-300 border-sky-500/20"
            : "bg-emerald-500/15 text-emerald-300 border-emerald-500/20"
        )}>
          {fotos[cur]?.tipo === "antes" ? "Antes" : "Depois"} · {cur+1}/{fotos.length}
        </span>
        <button onClick={onClose} className="w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center">
          <X className="h-4 w-4 text-white/60" />
        </button>
      </div>
      <div className="flex-1 flex items-center justify-center p-4 min-h-0 relative" onClick={e => e.stopPropagation()}>
        {cur > 0 && (
          <button onClick={() => setCur(c => c-1)} className="absolute left-2 z-10 w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center">
            <ChevronLeft className="h-4 w-4 text-white/60" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotos[cur]?.url} alt="" className="max-w-full max-h-full object-contain rounded-xl" />
        {cur < fotos.length-1 && (
          <button onClick={() => setCur(c => c+1)} className="absolute right-2 z-10 w-9 h-9 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center">
            <ChevronRight className="h-4 w-4 text-white/60" />
          </button>
        )}
      </div>
      {fotos.length > 1 && (
        <div className="flex justify-center gap-1.5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          {fotos.map((_:any,i:number) => (
            <button key={i} onClick={() => setCur(i)}
              className={cn("rounded-full transition-all", i===cur ? "w-5 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/25")} />
          ))}
        </div>
      )}
    </div>
  )
}

// ── Collab Card ───────────────────────────────────────────────────────────────
function CollabCard({ collab, todayKey }: { collab: any; todayKey: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [lb, setLb] = useState<{ fotos: any[]; idx: number }|null>(null)

  const entry    = collab.entries?.find((e:any) => e.date === todayKey) ?? null
  const horas    = entry?.totalHoras ?? 0
  const services = entry?.services ?? []
  const obras    = [...new Set(services.map((s:any) => s.obraNome).filter(Boolean))] as string[]
  const equipa   = [...new Set(services.flatMap((s:any) => s.equipa ?? []))] as string[]
  const fotosA   = services.flatMap((s:any) => (s.fotos??[]).filter((f:any) => f.tipo==="antes"))
  const fotosD   = services.flatMap((s:any) => (s.fotos??[]).filter((f:any) => f.tipo==="depois"))
  const totalFotos = fotosA.length + fotosD.length
  const hasMore  = equipa.length > 0 || totalFotos > 0

  return (
    <>
      <div className="rounded-2xl bg-gradient-to-br from-white/[0.06] to-white/[0.02] border border-white/10 overflow-hidden w-full">
        {/* Main row */}
        <div className="flex items-center gap-3 px-3.5 py-3 min-w-0">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center text-[11px] font-black text-white shrink-0 shadow-md shadow-emerald-500/20">
            {initials(collab.name)}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <p className="text-[13px] font-bold text-white/90 truncate">{collab.name}</p>
            <div className="flex items-center gap-2 mt-0.5 min-w-0 overflow-hidden">
              <span className="text-[11px] font-bold text-emerald-400 shrink-0">{horas.toFixed(1)}h</span>
              {obras[0] && (
                <span className="text-[11px] text-white/30 truncate">{obras[0]}{obras.length > 1 ? ` +${obras.length-1}` : ""}</span>
              )}
            </div>
          </div>

          {/* Right actions */}
          <div className="flex items-center gap-1 shrink-0">
            {totalFotos > 0 && (
              <span className="flex items-center gap-0.5 text-[10px] text-white/30 shrink-0">
                <Camera className="h-3 w-3" />{totalFotos}
              </span>
            )}
            {hasMore && (
              <button onClick={() => setOpen(o => !o)}
                className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
                <ChevronDown className={cn("h-3.5 w-3.5 text-white/30 transition-transform duration-200", open && "rotate-180")} />
              </button>
            )}
            <button onClick={() => router.push(`/admin/collaborator/${collab.id}`)}
              className="w-7 h-7 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition-all">
              <ChevronRight className="h-3.5 w-3.5 text-white/30" />
            </button>
          </div>
        </div>

        {/* Expandable */}
        {open && hasMore && (
          <div className="border-t border-white/6 px-3.5 pb-3 pt-2.5 space-y-2.5 overflow-hidden">
            {/* Equipa */}
            {equipa.length > 0 && (
              <div className="flex flex-wrap gap-1 min-w-0">
                {equipa.map((e:string, i:number) => (
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-white/5 text-[11px] text-white/40 font-medium border border-white/8">
                    {e}
                  </span>
                ))}
              </div>
            )}
            {/* Fotos */}
            {(fotosA.length > 0 || fotosD.length > 0) && (
              <div className="space-y-2 min-w-0">
                {[{ label:"Antes", fotos: fotosA, color:"text-sky-400" }, { label:"Depois", fotos: fotosD, color:"text-emerald-400" }]
                  .filter(g => g.fotos.length > 0)
                  .map(({ label, fotos, color }) => (
                    <div key={label} className="flex items-center gap-2 min-w-0 overflow-hidden">
                      <span className={cn("text-[9px] font-black uppercase tracking-widest shrink-0 w-9", color)}>{label}</span>
                      <div className="flex gap-1 overflow-hidden">
                        {fotos.slice(0,5).map((f:any, i:number) => (
                          <button key={f.publicId??i} type="button"
                            onClick={() => setLb({ fotos, idx: i })}
                            className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 group border border-white/10">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={f.url} alt="" className="w-full h-full object-cover" />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center transition-colors">
                              <ZoomIn className="h-2.5 w-2.5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </button>
                        ))}
                        {fotos.length > 5 && (
                          <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center shrink-0">
                            <span className="text-[9px] font-bold text-white/30">+{fotos.length-5}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}
      </div>

      {lb && <Lightbox fotos={lb.fotos} start={lb.idx} onClose={() => setLb(null)} />}
    </>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function TodayPanel() {
  const { collaborators, loading } = useCollaborators()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [collapsed, setCollapsed] = useState(false)

  const todayKey  = toKey(selectedDate)
  const realToday = toKey(new Date())
  const isToday   = todayKey === realToday

  const goDay = (dir: -1|1) => {
    setSelectedDate(d => {
      const n = new Date(d); n.setDate(n.getDate() + dir); return n
    })
  }

  const dayLabel = selectedDate.toLocaleDateString("pt-PT", {
    weekday: "long", day: "numeric", month: "long"
  })

  const { active, worked, totalH, totalF } = useMemo(() => {
    const a = collaborators.filter(c => c.ativo !== false)
    const w = a.filter(c => c.entries?.some((e:any) => e.date === todayKey))
    const h = w.reduce((s,c) => {
      const e = c.entries?.find((e:any) => e.date === todayKey)
      return s + (e?.totalHoras ?? 0)
    }, 0)
    const f = w.reduce((s,c) => {
      const e = c.entries?.find((e:any) => e.date === todayKey)
      return s + (e?.services??[]).flatMap((sv:any) => sv.fotos??[]).length
    }, 0)
    return { active: a, worked: w, totalH: h, totalF: f }
  }, [collaborators, todayKey])

  if (loading) return (
    <div className="rounded-3xl border border-white/10 overflow-hidden animate-pulse" style={{background:"linear-gradient(135deg,#0f172a,#1e293b)"}}>
      <div className="p-4 space-y-3">
        <div className="h-4 w-40 bg-white/8 rounded-full" />
        <div className="grid grid-cols-3 gap-2">
          {[1,2,3].map(i => <div key={i} className="h-14 bg-white/5 rounded-2xl" />)}
        </div>
      </div>
    </div>
  )

  return (
    <div className="rounded-3xl overflow-hidden w-full max-w-full shadow-xl"
      style={{background:"linear-gradient(135deg,#0f172a 0%,#1a2744 50%,#0f172a 100%)"}}>

      {/* ── Header ── */}
      <div className="relative px-4 pt-4 pb-4 overflow-hidden">
        {/* Subtle glow */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/8 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-500/6 rounded-full blur-3xl pointer-events-none" />

        {/* Day navigator */}
        <div className="relative flex items-center gap-2 mb-4 min-w-0">
          <button onClick={() => goDay(-1)}
            className="w-8 h-8 rounded-xl bg-white/6 hover:bg-white/12 border border-white/8 flex items-center justify-center transition-all shrink-0">
            <ChevronLeft className="h-4 w-4 text-white/50" />
          </button>

          <div className="flex-1 text-center min-w-0">
            <div className="flex items-center justify-center gap-1.5">
              {isToday && (
                <span className="relative flex h-1.5 w-1.5 shrink-0">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                </span>
              )}
              <p className="text-sm font-black text-white/90 capitalize truncate">{dayLabel}</p>
            </div>
            <p className="text-[10px] text-white/25 mt-0.5">{isToday ? "tempo real" : "histórico"}</p>
          </div>

          <button onClick={() => goDay(1)} disabled={isToday}
            className="w-8 h-8 rounded-xl bg-white/6 hover:bg-white/12 border border-white/8 flex items-center justify-center transition-all shrink-0 disabled:opacity-20 disabled:pointer-events-none">
            <ChevronRight className="h-4 w-4 text-white/50" />
          </button>

          <button onClick={() => setCollapsed(c => !c)}
            className="w-8 h-8 rounded-xl bg-white/6 hover:bg-white/12 border border-white/8 flex items-center justify-center transition-all shrink-0">
            <ChevronDown className={cn("h-4 w-4 text-white/40 transition-transform duration-300", collapsed && "rotate-180")} />
          </button>
        </div>

        {/* KPIs — apenas 3 números limpos */}
        <div className="relative grid grid-cols-3 gap-2">
          {[
            { label: "Em campo",  value: `${worked.length}/${active.length}`, icon: Users2, color: "text-emerald-400" },
            { label: "Horas",     value: `${totalH.toFixed(1)}h`,             icon: Clock,  color: "text-sky-400"     },
            { label: "Fotos",     value: `${totalF}`,                         icon: Camera, color: "text-violet-400"  },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl bg-white/4 border border-white/6 px-3 py-3 text-center min-w-0 overflow-hidden">
              <Icon className={cn("h-3.5 w-3.5 mx-auto mb-1.5 opacity-60", color)} />
              <p className={cn("text-base font-black tabular-nums truncate", color)}>{value}</p>
              <p className="text-[10px] text-white/20 mt-0.5 truncate">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Worked list ── */}
      {!collapsed && (
        <div className="px-3 pb-3 space-y-1.5 overflow-x-hidden w-full">
          {worked.length === 0 ? (
            <div className="py-8 text-center">
              <p className="text-sm text-white/20 font-medium">Sem registos para este dia</p>
            </div>
          ) : (
            worked.map(c => (
              <CollabCard key={c.id} collab={c} todayKey={todayKey} />
            ))
          )}
        </div>
      )}
    </div>
  )
}
