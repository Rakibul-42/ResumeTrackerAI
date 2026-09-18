import { motion, useReducedMotion } from "framer-motion";
import {
  TrendingUp,
  Sparkles,
  AlertCircle,
  ArrowRight,
  Check,
  X,
} from "lucide-react";
import AILogo from "@/components/layout/AILogo";

/**
 * Infinite horizontal marquee of "product preview" cards.
 * Renders the card list twice and slides the row from 0% to -50%
 * so the wrap-around is invisible.
 */
export function BrandCardMarquee() {
  const reducedMotion = useReducedMotion();
  const CARDS = [
    AtsScoreCard,
    ScoreEvolutionCard,
    TopIssuesCard,
    RewriteCard,
    KeywordsCard,
    StrengthsCard,
  ];

  const tilts = [-2, 1.5, -1, 2, -1.5, 1];

  return (
    <div
      className="relative w-full overflow-hidden"
      aria-label="Illustrative product previews with sample data"
      style={{
        maskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
        WebkitMaskImage:
          "linear-gradient(to right, transparent 0%, black 6%, black 94%, transparent 100%)",
      }}
    >
      <motion.div
        className="flex gap-5 py-4"
        animate={reducedMotion ? { x: 0 } : { x: ["0%", "-400%"] }}
        transition={{ duration: 55, repeat: Infinity, ease: "linear" }}
      >
        {[...CARDS, ...CARDS].map((Card, i) => (
          <div
            key={i}
            className="shrink-0"
            style={{ transform: `rotate(${tilts[i % tilts.length]}deg)` }}
          >
            <Card />
          </div>
        ))}
      </motion.div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Reusable shell — pure white card with consistent shadow + padding
 * ───────────────────────────────────────────────────────────────────────── */
function PreviewCard({ children, width = 300 }) {
  return (
    <div
      className="bg-[var(--surface)] rounded-3xl p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.45)]"
      style={{ width }}
    >
      {children}
    </div>
  );
}

function Label({ children }) {
  return (
    <div className="text-[10px] uppercase tracking-wider text-[var(--ink-muted)] font-semibold">
      {children}
    </div>
  );
}

function Footer({ subtitle, version }) {
  return (
    <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <AILogo size={24} animated={false} />
        <span className="text-[11px] font-medium text-[var(--ink)]">
          {subtitle || "Resume Tracker"}
        </span>
      </div>
      {version && (
        <span className="text-[10px] text-[var(--ink-muted)] tabular">{version}</span>
      )}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Card 1 — ATS Readiness score
 * ───────────────────────────────────────────────────────────────────────── */
function AtsScoreCard() {
  return (
    <PreviewCard width={300}>
      <div className="flex items-start justify-between mb-4">
        <div>
          <Label>ATS Readiness</Label>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span
              className="text-[42px] font-semibold leading-none text-[var(--ink)]"
              style={{
                fontFamily: '"Geist", "Inter", sans-serif',
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
              }}
            >
              82
            </span>
            <span className="text-sm text-[var(--ink-muted)] font-medium">/ 100</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <TrendingUp size={10} strokeWidth={2.5} />
          +12 pts
        </div>
      </div>

      <div className="relative h-1.5 rounded-full bg-gray-100 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full"
          style={{
            width: "82%",
            background: "linear-gradient(90deg, var(--brand-orange) 0%, var(--brand-brown) 100%)",
          }}
        />
      </div>

      <Footer subtitle="Resume Tracker" version="V3 of 3" />
    </PreviewCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Card 2 — Score Evolution mini chart
 * ───────────────────────────────────────────────────────────────────────── */
function ScoreEvolutionCard() {
  // points along a 240×60 viewBox
  const points = "0,48 60,36 120,24 180,12 240,4";
  const area = "0,60 0,48 60,36 120,24 180,12 240,4 240,60";

  return (
    <PreviewCard width={300}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Label>Score Evolution</Label>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span
              className="text-[28px] font-semibold leading-none text-[var(--ink)]"
              style={{
                fontFamily: '"Geist", "Inter", sans-serif',
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
              }}
            >
              +24
            </span>
            <span className="text-xs text-[var(--ink-muted)]">pts overall</span>
          </div>
        </div>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          V1 → V3
        </div>
      </div>

      <svg
        viewBox="0 0 240 60"
        className="w-full h-[60px]"
        preserveAspectRatio="none"
      >
        <defs>
          <linearGradient id="ev-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--brand-orange)" stopOpacity="0.3" />
            <stop offset="100%" stopColor="var(--brand-orange)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={area} fill="url(#ev-fill)" />
        <polyline
          points={points}
          stroke="var(--brand-brown)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        {[
          [0, 48],
          [60, 36],
          [120, 24],
          [180, 12],
          [240, 4],
        ].map(([x, y], i) => (
          <circle
            key={i}
            cx={x}
            cy={y}
            r="2.5"
            fill="white"
            stroke="var(--brand-brown)"
            strokeWidth="1.5"
          />
        ))}
      </svg>

      <div className="flex items-center justify-between text-[10px] text-[var(--ink-muted)] mt-1 tabular">
        <span>58</span>
        <span>66</span>
        <span>72</span>
        <span>78</span>
        <span className="text-[var(--ink)] font-semibold">82</span>
      </div>

      <Footer subtitle="Trend across versions" />
    </PreviewCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Card 3 — Top Issues
 * ───────────────────────────────────────────────────────────────────────── */
function TopIssuesCard() {
  const issues = [
    { title: "Missing quantified impact", sev: "high" },
    { title: "Generic action verbs", sev: "medium" },
    { title: "No keyword density", sev: "high" },
  ];
  const TONE = {
    high: "bg-[#F8E3E0] text-[#B5564E]",
    medium: "bg-[#FBF1E2] text-[#C28A3A]",
    low: "bg-gray-100 text-[var(--ink-muted)]",
  };

  return (
    <PreviewCard width={320}>
      <div className="flex items-start justify-between mb-4">
        <Label>Critical Issues</Label>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[#F8E3E0] text-[#B5564E]">
          5 found
        </div>
      </div>

      <div className="space-y-2.5">
        {issues.map((iss, i) => (
          <div key={i} className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-xl bg-[var(--surface-2)] flex items-center justify-center text-[var(--ink-muted)] shrink-0">
              <AlertCircle size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[var(--ink)] truncate">
                {iss.title}
              </div>
            </div>
            <span
              className={`text-[9px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded-full ${TONE[iss.sev]}`}
            >
              {iss.sev}
            </span>
          </div>
        ))}
      </div>

      <Footer subtitle="Apply fixes" />
    </PreviewCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Card 4 — Bullet Rewrite
 * ───────────────────────────────────────────────────────────────────────── */
function RewriteCard() {
  return (
    <PreviewCard width={340}>
      <div className="flex items-start justify-between mb-3">
        <Label>AI Rewrite</Label>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          <Sparkles size={10} strokeWidth={2.5} />
          Suggested
        </div>
      </div>

      <div className="space-y-2">
        <div className="rounded-2xl bg-[var(--surface-2)] border border-gray-100 p-3">
          <div className="text-[9px] uppercase tracking-wide text-[var(--ink-muted)] mb-1 font-semibold">
            Original
          </div>
          <div className="text-[12.5px] text-[var(--ink-muted)] leading-snug line-through decoration-gray-300">
            Worked with the team to deliver projects.
          </div>
        </div>

        <div className="flex justify-center text-gray-300">
          <ArrowRight size={14} />
        </div>

        <div className="rounded-2xl bg-[var(--accent-soft)] p-3">
          <div className="text-[9px] uppercase tracking-wide text-[var(--accent-strong)] mb-1 font-semibold">
            Rewritten
          </div>
          <div className="text-[12.5px] text-[var(--ink)] leading-snug">
            Collaborated with the team to deliver projects.
          </div>
        </div>
      </div>

      <Footer subtitle="Bullet improved" />
    </PreviewCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Card 5 — Keywords
 * ───────────────────────────────────────────────────────────────────────── */
function KeywordsCard() {
  const present = ["React", "TypeScript", "Node.js", "GraphQL", "AWS"];
  const missing = ["Kubernetes", "gRPC"];

  return (
    <PreviewCard width={320}>
      <div className="flex items-start justify-between mb-3">
        <div>
          <Label>Keyword Match</Label>
          <div className="flex items-baseline gap-1 mt-1.5">
            <span
              className="text-[28px] font-semibold leading-none text-[var(--ink)]"
              style={{
                fontFamily: '"Geist", "Inter", sans-serif',
                fontVariantNumeric: "tabular-nums",
                letterSpacing: "-0.02em",
              }}
            >
              24
            </span>
            <span className="text-sm text-[var(--ink-muted)]">/ 30 matched</span>
          </div>
        </div>
      </div>

      <div className="space-y-2.5">
        <div className="flex flex-wrap gap-1.5">
          {present.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[var(--accent-soft)] text-[var(--accent-strong)]"
            >
              <Check size={9} strokeWidth={3} />
              {k}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5">
          {missing.map((k) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F8E3E0] text-[#B5564E]"
            >
              <X size={9} strokeWidth={3} />
              {k}
            </span>
          ))}
        </div>
      </div>

      <Footer subtitle="ATS scan" />
    </PreviewCard>
  );
}

/* ─────────────────────────────────────────────────────────────────────────
 * Card 6 — Standout Strengths
 * ───────────────────────────────────────────────────────────────────────── */
function StrengthsCard() {
  const strengths = [
    { title: "Quantified leadership impact" },
    { title: "Strong technical depth signals" },
    { title: "Clean, scannable structure" },
  ];
  return (
    <PreviewCard width={310}>
      <div className="flex items-start justify-between mb-4">
        <Label>Standout Strengths</Label>
        <div className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-semibold bg-[var(--accent-soft)] text-[var(--accent-strong)]">
          5 total
        </div>
      </div>

      <div className="space-y-2.5">
        {strengths.map((s, i) => (
          <div key={i} className="flex items-start gap-3">
            <div className="h-8 w-8 rounded-xl bg-[var(--accent-soft)] flex items-center justify-center text-[var(--accent-strong)] shrink-0">
              <Sparkles size={13} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] font-medium text-[var(--ink)]">
                {s.title}
              </div>
            </div>
          </div>
        ))}
      </div>

      <Footer subtitle="What's working" />
    </PreviewCard>
  );
}
