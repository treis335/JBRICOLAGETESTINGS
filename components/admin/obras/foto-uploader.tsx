// components/admin/obras/foto-uploader.tsx
"use client"
import { useRef } from "react"
import { Camera, ImagePlus, X } from "lucide-react"

interface FotoUploaderProps {
  previewUrl?: string
  uploading: boolean
  progress: number
  onFileSelected: (f: File) => void
  onRemove: () => void
}

export function FotoUploader({ previewUrl, uploading, progress, onFileSelected, onRemove }: FotoUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <div className="space-y-1.5 w-full min-w-0">
      <label className="text-[11px] font-semibold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
        <Camera className="h-3 w-3 shrink-0" /> Foto
      </label>
      {previewUrl ? (
        <div className="relative rounded-xl overflow-hidden bg-muted border border-border/50 w-full" style={{ height: "160px" }}>
          <img src={previewUrl} alt="" className="w-full h-full object-cover" />
          {uploading && (
            <div className="absolute inset-0 bg-black/65 flex flex-col items-center justify-center gap-2.5 px-4">
              <div className="w-full max-w-[140px] h-1.5 bg-white/20 rounded-full overflow-hidden">
                <div className="h-full bg-white rounded-full transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
              <p className="text-white text-xs font-bold tracking-wide">{progress}%</p>
            </div>
          )}
          {!uploading && (
            <div className="absolute top-2 right-2 flex gap-1">
              <button type="button" onClick={() => inputRef.current?.click()}
                className="w-7 h-7 rounded-lg bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-colors">
                <Camera className="h-3.5 w-3.5 text-white" />
              </button>
              <button type="button" onClick={onRemove}
                className="w-7 h-7 rounded-lg bg-black/40 hover:bg-red-500/80 backdrop-blur-sm flex items-center justify-center transition-colors">
                <X className="h-3.5 w-3.5 text-white" />
              </button>
            </div>
          )}
        </div>
      ) : (
        <button type="button" onClick={() => inputRef.current?.click()}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-border/50 hover:border-primary/40 hover:bg-primary/[0.02] transition-all group">
          <div className="w-8 h-8 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center transition-colors shrink-0">
            <ImagePlus className="h-4 w-4 text-muted-foreground/60 group-hover:text-primary transition-colors" />
          </div>
          <div className="text-left min-w-0">
            <p className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors leading-none">Adicionar foto</p>
            <p className="text-[11px] text-muted-foreground/50 mt-0.5">JPG, PNG, WEBP</p>
          </div>
        </button>
      )}
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) onFileSelected(f); e.target.value = "" }} />
    </div>
  )
}
