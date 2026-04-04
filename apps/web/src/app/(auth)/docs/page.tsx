"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "motion/react";

const CSS_VARS = `
  :root {
    --doc-bg: #080b14;
    --doc-surface: #0f1420;
    --doc-surface2: #151b2e;
    --doc-border: rgba(255,255,255,0.07);
    --doc-border-accent: rgba(99,102,241,0.4);
    --doc-text: #e2e8f8;
    --doc-text-muted: #6b7a9e;
    --doc-text-dim: #3d4a6b;
    --doc-accent: #6366f1;
    --doc-accent-glow: rgba(99,102,241,0.15);
    --doc-accent2: #a78bfa;
    --doc-gold: #f59e0b;
    --doc-green: #10b981;
    --doc-red: #ef4444;
  }
`;

const SECTIONS = [
  { id: "getting-started", label: "Getting Started", group: "Overview" },
  { id: "daily-briefing", label: "Daily Briefing", group: "Features" },
  { id: "chat-assistant", label: "Chat Assistant", group: "Features" },
  { id: "calendar", label: "Calendar", group: "Features" },
  { id: "tasks", label: "Tasks", group: "Features" },
  { id: "email-hub", label: "Email Hub", group: "Features" },
  { id: "voice", label: "Voice Input", group: "Features" },
  { id: "example-prompts", label: "Example Prompts", group: "Reference" },
  { id: "pricing-plans", label: "Pricing & Plans", group: "Reference" },
  { id: "keyboard-shortcuts", label: "Keyboard Shortcuts", group: "Reference" },
  { id: "troubleshooting", label: "Troubleshooting", group: "Reference" },
  { id: "privacy-security", label: "Privacy & Security", group: "Legal & Trust" },
  { id: "changelog", label: "Changelog", group: "Legal & Trust" },
];

function scrollToSection(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontFamily: "monospace", fontSize: 11, fontWeight: 500, color: "#6366f1", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 10 }}>
      {children}
    </p>
  );
}

function Lead({ children }: { children: React.ReactNode }) {
  return (
    <p style={{ fontSize: 17, color: "#6b7a9e", lineHeight: 1.75, marginBottom: 40, borderLeft: "2px solid #6366f1", paddingLeft: 20 }}>
      {children}
    </p>
  );
}

function Callout({ type, icon, children }: { type: "info" | "warning" | "success"; icon: string; children: React.ReactNode }) {
  const styles = {
    info:    { background: "rgba(99,102,241,0.08)",  border: "1px solid rgba(99,102,241,0.2)" },
    warning: { background: "rgba(245,158,11,0.08)",  border: "1px solid rgba(245,158,11,0.2)" },
    success: { background: "rgba(16,185,129,0.08)",  border: "1px solid rgba(16,185,129,0.2)" },
  }[type];
  return (
    <div style={{ ...styles, borderRadius: 10, padding: "14px 18px", margin: "20px 0", display: "flex", gap: 12, alignItems: "flex-start", fontSize: 13.5, color: "#6b7a9e" }}>
      <span style={{ flexShrink: 0, fontSize: 16 }}>{icon}</span>
      <span>{children}</span>
    </div>
  );
}

function CodeBlock({ label, children }: { label?: string; children: React.ReactNode }) {
  return (
    <div style={{ margin: "16px 0" }}>
      {label && <p style={{ fontFamily: "monospace", fontSize: 10, color: "#3d4a6b", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>{label}</p>}
      <pre style={{ background: "#151b2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "16px 20px", fontFamily: "monospace", fontSize: 13, color: "#a78bfa", lineHeight: 1.7, overflowX: "auto", margin: 0 }}>
        {children}
      </pre>
    </div>
  );
}

function PromptItem({ text }: { text: string }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 12, background: "#0f1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: "10px 14px" }}>
      <span style={{ fontSize: 15, flexShrink: 0 }}>💬</span>
      <span style={{ fontFamily: "monospace", fontSize: 12.5, color: "#e2e8f8", lineHeight: 1.5 }}>"{text}"</span>
    </div>
  );
}

function Step({ num, title, desc }: { num: string; title: string; desc: string }) {
  return (
    <div style={{ display: "flex", gap: 16, marginBottom: 24, position: "relative" }}>
      <div style={{ width: 34, height: 34, borderRadius: "50%", flexShrink: 0, background: "#151b2e", border: "1px solid rgba(99,102,241,0.4)", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "sans-serif", fontSize: 13, fontWeight: 700, color: "#6366f1" }}>
        {num}
      </div>
      <div style={{ paddingTop: 6 }}>
        <p style={{ fontSize: 14, fontWeight: 600, color: "#e2e8f8", marginBottom: 4 }}>{title}</p>
        <p style={{ fontSize: 13.5, color: "#6b7a9e", margin: 0 }}>{desc}</p>
      </div>
    </div>
  );
}

function Card({ icon, title, desc }: { icon: string; title: React.ReactNode; desc: React.ReactNode }) {
  return (
    <div style={{ background: "#0f1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 12, padding: 20 }}>
      <div style={{ fontSize: 22, marginBottom: 10 }}>{icon}</div>
      <p style={{ fontFamily: "sans-serif", fontSize: 14, fontWeight: 600, color: "#e2e8f8", marginBottom: 6 }}>{title}</p>
      <p style={{ fontSize: 13, color: "#6b7a9e", lineHeight: 1.6, margin: 0 }}>{desc}</p>
    </div>
  );
}

function Badge({ tier }: { tier: "free" | "pro" | "business" }) {
  const styles = {
    free:     { background: "rgba(16,185,129,0.12)",  color: "#10b981" },
    pro:      { background: "rgba(99,102,241,0.15)",  color: "#a78bfa" },
    business: { background: "rgba(245,158,11,0.12)",  color: "#f59e0b" },
  }[tier];
  return (
    <span style={{ ...styles, display: "inline-flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600, letterSpacing: "0.04em" }}>
      {tier.charAt(0).toUpperCase() + tier.slice(1)}
    </span>
  );
}

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ border: `1px solid ${open ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`, borderRadius: 10, marginBottom: 10, overflow: "hidden", transition: "border-color 0.2s" }}>
      <div onClick={() => setOpen(!open)} style={{ padding: "14px 18px", fontSize: 14, fontWeight: 500, color: "#e2e8f8", cursor: "pointer", display: "flex", justifyContent: "space-between", alignItems: "center", userSelect: "none" }}>
        {q}
        <span style={{ color: "#6366f1", fontSize: 20, fontWeight: 300, lineHeight: 1 }}>{open ? "−" : "+"}</span>
      </div>
      {open && (
        <div style={{ padding: "0 18px 14px", borderTop: "1px solid rgba(255,255,255,0.07)", paddingTop: 14, fontSize: 13.5, color: "#6b7a9e" }}>
          {a}
        </div>
      )}
    </div>
  );
}

function SectionH2({ children }: { children: React.ReactNode }) {
  return <h2 style={{ fontFamily: "sans-serif", fontSize: 26, fontWeight: 700, color: "#fff", marginBottom: 12, marginTop: 48, letterSpacing: "-0.01em" }}>{children}</h2>;
}
function SectionH3({ children }: { children: React.ReactNode }) {
  return <h3 style={{ fontFamily: "sans-serif", fontSize: 17, fontWeight: 600, color: "#e2e8f8", marginBottom: 8, marginTop: 32 }}>{children}</h3>;
}
function P({ children }: { children: React.ReactNode }) {
  return <p style={{ color: "#6b7a9e", marginBottom: 16 }}>{children}</p>;
}
function Strong({ children }: { children: React.ReactNode }) {
  return <strong style={{ color: "#e2e8f8", fontWeight: 500 }}>{children}</strong>;
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState("getting-started");
  const [searchQuery, setSearchQuery] = useState("");
  const mainRef = useRef<HTMLDivElement>(null);

  // Scrollspy
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        }
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );
    SECTIONS.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  const filteredSections = SECTIONS.filter((s) =>
    searchQuery === "" || s.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const groups = [...new Set(SECTIONS.map((s) => s.group))];

  return (
    <>
      <style>{CSS_VARS}</style>
      <div style={{ background: "#080b14", color: "#e2e8f8", fontFamily: "'DM Sans', -apple-system, sans-serif", fontSize: 15, lineHeight: 1.7, minHeight: "100vh" }}>

        {/* ── TOP NAV ── */}
        <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, height: 56, background: "rgba(8,11,20,0.9)", backdropFilter: "blur(16px)", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", padding: "0 24px", gap: 20 }}>
          <a href="/login" style={{ display: "flex", alignItems: "center", gap: 10, fontWeight: 700, fontSize: 16, color: "#e2e8f8", textDecoration: "none", marginRight: "auto" }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: "#6366f1", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 800, color: "#fff" }}>CA</div>
            CalAssist
          </a>
          {[
            { label: "Features", href: "/login#features" },
            { label: "Pricing", href: "/login" },
            { label: "Docs", href: "/docs" },
          ].map(({ label, href }) => (
            <a key={label} href={href} style={{ color: label === "Docs" ? "#a78bfa" : "#6b7a9e", textDecoration: "none", fontSize: 13, fontWeight: 500 }}>{label}</a>
          ))}
          <a href="/login" style={{ background: "#6366f1", color: "#fff", padding: "6px 16px", borderRadius: 8, fontSize: 13, textDecoration: "none", fontWeight: 500 }}>Sign In</a>
        </nav>

        <div style={{ display: "flex", paddingTop: 56, minHeight: "100vh" }}>

          {/* ── SIDEBAR ── */}
          <aside style={{ width: 268, position: "fixed", top: 56, left: 0, bottom: 0, overflowY: "auto", borderRight: "1px solid rgba(255,255,255,0.07)", padding: "28px 0 40px", background: "#080b14" }}>
            {/* Search */}
            <div style={{ margin: "0 16px 24px", position: "relative" }}>
              <span style={{ position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)", color: "#3d4a6b", fontSize: 13 }}>⌕</span>
              <input
                type="text"
                placeholder="Search docs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ width: "100%", background: "#0f1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "8px 12px 8px 32px", color: "#e2e8f8", fontSize: 13, fontFamily: "inherit", outline: "none" }}
              />
            </div>

            {/* Nav groups */}
            {groups.map((group) => {
              const items = filteredSections.filter((s) => s.group === group);
              if (!items.length) return null;
              return (
                <div key={group} style={{ marginBottom: 8 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase", color: "#3d4a6b", padding: "8px 20px 6px" }}>{group}</p>
                  {items.map(({ id, label }) => (
                    <button
                      key={id}
                      onClick={() => scrollToSection(id)}
                      style={{
                        display: "flex", alignItems: "center", gap: 8,
                        padding: "7px 20px", width: "100%", textAlign: "left",
                        color: activeSection === id ? "#a78bfa" : "#6b7a9e",
                        background: activeSection === id ? "rgba(99,102,241,0.15)" : "transparent",
                        border: "none", borderLeft: activeSection === id ? "2px solid #6366f1" : "2px solid transparent",
                        fontSize: 13.5, fontWeight: activeSection === id ? 500 : 400,
                        cursor: "pointer", transition: "color 0.15s, background 0.15s",
                        fontFamily: "inherit",
                      }}
                    >
                      <span style={{ width: 5, height: 5, borderRadius: "50%", background: "currentColor", opacity: 0.5, flexShrink: 0 }} />
                      {label}
                    </button>
                  ))}
                </div>
              );
            })}
          </aside>

          {/* ── MAIN ── */}
          <main ref={mainRef} style={{ marginLeft: 268, flex: 1, maxWidth: 820, padding: "56px 64px 120px" }}>

            {/* ── GETTING STARTED ── */}
            <motion.div id="getting-started" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} style={{ marginBottom: 88, paddingBottom: 40, borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
              <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.4)", borderRadius: 20, padding: "4px 12px", fontFamily: "monospace", fontSize: 11, color: "#a78bfa", marginBottom: 20 }}>
                <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#6366f1", animation: "pulse 2s infinite" }} />
                Documentation v1.0
              </div>
              <Eyebrow>Getting Started</Eyebrow>
              <h1 style={{ fontFamily: "sans-serif", fontSize: 38, fontWeight: 800, lineHeight: 1.15, color: "#fff", marginBottom: 16, letterSpacing: "-0.02em" }}>Welcome to Cal Assist</h1>
              <Lead>Cal Assist is your AI-powered personal assistant built on top of Google. It handles your calendar, tasks, emails, and daily briefing — all through natural conversation. This guide will get you up and running in minutes.</Lead>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "24px 0" }}>
                <Card icon="⚡" title="Quick Setup" desc="Connect your Google account and start managing your day in under 5 minutes." />
                <Card icon="🎯" title="Example Prompts" desc="Not sure what to say? Browse ready-to-use prompts for every feature." />
                <Card icon="🔒" title="Privacy First" desc="Your data stays in your Google account. Cal never stores your emails or events." />
                <Card icon="🎮" title="Gamified Tasks" desc="Earn XP, level up, and build streaks as you complete your daily tasks." />
              </div>

              <SectionH2>How to Create an Account</SectionH2>
              <div style={{ margin: "24px 0" }}>
                <Step num="1" title="Visit cal-assist.app and click Sign In" desc="You'll be taken to the authentication screen. No email or password needed — Cal Assist uses Google Sign-In exclusively." />
                <Step num="2" title="Sign in with your Google account" desc="Choose the Google account you want to connect. This should be the account where your calendar and email live." />
                <Step num="3" title="Grant the required permissions" desc="Cal will ask for access to Google Calendar and Google Tasks. These are required for core features. Gmail access is optional and only needed for the Email Hub." />
                <Step num="4" title="You're in — say hi to Cal" desc='Your dashboard loads immediately. Head to the Chat tab and try your first prompt: "What do I have today?" and Cal will pull your calendar events instantly.' />
              </div>

              <Callout type="info" icon="💡">
                <Strong>First time tip:</Strong> After signing in, check the Daily Briefing tab. If you have events on your Google Calendar already, Cal will surface them there immediately with no extra setup needed.
              </Callout>

              <SectionH2>Frequently Asked Questions</SectionH2>
              <FaqItem q="Does Cal Assist work without a Google account?" a="No — Cal Assist is built on the Google ecosystem. You need a Google account to use it. This is intentional: your data stays in Google's servers rather than ours, which is better for your privacy." />
              <FaqItem q="Which browsers are supported?" a="Cal Assist works best in Chrome and Edge. Firefox and Safari are supported for all features except voice input, which requires Chrome or Edge due to Web Speech API availability." />
              <FaqItem q="Is there a mobile app?" a="Not yet — Cal Assist is currently a web application that works on mobile browsers. A dedicated iOS and Android app is on the roadmap." />
              <FaqItem q="Can I use Cal Assist with a work Google account?" a="Yes. Cal Assist works with both personal Gmail accounts and Google Workspace accounts used at work or school. Some organizations have restrictions on third-party app access — check with your IT administrator if you have trouble connecting." />
            </motion.div>

            {/* ── DAILY BRIEFING ── */}
            <div id="daily-briefing" style={{ marginBottom: 88 }}>
              <Eyebrow>Features</Eyebrow>
              <SectionH2>☀️ Daily Briefing</SectionH2>
              <Lead>The Daily Briefing tab is the first thing you see when you open Cal Assist. It's your personalized morning newspaper — a single view that tells you everything important about your day before you've even had your coffee.</Lead>

              <SectionH3>What's in the Briefing</SectionH3>
              <P>Every morning Cal pulls your Google Calendar events, tasks due today from Google Tasks, and unread email count from Gmail and weaves them into a single cohesive briefing. The tab is organized into five sections:</P>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14, margin: "24px 0" }}>
                <Card icon="🌅" title="Hero Header" desc="Time-aware greeting, today's date, current weather, and a one-line AI-generated summary of your day's theme." />
                <Card icon="📊" title="Live Stats Row" desc="Four at-a-glance chips: unread emails, tasks due today, next upcoming event, and your current streak." />
                <Card icon="🗓️" title="Week at a Glance" desc="A 7-day strip showing events and tasks per day. Tap any day to preview its schedule without leaving the briefing." />
                <Card icon="⏱️" title="Today's Agenda Timeline" desc="A visual vertical timeline of today's events with free time blocks explicitly shown and a live current-time indicator." />
                <Card icon="🎯" title="Priority Targets" desc="Must Do Today, This Week's Goal, and your Momentum card showing streak and productivity trends." />
                <Card icon="✉️" title={<>Email Snapshot <Badge tier="pro" /></>} desc="The 3 most important unread emails as one-line summaries. Tap to jump to the full Email Hub." />
              </div>

              <SectionH3>When Does It Update?</SectionH3>
              <P>The briefing is generated fresh every morning at 8am. You can customize this time in <Strong>Settings → Notifications → Daily Briefing Time</Strong>. The live stats chips and timeline update in real time throughout the day as you add events, complete tasks, and receive emails.</P>

              <Callout type="warning" icon="⚠️">
                The Email Snapshot section in the Daily Briefing requires Gmail access. If you haven't connected Gmail, this section will show a prompt to connect your email instead.
              </Callout>
            </div>

            {/* ── CHAT ASSISTANT ── */}
            <div id="chat-assistant" style={{ marginBottom: 88 }}>
              <Eyebrow>Features</Eyebrow>
              <SectionH2>💬 Chat Assistant</SectionH2>
              <Lead>The Chat tab is the universal control layer for everything in Cal Assist. Instead of clicking through menus and forms, you just talk to Cal naturally and it figures out what you need.</Lead>

              <SectionH3>How Cal Understands You</SectionH3>
              <P>Every message you send passes through an intent detection system before anything happens. Cal reads your message and identifies what you're trying to do — schedule an event, create a task, summarize an email, or just have a conversation. Based on that detection it routes your request to the right feature automatically.</P>

              <CodeBlock label="What Cal can understand">
{`"Schedule a team sync tomorrow at 3pm"  →  Creates calendar event
"I need to finish the report by Friday"  →  Creates a task
"Summarize my unread emails"             →  Opens email summarizer
"What do I have this week?"              →  Shows weekly agenda
"How am I doing on my tasks?"            →  Shows XP and streak stats`}
              </CodeBlock>

              <SectionH3>Chat History</SectionH3>
              <P>Cal remembers the context of your conversation within a session. You can follow up naturally — if you just created an event you can say "actually make it an hour longer" and Cal knows which event you mean without you having to repeat yourself.</P>

              <Callout type="info" icon="💡">
                Free accounts get <Strong>30 AI messages per day</Strong>. Pro and Business accounts get unlimited messages. Your message count resets at midnight in your local timezone.
              </Callout>
            </div>

            {/* ── CALENDAR ── */}
            <div id="calendar" style={{ marginBottom: 88 }}>
              <Eyebrow>Features</Eyebrow>
              <SectionH2>📅 Calendar</SectionH2>
              <Lead>The Calendar tab shows your Google Calendar inside Cal Assist and lets you create, view, and manage events entirely through conversation — no clicking on time slots or filling out event forms required.</Lead>

              <SectionH3>Creating Events Through Chat</SectionH3>
              <P>Just describe your event naturally in the chat. Cal will extract the title, date, time, and duration and create the event in your Google Calendar immediately. The event syncs to all your devices because it lives in your actual Google account.</P>

              <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "20px 0" }}>
                {["Dentist appointment next Tuesday at 10am for an hour", "Block 2 hours tomorrow morning for deep work", "Team standup every Monday at 9am", "Lunch with Sarah this Friday at noon, about 90 minutes"].map(t => <PromptItem key={t} text={t} />)}
              </div>

              <SectionH3>Viewing Your Calendar</SectionH3>
              <P>Switch between Day, Week, and Month views using the buttons in the top right of the Calendar tab. You can also ask Cal directly — <Strong>"What do I have on Thursday?"</Strong> — and Cal will summarize that day's events in the chat without navigating the calendar view at all.</P>

              <SectionH3>Clicking a Day</SectionH3>
              <P>Clicking any day cell in Month or Week view jumps you to the Day view for that date, showing its full schedule. To create a new event, click the <Strong>+</Strong> button that appears on hover over any day cell.</P>
            </div>

            {/* ── TASKS ── */}
            <div id="tasks" style={{ marginBottom: 88 }}>
              <Eyebrow>Features</Eyebrow>
              <SectionH2>✅ Tasks</SectionH2>
              <Lead>The Tasks tab is a gamified productivity dashboard that makes completing tasks feel genuinely rewarding. Every task gives you XP, builds your streak, and levels up your profile.</Lead>

              <SectionH3>The XP System</SectionH3>
              <P>Every task you complete earns XP based on its priority level. As you accumulate XP your level increases and your title upgrades from Rookie all the way to Legend.</P>
              <CodeBlock>
{`🔴 High Priority task    →  +50 XP
🟡 Medium Priority task  →  +30 XP
🟢 Low Priority task     →  +10 XP`}
              </CodeBlock>

              <SectionH3>The Three Columns</SectionH3>
              <P>Tasks are organized into three swim lanes. <Strong>Do Today</Strong> contains tasks due today. <Strong>Up Next</Strong> contains tasks due in the next 7 days. <Strong>Someday</Strong> is your low-priority backlog. Tasks move between columns automatically as their due dates approach.</P>

              <SectionH3>Lazy Mode</SectionH3>
              <P>On overwhelming days tap the <Strong>Lazy Mode</Strong> button. Cal collapses everything down to just your 3 most important tasks with the message "Just these 3. That's it. You got this." Exit anytime by tapping again.</P>

              <SectionH3>Focus Timer</SectionH3>
              <P>Each task card has a timer icon that lets you set a Pomodoro-style focus session. Choose from preset durations (5m, 15m, 25m 🍅, 30m, 1h) or enter a custom time. The timer displays as a live countdown inside the card while running.</P>

              <SectionH3>Wins Wall</SectionH3>
              <P>Every completed task is logged at the bottom of the Tasks tab in the Wins Wall — a running trophy log showing what you accomplished and how much XP you earned. It resets weekly.</P>

              <Callout type="success" icon="🎉">
                Complete all your tasks for the day and Cal plays a full celebration animation. Completing tasks back-to-back triggers an <Strong>On a Roll</Strong> combo banner with an XP multiplier.
              </Callout>
            </div>

            {/* ── EMAIL HUB ── */}
            <div id="email-hub" style={{ marginBottom: 88 }}>
              <Eyebrow>Features · <Badge tier="pro" /></Eyebrow>
              <SectionH2>✉️ Email Hub</SectionH2>
              <Lead>The Email Hub brings your Gmail inbox into Cal Assist and lets you read, summarize, draft, and clean up emails without ever opening Gmail directly. Cal handles the noise so you only deal with what matters.</Lead>

              <Callout type="warning" icon="🔒">
                Email Hub requires Gmail access. Cal asks for <code style={{ background: "#151b2e", padding: "2px 6px", borderRadius: 4, fontSize: 12, color: "#a78bfa" }}>gmail.readonly</code> and <code style={{ background: "#151b2e", padding: "2px 6px", borderRadius: 4, fontSize: 12, color: "#a78bfa" }}>gmail.modify</code> permissions. You can review and revoke these at any time from <Strong>Settings → Account & Privacy → Connected Accounts</Strong>.
              </Callout>

              <SectionH3>Inbox Summarizer</SectionH3>
              <P>Each email card shows the sender, a color-coded urgency dot (red for urgent, amber for needs reply, grey for informational), and a one-line AI-generated summary. Tap any card to see the full summary with Cal's assessment of whether it needs a reply and any deadlines mentioned.</P>

              <SectionH3>Summarize All</SectionH3>
              <P>Tap <Strong>Summarize All</Strong> to run all your unread emails through Cal at once. Cal groups them into: Urgent, Needs Reply, Informational, Newsletters, and Promotions — ranked from most to least important. This single action can replace 20 minutes of inbox scanning every morning.</P>

              <SectionH3>Deleting & Archiving</SectionH3>
              <P>Deleting an email moves it to Gmail trash — recoverable within 30 days. After confirming deletion a 10-second undo option appears. Newsletters and Promotions categories each have a <Strong>Clear All</Strong> button for bulk cleanup with a confirmation step.</P>

              <SectionH3>Email Composer</SectionH3>
              <div style={{ margin: "20px 0" }}>
                <Step num="AI" title="AI Assist Mode" desc='Describe what you want to write in plain English. Cal drafts the email with a subject line pre-filled. Use the Refine input to tweak — "make it shorter" or "add that I&apos;m available Thursday" — before sending.' />
                <Step num="✏️" title="Manual Mode" desc="A clean To, Subject, Body composer for when you want to write yourself. No AI involvement unless you ask for it." />
              </div>

              <Callout type="info" icon="🛡️">
                <Strong>Cal never sends email automatically.</Strong> Every email goes through a review step where you can read, edit, and choose to send. The Send button is always the last action.
              </Callout>
            </div>

            {/* ── VOICE ── */}
            <div id="voice" style={{ marginBottom: 88 }}>
              <Eyebrow>Features · <Badge tier="pro" /></Eyebrow>
              <SectionH2>🎙️ Voice Input</SectionH2>
              <Lead>Voice input lets you speak to Cal instead of typing. Everything you can do through the chat works identically through voice.</Lead>

              <SectionH3>How to Use Voice Input</SectionH3>
              <div style={{ margin: "20px 0" }}>
                <Step num="1" title="Click the microphone button in the chat input" desc="The button turns red and pulses to indicate Cal is listening. Your browser may ask for microphone permission the first time — click Allow." />
                <Step num="2" title="Speak your prompt naturally" desc='Talk exactly as you would type. "Schedule a meeting with the team tomorrow at 2pm" works just as well spoken as typed.' />
                <Step num="3" title="Cal transcribes and responds" desc="Your speech is converted to text using the Web Speech API and sent through the same pipeline as typed messages. The response appears in the chat." />
              </div>

              <SectionH3>Browser Support</SectionH3>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
                <thead>
                  <tr>
                    {["Browser", "Voice Input", "Notes"].map(h => (
                      <th key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3d4a6b", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["Chrome", "✅ Full support", "Recommended browser for voice"],
                    ["Edge", "✅ Full support", "Works identically to Chrome"],
                    ["Firefox", "❌ Not supported", "Web Speech API not available"],
                    ["Safari", "⚠️ Partial", "May work on macOS, unreliable on iOS"],
                  ].map(([browser, support, note]) => (
                    <tr key={browser}>
                      <td style={{ padding: "12px 14px", fontSize: 13.5, color: "#a78bfa", borderBottom: "1px solid rgba(255,255,255,0.07)", fontFamily: "monospace" }}>{browser}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13.5, color: "#6b7a9e", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{support}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13.5, color: "#6b7a9e", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{note}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Callout type="info" icon="💡">
                Voice input is available on <Strong>Cal Pro and Business</Strong> plans. Free users can see the microphone button but will be prompted to upgrade when tapping it.
              </Callout>
            </div>

            <div style={{ height: 1, background: "rgba(255,255,255,0.07)", margin: "48px 0" }} />

            {/* ── EXAMPLE PROMPTS ── */}
            <div id="example-prompts" style={{ marginBottom: 88 }}>
              <Eyebrow>Reference</Eyebrow>
              <SectionH2>💬 Example Prompts</SectionH2>
              <Lead>Not sure what to say to Cal? Here's a curated list of prompts organized by feature. Use these exactly as written or adapt them to your situation.</Lead>

              {[
                { heading: "📅 Calendar", prompts: ["Schedule a dentist appointment next Tuesday at 10am for 1 hour", "Block tomorrow afternoon for deep work, 2 to 5pm", "What do I have on Friday?", "Am I free on Thursday morning?", "Move my 3pm meeting to 4pm", "Show me my schedule for next week"] },
                { heading: "✅ Tasks", prompts: ["I need to finish the budget report by end of day Friday, high priority", "Add a task to call the client tomorrow morning", "What are my most important tasks today?", "How many tasks do I have left this week?", "Mark the report task as done", "What's my current streak and level?"] },
                { heading: "✉️ Email", prompts: ["Summarize my unread emails", "Which emails need a reply?", "Draft a follow up to a client I haven't heard from in a week", "Write a professional apology email to my professor", "Draft a thank you email after a job interview", "Write a cold outreach email to a potential client, keep it short"] },
                { heading: "☀️ Daily Briefing", prompts: ["Give me my morning briefing", "What's most important for me to do today?", "How does my week look?", "What's my productivity summary this week?"] },
              ].map(({ heading, prompts }) => (
                <div key={heading}>
                  <SectionH3>{heading}</SectionH3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8, margin: "16px 0 32px" }}>
                    {prompts.map(p => <PromptItem key={p} text={p} />)}
                  </div>
                </div>
              ))}
            </div>

            {/* ── PRICING ── */}
            <div id="pricing-plans" style={{ marginBottom: 88 }}>
              <Eyebrow>Reference</Eyebrow>
              <SectionH2>💰 Pricing & Plans</SectionH2>
              <Lead>Cal Assist is free to get started with no credit card required. Pro and Business plans unlock advanced features for power users and small business owners.</Lead>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 14, margin: "28px 0" }}>
                {[
                  { tier: "Free", price: "$0", period: "/ forever", desc: "For students and casual users who want a smarter daily routine.", featured: false, features: ["Full Tasks dashboard + gamification", "Google Calendar integration", "Google Tasks integration", "Simplified Daily Briefing", "Basic chat assistant", "30 AI messages per day", "3 Meeting Notes per month", "2 themes (Midnight + Monochrome)"] },
                  { tier: "Pro", price: "$6.99", period: "/ month", desc: "For professionals and students who want Cal to run their full day.", featured: true, features: ["Everything in Free", "Full Daily Briefing with email snapshot", "Full Email Hub — summarize, draft, delete", "Unlimited AI messages", "Voice input via microphone", "Unlimited Meeting Notes", "All 8 themes + custom color picker", "Full notification controls", "Priority email support"] },
                  { tier: "Business", price: "$14.99", period: "/ month", desc: "For freelancers and small business owners where time equals money.", featured: false, features: ["Everything in Pro", "Multiple Google account connections", "Google Sheets integration", "Lightweight contact manager", "Advanced email templates", "Weekly productivity reports", "Custom Cal name and personality", "Priority AI processing"] },
                ].map(({ tier, price, period, desc, featured, features }) => (
                  <div key={tier} style={{ background: featured ? "linear-gradient(145deg, rgba(99,102,241,0.08), #0f1420)" : "#0f1420", border: featured ? "1px solid #6366f1" : "1px solid rgba(255,255,255,0.07)", borderRadius: 14, padding: "24px 20px", position: "relative" }}>
                    {featured && <div style={{ position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)", background: "#6366f1", color: "#fff", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20, letterSpacing: "0.06em", textTransform: "uppercase" }}>Most Popular</div>}
                    <p style={{ fontSize: 13, fontWeight: 700, color: "#6b7a9e", letterSpacing: "0.06em", textTransform: "uppercase", marginBottom: 8 }}>{tier}</p>
                    <p style={{ fontSize: 32, fontWeight: 800, color: "#fff", marginBottom: 4 }}>{price} <span style={{ fontSize: 14, color: "#6b7a9e", fontWeight: 400 }}>{period}</span></p>
                    <p style={{ fontSize: 12.5, color: "#6b7a9e", marginBottom: 20 }}>{desc}</p>
                    <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                      {features.map(f => (
                        <li key={f} style={{ fontSize: 13, color: "#6b7a9e", padding: "5px 0", display: "flex", gap: 8, alignItems: "flex-start", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                          <span style={{ color: "#10b981", flexShrink: 0, fontWeight: 600 }}>✓</span>{f}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              <Callout type="success" icon="🎓">
                <Strong>Student discount:</Strong> Verified students get 50% off the Pro plan — $3.49/month. Contact us with your .edu email address to claim this discount.
              </Callout>

              <SectionH3>Free Trial</SectionH3>
              <P>New users get a <Strong>30-day free trial of Cal Pro</Strong> with no credit card required. At the end of 30 days you can choose to subscribe or automatically drop to the Free plan.</P>
            </div>

            {/* ── KEYBOARD SHORTCUTS ── */}
            <div id="keyboard-shortcuts" style={{ marginBottom: 88 }}>
              <Eyebrow>Reference</Eyebrow>
              <SectionH2>⌨️ Keyboard Shortcuts</SectionH2>
              <Lead>Cal Assist supports keyboard shortcuts for faster navigation. All shortcuts work when the chat input is not focused.</Lead>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, margin: "20px 0" }}>
                {[
                  { desc: "Open Chat", keys: ["G", "C"] }, { desc: "Open Calendar", keys: ["G", "K"] },
                  { desc: "Open Tasks", keys: ["G", "T"] }, { desc: "Open Daily Briefing", keys: ["G", "B"] },
                  { desc: "Open Email Hub", keys: ["G", "E"] }, { desc: "Focus Chat Input", keys: ["/"] },
                  { desc: "Toggle Lazy Mode", keys: ["L"] }, { desc: "Toggle Voice Input", keys: ["V"] },
                  { desc: "Open Settings", keys: ["⌘", ","] }, { desc: "Search Docs", keys: ["⌘", "K"] },
                ].map(({ desc, keys }) => (
                  <div key={desc} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0f1420", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8, padding: "10px 14px" }}>
                    <span style={{ fontSize: 13, color: "#6b7a9e" }}>{desc}</span>
                    <div style={{ display: "flex", gap: 4 }}>
                      {keys.map(k => (
                        <span key={k} style={{ background: "#151b2e", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 5, padding: "2px 8px", fontFamily: "monospace", fontSize: 11, color: "#e2e8f8", boxShadow: "0 2px 0 rgba(255,255,255,0.07)" }}>{k}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── TROUBLESHOOTING ── */}
            <div id="troubleshooting" style={{ marginBottom: 88 }}>
              <Eyebrow>Reference</Eyebrow>
              <SectionH2>🛠️ Troubleshooting</SectionH2>
              <Lead>Running into an issue? Most problems have quick fixes. Here are the most common ones.</Lead>

              <FaqItem q="Google Calendar events aren't showing up in Cal" a="Go to Settings → Account & Privacy → Connected Accounts and tap Re-authorize Google Calendar. If the issue persists, sign out and sign back in — this refreshes all Google API tokens." />
              <FaqItem q="The Email Hub says 'Gmail not connected'" a="Gmail access is separate from Calendar access. Go to Settings → Account & Privacy and tap Connect Gmail. You'll be taken to a Google permission screen — make sure to check both the read and modify checkboxes." />
              <FaqItem q="Voice input button is greyed out" a="Voice input requires Chrome or Edge. If you're on a supported browser, make sure Cal Assist has microphone permission in your browser settings. In Chrome: Settings → Privacy & Security → Site Settings → Microphone." />
              <FaqItem q="Cal created an event on the wrong date" a="Cal interprets relative dates like 'next Tuesday' based on your local timezone. If the timezone in your Google account settings does not match your actual location, events may land on unexpected dates. Verify your timezone at myaccount.google.com." />
              <FaqItem q="I hit the 30 message daily limit too fast" a="The 30 message limit on the Free plan resets at midnight in your local timezone. Upgrade to Cal Pro for unlimited messages. Alternatively, batch your requests — asking 'what do I have this week and create a task to review Q2 report by Friday' counts as one message." />
              <FaqItem q="Tasks aren't syncing to Google Tasks" a="Cal creates tasks in Google Tasks by default. Check that Google Tasks access is enabled in Settings → Account & Privacy. Also verify you're looking at the correct task list in Google Tasks — Cal creates tasks in your default 'My Tasks' list." />
            </div>

            {/* ── PRIVACY & SECURITY ── */}
            <div id="privacy-security" style={{ marginBottom: 88 }}>
              <Eyebrow>Legal & Trust</Eyebrow>
              <SectionH2>🔒 Privacy & Security</SectionH2>
              <Lead>Your data belongs to you and stays in your Google account. Cal Assist is designed from the ground up to minimize what it touches and to give you full visibility and control.</Lead>

              <SectionH3>What Cal Stores</SectionH3>
              <P>Cal Assist stores only the minimum data needed to run your account: your Google account ID (not your email), your plan tier and billing status, your settings preferences, and your task XP and streak data. Cal does <Strong>not</Strong> store your calendar events, email content, or task titles on its own servers.</P>

              <SectionH3>Google API Permissions</SectionH3>
              <table style={{ width: "100%", borderCollapse: "collapse", margin: "20px 0" }}>
                <thead>
                  <tr>
                    {["Permission", "Why It's Needed", "Required"].map(h => (
                      <th key={h} style={{ fontSize: 11, fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "#3d4a6b", padding: "10px 14px", textAlign: "left", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    ["calendar.events", "Read and write calendar events", "Yes"],
                    ["tasks", "Read and write Google Tasks", "Yes"],
                    ["gmail.readonly", "Read email summaries for Briefing and Email Hub", "No (Pro)"],
                    ["gmail.modify", "Archive and delete emails from Email Hub", "No (Pro)"],
                    ["gmail.send", "Send emails drafted in Email Hub", "No (Pro)"],
                  ].map(([perm, reason, required]) => (
                    <tr key={perm}>
                      <td style={{ padding: "12px 14px", fontFamily: "monospace", fontSize: 12, color: "#a78bfa", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{perm}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13.5, color: "#6b7a9e", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>{reason}</td>
                      <td style={{ padding: "12px 14px", fontSize: 13.5, color: required === "Yes" ? "#10b981" : "#f59e0b", borderBottom: "1px solid rgba(255,255,255,0.07)", fontWeight: 500 }}>{required}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <Callout type="success" icon="✅">
                You can revoke any Google permission at any time from <a href="https://myaccount.google.com/permissions" style={{ color: "#a78bfa" }}>myaccount.google.com/permissions</a>. Revoking calendar access will disable event creation; revoking Gmail access will disable the Email Hub. Your account and tasks data remain intact.
              </Callout>
            </div>

            {/* ── CHANGELOG ── */}
            <div id="changelog" style={{ marginBottom: 88 }}>
              <Eyebrow>Legal & Trust</Eyebrow>
              <SectionH2>📋 Changelog</SectionH2>
              <Lead>A running log of what's shipped, what's improved, and what's been fixed in Cal Assist.</Lead>

              {[
                { date: "Apr 2025", title: "v1.0 — Initial Launch", desc: "Core release: Chat assistant, Google Calendar & Tasks sync, Daily Briefing, Tasks with XP system, Settings panel with 8 themes.", tags: ["new", "new", "new"] },
                { date: "Apr 2025", title: "Email Hub + Voice Input", desc: "Pro tier features ship: Gmail integration, Email Summarizer, one-click deletion, email composer, voice input via Web Speech API.", tags: ["new", "new"] },
                { date: "Apr 2025", title: "Landing Page Redesign", desc: "New dark-themed landing page with ContainerScroll animation, feature grid, integrations dock, and two-column demo section.", tags: ["improved"] },
                { date: "Mar 2025", title: "Settings System", desc: "Full settings panel with 8 themes (live CSS var switching), font scaling, card styles, sidebar styles, XP customization, and notification controls.", tags: ["new", "improved"] },
                { date: "Mar 2025", title: "Calendar Day Navigation", desc: "Clicking a day in Month view now navigates to Day view. The + button creates new events without navigating away.", tags: ["improved", "fix"] },
              ].map(({ date, title, desc, tags }) => (
                <div key={title} style={{ display: "flex", gap: 20, marginBottom: 28, position: "relative" }}>
                  <p style={{ fontFamily: "monospace", fontSize: 11, color: "#3d4a6b", width: 70, flexShrink: 0, paddingTop: 3, lineHeight: 1.4 }}>{date}</p>
                  <div style={{ width: 10, height: 10, borderRadius: "50%", background: "#6366f1", flexShrink: 0, marginTop: 6, boxShadow: "0 0 0 3px rgba(99,102,241,0.15)" }} />
                  <div>
                    <p style={{ fontSize: 15, fontWeight: 600, color: "#e2e8f8", marginBottom: 6 }}>{title}</p>
                    <p style={{ fontSize: 13.5, color: "#6b7a9e", margin: "0 0 8px" }}>{desc}</p>
                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                      {tags.map((t, i) => (
                        <span key={i} style={{
                          fontSize: 11, padding: "2px 8px", borderRadius: 20, fontWeight: 600, letterSpacing: "0.04em",
                          ...(t === "new" ? { background: "rgba(99,102,241,0.15)", color: "#a78bfa" } :
                             t === "improved" ? { background: "rgba(16,185,129,0.12)", color: "#10b981" } :
                             { background: "rgba(245,158,11,0.12)", color: "#f59e0b" })
                        }}>
                          {t === "new" ? "New" : t === "improved" ? "Improved" : "Fix"}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </main>
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        .docs-sidebar-btn:hover {
          color: #e2e8f8 !important;
          background: rgba(99,102,241,0.1) !important;
        }
        @media (max-width: 900px) {
          aside { display: none !important; }
          main { margin-left: 0 !important; padding: 32px 24px 80px !important; }
        }
      `}</style>
    </>
  );
}
