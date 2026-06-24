// components/admin/obras/estado-badge.tsx
"use client"
import { ESTADO_LABELS, ESTADO_COLORS } from "@/lib/obras-service"
import type { ObraEstado } from "@/lib/obras-service"

export function EstadoBadge({ estado, size = "sm" }: { estado: ObraEstado; size?: "xs" | "sm" }) {
  const ec = ESTADO_COLORS[estado]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full font-semibold shrink-0 ${ec.bg} ${ec.text} ${
      size === "xs" ? "px-1.5 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs"
    }`}>
      <span className={`rounded-full shrink-0 ${ec.dot} ${size === "xs" ? "w-1 h-1" : "w-1.5 h-1.5"}`} />
      {ESTADO_LABELS[estado]}
    </span>
  )
}
