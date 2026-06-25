// components/forms/service-fotos.tsx
"use client"

import { useRef, useState, useCallback } from "react"
import { useAuth } from "@/lib/AuthProvider"
import { uploadServiceFoto, deleteServiceFoto, compressImage, MAX_FOTOS_POR_TIPO } from "@/lib/service-fotos"
import type { ServiceFoto } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Camera, Upload, X, Loader2, AlertCircle,
  ChevronLeft, ChevronRight, ZoomIn, Images, Plus, Trash2,
} from "lucide-react"

// ─── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({
  fotos, index, onClose,
}: {
  fotos: ServiceFoto[]
  index: number
  onClose: () => void
}) {
  const [cur, setCur] = useState(index)
  const foto = fotos[cur]

  return (
    <div
      className="fixed inset-0 z-[200] bg-black/95 flex flex-col animate-fade-in"
      onClick={onClose}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-3 shrink-0" onClick={e => e.stopPropagation()}>
        <span className={cn(
          "px-2.5 py-1 rounded-full text-[11px] font-bold",
          foto.tipo === "antes"
            ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
            : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
        )}>
          {foto.tipo === "antes" ? "📷 Antes" : "✅ Depois"} · {cur + 1}/{fotos.length}
        </span>
        <button
          onClick={onClose}
          className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
        >
          <X className="h-5 w-5 text-white" />
        </button>
      </div>

      {/* Image */}
      <div className="flex-1 flex items-center justify-center px-4 min-h-0" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt={`${foto.tipo} ${cur + 1}`}
          className="max-w-full max-h-full object-contain rounded-xl shadow-2xl animate-scale-in"
        />
      </div>

      {/* Nav arrows */}
      {fotos.length > 1 && (
        <div className="flex items-center justify-center gap-4 py-4 shrink-0" onClick={e => e.stopPropagation()}>
          <button
            onClick={() => setCur(c => Math.max(0, c - 1))}
            disabled={cur === 0}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="h-5 w-5 text-white" />
          </button>
          <div className="flex gap-1.5">
            {fotos.map((_, i) => (
              <button
                key={i}
                onClick={() => setCur(i)}
                className={cn(
                  "rounded-full transition-all",
                  i === cur ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>
          <button
            onClick={() => setCur(c => Math.min(fotos.length - 1, c + 1))}
            disabled={cur === fotos.length - 1}
            className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 disabled:opacity-30 flex items-center justify-center transition-colors"
          >
            <ChevronRight className="h-5 w-5 text-white" />
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Pick Sheet (câmara ou upload) ────────────────────────────────────────────
function PickSheet({
  tipo,
  onCamera,
  onGallery,
  onClose,
}: {
  tipo: "antes" | "depois"
  onCamera: () => void
  onGallery: () => void
  onClose: () => void
}) {
  const isAntes = tipo === "antes"
  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[150] bg-black/50 backdrop-blur-sm" onClick={onClose} />
      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-[160] max-w-lg mx-auto px-3 pb-5 animate-slide-up">
        <div className="rounded-3xl bg-card border border-border/50 shadow-2xl overflow-hidden">
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/20" />
          </div>
          {/* Title */}
          <p className="text-center text-sm font-bold pb-3 pt-1.5 text-foreground/80">
            {isAntes ? "📷 Adicionar foto — Antes" : "✅ Adicionar foto — Depois"}
          </p>
          {/* Options */}
          <div className="grid grid-cols-2 gap-2.5 px-3 pb-4">
            {/* Câmara */}
            <button
              type="button"
              onClick={() => { onCamera(); onClose() }}
              className={cn(
                "flex flex-col items-center gap-3 py-5 px-3 rounded-2xl border transition-all active:scale-95",
                isAntes
                  ? "bg-blue-50 dark:bg-blue-950/30 border-blue-200/50 hover:bg-blue-100 dark:hover:bg-blue-950/50"
                  : "bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200/50 hover:bg-emerald-100 dark:hover:bg-emerald-950/50"
              )}
            >
              <div className={cn(
                "w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg",
                isAntes
                  ? "bg-gradient-to-br from-blue-500 to-blue-600 shadow-blue-500/30"
                  : "bg-gradient-to-br from-emerald-500 to-emerald-600 shadow-emerald-500/30"
              )}>
                <Camera className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className={cn("text-sm font-bold", isAntes ? "text-blue-700 dark:text-blue-300" : "text-emerald-700 dark:text-emerald-300")}>
                  Tirar foto
                </p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Usar câmara</p>
              </div>
            </button>
            {/* Galeria / Upload */}
            <button
              type="button"
              onClick={() => { onGallery(); onClose() }}
              className="flex flex-col items-center gap-3 py-5 px-3 rounded-2xl bg-slate-50 dark:bg-slate-800/30 border border-slate-200/50 dark:border-slate-700/40 hover:bg-slate-100 dark:hover:bg-slate-800/50 transition-all active:scale-95"
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-slate-600 to-slate-800 flex items-center justify-center shadow-lg shadow-slate-500/20">
                <Upload className="h-7 w-7 text-white" />
              </div>
              <div className="text-center">
                <p className="text-sm font-bold text-slate-700 dark:text-slate-300">Upload</p>
                <p className="text-[11px] text-muted-foreground/60 mt-0.5">Galeria / ficheiro</p>
              </div>
            </button>
          </div>
          {/* Cancel */}
          <button
            type="button"
            onClick={onClose}
            className="w-full py-4 text-sm font-semibold text-muted-foreground border-t border-border/20 hover:bg-muted/30 transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </>
  )
}

// ─── Upload Row Item ──────────────────────────────────────────────────────────
function UploadingRow({ name, progress }: { name: string; progress: number }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-xl bg-muted/40 border border-border/40">
      <Loader2 className="h-4 w-4 animate-spin text-muted-foreground/60 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate text-muted-foreground/80">{name}</p>
        <div className="mt-1.5 h-1 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-200"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
      <span className="text-[10px] font-bold tabular-nums text-muted-foreground/50 shrink-0">{progress}%</span>
    </div>
  )
}

// ─── FotoStrip — lista horizontal de thumbnails + botão add ──────────────────
function FotoStrip({
  tipo, fotos, serviceId, userId, onChange, disabled,
}: {
  tipo: "antes" | "depois"
  fotos: ServiceFoto[]
  serviceId: string
  userId: string
  onChange: (f: ServiceFoto[]) => void
  disabled?: boolean
}) {
  const [showPick, setShowPick]       = useState(false)
  const [uploading, setUploading]     = useState<{ name: string; progress: number }[]>([])
  const [errors, setErrors]           = useState<string[]>([])
  const [lightboxIdx, setLightboxIdx] = useState<number | null>(null)
  const cameraRef  = useRef<HTMLInputElement>(null)
  const galleryRef = useRef<HTMLInputElement>(null)

  const mine = fotos.filter(f => f.tipo === tipo)
  const canAdd = mine.length < MAX_FOTOS_POR_TIPO && !disabled

  const isAntes = tipo === "antes"

  const processFile = useCallback(async (file: File) => {
    const key = `${Date.now()}-${file.name}`
    setUploading(prev => [...prev, { name: file.name, progress: 0 }])
    setErrors([])
    try {
      const compressed = await compressImage(file)
      const foto = await uploadServiceFoto(
        compressed, userId, serviceId, tipo,
        pct => setUploading(prev => prev.map(u => u.name === file.name ? { ...u, progress: pct } : u))
      )
      onChange([...fotos, foto])
    } catch (err: any) {
      setErrors(prev => [...prev, err.message ?? "Erro no upload"])
    } finally {
      setUploading(prev => prev.filter(u => u.name !== file.name))
    }
  }, [fotos, onChange, serviceId, tipo, userId])

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files) return
    const remaining = MAX_FOTOS_POR_TIPO - mine.length
    const toProcess = Array.from(files).slice(0, remaining)
    for (const f of toProcess) await processFile(f)
  }, [mine.length, processFile])

  const handleRemove = useCallback((foto: ServiceFoto) => {
    deleteServiceFoto(foto.publicId)
    onChange(fotos.filter(f => f.publicId !== foto.publicId))
  }, [fotos, onChange])

  return (
    <div className="space-y-2">
      {/* Section label */}
      <div className="flex items-center justify-between">
        <span className={cn(
          "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
          isAntes
            ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
            : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        )}>
          {isAntes ? <Camera className="h-3 w-3" /> : <Images className="h-3 w-3" />}
          {isAntes ? "Antes" : "Depois"}
        </span>
        <span className="text-[10px] text-muted-foreground/40 font-medium tabular-nums">
          {mine.length}/{MAX_FOTOS_POR_TIPO}
        </span>
      </div>

      {/* Thumbnails row */}
      {mine.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          {mine.map((foto, i) => (
            <div key={foto.publicId} className="relative group w-16 h-16 shrink-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={foto.url}
                alt={`${tipo} ${i + 1}`}
                className="w-full h-full object-cover rounded-xl border border-border/60 cursor-pointer transition-transform group-hover:scale-105"
                onClick={() => setLightboxIdx(i)}
              />
              <div className="absolute inset-0 rounded-xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
                <ZoomIn className="h-4 w-4 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow" />
              </div>
              {!disabled && (
                <button
                  type="button"
                  onClick={() => handleRemove(foto)}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-destructive flex items-center justify-center shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <X className="h-2.5 w-2.5 text-white" />
                </button>
              )}
            </div>
          ))}

          {/* Add more button (inline) */}
          {canAdd && (
            <button
              type="button"
              onClick={() => setShowPick(true)}
              className={cn(
                "w-16 h-16 shrink-0 rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-0.5 transition-all active:scale-95",
                isAntes
                  ? "border-blue-300/60 dark:border-blue-700/40 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-400"
                  : "border-emerald-300/60 dark:border-emerald-700/40 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-400"
              )}
            >
              <Plus className={cn("h-5 w-5", isAntes ? "text-blue-400" : "text-emerald-400")} />
            </button>
          )}
        </div>
      )}

      {/* Empty state — big add button */}
      {mine.length === 0 && (
        <button
          type="button"
          onClick={() => canAdd && setShowPick(true)}
          disabled={!canAdd}
          className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl border-2 border-dashed transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed",
            isAntes
              ? "border-blue-200/60 dark:border-blue-800/40 bg-blue-50/30 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-300"
              : "border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/30 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-300"
          )}
        >
          <div className={cn(
            "w-8 h-8 rounded-xl flex items-center justify-center shrink-0",
            isAntes ? "bg-blue-100 dark:bg-blue-950/40" : "bg-emerald-100 dark:bg-emerald-950/40"
          )}>
            <Camera className={cn("h-4 w-4", isAntes ? "text-blue-500" : "text-emerald-500")} />
          </div>
          <span className={cn(
            "text-sm font-medium",
            isAntes ? "text-blue-600/70 dark:text-blue-400/70" : "text-emerald-600/70 dark:text-emerald-400/70"
          )}>
            Adicionar fotos {isAntes ? "antes" : "depois"}…
          </span>
        </button>
      )}

      {/* Upload progress rows */}
      {uploading.map(u => (
        <UploadingRow key={u.name} name={u.name} progress={u.progress} />
      ))}

      {/* Errors */}
      {errors.map((e, i) => (
        <div key={i} className="flex items-center gap-1.5 text-[11px] text-destructive animate-fade-in">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{e}</span>
        </div>
      ))}

      {/* Hidden inputs */}
      <input ref={cameraRef}  type="file" accept="image/*" capture="environment" multiple className="sr-only"
        onChange={e => handleFiles(e.target.files).then(() => { if(cameraRef.current) cameraRef.current.value = "" })} />
      <input ref={galleryRef} type="file" accept="image/*" multiple className="sr-only"
        onChange={e => handleFiles(e.target.files).then(() => { if(galleryRef.current) galleryRef.current.value = "" })} />

      {/* Pick sheet */}
      {showPick && (
        <PickSheet
          tipo={tipo}
          onCamera={() => cameraRef.current?.click()}
          onGallery={() => galleryRef.current?.click()}
          onClose={() => setShowPick(false)}
        />
      )}

      {/* Lightbox */}
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
  disabled?: boolean
}

export function ServiceFotos({ serviceId, fotos, onChange, disabled }: ServiceFotosProps) {
  const { user } = useAuth()
  const userId    = user?.uid ?? "anonymous"
  const safefotos = fotos ?? []
  const total     = safefotos.length

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
          <Images className="h-3.5 w-3.5 text-white" />
        </div>
        <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/50">
          Fotos do serviço
          {total > 0 && <span className="ml-1.5 text-violet-500">· {total}</span>}
        </p>
      </div>

      {/* Antes + Depois side by side */}
      <div className="grid grid-cols-2 gap-4">
        <FotoStrip tipo="antes"  fotos={safefotos} serviceId={serviceId} userId={userId} onChange={onChange} disabled={disabled} />
        <FotoStrip tipo="depois" fotos={safefotos} serviceId={serviceId} userId={userId} onChange={onChange} disabled={disabled} />
      </div>

      {total > 0 && (
        <p className="text-[10px] text-muted-foreground/40 font-medium">
          Toca numa foto para ver em ecrã completo · toca e segura para remover
        </p>
      )}
    </div>
  )
}
