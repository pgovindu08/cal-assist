"use client";

import { useRef } from "react";
import { LayoutGroup, motion } from "motion/react";
import {
  ChevronDown,
  CalendarDays,
  MessageSquare,
  CheckSquare,
  Zap,
  RefreshCw,
  Bell,
  Mail,
} from "lucide-react";
import { TextRotate } from "@/components/ui/text-rotate";
import { AuthForm } from "@/components/auth/AuthForm";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import RadialOrbitalTimeline from "@/components/ui/radial-orbital-timeline";
import { Button } from "@/components/ui/button";

const calassistFeatures = [
  {
    id: 1,
    title: "AI Chat",
    date: "Core",
    content:
      'Talk to your calendar naturally. Say "Schedule a meeting with Alex tomorrow at 3pm" and it\'s done instantly.',
    category: "AI",
    icon: MessageSquare,
    relatedIds: [2, 3],
    status: "completed" as const,
    energy: 100,
  },
  {
    id: 2,
    title: "Smart Calendar",
    date: "Core",
    content:
      "Month, week, and day views with intelligent event placement. Click any day to jump straight to it.",
    category: "Calendar",
    icon: CalendarDays,
    relatedIds: [1, 4],
    status: "completed" as const,
    energy: 95,
  },
  {
    id: 3,
    title: "Tasks",
    date: "New",
    content:
      "Create to-dos by chatting with the assistant. Priority levels, due dates, and Today/Upcoming views built in.",
    category: "Tasks",
    icon: CheckSquare,
    relatedIds: [1, 5],
    status: "completed" as const,
    energy: 90,
  },
  {
    id: 4,
    title: "Google Sync",
    date: "Integrated",
    content:
      "Everything syncs to Google Calendar and Google Tasks automatically. Works with your existing tools.",
    category: "Sync",
    icon: RefreshCw,
    relatedIds: [2, 3],
    status: "completed" as const,
    energy: 85,
  },
  {
    id: 5,
    title: "Fast Scheduling",
    date: "Core",
    content:
      "AI resolves relative dates, times, and timezones perfectly. \"Friday at noon\" always lands in the right slot.",
    category: "AI",
    icon: Zap,
    relatedIds: [1, 6],
    status: "completed" as const,
    energy: 92,
  },
  {
    id: 6,
    title: "Reminders",
    date: "Soon",
    content:
      "Proactive nudges before your events and task deadlines so nothing slips through the cracks.",
    category: "Notifications",
    icon: Bell,
    relatedIds: [3, 5],
    status: "pending" as const,
    energy: 40,
  },
];

export default function LoginPage() {
  const loginRef = useRef<HTMLDivElement>(null);

  const scrollToLogin = () => {
    loginRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="bg-background">
      {/* ── Fixed navbar ─────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur-md border-b border-border/40">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs">
            CA
          </div>
          <span className="font-semibold tracking-tight">CalAssist</span>
        </div>
        <Button
          onClick={scrollToLogin}
          size="sm"
          className="rounded-full px-5"
        >
          Sign In
        </Button>
      </nav>

      {/* ── Hero section ─────────────────────────────────────── */}
      <section className="relative flex h-screen flex-col items-center justify-center overflow-hidden px-6 pt-16">
        {/* Grid background */}
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

        {/* Headline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="text-center"
        >
          <LayoutGroup>
            <motion.div
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
            </motion.div>
          </LayoutGroup>
        </motion.div>

        {/* Subheadline */}
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut", delay: 0.25 }}
          className="mt-6 max-w-md text-center text-base text-muted-foreground sm:text-lg"
        >
          Type naturally — &ldquo;Dentist appointment Friday at 3pm&rdquo; —
          and CalAssist handles the rest.
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
            "✅ Task manager",
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
          onClick={() =>
            document
              .getElementById("app-preview")
              ?.scrollIntoView({ behavior: "smooth" })
          }
          className="absolute bottom-10 flex flex-col items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="Scroll to see more"
        >
          <span className="text-xs font-medium tracking-wider uppercase">
            See it in action
          </span>
          <motion.div
            animate={{ y: [0, 5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <ChevronDown className="h-5 w-5" />
          </motion.div>
        </motion.button>
      </section>

      {/* ── Scroll animation preview section ─────────────────── */}
      <section id="app-preview" className="bg-background">
        <ContainerScroll
          titleComponent={
            <div className="mb-8">
              <p className="text-sm font-medium text-primary uppercase tracking-widest mb-3">
                Powered by AI
              </p>
              <h2 className="text-4xl md:text-6xl font-bold text-foreground leading-tight">
                Your entire schedule,
                <br />
                <span className="text-primary">one conversation away</span>
              </h2>
              <p className="mt-4 text-muted-foreground text-base md:text-lg max-w-2xl mx-auto">
                No forms. No clicking through menus. Just tell CalAssist what
                you need.
              </p>
            </div>
          }
        >
          {/* Mock app UI inside the scroll card */}
          <div className="h-full w-full flex overflow-hidden rounded-xl bg-zinc-950">
            {/* Sidebar mock */}
            <div className="w-14 flex flex-col items-center gap-4 py-4 border-r border-zinc-800 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-xs font-bold">
                CA
              </div>
              <div className="w-9 h-9 rounded-lg bg-zinc-800 flex items-center justify-center">
                <MessageSquare className="w-4 h-4 text-zinc-400" />
              </div>
              <div className="w-9 h-9 rounded-lg bg-primary/20 flex items-center justify-center">
                <CalendarDays className="w-4 h-4 text-primary" />
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

              {/* Assistant message */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-200 max-w-xs">
                  Hey! I&apos;m CalAssist. What would you like to schedule?
                </div>
              </div>

              {/* User message */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-primary-foreground max-w-xs">
                  Schedule a team standup every Monday at 9am
                </div>
              </div>

              {/* Assistant confirmation */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-200 max-w-xs">
                  Done! 📅 &ldquo;Team Standup&rdquo; added every Monday at
                  9:00 AM. Also synced to your Google Calendar.
                </div>
              </div>

              {/* User message */}
              <div className="flex gap-3 items-start justify-end">
                <div className="bg-primary rounded-2xl rounded-tr-sm px-4 py-2.5 text-sm text-primary-foreground max-w-xs">
                  Add a task: review Q2 report by Friday
                </div>
              </div>

              {/* Assistant task */}
              <div className="flex gap-3 items-start">
                <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                  <Zap className="w-3.5 h-3.5 text-primary" />
                </div>
                <div className="bg-zinc-800 rounded-2xl rounded-tl-sm px-4 py-2.5 text-sm text-zinc-200 max-w-xs">
                  ✅ Task added: &ldquo;Review Q2 report&rdquo; — due Friday,
                  Medium priority.
                </div>
              </div>

              {/* Input mock */}
              <div className="mt-auto flex items-center gap-2 bg-zinc-800 rounded-xl px-4 py-2.5">
                <span className="text-sm text-zinc-500 flex-1">
                  Ask me anything…
                </span>
                <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center">
                  <ChevronDown className="w-3.5 h-3.5 text-primary-foreground -rotate-90" />
                </div>
              </div>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* ── Features orbital timeline ─────────────────────────── */}
      <section className="bg-black">
        <div className="text-center pt-20 pb-4 px-4">
          <p className="text-sm font-medium text-purple-400 uppercase tracking-widest mb-3">
            Everything you need
          </p>
          <h2 className="text-3xl md:text-5xl font-bold text-white">
            Built around how you think
          </h2>
          <p className="mt-4 text-white/60 text-base max-w-xl mx-auto">
            Click any node to explore each feature and see how they connect.
          </p>
        </div>
        <RadialOrbitalTimeline timelineData={calassistFeatures} />
      </section>

      {/* ── Login section ─────────────────────────────────────── */}
      <section
        ref={loginRef}
        className="flex min-h-screen items-center justify-center px-4 py-20 bg-background"
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
                <span className="bg-card px-2 text-muted-foreground">
                  or continue with
                </span>
              </div>
            </div>

            <GoogleSignInButton />
          </div>
        </motion.div>
      </section>
    </div>
  );
}
