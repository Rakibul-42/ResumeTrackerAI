import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowRight, Play, Sparkles, ShieldCheck } from "lucide-react";
import { DarkPanel } from "./DarkPanel";
import { HeroDashboardPreview } from "./HeroDashboardPreview";

export function HeroSection() {
  return (
    <section className="relative w-full">
      <DarkPanel
        className="w-full min-h-[760px] lg:min-h-[820px]"
        radius="rounded-b-[40px] sm:rounded-b-[56px]"
      >
        <div
          className="grid grid-cols-1 lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-10 items-center px-6 sm:px-10 lg:px-16 pt-32 sm:pt-36 lg:pt-40 pb-16 lg:pb-24"
          style={{ maxWidth: 1280, marginLeft: "auto", marginRight: "auto" }}
        >
          {/* Copy */}
          <div className="text-white">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/10 backdrop-blur-md"
            >
              <Sparkles size={12} className="text-[var(--brand-cream)]" />
              <span className="text-[11px] tracking-wide text-white/85 uppercase font-semibold">
                AI-assisted resume review
              </span>
            </motion.div>

            <motion.h1
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.05 }}
              className="font-display text-[48px] sm:text-[64px] lg:text-[80px] leading-[0.98] tracking-tight mt-7"
            >
              Review your resume.
              <br />
              <span className="text-white/85">Track every</span>{" "}
              <span
                style={{
                  backgroundImage:
                    "linear-gradient(120deg, var(--brand-cream), #ffd39d)",
                  WebkitBackgroundClip: "text",
                  backgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  color: "transparent",
                }}
              >
                improvement.
              </span>
            </motion.h1>

            <motion.p
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.15 }}
              className="text-white/85 text-base sm:text-lg lg:text-[19px] mt-6 max-w-[540px] leading-relaxed"
            >
              Upload a PDF for AI-assisted feedback, review suggested wording, and compare saved versions. Scores are estimates—not employer ATS results.
            </motion.p>

            <motion.div
              initial={false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.25 }}
              className="flex flex-wrap items-center gap-3 mt-8"
            >
              <Link
                to="/register"
                className="group relative inline-flex items-center gap-2 h-12 px-5 rounded-full font-semibold text-[14px] text-[var(--brand-cream)] shadow-[0_10px_30px_-8px_rgba(192,88,0,0.5)] transition-all hover:shadow-[0_14px_36px_-8px_rgba(192,88,0,0.7)] active:scale-[0.98]"
                style={{
                  background:
                    "linear-gradient(135deg, var(--brand-brown), var(--brand-deep))",
                }}
              >
                <span
                  className="absolute inset-0 rounded-full pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, transparent 50%)",
                  }}
                />
                <span className="relative">Upload your resume</span>
                <ArrowRight size={15} className="relative group-hover:translate-x-0.5 transition-transform" />
              </Link>

              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 h-12 px-5 rounded-full font-medium text-[14px] text-white bg-white/8 border border-white/12 backdrop-blur-md hover:bg-white/12 transition-colors"
              >
                <Play size={13} fill="currentColor" />
                See how it works
              </a>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-8 text-[12px] text-white/85"
            >
              <span className="inline-flex items-center gap-1.5">
                <ShieldCheck size={13} className="text-[var(--brand-orange)]" />
                Text-based PDFs
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-white/30" />
                Review before applying
              </span>
              <span className="inline-flex items-center gap-1.5">
                <span className="h-1 w-1 rounded-full bg-white/30" />
                Your versions, organized
              </span>
            </motion.div>
          </div>

          {/* Visual */}
          <div className="relative">
            <p className="text-sm text-white/85 mb-3">Illustrative preview — sample data, not customer results.</p>
            <HeroDashboardPreview />
          </div>
        </div>
      </DarkPanel>
    </section>
  );
}
