"use client";

import { useRef, useState } from "react";
import { LayoutGroup, motion, AnimatePresence } from "motion/react";
import {
  ChevronDown,
  CalendarDays,
  MessageSquare,
  CheckSquare,
  Zap,
  RefreshCw,
  Bell,
  Mail,
  Sun,
  ArrowRight,
  Check,
  Shield,
  Clock,
  CreditCard,
} from "lucide-react";
import { TextRotate } from "@/components/ui/text-rotate";
import { AuthForm } from "@/components/auth/AuthForm";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { PricingSection } from "@/components/landing/PricingSection";
import { Dock, DockIcon } from "@/components/ui/dock";

const FEATURES = [
  {
    icon: Zap,
    title: "Fast scheduling",
    description:
      "Type events naturally in plain language — no forms, no clicks through menus.",
    color: "#F59E0B",
  },
  {
    icon: MessageSquare,
    title: "AI chat",
    description:
      "Conversational interface that understands context and handles complex requests.",
    color: "#8B5CF6",
  },
  {
    icon: Bell,
    title: "Smart reminders",
    description:
      "Proactive nudges based on your habits and event importance.",
    color: "#EC4899",
  },
  {
    icon: CheckSquare,
    title: "Task manager",
    description:
      "Track to-dos alongside your calendar. Priorities set automatically by AI.",
    color: "#10B981",
  },
  {
    icon: CalendarDays,
    title: "Smart calendar",
    description:
      "An intelligent view that surfaces what matters most today.",
    color: "#3B82F6",
  },
  {
    icon: RefreshCw,
    title: "Google Sync",
    description:
      "Two-way sync with Google Calendar. Changes reflect everywhere instantly.",
    color: "#EF4444",
  },
];

const CHAT_MESSAGES = [
  { role: "user", text: "Schedule a team standup every Monday at 9am" },
  {
    role: "assistant",
    text: 'Done! "Team Standup" added every Monday at 9:00 AM.',
    badge: "✓ Synced to Google Calendar",
  },
  { role: "user", text: "Add task: review Q2 report by Friday" },
  {
    role: "assistant",
    text: "Task added — due Friday, Medium priority.",
    badge: "✓ Task created",
  },
  { role: "user", text: "Remind me about the dentist appointment" },
  {
    role: "assistant",
    text: "Reminder set for 1 hour before.",
    badge: "✓ Reminder on",
  },
];

export default function LoginPage() {
  const loginRef = useRef<HTMLDivElement>(null);
  const [showPricing, setShowPricing] = useState(false);

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div style={{ background: "#0A0C14", color: "#fff" }}>
      {/* ── Pricing modal overlay ─────────────────────────────── */}
      <AnimatePresence>
        {showPricing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[100] overflow-auto"
            style={{ background: "#0A0C14" }}
          >
            <PricingSection onClose={() => setShowPricing(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Fixed navbar ─────────────────────────────────────── */}
      <nav
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-4 backdrop-blur-md"
        style={{
          background: "rgba(10,12,20,0.85)",
          borderBottom: "1px solid rgba(255,255,255,0.07)",
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg text-white font-bold text-xs"
            style={{ background: "#1A56DB" }}
          >
            CA
          </div>
          <span className="font-semibold tracking-tight text-white">CalAssist</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {[
            { label: "Features", action: () => document.getElementById("features")?.scrollIntoView({ behavior: "smooth" }) },
            { label: "Pricing", action: () => setShowPricing(true) },
            { label: "Docs", action: () => { window.location.href = "/docs"; } },
          ].map(({ label, action }) => (
            <button
              key={label}
              onClick={action}
              className="text-sm font-medium transition-colors"
              style={{ color: "rgba(255,255,255,0.55)" }}
              onMouseEnter={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color = "#fff")
              }
              onMouseLeave={(e) =>
                ((e.currentTarget as HTMLButtonElement).style.color =
                  "rgba(255,255,255,0.55)")
              }
            >
              {label}
            </button>
          ))}
        </div>

        <button
          onClick={scrollToLogin}
          className="rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: "#1A56DB" }}
        >
          Sign In
        </button>
      </nav>

      {/* ── Hero section ─────────────────────────────────────── */}
      <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-20 pb-16">
        {/* Grid background */}
        <div
          className="pointer-events-none absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {/* Glow blobs */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/3 -z-10 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl"
          style={{ background: "rgba(26,86,219,0.12)" }}
        />
        <div
          className="pointer-events-none absolute right-1/4 bottom-1/4 -z-10 h-[300px] w-[300px] rounded-full blur-3xl"
          style={{ background: "rgba(126,58,242,0.08)" }}
        />

        {/* Eyebrow badge */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 flex items-center gap-2 rounded-full px-4 py-1.5"
          style={{
            background: "rgba(26,86,219,0.15)",
            border: "1px solid rgba(26,86,219,0.35)",
          }}
        >
          <Zap className="h-3.5 w-3.5" style={{ color: "#60A5FA" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#60A5FA" }}>
            Powered by AI
          </span>
        </motion.div>

        {/* Headline with rotating word */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="text-center"
        >
          <LayoutGroup>
            <motion.div
              layout
              className="flex flex-wrap items-center justify-center gap-x-3 font-light"
              style={{ fontSize: "clamp(2.5rem, 7vw, 5rem)", lineHeight: 1.1 }}
            >
              <motion.span
                layout
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                className="text-white"
              >
                Your calendar,
              </motion.span>
              <TextRotate
                texts={[
                  "intelligently managed",
                  "smarter 🧠",
                  "faster ⚡",
                  "hands-free 🎙️",
                  "stress-free",
                  "AI-powered ✨",
                ]}
                mainClassName="text-white px-3 sm:px-4 overflow-hidden py-1 sm:py-2 justify-center rounded-xl shadow-lg bg-[#1A56DB]"
                staggerFrom="last"
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "-120%" }}
                staggerDuration={0.025}
                splitLevelClassName="overflow-hidden pb-0.5 sm:pb-1"
                transition={{ type: "spring", damping: 30, stiffness: 400 }}
                rotationInterval={2500}
              />
            </motion.div>
          </LayoutGroup>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
          className="mt-6 max-w-lg text-center text-base sm:text-lg"
          style={{ color: "rgba(255,255,255,0.55)" }}
        >
          Type naturally — &ldquo;Dentist Friday at 3pm&rdquo; — and CalAssist handles
          scheduling, reminders, and tasks automatically.
        </motion.p>

        {/* CTA buttons */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.38 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-4"
        >
          <button
            onClick={scrollToLogin}
            className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
            style={{ background: "#1A56DB", boxShadow: "0 8px 24px rgba(26,86,219,0.35)" }}
          >
            Get started free
          </button>
          <button
            onClick={() =>
              document
                .getElementById("app-preview")
                ?.scrollIntoView({ behavior: "smooth" })
            }
            className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-semibold transition-colors"
            style={{
              color: "rgba(255,255,255,0.7)",
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "#fff";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.7)";
              (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            }}
          >
            See how it works <ArrowRight className="h-4 w-4" />
          </button>
        </motion.div>

        {/* Scroll CTA */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.6 }}
          onClick={() =>
            document
              .getElementById("app-preview")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="absolute bottom-10 flex flex-col items-center gap-1.5 transition-colors"
          style={{ color: "rgba(255,255,255,0.3)" }}
          aria-label="Scroll to see more"
        >
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </section>

      {/* ── Scroll animation preview section (KEEP) ──────────── */}
      <section id="app-preview" style={{ background: "#0A0C14" }}>
        <ContainerScroll
          titleComponent={
            <div className="mb-8">
              <p
                className="text-sm font-medium uppercase tracking-widest mb-3"
                style={{ color: "#60A5FA" }}
              >
                Powered by AI
              </p>
              <h2
                className="text-4xl md:text-6xl font-bold leading-tight text-white"
              >
                Your entire schedule,
                <br />
                <span style={{ color: "#1A56DB" }}>one conversation away</span>
              </h2>
              <p
                className="mt-4 text-base md:text-lg max-w-2xl mx-auto"
                style={{ color: "rgba(255,255,255,0.5)" }}
              >
                No forms. No clicking through menus. Just tell CalAssist what you need.
              </p>
            </div>
          }
        >
          {/* Mock app UI inside the scroll card */}
          <div className="h-full w-full flex overflow-hidden rounded-xl bg-zinc-950">
            {/* Sidebar mock */}
            <div className="w-14 flex flex-col items-center gap-4 py-4 border-r border-zinc-800 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                CA
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Sun className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="w-9 h-9 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-blue-400" />
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                <CheckSquare className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                <Mail className="w-4 h-4 text-zinc-400" />
              </div>
            </div>

            {/* Chat panel mock */}
            <div className="flex-1 flex flex-col p-4 gap-3 overflow-hidden">
              <div className="text-xs text-zinc-500 font-medium uppercase tracking-widest">
                AI Assistant
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-200 max-w-xs">
                  Hey! I&apos;m CalAssist. What would you like to schedule?
                </div>
              </div>
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white max-w-xs">
                  Schedule a team standup every Monday at 9am
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-200 max-w-xs">
                  Done! 📅 &ldquo;Team Standup&rdquo; added every Monday at 9:00 AM. Also synced to your Google Calendar.
                </div>
              </div>
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-blue-600 rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-white max-w-xs">
                  Add a task: review Q2 report by Friday
                </div>
              </div>
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-blue-600/20 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-blue-400" />
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-200 max-w-xs">
                  ✅ Task added: &ldquo;Review Q2 report&rdquo; — due Friday, Medium priority.
                </div>
              </div>
              <div className="mt-auto flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-2.5">
                <span className="text-sm text-zinc-500 flex-1">Ask me anything…</span>
                <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center">
                  <ChevronDown className="w-3.5 h-3.5 text-white -rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* ── Feature grid ──────────────────────────────────────── */}
      <section id="features" className="px-6 py-24" style={{ background: "#0D0F1C" }}>
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-14"
          >
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.4)" }}
            >
              Everything you need
            </p>
            <h2 className="text-3xl md:text-5xl font-bold text-white leading-tight">
              Built around how you think
            </h2>
            <p className="mt-4 text-base max-w-xl mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              Six powerful modules that work together seamlessly.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: i * 0.07 }}
                className="rounded-2xl p-6 flex flex-col gap-3 transition-all duration-300"
                style={{
                  background: "rgba(255,255,255,0.04)",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.07)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.13)";
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLDivElement).style.background = "rgba(255,255,255,0.04)";
                  (e.currentTarget as HTMLDivElement).style.borderColor = "rgba(255,255,255,0.07)";
                }}
              >
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-xl"
                  style={{ background: `${f.color}18` }}
                >
                  <f.icon className="h-5 w-5" style={{ color: f.color }} />
                </div>
                <p className="text-base font-semibold text-white">{f.title}</p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.45)" }}>
                  {f.description}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Integrations dock section ─────────────────────────── */}
      <section className="px-6 py-20" style={{ background: "#0A0C14" }}>
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-3"
              style={{ color: "rgba(255,255,255,0.35)" }}
            >
              Integrations
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              Connects to your entire workflow
            </h2>
            <p className="text-base max-w-lg mx-auto" style={{ color: "rgba(255,255,255,0.45)" }}>
              CalAssist plugs into the tools you already use every day — no migration, no setup pain.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="flex justify-center"
          >
            <Dock iconSize={56} maxAdditionalSize={6}>
              {/* Google Calendar */}
              <DockIcon name="Google Calendar" href="#">
                <svg viewBox="0 0 48 48" className="h-full w-full p-0.5">
                  <rect width="40" height="40" x="4" y="4" rx="4" fill="#fff"/>
                  <path fill="#1A73E8" d="M32 8H16v8l8 2 8-2V8z"/>
                  <path fill="#EA4335" d="M38 8h-6v8h6a2 2 0 002-2v-4a2 2 0 00-2-2z"/>
                  <path fill="#34A853" d="M10 40h28a2 2 0 002-2V16H8v22a2 2 0 002 2z"/>
                  <path fill="#FBBC04" d="M8 16h32v-4a2 2 0 00-2-2h-4v8H14V10H10a2 2 0 00-2 2v4z"/>
                  <text x="24" y="34" textAnchor="middle" fill="#fff" fontSize="14" fontWeight="700" fontFamily="Arial">31</text>
                </svg>
              </DockIcon>

              {/* Gmail */}
              <DockIcon name="Gmail" href="#">
                <svg viewBox="0 0 48 48" className="h-full w-full">
                  <rect width="48" height="48" rx="6" fill="#fff"/>
                  <path fill="#EA4335" d="M8 36V18l16 10 16-10v18H8z"/>
                  <path fill="#FBBC05" d="M8 18l16 10 16-10"/>
                  <path fill="#34A853" d="M40 12H8v6l16 10 16-10V12z"/>
                  <path fill="#4285F4" d="M8 12H6a2 2 0 00-2 2v20a2 2 0 002 2h2V12z"/>
                  <path fill="#C5221F" d="M40 12h2a2 2 0 012 2v20a2 2 0 01-2 2h-2V12z"/>
                </svg>
              </DockIcon>

              {/* Google Tasks */}
              <DockIcon name="Google Tasks" href="#">
                <svg viewBox="0 0 48 48" className="h-full w-full">
                  <rect width="48" height="48" rx="6" fill="#1A73E8"/>
                  <circle cx="24" cy="24" r="12" fill="none" stroke="#fff" strokeWidth="3"/>
                  <path d="M19 24l4 4 7-7" stroke="#fff" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </DockIcon>

              {/* Groq AI */}
              <DockIcon name="Groq AI" href="#">
                <div className="h-full w-full rounded-[inherit] flex items-center justify-center text-white font-black text-lg" style={{ background: "linear-gradient(135deg, #F55036 0%, #FF8C00 100%)" }}>
                  G
                </div>
              </DockIcon>

              {/* Supabase */}
              <DockIcon name="Supabase" href="#">
                <svg viewBox="0 0 48 48" className="h-full w-full">
                  <rect width="48" height="48" rx="6" fill="#1C1C1C"/>
                  <path fill="#3ECF8E" d="M27.9 6.2L12.5 26.2c-.7.9-.1 2.2 1.1 2.2H26V42c0 1.4 1.7 2 2.7 1l15.3-20c.7-.9.1-2.2-1.1-2.2H30V7.2c0-1.4-1.7-2-2.1-1z"/>
                  <path fill="#3ECF8E" fillOpacity=".3" d="M20.1 41.8L34.5 21.8c.7-.9.1-2.2-1.1-2.2H21V5.9c0-1.4-1.7-2-2.7-1L3 24.9c-.7.9-.1 2.2 1.1 2.2H17v13.8c0 1.4 1.7 2 3.1.9z"/>
                </svg>
              </DockIcon>

              {/* ElevenLabs */}
              <DockIcon name="ElevenLabs" href="#">
                <div className="h-full w-full rounded-[inherit] flex items-center justify-center" style={{ background: "#000" }}>
                  <svg viewBox="0 0 24 24" className="h-6 w-6" fill="white">
                    <rect x="5" y="3" width="3" height="18" rx="1.5"/>
                    <rect x="10.5" y="7" width="3" height="14" rx="1.5"/>
                    <rect x="16" y="5" width="3" height="16" rx="1.5"/>
                  </svg>
                </div>
              </DockIcon>

              {/* Vercel */}
              <DockIcon name="Vercel" href="#">
                <div className="h-full w-full rounded-[inherit] flex items-center justify-center" style={{ background: "#000" }}>
                  <svg viewBox="0 0 116 100" className="h-5 w-5" fill="white">
                    <path d="M57.5 0L115 100H0L57.5 0z"/>
                  </svg>
                </div>
              </DockIcon>

              {/* Next.js */}
              <DockIcon name="Next.js" href="#">
                <div className="h-full w-full rounded-[inherit] flex items-center justify-center" style={{ background: "#000" }}>
                  <svg viewBox="0 0 180 180" className="h-7 w-7" fill="white">
                    <path d="M90 0C40.3 0 0 40.3 0 90s40.3 90 90 90 90-40.3 90-90S139.7 0 90 0zm44.7 161.3l-57-78.4V135H62V45l74.3 101.8c-12.5 9-27.8 14.2-44.3 14.2-.5 0-1 0-1.5 0z"/>
                    <path d="M118 45h16v90h-16z"/>
                  </svg>
                </div>
              </DockIcon>
            </Dock>
          </motion.div>

          {/* Integration labels row */}
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-wrap justify-center gap-x-6 gap-y-2 mt-8"
          >
            {[
              "Google Calendar",
              "Gmail",
              "Google Tasks",
              "Groq AI",
              "Supabase",
              "ElevenLabs Voice",
              "Vercel",
              "Next.js",
            ].map((name) => (
              <span key={name} className="text-xs" style={{ color: "rgba(255,255,255,0.25)" }}>
                {name}
              </span>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── Two-column conversation section ───────────────────── */}
      <section className="px-6 py-24" style={{ background: "#0A0C14" }}>
        <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: pitch */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <p
              className="text-sm font-semibold uppercase tracking-widest mb-4"
              style={{ color: "#60A5FA" }}
            >
              Powered by AI
            </p>
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-5">
              Your entire schedule,{" "}
              <span style={{ color: "#1A56DB" }}>one conversation away</span>
            </h2>
            <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
              No forms. No clicking through menus. Just tell CalAssist what you need and
              it handles the rest — scheduling, tasks, reminders, all at once.
            </p>
            <button
              onClick={scrollToLogin}
              className="flex items-center gap-2 rounded-full px-7 py-3 text-sm font-bold text-white transition-opacity hover:opacity-90"
              style={{ background: "#1A56DB", boxShadow: "0 8px 24px rgba(26,86,219,0.35)" }}
            >
              Try the demo
            </button>
          </motion.div>

          {/* Right: chat mock */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "#141627",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 32px 80px rgba(0,0,0,0.5)",
            }}
          >
            {/* Window chrome */}
            <div
              className="flex items-center gap-2 px-4 py-3"
              style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", background: "#0F1120" }}
            >
              <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-yellow-500/70" />
              <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
              <span className="ml-3 text-xs font-medium" style={{ color: "rgba(255,255,255,0.3)" }}>
                CalAssist · AI Assistant
              </span>
            </div>

            <div className="p-5 flex flex-col gap-3">
              {CHAT_MESSAGES.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"} gap-1`}
                >
                  <div
                    className="max-w-[85%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed"
                    style={
                      msg.role === "user"
                        ? { background: "#1A56DB", color: "#fff", borderTopRightRadius: 4 }
                        : { background: "rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.85)", borderTopLeftRadius: 4 }
                    }
                  >
                    {msg.text}
                  </div>
                  {msg.badge && (
                    <span
                      className="text-xs font-medium px-2.5 py-1 rounded-full"
                      style={{ background: "rgba(16,185,129,0.15)", color: "#34D399" }}
                    >
                      {msg.badge}
                    </span>
                  )}
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Login section ─────────────────────────────────────── */}
      <section
        ref={loginRef}
        className="relative px-6 py-24 overflow-hidden"
        style={{ background: "#0D0F1C" }}
      >
        {/* Background glow */}
        <div
          className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-[500px] w-[500px] rounded-full blur-3xl"
          style={{ background: "rgba(26,86,219,0.12)" }}
        />

        <div className="relative max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          {/* Left: social proof */}
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-bold text-white leading-tight mb-4">
              Start organizing your life — free
            </h2>
            <p className="text-base mb-8" style={{ color: "rgba(255,255,255,0.5)" }}>
              Join thousands of users who&apos;ve replaced their clunky calendar apps
              with CalAssist. No credit card needed.
            </p>

            <div className="flex flex-col gap-4">
              {[
                { icon: CreditCard, text: "Free plan, no credit card required" },
                { icon: RefreshCw, text: "Google Calendar sync included" },
                { icon: Shield, text: "Your data stays private, always" },
                { icon: Clock, text: "Works on all devices" },
              ].map(({ icon: Icon, text }) => (
                <div key={text} className="flex items-center gap-3">
                  <div
                    className="flex h-6 w-6 items-center justify-center rounded-full shrink-0"
                    style={{ background: "rgba(26,86,219,0.2)" }}
                  >
                    <Check className="h-3.5 w-3.5" style={{ color: "#60A5FA" }} />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.65)" }}>
                    {text}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right: auth form */}
          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
          >
            <div className="text-center mb-6">
              <div
                className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl"
                style={{
                  background: "#1A56DB",
                  boxShadow: "0 8px 24px rgba(26,86,219,0.35)",
                }}
              >
                <CalendarDays className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Welcome to CalAssist</h3>
            </div>

            <div
              className="rounded-2xl p-7"
              style={{
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.09)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 24px 64px rgba(0,0,0,0.4)",
              }}
            >
              <AuthForm />
            </div>
          </motion.div>
        </div>
      </section>
    </div>
  );
}
