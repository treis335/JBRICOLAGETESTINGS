"use client"

import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"
import { auth } from "@/lib/firebase"
import { useState } from "react"
import Image from "next/image"

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleGoogleLogin = async () => {
    setError("")
    setLoading(true)
    try {
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
    } catch (err: any) {
      console.error(err)
      setError("Erro ao entrar com Google. Tenta novamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-5 relative overflow-hidden">

      {/* Background decorative elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-primary/5 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full border border-border/30" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[400px] h-[400px] rounded-full border border-border/20" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[200px] h-[200px] rounded-full border border-border/15" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-sm animate-fade-in-up">

        {/* Logo area */}
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-primary/10 border border-primary/20 mb-5 shadow-lg shadow-primary/10 relative mx-auto">
            <Image
              src="/apple-icon.png"
              alt="JBricolage"
              width={48}
              height={48}
              className="object-contain"
            />
            {/* Ping animation */}
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-background">
              <span className="absolute inset-0 rounded-full bg-emerald-500 animate-ping opacity-75" />
            </span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-foreground mb-1">
            JBRICOLAGE
          </h1>
          <p className="text-sm text-muted-foreground font-medium">
            Gestão de obras e horas de trabalho
          </p>
        </div>

        {/* Login card */}
        <div
          className="rounded-3xl border border-border/60 bg-card/80 p-7 shadow-xl shadow-black/5 animate-fade-in delay-100"
          style={{ backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}
        >
          <p className="text-xs font-semibold text-muted-foreground/70 uppercase tracking-widest text-center mb-5">
            Acesso seguro
          </p>

          {/* Google button */}
          <button
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 rounded-2xl border border-border/60 bg-background px-5 py-3.5 text-sm font-semibold text-foreground shadow-sm transition-all duration-200 hover:bg-muted/60 hover:border-border hover:shadow-md hover:-translate-y-0.5 active:translate-y-0 active:shadow-sm disabled:opacity-50 disabled:cursor-not-allowed press-effect"
          >
            {loading ? (
              <>
                {/* Spinner */}
                <svg className="w-[18px] h-[18px] animate-spin-slow" viewBox="0 0 24 24" fill="none">
                  <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeOpacity="0.25" />
                  <path d="M12 2a10 10 0 0 1 10 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                </svg>
                <span>A entrar…</span>
              </>
            ) : (
              <>
                {/* Google logo */}
                <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden>
                  <path fill="#FFC107" d="M43.6 20.5H42V20H24v8h11.3C33.7 32.5 29.3 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.2-.4-3.5z" />
                  <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.7 16.2 19 12 24 12c3.1 0 5.9 1.2 8 3.1l5.7-5.7C34.1 6.1 29.3 4 24 4 16.3 4 9.6 8.3 6.3 14.7z" />
                  <path fill="#4CAF50" d="M24 44c5.2 0 10-2 13.6-5.2l-6.3-5.3C29.3 35.7 26.7 36 24 36c-5.3 0-9.7-3.5-11.3-8.4l-6.6 5.1C9.5 39.5 16.2 44 24 44z" />
                  <path fill="#1976D2" d="M43.6 20.5H42V20H24v8h11.3c-1 2.9-3 5.3-5.6 6.9l6.3 5.3C39.6 36.9 44 31.4 44 24c0-1.3-.1-2.2-.4-3.5z" />
                </svg>
                <span>Entrar com Google</span>
              </>
            )}
          </button>

          {/* Error message */}
          {error && (
            <div className="mt-4 flex items-center gap-2 px-3.5 py-2.5 rounded-xl bg-destructive/10 border border-destructive/20 animate-scale-in">
              <svg className="h-4 w-4 text-destructive shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <p className="text-xs font-medium text-destructive">{error}</p>
            </div>
          )}

          {/* Divider */}
          <div className="flex items-center gap-3 my-5">
            <div className="flex-1 h-px bg-border/50" />
            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-wider">acesso restrito</span>
            <div className="flex-1 h-px bg-border/50" />
          </div>

          <p className="text-[11px] text-muted-foreground/60 text-center leading-relaxed">
            Apenas contas autorizadas pela equipa JBRICOLAGE têm acesso a esta plataforma.
          </p>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-muted-foreground/40 mt-6 animate-fade-in delay-200">
          © {new Date().getFullYear()} JBRICOLAGE · Todos os direitos reservados
        </p>
      </div>
    </div>
  )
}
