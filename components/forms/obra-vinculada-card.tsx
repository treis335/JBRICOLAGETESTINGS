// components/forms/obra-vinculada-card.tsx
"use client"
import { useState } from "react"
import { X, MapPin, ZoomIn, HardHat } from "lucide-react"
import { ESTADO_LABELS, ESTADO_COLORS } from "@/lib/obras-service"
import { PhotoLightbox } from "./photo-lightbox"
import type { Obra } from "@/lib/obras-service"

interface ObraVinculadaCardProps {
  obra: Obra
  obraNome: string
  onInfo: () => void
  onUnlink: () => void
}

export function ObraVinculadaCard({ obra, obraNome, onInfo, onUnlink }: ObraVinculadaCardProps) {
  const [lightboxOpen, setLightboxOpen] = useState(false)
  const morada = [obra.moradaRua, obra.moradaCidade].filter(Boolean).join(", ")
  const ec = ESTADO_COLORS[obra.estado]

  return (
    <>
      {lightboxOpen && obra.fotoUrl && (
        <PhotoLightbox src={obra.fotoUrl} alt={obra.nome} onClose={() => setLightboxOpen(false)} />
      )}
      <div className="rounded-2xl border border-primary/20 bg-primary/[0.02] overflow-hidden">
        {obra.fotoUrl && (
          <button
            type="button"
            onClick={() => setLightboxOpen(true)}
            className="relative w-full overflow-hidden group block"
            style={{ height: "110px" }}
          >
            <img
              src={obra.fotoUrl}
              alt={obra.nome}
              className="w-full h-full object-cover group-hover:scale-[1.04] transition-transform duration-500"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-black/50 backdrop-blur-sm text-white text-xs font-semibold">
                <ZoomIn className="h-3.5 w-3.5" />Ampliar foto
              </div>
            </div>
            <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/30 to-transparent" />
          </button>
        )}

        <div className="flex items-center gap-3 px-3.5 py-3">
          {!obra.fotoUrl && (
            <div
              className="w-10 h-10 rounded-xl shrink-0 flex items-center justify-center border border-border/25"
              style={{ backgroundColor: obra.cor + "18" }}
            >
              <HardHat className="h-4 w-4 opacity-20" style={{ color: obra.cor }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-sm font-semibold truncate text-foreground leading-snug">{obraNome}</p>
              <span className={`shrink-0 inline-flex items-center gap-1 rounded-full text-[9px] font-bold px-1.5 py-0.5 ${ec.bg} ${ec.text}`}>
                <span className={`w-1 h-1 rounded-full ${ec.dot}`} />{ESTADO_LABELS[obra.estado]}
              </span>
            </div>
            {morada && (
              <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5 truncate">
                <MapPin className="h-2.5 w-2.5 shrink-0" />{morada}
              </p>
            )}
          </div>

          <button
            type="button"
            onClick={onInfo}
            title="Morada e navegação"
            className="w-9 h-9 rounded-xl border border-border/40 bg-background hover:bg-blue-50 hover:border-blue-200 dark:hover:bg-blue-950/30 dark:hover:border-blue-800/50 flex items-center justify-center transition-all shrink-0 group"
          >
            <MapPin className="h-4 w-4 text-muted-foreground/60 group-hover:text-blue-500 transition-colors" />
          </button>

          <button
            type="button"
            onClick={onUnlink}
            title="Desvincular obra"
            className="w-9 h-9 rounded-xl border border-border/40 bg-background hover:bg-red-50 hover:border-red-200 dark:hover:bg-red-950/25 dark:hover:border-red-800/40 flex items-center justify-center transition-all shrink-0 group"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-red-500 transition-colors" />
          </button>
        </div>
      </div>
    </>
  )
}
