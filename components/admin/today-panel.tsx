// components/admin/today-panel.tsx
"use client"

import { useMemo, useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useCollaborators } from "@/hooks/useCollaborators"
import {
  Clock, HardHat, CheckCircle2, AlertCircle,
  ChevronRight, Camera, ZoomIn, X,
  ChevronLeft, ChevronDown, Sun, Users2,
} from "lucide-react"

// ── Helpers ───────────────────────────────────────────────────────────────────
const toKey = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`

function initials(name: string) {
  return name.split(" ").slice(0,2).map(w => w[0]).join("").toUpperCase()
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
        if (dx>50) setCur(c=>Math.max(0,c-1))
        else if (dx<-50) setCur(c=>Math.min(fotos.length-1,c+1))
        tx.current=null
      }}>
      {/* top bar */}
      <div className="flex items-center justify-between px-5 pt-5 pb-3 shrink-0" onClick={e=>e.stopPropagation()}>
        <span className={cn("px-3 py-1.5 rounded-full text-[11px] font-black tracking-widest uppercase border",
          isAntes ? "bg-sky-500/15 text-sky-300 border-sky-500/25" : "bg-emerald-500/15 text-emerald-300 border-emerald-500/25")}>
          {isAntes?"Antes":"Depois"} · {cur+1}/{fotos.length}
        </span>
        <button onClick={onClose} className="w-10 h-10 rounded-2xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all">
          <X className="h-5 w-5 text-white/80" />
        </button>
      </div>
      {/* image */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative" onClick={e=>e.stopPropagation()}>
        {cur>0 && (
          <button onClick={()=>setCur(c=>c-1)} className="absolute left-2 sm:left-4 z-10 w-10 h-10 rounded-2xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all">
            <ChevronLeft className="h-5 w-5 text-white/80" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={fotos[cur]?.url} alt="" className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl" />
        {cur<fotos.length-1 && (
          <button onClick={()=>setCur(c=>c+1)} className="absolute right-2 sm:right-4 z-10 w-10 h-10 rounded-2xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all">
            <ChevronRight className="h-5 w-5 text-white/80" />
          </button>
        )}
      </div>
      {/* dots */}
      {fotos.length>1 && (
        <div className="flex justify-center gap-1.5 py-5 shrink-0" onClick={e=>e.stopPropagation()}>
          {fotos.map((_:any,i:number)=>(
            <button key={i} onClick={()=>setCur(i)}
              className={cn("rounded-full transition-all duration-300", i===cur ? "w-6 h-2 bg-white" : "w-2 h-2 bg-white/25 hover:bg-white/40")}/>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Foto strip ────────────────────────────────────────────────────────────────
function FotoStrip({ label, fotos, accent }: { label: string; fotos: any[]; accent: "sky"|"emerald" }) {
  const [lb, setLb] = useState<number|null>(null)
  if (!fotos.length) return null
  return (
    <>
      <div className="flex items-center gap-2">
        <span className={cn("text-[9px] font-black uppercase tracking-widest w-9 shrink-0",
          accent==="sky" ? "text-sky-500 dark:text-sky-400" : "text-emerald-500 dark:text-emerald-400")}>
          {label}
        </span>
        <div className="flex gap-1.5 flex-wrap">
          {fotos.slice(0,6).map((f:any, i:number)=>(
            <button key={f.publicId??i} type="button" onClick={()=>setLb(i)}
              className="relative w-9 h-9 rounded-xl overflow-hidden border border-white/10 group shrink-0 hover:scale-105 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={f.url} alt="" className="w-full h-full object-cover"/>
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/35 flex items-center justify-center transition-colors">
                <ZoomIn className="h-3 w-3 text-white opacity-0 group-hover:opacity-100 transition-opacity"/>
              </div>
            </button>
          ))}
          {fotos.length>6 && (
            <div className="w-9 h-9 rounded-xl bg-white/6 border border-white/8 flex items-center justify-center text-[10px] font-bold text-muted-foreground">
              +{fotos.length-6}
            </div>
          )}
        </div>
      </div>
      {lb!==null && <Lightbox fotos={fotos} start={lb} onClose={()=>setLb(null)}/>}
    </>
  )
}

// ── Collab row ────────────────────────────────────────────────────────────────
function CollabRow({ collab, todayKey, onClick }: { collab: any; todayKey: string; onClick: ()=>void }) {
  const [open, setOpen] = useState(false)

  const entry = collab.entries?.find((e:any) => e.date === todayKey) ?? null
  const worked = !!entry
  const horas  = entry?.totalHoras ?? 0
  const services = entry?.services ?? []
  const obras  = [...new Set(services.map((s:any)=>s.obraNome).filter(Boolean))] as string[]
  const equipa = [...new Set(services.flatMap((s:any)=>s.equipa??[]))] as string[]
  const fotosA = services.flatMap((s:any)=>(s.fotos??[]).filter((f:any)=>f.tipo==="antes"))
  const fotosD = services.flatMap((s:any)=>(s.fotos??[]).filter((f:any)=>f.tipo==="depois"))
  const hasFotos = fotosA.length>0||fotosD.length>0

  return (
    <div className={cn(
      "rounded-2xl overflow-hidden border transition-all duration-200",
      worked
        ? "bg-gradient-to-br from-card to-card border-border/50 shadow-sm"
        : "bg-muted/20 border-border/20"
    )}>
      {/* Main row */}
      <div className="flex items-center gap-3 px-4 py-3">
        {/* Avatar */}
        <div className={cn(
          "w-10 h-10 rounded-2xl flex items-center justify-center text-[12px] font-black shrink-0 select-none",
          worked
            ? "bg-gradient-to-br from-emerald-400 to-teal-500 text-white shadow-md shadow-emerald-500/25"
            : "bg-muted text-muted-foreground/40"
        )}>
          {initials(collab.name)}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className={cn("text-sm font-bold truncate leading-tight", !worked && "text-muted-foreground/50")}>{collab.name}</p>
          {worked ? (
            <div className="flex items-center gap-2 mt-0.5 flex-wrap">
              <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                <Clock className="h-3 w-3"/>{horas.toFixed(1)}h
              </span>
              {obras.length>0 && (
                <span className="flex items-center gap-1 text-[11px] text-muted-foreground/60 truncate max-w-[140px]">
                  <HardHat className="h-2.5 w-2.5 shrink-0"/>{obras[0]}{obras.length>1 && ` +${obras.length-1}`}
                </span>
              )}
              {hasFotos && (
                <span className="flex items-center gap-1 text-[11px] text-violet-500">
                  <Camera className="h-2.5 w-2.5"/>{fotosA.length+fotosD.length}
                </span>
              )}
            </div>
          ) : (
            <p className="text-[11px] text-muted-foreground/35 mt-0.5">Sem registo hoje</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 shrink-0">
          {worked ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-500"/>
          ) : (
            <AlertCircle className="h-4 w-4 text-muted-foreground/20"/>
          )}
          {worked && (equipa.length>0||hasFotos||obras.length>0) && (
            <button onClick={()=>setOpen(o=>!o)}
              className="w-8 h-8 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-all">
              <ChevronDown className={cn("h-4 w-4 text-muted-foreground/40 transition-transform duration-200", open&&"rotate-180")}/>
            </button>
          )}
          <button onClick={onClick}
            className="w-8 h-8 rounded-xl hover:bg-muted/50 flex items-center justify-center transition-all">
            <ChevronRight className="h-4 w-4 text-muted-foreground/30"/>
          </button>
        </div>
      </div>

      {/* Expandable details */}
      {worked && open && (
        <div className="px-4 pb-3.5 space-y-2.5 border-t border-border/15 pt-2.5">
          {equipa.length>0 && (
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider w-9">Equipa</span>
              <div className="flex flex-wrap gap-1">
                {equipa.map((e:string,i:number)=>(
                  <span key={i} className="px-2 py-0.5 rounded-lg bg-muted/50 text-[11px] font-medium text-muted-foreground">{e}</span>
                ))}
              </div>
            </div>
          )}
          {hasFotos && (
            <div className="space-y-2">
              <FotoStrip label="Antes"  fotos={fotosA} accent="sky"/>
              <FotoStrip label="Depois" fotos={fotosD} accent="emerald"/>
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

  const today    = new Date()
  const todayKey = toKey(today)
  const dayLabel = today.toLocaleDateString("pt-PT", { weekday:"long", day:"numeric", month:"long" })

  const { worked, idle, totalH, totalF } = useMemo(() => {
    const active = collaborators.filter(c => c.ativo !== false)
    const w = active.filter(c => c.entries?.some((e:any) => e.date===todayKey))
    const i = active.filter(c => !c.entries?.some((e:any) => e.date===todayKey))
    const h = w.reduce((s,c) => {
      const e = c.entries?.find((e:any)=>e.date===todayKey)
      return s+(e?.totalHoras??0)
    }, 0)
    const f = w.reduce((s,c) => {
      const e = c.entries?.find((e:any)=>e.date===todayKey)
      return s+(e?.services??[]).flatMap((sv:any)=>sv.fotos??[]).length
    }, 0)
    return { worked:w, idle:i, totalH:h, totalF:f }
  }, [collaborators, todayKey])

  const active = collaborators.filter(c => c.ativo !== false)
  const pct = active.length > 0 ? Math.round((worked.length/active.length)*100) : 0

  if (loading) return (
    <div className="rounded-3xl bg-card border border-border/40 p-5 space-y-3 animate-pulse">
      <div className="h-5 w-40 bg-muted rounded-full"/>
      <div className="grid grid-cols-3 gap-2">
        {[1,2,3].map(i=><div key={i} className="h-16 bg-muted rounded-2xl"/>)}
      </div>
      <div className="space-y-2">
        {[1,2,3].map(i=><div key={i} className="h-16 bg-muted rounded-2xl"/>)}
      </div>
    </div>
  )

  return (
    <div className="rounded-3xl bg-card border border-border/40 overflow-hidden shadow-sm">

      {/* ── Header ── */}
      <div className="relative overflow-hidden">
        {/* gradient bg */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950"/>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(16,185,129,0.12),_transparent_60%)]"/>
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_left,_rgba(59,130,246,0.08),_transparent_60%)]"/>

        <div className="relative px-5 pt-5 pb-4">
          {/* Top row */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400"/>
                <div className="absolute inset-0 rounded-full bg-emerald-400 animate-ping opacity-50"/>
              </div>
              <div>
                <p className="text-white/90 text-sm font-black tracking-tight capitalize">{dayLabel}</p>
                <p className="text-white/35 text-[11px] mt-0.5">Vista em tempo real</p>
              </div>
            </div>
            <button onClick={()=>setCollapsed(c=>!c)}
              className="w-8 h-8 rounded-xl bg-white/8 hover:bg-white/15 flex items-center justify-center transition-all">
              <ChevronDown className={cn("h-4 w-4 text-white/50 transition-transform duration-300", collapsed&&"rotate-180")}/>
            </button>
          </div>

          {/* KPI row */}
          <div className="grid grid-cols-3 gap-2.5">
            {[
              { label:"Em campo",   value: worked.length, sub:`de ${active.length}`,    color:"text-emerald-400", icon: Users2,  bg:"bg-emerald-500/12 border-emerald-500/20" },
              { label:"Horas hoje", value: `${totalH.toFixed(1)}h`, sub:"registadas",  color:"text-sky-400",     icon: Clock,   bg:"bg-sky-500/12 border-sky-500/20" },
              { label:"Fotos",      value: totalF, sub:"tiradas hoje",                  color:"text-violet-400",  icon: Camera,  bg:"bg-violet-500/12 border-violet-500/20" },
            ].map(({ label, value, sub, color, icon: Icon, bg })=>(
              <div key={label} className={cn("rounded-2xl border px-3 py-3 text-center", bg)}>
                <Icon className={cn("h-4 w-4 mx-auto mb-1.5", color)}/>
                <p className={cn("text-lg font-black tabular-nums leading-none", color)}>{value}</p>
                <p className="text-white/30 text-[10px] font-medium mt-1 leading-tight">{label}</p>
              </div>
            ))}
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1.5">
              <span className="text-white/30 text-[10px] font-medium">Presença hoje</span>
              <span className="text-white/50 text-[10px] font-bold">{pct}%</span>
            </div>
            <div className="h-1.5 bg-white/8 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-400 to-teal-400 rounded-full transition-all duration-700"
                style={{width:`${pct}%`}}/>
            </div>
            {/* Mini avatars */}
            <div className="flex gap-1 mt-2.5 flex-wrap">
              {active.map(c=>{
                const has = c.entries?.some((e:any)=>e.date===todayKey)
                return (
                  <div key={c.id} title={c.name}
                    className={cn("w-6 h-6 rounded-lg flex items-center justify-center text-[9px] font-black transition-all",
                      has ? "bg-emerald-500 text-white shadow-sm shadow-emerald-500/30 scale-100"
                          : "bg-white/8 text-white/20 scale-90"
                    )}>
                    {initials(c.name)}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      {!collapsed && (
        <div className="p-3 space-y-2">
          {/* Worked first */}
          {worked.map(c=>(
            <CollabRow key={c.id} collab={c} todayKey={todayKey}
              onClick={()=>router.push(`/admin/collaborator/${c.id}`)}/>
          ))}

          {/* Divider if both */}
          {worked.length>0 && idle.length>0 && (
            <div className="flex items-center gap-2 py-1 px-1">
              <div className="flex-1 h-px bg-border/30"/>
              <span className="text-[10px] text-muted-foreground/30 font-medium">sem registo</span>
              <div className="flex-1 h-px bg-border/30"/>
            </div>
          )}

          {/* Idle */}
          {idle.map(c=>(
            <CollabRow key={c.id} collab={c} todayKey={todayKey}
              onClick={()=>router.push(`/admin/collaborator/${c.id}`)}/>
          ))}

          {active.length===0 && (
            <div className="py-10 text-center">
              <Sun className="h-8 w-8 text-muted-foreground/15 mx-auto mb-2"/>
              <p className="text-sm text-muted-foreground/30 font-medium">Nenhum colaborador ativo</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
