"use client";

import { useState } from "react";
import NumberFlow from "@number-flow/react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCheck,
  Zap,
  Mail,
  Mic,
  CalendarDays,
  CheckSquare,
  Sun,
  Volume2,
  Users,
  BarChart3,
  MessageSquare,
  Palette,
  X,
} from "lucide-react";

const plans = [
  {
    name: "Cal Free",
    tagline: "For students & casual users",
    description:
      "Genuinely useful on its own — not a crippled demo. Full calendar and task management, free forever.",
    monthlyPrice: 0,
    yearlyPrice: 0,
    buttonText: "Get started free",
    popular: false,
    color: "rgba(255,255,255,0.06)",
    borderColor: "rgba(255,255,255,0.1)",
    features: [
      { icon: CalendarDays, text: "Full Calendar + Google sync" },
      { icon: CheckSquare, text: "Full Tasks + XP & gamification" },
      { icon: Sun, text: "Daily Briefing (today's events & tasks)" },
      { icon: MessageSquare, text: "30 AI chat messages/day" },
      { icon: Palette, text: "2 themes (Midnight, Monochrome)" },
    ],
    includes: "No credit card required · Free forever",
  },
  {
    name: "Cal Pro",
    tagline: "For everyday professionals",
    description:
      "The full Cal experience. Let Cal genuinely run your day with email, voice, and unlimited AI.",
    monthlyPrice: 6.99,
    yearlyPrice: 59,
    buttonText: "Start 30-day free trial",
    popular: true,
    color: "rgba(26,86,219,0.1)",
    borderColor: "rgba(26,86,219,0.5)",
    features: [
      { icon: Mail, text: "Full Email Hub — summarize, draft, archive" },
      { icon: Sun, text: "Full Briefing — email snapshot, AI theme, weather" },
      { icon: MessageSquare, text: "Unlimited AI chat messages" },
      { icon: Mic, text: "Voice input" },
      { icon: Palette, text: "All 8 themes + custom color picker" },
      { icon: Zap, text: "Meeting Notes → auto task creation" },
    ],
    includes: "Everything in Free, plus:",
    upgrade: [
      "Advanced notification control & quiet hours",
      "Streak alerts & full gamification settings",
      "Priority email support",
    ],
  },
  {
    name: "Cal Business",
    tagline: "For freelancers & small teams",
    description:
      "When your time genuinely equals money. ElevenLabs voice, multi-account, Sheets, and more.",
    monthlyPrice: 14.99,
    yearlyPrice: 119,
    buttonText: "Start free trial",
    popular: false,
    color: "rgba(126,58,242,0.08)",
    borderColor: "rgba(126,58,242,0.4)",
    features: [
      { icon: Volume2, text: "ElevenLabs natural voice responses" },
      { icon: Users, text: "Multiple Google accounts (personal + work)" },
      { icon: BarChart3, text: "Google Sheets integration via chat" },
      { icon: MessageSquare, text: "Contact & relationship manager" },
      { icon: Mail, text: "Email templates & scheduled sending" },
      { icon: BarChart3, text: "Weekly/monthly productivity reports" },
    ],
    includes: "Everything in Pro, plus:",
    upgrade: [
      "Custom Cal name & personality",
      "Priority AI processing",
      "Auto follow-up email sequences",
    ],
  },
];

function PricingToggle({ isYearly, onToggle }: { isYearly: boolean; onToggle: () => void }) {
  return (
    <div className="flex justify-center mb-12">
      <div
        className="flex items-center gap-1 rounded-full p-1"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(255,255,255,0.1)",
        }}
      >
        <button
          onClick={() => isYearly && onToggle()}
          className="relative rounded-full px-5 py-2 text-sm font-semibold transition-all"
          style={{
            color: !isYearly ? "#fff" : "rgba(255,255,255,0.4)",
            background: !isYearly ? "#1A56DB" : "transparent",
          }}
        >
          Monthly
        </button>
        <button
          onClick={() => !isYearly && onToggle()}
          className="flex items-center gap-2 rounded-full px-5 py-2 text-sm font-semibold transition-all"
          style={{
            color: isYearly ? "#fff" : "rgba(255,255,255,0.4)",
            background: isYearly ? "#1A56DB" : "transparent",
          }}
        >
          Yearly
          <span
            className="rounded-full px-2 py-0.5 text-xs font-bold"
            style={{
              background: isYearly ? "rgba(255,255,255,0.2)" : "rgba(26,86,219,0.25)",
              color: isYearly ? "#fff" : "#60A5FA",
            }}
          >
            2 months free
          </span>
        </button>
      </div>
    </div>
  );
}

interface PricingSectionProps {
  onClose?: () => void;
}

export function PricingSection({ onClose }: PricingSectionProps) {
  const [isYearly, setIsYearly] = useState(false);

  return (
    <div
      className="relative min-h-screen w-full overflow-auto py-16 px-4"
      style={{ background: "#0A0C14" }}
    >
      {/* Close button */}
      {onClose && (
        <button
          onClick={onClose}
          className="fixed top-6 right-6 z-50 flex h-9 w-9 items-center justify-center rounded-full transition-colors"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "rgba(255,255,255,0.6)",
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.1)";
            (e.currentTarget as HTMLButtonElement).style.color = "#fff";
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.background = "rgba(255,255,255,0.06)";
            (e.currentTarget as HTMLButtonElement).style.color = "rgba(255,255,255,0.6)";
          }}
        >
          <X className="h-4 w-4" />
        </button>
      )}

      {/* Background glow */}
      <div
        className="pointer-events-none absolute left-1/2 top-0 -translate-x-1/2 h-[400px] w-[700px] rounded-full blur-3xl"
        style={{ background: "rgba(26,86,219,0.1)" }}
      />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative text-center mb-12 max-w-2xl mx-auto"
      >
        <div
          className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-5"
          style={{
            background: "rgba(26,86,219,0.15)",
            border: "1px solid rgba(26,86,219,0.35)",
          }}
        >
          <Zap className="h-3.5 w-3.5" style={{ color: "#60A5FA" }} />
          <span className="text-xs font-semibold uppercase tracking-widest" style={{ color: "#60A5FA" }}>
            Pricing
          </span>
        </div>
        <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-4">
          Plans that grow{" "}
          <span
            className="rounded-xl px-3 py-1"
            style={{
              background: "rgba(26,86,219,0.2)",
              border: "1px dashed rgba(26,86,219,0.6)",
              color: "#60A5FA",
            }}
          >
            with you
          </span>
        </h2>
        <p className="text-base" style={{ color: "rgba(255,255,255,0.45)" }}>
          Calendar and Tasks are free forever. Upgrade when Cal becomes your
          daily command center.
        </p>
      </motion.div>

      <PricingToggle isYearly={isYearly} onToggle={() => setIsYearly((v) => !v)} />

      {/* Cards */}
      <div className="relative max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-5">
        {plans.map((plan, i) => (
          <motion.div
            key={plan.name}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            className="relative flex flex-col rounded-2xl p-6"
            style={{
              background: plan.color,
              border: `1px solid ${plan.borderColor}`,
              boxShadow: plan.popular
                ? "0 0 40px rgba(26,86,219,0.2), 0 24px 48px rgba(0,0,0,0.4)"
                : "0 8px 32px rgba(0,0,0,0.3)",
            }}
          >
            {plan.popular && (
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-4 py-1 text-xs font-bold text-white"
                style={{ background: "#1A56DB", boxShadow: "0 4px 16px rgba(26,86,219,0.5)" }}
              >
                Most Popular
              </div>
            )}

            {/* Plan header */}
            <div className="mb-5">
              <h3 className="text-xl font-bold text-white mb-0.5">{plan.name}</h3>
              <p className="text-xs font-medium mb-3" style={{ color: plan.popular ? "#60A5FA" : "rgba(255,255,255,0.4)" }}>
                {plan.tagline}
              </p>
              <p className="text-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.5)" }}>
                {plan.description}
              </p>
            </div>

            {/* Price */}
            <div className="mb-6 flex items-baseline gap-1">
              {plan.monthlyPrice === 0 ? (
                <span className="text-4xl font-bold text-white">Free</span>
              ) : (
                <>
                  <span className="text-2xl font-bold text-white">$</span>
                  <NumberFlow
                    value={isYearly ? plan.yearlyPrice : plan.monthlyPrice}
                    className="text-4xl font-bold text-white tabular-nums"
                  />
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.4)" }}>
                    /{isYearly ? "year" : "month"}
                  </span>
                </>
              )}
            </div>

            {/* CTA button */}
            <button
              className="w-full rounded-xl py-3 text-sm font-bold text-white mb-6 transition-opacity hover:opacity-90"
              style={
                plan.popular
                  ? {
                      background: "#1A56DB",
                      boxShadow: "0 8px 24px rgba(26,86,219,0.4)",
                    }
                  : plan.name === "Cal Business"
                  ? {
                      background: "rgba(126,58,242,0.25)",
                      border: "1px solid rgba(126,58,242,0.5)",
                    }
                  : {
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid rgba(255,255,255,0.15)",
                    }
              }
            >
              {plan.buttonText}
            </button>

            {/* Features */}
            <ul className="flex flex-col gap-3 mb-5">
              {plan.features.map((f) => (
                <li key={f.text} className="flex items-start gap-3">
                  <div
                    className="flex h-7 w-7 items-center justify-center rounded-lg shrink-0 mt-0.5"
                    style={{
                      background: plan.popular
                        ? "rgba(26,86,219,0.2)"
                        : plan.name === "Cal Business"
                        ? "rgba(126,58,242,0.15)"
                        : "rgba(255,255,255,0.06)",
                    }}
                  >
                    <f.icon
                      className="h-3.5 w-3.5"
                      style={{
                        color: plan.popular
                          ? "#60A5FA"
                          : plan.name === "Cal Business"
                          ? "#A78BFA"
                          : "rgba(255,255,255,0.5)",
                      }}
                    />
                  </div>
                  <span className="text-sm" style={{ color: "rgba(255,255,255,0.7)" }}>
                    {f.text}
                  </span>
                </li>
              ))}
            </ul>

            {/* Includes section */}
            {plan.upgrade && (
              <div
                className="mt-auto pt-5"
                style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
              >
                <p className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: "rgba(255,255,255,0.35)" }}>
                  {plan.includes}
                </p>
                <ul className="flex flex-col gap-2">
                  {plan.upgrade.map((item) => (
                    <li key={item} className="flex items-center gap-2.5">
                      <div
                        className="flex h-5 w-5 items-center justify-center rounded-full shrink-0"
                        style={{ background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.3)" }}
                      >
                        <CheckCheck className="h-3 w-3" style={{ color: "#34D399" }} />
                      </div>
                      <span className="text-xs" style={{ color: "rgba(255,255,255,0.5)" }}>
                        {item}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {plan.name === "Cal Free" && (
              <div className="mt-auto pt-5" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
                <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.3)" }}>
                  {plan.includes}
                </p>
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Student discount note */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm mt-10"
        style={{ color: "rgba(255,255,255,0.3)" }}
      >
        🎓 Students get 50% off Cal Pro — verify with your .edu email at checkout.
      </motion.p>
    </div>
  );
}
