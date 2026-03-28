"use client"

import { useRef } from "react"
import { LayoutGroup, motion } from "motion/react"
import { ChevronDown, CalendarDays } from "lucide-react"
import { TextRotate } from "@/components/ui/text-rotate"
import { AuthForm } from "@/components/auth/AuthForm"
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton"

export default function LoginPage() {
  const loginRef = useRef<HTMLDivElement>(null)

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="bg-background">
      {/* ── Hero section ─────────────────────────────────────── */}
      <section className="relative flex h-screen flex-col items-center justify-center overflow-hidden px-6">
        {/* Subtle grid background */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.03] dark:opacity-[0.06]"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />

        {/* Glow blob */}
        <div className="pointer-events-none absolute left-1/2 top-1/2 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-3xl" />

        {/* Logo mark */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="mb-8 flex items-center gap-3"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
            <CalendarDays className="h-6 w-6" />
          </div>
          <span className="text-2xl font-bold tracking-tight">CalAssist</span>
        </motion.div>

        {/* Main headline with TextRotate */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="text-center"
        >
          <LayoutGroup>
            <motion.p
              layout
              className="flex flex-wrap items-center justify-center gap-x-3 text-4xl font-light sm:text-5xl md:text-6xl lg:text-7xl"
            >
              <motion.span
                layout
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="text-foreground"
              >
                Your calendar,
              </motion.span>
              <TextRotate
                texts={[
                  "smarter 🧠",
                  "faster ⚡",
                  "simpler",
                  "hands-free 🎙️",
                  "stress-free",
                  "just talk",
                  "AI-powered ✨",
                ]}
                mainClassName="text-white px-3 sm:px-4 bg-primary overflow-hidden py-1 sm:py-2 justify-center rounded-xl shadow-lg shadow-primary/30"
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2200}
              />
            </motion.p>
          </LayoutGroup>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
          className="mt-6 max-w-md text-center text-base text-muted-foreground sm:text-lg"
        >
          Type or speak naturally — &ldquo;Dentist appointment Friday at 3pm&rdquo; — and
          CalAssist handles the rest.
        </motion.p>

        {/* Feature pills */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.4 }}
          className="mt-8 flex flex-wrap justify-center gap-2"
        >
          {[
            "🗓️ Smart scheduling",
            "🎙️ Voice input",
            "🔔 Reminders",
            "🤖 AI assistant",
            "🔒 Your data, your calendar",
          ].map((pill) => (
            <span
              key={pill}
              className="rounded-full border border-border bg-secondary/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur-sm"
            >
              {pill}
            </span>
          ))}
        </motion.div>

        {/* Scroll CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          onClick={scrollToLogin}
          className="absolute bottom-10 flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Scroll to sign in"
        >
          <span className="text-xs font-medium tracking-wider uppercase">Get started</span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </section>

      {/* ── Login section ─────────────────────────────────────── */}
      <section
        ref={loginRef}
        className="flex min-h-screen items-center justify-center px-4 py-20"
      >
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-sm space-y-8"
        >
          {/* Section logo */}
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg shadow-primary/30">
              <CalendarDays className="h-7 w-7" />
            </div>
            <h2 className="text-2xl font-bold">Welcome to CalAssist</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Sign in or create a free account to get started.
            </p>
          </div>

          {/* Auth card */}
          <div className="rounded-2xl border border-border bg-card p-8 shadow-sm space-y-5">
            <AuthForm />

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs">
                <span className="bg-card px-2 text-muted-foreground">or continue with</span>
              </div>
            </div>

            <GoogleSignInButton />
          </div>
        </motion.div>
      </section>
    </div>
  )
}
