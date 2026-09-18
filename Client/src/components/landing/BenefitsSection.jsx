import { motion } from "framer-motion";
import {
  PhoneCall,
  ShieldCheck,
  Zap,
  Search,
  Sparkles,
} from "lucide-react";
import { SectionHeader } from "./FeaturesSection";

const BENEFITS = [
  {
    icon: PhoneCall,
    title: "Keep your work organized",
    desc: "Save versions so you can revisit wording and compare changes.",
  },
  {
    icon: ShieldCheck,
    title: "Review structure and clarity",
    desc: "Get AI feedback on your resume. Actual employer systems may evaluate it differently.",
  },
  {
    icon: Sparkles,
    title: "Keep your experience truthful",
    desc: "Review wording suggestions without inventing qualifications or results.",
  },
  {
    icon: Zap,
    title: "Choose changes deliberately",
    desc: "Apply selected suggestions to a new version while preserving the original.",
  },
  {
    icon: Search,
    title: "Match the right keywords",
    desc: "Explore suggested keywords for a target role. Include only skills you actually have.",
  },
];

export function BenefitsSection() {
  return (
    <section
      className="px-3 sm:px-6 mt-28 sm:mt-36"
      style={{ maxWidth: 1240, marginLeft: "auto", marginRight: "auto" }}
    >
      <SectionHeader
        eyebrow="Your workflow"
        title={<>A clearer view of your resume.</>}
        sub="Tools to support your own review and judgment."
      />

      <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 sm:gap-5">
        {BENEFITS.map((b, i) => (
          <motion.div
            key={b.title}
            initial={{ opacity: 0, y: 14 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5, delay: i * 0.05 }}
            className={`rounded-[22px] bg-[var(--surface)] border border-[var(--border)] shadow-card hover:shadow-hover transition-all p-5 sm:p-6 ${
              i === 0 ? "lg:col-span-3" : i === 1 ? "lg:col-span-3" : "lg:col-span-2"
            }`}
          >
            <div className="h-10 w-10 rounded-2xl bg-[var(--accent-soft)] text-[var(--accent-strong)] flex items-center justify-center mb-4">
              <b.icon size={16} strokeWidth={2.25} />
            </div>
            <h3 className="font-display text-[17px] font-semibold tracking-tight text-[var(--ink)]">
              {b.title}
            </h3>
            <p className="text-[13px] text-[var(--ink-muted)] mt-1.5 leading-relaxed">
              {b.desc}
            </p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
