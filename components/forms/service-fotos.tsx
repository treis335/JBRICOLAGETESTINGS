// components/forms/service-fotos.tsx
"use client"

import { useRef, useState, useCallback } from "react"
import { useAuth } from "@/lib/AuthProvider"
import {
  uploadServiceFoto, deleteServiceFoto,
  compressImage, MAX_FOTOS_POR_TIPO
} from "@/lib/service-fotos"
import type { ServiceFoto } from "@/lib/types"
import { cn } from "@/lib/utils"
import {
  Camera, ImagePlus, X, Loader2, CheckCircle2,
  AlertCircle, ChevronRight, Eye, ZoomIn,
} from "lucide-react"

// ── Photo Thumbnail ──────────────────────────────────────────────────────────
function PhotoThumb({
  foto,
  onRemove,
  onClick,
  disabled,
}: {
  foto: ServiceFoto
  onRemove: () => void
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <div className="relative group aspect-square rounded-xl overflow-hidden border border-border/60 bg-muted/30 shadow-sm">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={foto.url}
        alt={`Foto ${foto.tipo}`}
        className="w-full h-full object-cover cursor-pointer transition-transform duration-200 group-hover:scale-105"
        onClick={onClick}
      />
      {/* Zoom hint */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center pointer-events-none">
        <ZoomIn className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
      </div>
      {/* Remove button */}
      {!disabled && (
        <button
          type="button"
          onClick={e => { e.stopPropagation(); onRemove() }}
          className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 hover:bg-red-500 flex items-center justify-center transition-colors shadow-md opacity-0 group-hover:opacity-100"
        >
          <X className="h-3 w-3 text-white" />
        </button>
      )}
    </div>
  )
}

// ── Add Slot ─────────────────────────────────────────────────────────────────
function AddSlot({
  tipo,
  inputId,
  uploading,
  progress,
  disabled,
}: {
  tipo: "antes" | "depois"
  inputId: string
  uploading: boolean
  progress: number
  disabled?: boolean
}) {
  const isAntes = tipo === "antes"
  return (
    <label
      htmlFor={disabled || uploading ? undefined : inputId}
      className={cn(
        "aspect-square rounded-xl border-2 border-dashed flex flex-col items-center justify-center gap-1.5 transition-all duration-150 select-none",
        disabled || uploading
          ? "border-border/30 bg-muted/10 cursor-not-allowed opacity-50"
          : isAntes
            ? "border-blue-300/60 dark:border-blue-700/40 bg-blue-50/40 dark:bg-blue-950/10 hover:bg-blue-50 dark:hover:bg-blue-950/20 hover:border-blue-400 cursor-pointer active:scale-95"
            : "border-emerald-300/60 dark:border-emerald-700/40 bg-emerald-50/40 dark:bg-emerald-950/10 hover:bg-emerald-50 dark:hover:bg-emerald-950/20 hover:border-emerald-400 cursor-pointer active:scale-95"
      )}
    >
      {uploading ? (
        <>
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground/60" />
          <span className="text-[10px] font-bold tabular-nums text-muted-foreground/50">{progress}%</span>
        </>
      ) : (
        <>
          <ImagePlus className={cn("h-5 w-5", isAntes ? "text-blue-400" : "text-emerald-400")} />
          <span className={cn("text-[10px] font-semibold", isAntes ? "text-blue-500/70" : "text-emerald-500/70")}>
            Adicionar
          </span>
        </>
      )}
    </label>
  )
}

// ── Lightbox ─────────────────────────────────────────────────────────────────
function Lightbox({ foto, onClose }: { foto: ServiceFoto; onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[200] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <button
        type="button"
        onClick={onClose}
        className="absolute top-4 right-4 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
      >
        <X className="h-5 w-5 text-white" />
      </button>
      <div className="max-w-2xl w-full" onClick={e => e.stopPropagation()}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={foto.url}
          alt={`Foto ${foto.tipo}`}
          className="w-full max-h-[80dvh] object-contain rounded-2xl shadow-2xl animate-scale-in"
        />
        <div className="mt-3 text-center">
          <span className={cn(
            "inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold",
            foto.tipo === "antes"
              ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
          )}>
            {foto.tipo === "antes" ? "📷 Antes" : "✅ Depois"}
          </span>
        </div>
      </div>
    </div>
  )
}

// ── FotoStrip — uma linha (antes ou depois) ───────────────────────────────────
function FotoStrip({
  tipo,
  fotos,
  serviceId,
  userId,
  onChange,
  disabled,
}: {
  tipo: "antes" | "depois"
  fotos: ServiceFoto[]
  serviceId: string
  userId: string
  onChange: (updated: ServiceFoto[]) => void
  disabled?: boolean
}) {
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lightbox, setLightbox] = useState<ServiceFoto | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const inputId = `foto-${tipo}-${serviceId}`

  const thisTypeFotos = fotos.filter(f => f.tipo === tipo)
  const canAdd = thisTypeFotos.length < MAX_FOTOS_POR_TIPO && !uploading && !disabled
  const slots = MAX_FOTOS_POR_TIPO // sempre 2 slots visíveis

  const handleFile = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ""
    if (!file) return

    setError(null)
    setUploading(true)
    setProgress(0)

    try {
      const compressed = await compressImage(file)
      const foto = await uploadServiceFoto(compressed, userId, serviceId, tipo, pct => setProgress(pct))
      onChange([...fotos, foto])
    } catch (err: any) {
      setError(err.message ?? "Erro no upload")
    } finally {
      setUploading(false)
      setProgress(0)
    }
  }, [fotos, onChange, serviceId, tipo, userId])

  const handleRemove = useCallback((foto: ServiceFoto) => {
    deleteServiceFoto(foto.publicId)
    onChange(fotos.filter(f => f.publicId !== foto.publicId))
  }, [fotos, onChange])

  const isAntes = tipo === "antes"

  return (
    <div className="space-y-2">
      {/* Label */}
      <div className="flex items-center gap-2">
        <div className={cn(
          "flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider",
          isAntes
            ? "bg-blue-100 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400"
            : "bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400"
        )}>
          <Camera className="h-3 w-3" />
          {isAntes ? "Antes" : "Depois"}
        </div>
        <span className="text-[10px] text-muted-foreground/50 font-medium">
          {thisTypeFotos.length}/{MAX_FOTOS_POR_TIPO}
        </span>
      </div>

      {/* Grid 2 slots */}
      <div className="grid grid-cols-2 gap-2">
        {/* Fotos existentes */}
        {thisTypeFotos.map(foto => (
          <PhotoThumb
            key={foto.publicId}
            foto={foto}
            onRemove={() => handleRemove(foto)}
            onClick={() => setLightbox(foto)}
            disabled={disabled}
          />
        ))}

        {/* Slot(s) de adicionar */}
        {Array.from({ length: slots - thisTypeFotos.length }).map((_, i) => (
          <AddSlot
            key={i}
            tipo={tipo}
            inputId={inputId}
            uploading={uploading && i === 0}
            progress={progress}
            disabled={!canAdd}
          />
        ))}
      </div>

      {/* Hidden input */}
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        capture={isAntes ? undefined : "environment"}
        className="sr-only"
        onChange={handleFile}
      />

      {/* Error */}
      {error && (
        <div className="flex items-center gap-1.5 text-[11px] text-destructive animate-fade-in">
          <AlertCircle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Lightbox */}
      {lightbox && <Lightbox foto={lightbox} onClose={() => setLightbox(null)} />}
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export interface ServiceFotosProps {
  serviceId: string
  fotos: ServiceFoto[]
  onChange: (fotos: ServiceFoto[]) => void
  disabled?: boolean
  collapsed?: boolean
}

export function ServiceFotos({ serviceId, fotos, onChange, disabled, collapsed }: ServiceFotosProps) {
  const { user } = useAuth()
  const [open, setOpen] = useState((fotos?.length ?? 0) > 0) // auto-open se já há fotos
  const userId = user?.uid ?? "anonymous"

  const totalFotos = fotos?.length ?? 0
  const safefotos = fotos ?? []

  if (collapsed) return null

  return (
    <div className="border-t border-border/20">
      {/* Colapsável trigger */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-sm shrink-0">
            <Camera className="h-3.5 w-3.5 text-white" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none">Fotos do serviço</p>
            <p className="text-[10px] text-muted-foreground/60 mt-0.5">
              {totalFotos === 0
                ? "Antes & depois · opcional"
                : `${totalFotos} foto${totalFotos !== 1 ? "s" : ""} adicionada${totalFotos !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          {totalFotos > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-violet-100 dark:bg-violet-950/40 text-[10px] font-black text-violet-600 dark:text-violet-400">
              {totalFotos}
            </span>
          )}
          <ChevronRight className={cn(
            "h-4 w-4 text-muted-foreground/40 transition-transform duration-200",
            open && "rotate-90"
          )} />
        </div>
      </button>

      {/* Conteúdo colapsável */}
      {open && (
        <div className="px-4 pb-4 space-y-4 animate-fade-in">
          {/* Info pill */}
          {totalFotos === 0 && (
            <div className="flex items-start gap-2 px-3 py-2.5 rounded-xl bg-violet-50/60 dark:bg-violet-950/15 border border-violet-200/40 dark:border-violet-800/30">
              <Eye className="h-3.5 w-3.5 text-violet-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-violet-700/80 dark:text-violet-300/70 font-medium leading-relaxed">
                Adiciona até <strong>2 fotos antes</strong> e <strong>2 depois</strong> do serviço. O admin pode ver todas as fotos.
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <FotoStrip
              tipo="antes"
              fotos={safefotos}
              serviceId={serviceId}
              userId={userId}
              onChange={onChange}
              disabled={disabled}
            />
            <FotoStrip
              tipo="depois"
              fotos={safefotos}
              serviceId={serviceId}
              userId={userId}
              onChange={onChange}
              disabled={disabled}
            />
          </div>

          {totalFotos > 0 && (
            <div className="flex items-center gap-1.5 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="h-3 w-3" />
              Fotos guardadas localmente · sincronizadas com o servidor
            </div>
          )}
        </div>
      )}
    </div>
  )
}
