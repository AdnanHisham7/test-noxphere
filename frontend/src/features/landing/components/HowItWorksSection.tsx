// src/features/landing/components/HowItWorksSection.tsx
import React from "react";
import { motion } from "framer-motion";
import { HOW_IT_WORKS } from "../data";

export const HowItWorksSection: React.FC = () => {
  return (
    <section id="how-it-works" className="relative py-24 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <span className="nox-eyebrow">How it works</span>
          <h2 className="mt-4 font-orbital text-3xl md:text-4xl font-semibold text-nox-high">
            From setup to your next report, in one orbit.
          </h2>
        </motion.div>

        <div className="mt-16 relative">
          {/* connecting line, hidden on mobile */}
          <div className="hidden md:block absolute top-6 left-[6%] right-[6%] h-px bg-gradient-to-r from-core-400/50 via-ion-400/40 to-plasma-400/30" />

          <div className="grid md:grid-cols-4 gap-10 md:gap-6">
            {HOW_IT_WORKS.map((step, i) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.1 }}
                className="relative"
              >
                <div className="relative z-10 flex items-center justify-center w-12 h-12 rounded-full bg-ink-800 border border-core-400/40 text-core-400 font-mono text-xs">
                  {step.step}
                </div>
                <h3 className="mt-5 font-orbital text-base font-medium text-nox-high">
                  {step.title}
                </h3>
                <p className="mt-2 text-[13px] text-nox-mid leading-relaxed">{step.body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorksSection;
