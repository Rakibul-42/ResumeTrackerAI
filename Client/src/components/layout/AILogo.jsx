import { motion } from "framer-motion";

const AILogo = () => {
  return (
    <div
      className="relative h-12 w-12 flex items-center justify-center"
      role="img"
      aria-label="ResumeTrackerAI logo"
    >
      {/* Soft outer halo glow — breathes */}
      <motion.div
        className="absolute -inset-1 rounded-[20px]"
        style={{
          background:
            "radial-gradient(circle, color-mix(in srgb, var(--brand-orange) 58%, transparent) 0%, color-mix(in srgb, var(--brand-brown) 28%, transparent) 42%, transparent 72%)",
          filter: "blur(8px)",
        }}
        animate={{ opacity: [0.28, 0.62, 0.28], scale: [0.92, 1.04, 0.92] }}
        transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut" }}
      />

      {/* Rotating conic gradient ring (the sweep) */}
      <div className="absolute inset-0 rounded-[16px] overflow-hidden">
        <motion.div
          className="absolute -inset-1/2"
          style={{
            background:
              "conic-gradient(from 0deg, var(--brand-deep) 0deg, var(--brand-brown) 95deg, var(--brand-orange) 190deg, var(--brand-cream) 218deg, var(--brand-orange) 244deg, var(--brand-brown) 310deg, var(--brand-deep) 360deg)",
          }}
          animate={{ rotate: 360 }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Inner card (creates the ring frame) */}
      <div className="relative h-[38px] w-[38px] rounded-[12px] bg-[var(--brand-deep)] border border-[color-mix(in_srgb,var(--brand-orange)_70%,var(--brand-cream))] flex items-center justify-center overflow-hidden shadow-[inset_0_1px_0_color-mix(in_srgb,var(--brand-cream)_18%,transparent),0_5px_14px_rgba(22,13,4,0.32)]">
        {/* Soft inner gradient backdrop */}
        <motion.div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 30%, color-mix(in srgb, var(--brand-orange) 34%, transparent) 0%, transparent 68%)",
          }}
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Shimmering diamond */}
        <motion.div
          className="relative h-[18px] w-[18px] rounded-[4px]"
          style={{
            background:
              "linear-gradient(135deg, var(--brand-cream) 0%, var(--brand-orange) 35%, var(--brand-brown) 100%)",
            backgroundSize: "200% 200%",
            rotate: 45,
          }}
          animate={{
            backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
            scale: [1, 1.08, 1],
          }}
          transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Inner highlight sparkle */}
        <motion.div
          className="absolute h-[3px] w-[3px] rounded-full bg-[var(--brand-cream)]"
          style={{ boxShadow: "0 0 5px color-mix(in srgb, var(--brand-cream) 76%, transparent)" }}
          animate={{
            opacity: [0, 1, 0],
            top: ["28%", "42%", "62%"],
            left: ["38%", "58%", "42%"],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
        />

        {/* Tiny second sparkle, offset timing */}
        <motion.div
          className="absolute h-[2px] w-[2px] rounded-full bg-[var(--brand-cream)]"
          style={{ boxShadow: "0 0 4px color-mix(in srgb, var(--brand-cream) 68%, transparent)" }}
          animate={{
            opacity: [0, 1, 0],
            top: ["58%", "30%", "60%"],
            left: ["62%", "40%", "30%"],
          }}
          transition={{
            duration: 2.2,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 1.1,
          }}
        />
      </div>
    </div>
  );
};

export default AILogo;
