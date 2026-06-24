// app/not-found.tsx
"use client"

import Link from "next/link"
import { Home, ArrowLeft, Hammer } from "lucide-react"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-6 relative overflow-hidden">

      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-60 -left-60 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-60 -right-60 w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] rounded-full border border-border/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full border border-border/15" />
      </div>

      <div className="relative text-center animate-fade-in-up max-w-sm w-full">

        {/* 404 Number */}
        <div className="mb-6 relative inline-block">
          <span
            className="text-[120px] font-black leading-none tracking-tighter select-none"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.18 250), oklch(0.65 0.15 200))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 4px 24px oklch(0.55 0.18 250 / 0.2))",
            }}
          >
            404
          </span>
          {/* Hammer icon floating */}
          <div className="absolute -top-2 -right-6 w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center animate-bounce-in delay-200 shadow-lg">
            <Hammer className="h-6 w-6 text-primary" strokeWidth={1.8} />
          </div>
        </div>

        {/* Card */}
        <div
          className="rounded-3xl border border-border/50 bg-card/80 p-7 shadow-2xl shadow-black/5 mb-6 animate-fade-in delay-100"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <h1 className="text-xl font-black text-foreground mb-2">Página não encontrada</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Esta obra não existe no nosso registo. Verifica o endereço ou volta ao início.
          </p>
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-3 animate-fade-in delay-200">
          <Link
            href="/"
            className="flex items-center justify-center gap-2.5 h-12 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-0.5 transition-all duration-200 press-effect"
          >
            <Home className="h-4 w-4" />
            Voltar ao Início
          </Link>
          <button
            onClick={() => history.back()}
            className="flex items-center justify-center gap-2.5 h-12 rounded-2xl border border-border/60 bg-background text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition-all duration-200 press-effect"
          >
            <ArrowLeft className="h-4 w-4" />
            Página Anterior
          </button>
        </div>

        {/* Footer */}
        <p className="text-[11px] text-muted-foreground/40 mt-8 animate-fade-in delay-300">
          © {new Date().getFullYear()} JBRICOLAGE · Gestão de Obras
        </p>
      </div>
    </div>
  )
}
