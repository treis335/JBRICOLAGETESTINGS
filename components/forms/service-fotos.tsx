// components/forms/service-fotos.tsx
"use client"

import { useRef, useState, useCallback } from "react"
import { useAuth } from "@/lib/AuthProvider"
import { uploadServiceFoto, deleteServiceFoto, compressImage, MAX_FOTOS_POR_TIPO } from "@/lib/service-fotos"
import type { ServiceFoto } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Camera, Upload, X, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, ZoomIn, Plus, ImagePlus,
} from "lucide-react"

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ fotos, index, onClose }: { fotos: ServiceFoto[]; index: number; onClose: () => void }) {
  const [cur, setCur] = useState(index)
  const foto = fotos[cur]
  const isAntes = foto.tipo === "antes"

  const prev = () => setCur(c => Math.max(0, c - 1))
  const next = () => setCur(c => Math.min(fotos.length - 1, c + 1))

  // Swipe support
  const touchX = useRef<number | null>(null)

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col"
      onClick={onClose}
      onTouchStart={e => { touchX.current = e.touches[0].clientX }}
      onTouchEnd={e => {
        if (touchX.current === null) return
        const dx = e.changedTouches[0].clientX - touchX.current
        if (dx > 50) prev()
        else if (dx < -50) next()
        touchX.current = null
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <span className={cn(
          "px-3 py-1 rounded-full text-[11px] font-bold tracking-wide",
          isAntes
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
        )}>
          {isAntes ? "ANTES" : "DEPOIS"} · {cur + 1}/{fotos.length}
        </span>
        <button onClick={onClose} className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0 relative" onClick={e => e.stopPropagation()}>
        {/* Prev zone */}
        {cur > 0 && (
          <button onClick={prev} className="absolute left-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
        )}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={foto.url} alt={`${foto.tipo} ${cur + 1}`} className="max-w-full max-h-full object-contain rounded-xl shadow-2xl" />
        {/* Next zone */}
        {cur < fotos.length - 1 && (
          <button onClick={next} className="absolute right-2 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors z-10">
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        )}
      </div>

      {/* Dots */}
      {fotos.length > 1 && (
        <div className="flex justify-center gap-1.5 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          {fotos.map((_, i) => (
            <button key={i} onClick={() => setCur(i)}
              className={cn("rounded-full transition-all", i === cur ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/30 hover:bg-white/50")}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Pick Sheet ───────────────────────────────────────────────────────────────
function PickSheet({ tipo, onCamera, onGallery, onClose }: {
  tipo: "antes" | "depois"; onCamera: () => void; onGallery: () => void; onClose: () => void
}) {
  const isAntes = tipo === "antes"
  const accent = isAntes ? "blue" : "emerald"
  return (
    <>
      <div className="fixed inset-0 z-[150] bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-[160] max-w-sm mx-auto px-4 pb-6">
        <div className="rounded-3xl bg-card border border-border/50 shadow-2xl overflow-hidden">
          <div className="flex justify-center pt-3 pb-0.5">
            <div className="w-8 h-1 rounded-full bg-muted-foreground/20" />
          </div>
          <p className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground py-3 px-4">
            {isAntes ? "📷 Fotos — Antes" : "✅ Fotos — Depois"}
          </p>
          <div className="grid grid-cols-2 gap-2 px-3 pb-3">
            <button type="button" onClick={() => { onCamera(); onClose() }}
              className={cn(
                "flex flex-col items-center gap-2.5 py-4 rounded-2xl border transition-all active:scale-95",
                accent === "blue"
                  ? "bg-blue-50 dark:bg-blue-950/20 border-blue-200/50 hover:bg-blue-100"
                  : "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200/50 hover:bg-emerald-100"
              )}>
              <div className={cn("w-11 h-11 rounded-xl flex items-center justify-center shadow-md",
                accent === "blue" ? "bg-blue-500 shadow-blue-500/30" : "bg-emerald-500 shadow-emerald-500/30"
              )}>
                <Camera className="h-5 w-5 text-white" />
              </div>
              <p className={cn("text-xs font-bold", accent === "blue" ? "text-blue-700 dark:text-blue-300" : "text-emerald-700 dark:text-emerald-300")}>
                Câmara
              </p>
            </button>
            <button type="button" onClick={() => { onGallery(); onClose() }}
              className="flex flex-col items-center gap-2.5 py-4 rounded-2xl bg-muted/40 border border-border/40 hover:bg-muted/60 transition-all active:scale-95">
              <div className="w-11 h-11 rounded-xl bg-slate-700 flex items-center justify-center shadow-md shadow-slate-500/20">
                <Upload className="h-5 w-5 text-white" />
              </div>
              <p className="text-xs font-bold text-muted-foreground">Galeria</p>
            </button>
          </div>
          <button type="button" onClick={onClose}
            className="w-full py-3.5 text-xs font-semibold text-muted-foreground/60 border-t border-border/20 hover:bg-muted/20 transition-colors">
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Thumbnail ────────────────────────────────────────────────────────────────
function Thumb({ foto, index, onView, onRemove, disabled }: {
  foto: ServiceFoto; index: number; onView: () => void; onRemove: () => void; disabled?: boolean
}) {
  return (
    <div className="relative group w-[72px] h-[72px] shrink-0">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={foto.url} alt={`foto ${index + 1}`}
        className="w-full h-full object-cover rounded-2xl border border-border/40 cursor-pointer"
        onClick={onView}
      />
      <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/25 transition-colors flex items-center justify-center pointer-events-none">
        <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
      </div>
      {!disabled && (
        <button type="button" onClick={onRemove}
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-destructive shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <X className="h-2.5 w-2.5 text-white" />
        </button>
      )}
    </div>
  )
}

// ─── FotoSection (Antes ou Depois) ────────────────────────────────────────────
function FotoSection({ tipo, fotos, serviceId, userId, onChange, onUploadingChange, disabled }: {
  tipo: "antes" | "depois"
  fotos: ServiceFoto[]
  serviceId: string
  userId: string
  onChange: (f: ServiceFoto[]) => void
  onUploadingChange?: (v: boolean) => void
  disabled?: boolean
}) {
  const [showPick, setShowPick]   = useState(false)
  const [uploading, setUploading] = useState<{ name: string; progress: number }[]>([])
  const [errors, setErrors]       = useState<string[]>([])
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)
  const fotosRef   = useRef(fotos)
  fotosRef.current = fotos

  const mine   = fotos.filter(f => f.tipo === tipo)
  const canAdd = mine.length < MAX_FOTOS_POR_TIPO && !disabled
  const isAntes = tipo === "antes"

  const processFile = useCallback(async (file: File) => {
    setUploading(prev => {
      const next = [...prev, { name: file.name, progress: 0 }]
      onUploadingChange?.(true)
      return next
    })
    setErrors([])
    try {
      const compressed = await compressImage(file)
      const foto = await uploadServiceFoto(compressed, userId, serviceId, tipo,
        pct => setUploading(prev => prev.map(u => u.name === file.name ? { ...u, progress: pct } : u))
      )
      onChange([...fotosRef.current, foto])
    } catch (err: any) {
      setErrors(prev => [...prev, err.message ?? "Erro no upload"])
    } finally {
      setUploading(prev => {
        const next = prev.filter(u => u.name !== file.name)
        if (next.length === 0) onUploadingChange?.(false)
        return next
      })
    }
  }, [onChange, onUploadingChange, serviceId, tipo, userId])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return
    const toProcess = Array.from(files).slice(0, MAX_FOTOS_POR_TIPO - mine.length)
    await Promise.all(toProcess.map(f => processFile(f)))
  }, [mine.length, processFile])

  const handleRemove = useCallback((foto: ServiceFoto) => {
    deleteServiceFoto(foto.publicId)
    onChange(fotosRef.current.filter(f => f.publicId !== foto.publicId))
  }, [onChange])

  return (
    <div className="space-y-2">
      {/* Label + counter */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "text-[10px] font-black uppercase tracking-widest",
          isAntes ? "text-blue-500 dark:text-blue-400" : "text-emerald-500 dark:text-emerald-400"
        )}>
          {isAntes ? "Antes" : "Depois"}
        </span>
        <span className="text-[10px] text-muted-foreground/40 tabular-nums">{mine.length}/{MAX_FOTOS_POR_TIPO}</span>
      </div>

      {/* Thumbnails + Add button */}
      <div className="flex flex-wrap gap-2">
        {mine.map((foto, i) => (
          <Thumb key={foto.publicId} foto={foto} index={i}
            onView={() => setLightboxIdx(i)}
            onRemove={() => handleRemove(foto)}
            disabled={disabled}
          />
        ))}

        {canAdd && (
          <button type="button" onClick={() => setShowPick(true)}
            className={cn(
              "w-[72px] h-[72px] shrink-0 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-1 transition-all active:scale-95",
              mine.length === 0
                ? isAntes
                  ? "border-blue-200 dark:border-blue-800/50 bg-blue-50/50 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20"
                  : "border-emerald-200 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
                : "border-border/40 hover:bg-muted/30"
            )}
          >
            {mine.length === 0
              ? <Camera className={cn("h-5 w-5", isAntes ? "text-blue-400" : "text-emerald-400")} />
              : <Plus className="h-4 w-4 text-muted-foreground/40" />
            }
            {mine.length === 0 && (
              <span className={cn("text-[9px] font-bold", isAntes ? "text-blue-400/70" : "text-emerald-400/70")}>
                Adicionar
              </span>
            )}
          </button>
        )}
      </div>

      {/* Upload progress */}
      {uploading.map(u => (
        <div key={u.name} className="flex items-center gap-2 px-2.5 py-2 rounded-xl bg-muted/30 border border-border/30">
          <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground/50 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-[10px] text-muted-foreground/60 truncate">{u.name}</p>
            <div className="mt-1 h-0.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${u.progress}%` }} />
            </div>
          </div>
          <span className="text-[10px] font-bold tabular-nums text-muted-foreground/40">{u.progress}%</span>
        </div>
      ))}

      {/* Errors */}
      {errors.map((e, i) => (
        <div key={i} className="flex items-center gap-1 text-[10px] text-destructive">
          <AlertCircle className="h-3 w-3 shrink-0" />{e}
        </div>
      ))}

      {/* Hidden inputs */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" multiple className="sr-only"
        onChange={e => handleFiles(e.target.files).then(() => { if (cameraRef.current) cameraRef.current.value = "" })} />
      <input ref={galleryRef} type="file" accept="image/*" multiple className="sr-only"
        onChange={e => handleFiles(e.target.files).then(() => { if (galleryRef.current) galleryRef.current.value = "" })} />

      {showPick && (
        <PickSheet tipo={tipo}
          onCamera={() => cameraRef.current?.click()}
          onGallery={() => galleryRef.current?.click()}
          onClose={() => setShowPick(false)}
        />
      )}

      {lightboxIdx !== null && (
        <Lightbox fotos={mine} index={lightboxIdx} onClose={() => setLightboxIdx(null)} />
      )}
    </div>
  )
}

// ─── Main Export ──────────────────────────────────────────────────────────────
export interface ServiceFotosProps {
  serviceId: string
  fotos: ServiceFoto[]
  onChange: (fotos: ServiceFoto[]) => void
  onUploadingChange?: (isUploading: boolean) => void
  disabled?: boolean
}

export function ServiceFotos({ serviceId, fotos, onChange, onUploadingChange, disabled }: ServiceFotosProps) {
  const { user } = useAuth()
  const userId   = user?.uid ?? "anonymous"
  const safe     = fotos ?? []
  const total    = safe.length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-5 h-5 rounded-md bg-violet-500/15 flex items-center justify-center shrink-0">
          <ImagePlus className="h-3 w-3 text-violet-500" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
          Fotos{total > 0 && <span className="ml-1 text-violet-500">· {total}</span>}
        </p>
      </div>

      {/* Two columns: Antes | Depois */}
      <div className="grid grid-cols-2 gap-4">
        <FotoSection tipo="antes"  fotos={safe} serviceId={serviceId} userId={userId}
          onChange={onChange} onUploadingChange={onUploadingChange} disabled={disabled} />
        <FotoSection tipo="depois" fotos={safe} serviceId={serviceId} userId={userId}
          onChange={onChange} onUploadingChange={onUploadingChange} disabled={disabled} />
      </div>
    </div>
  )
}
