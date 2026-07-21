// src/features/landing/components/ProblemSection.tsx
import React from "react";
import { motion } from "framer-motion";
import { PROBLEMS } from "../data";

export const ProblemSection: React.FC = () => {
  return (
    <section className="relative py-24 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <span className="nox-eyebrow">The problem</span>
          <h2 className="mt-4 font-orbital text-3xl md:text-4xl font-semibold text-nox-high">
            Running an academy shouldn't mean running five different systems.
          </h2>
        </motion.div>

        <div className="mt-14 grid md:grid-cols-3 gap-6">
          {PROBLEMS.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.45, delay: i * 0.08 }}
              className="nox-card p-6"
            >
              <div className="w-9 h-9 rounded-full border border-ion-400/30 bg-ion-400/[0.07]" />
              <h3 className="mt-5 font-orbital text-lg font-medium text-nox-high">{p.title}</h3>
              <p className="mt-2 text-sm text-nox-mid leading-relaxed">{p.body}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProblemSection;
