// app/not-found.tsx
import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-5 relative overflow-hidden">

      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-3xl" />
      </div>

      <div className="relative text-center animate-fade-in-up max-w-sm">
        {/* Big 404 */}
        <div className="relative mb-6 inline-block">
          <span
            className="text-[120px] font-black leading-none select-none"
            style={{
              background: "linear-gradient(135deg, oklch(0.55 0.18 250) 0%, oklch(0.65 0.15 200) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              opacity: 0.15,
            }}
          >
            404
          </span>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-20 h-20 rounded-3xl bg-card border border-border shadow-lg flex items-center justify-center animate-bounce-in">
              <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
                <path d="M6 28L12 10L18 20L24 14L30 28H6Z" fill="currentColor" className="text-primary/20" />
                <path d="M6 28L12 10L18 20L24 14L30 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary/60" />
              </svg>
            </div>
          </div>
        </div>

        <h1 className="text-2xl font-bold text-foreground mb-2">Página não encontrada</h1>
        <p className="text-muted-foreground text-sm mb-8 leading-relaxed">
          A página que procuras não existe ou foi movida para outro local.
        </p>

        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/20 hover:bg-primary/90 hover:-translate-y-0.5 hover:shadow-primary/30 hover:shadow-xl transition-all duration-200 press-effect"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          Voltar ao início
        </Link>
      </div>
    </div>
  )
}
