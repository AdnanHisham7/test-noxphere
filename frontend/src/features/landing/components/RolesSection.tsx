// src/features/landing/components/RolesSection.tsx
import React from "react";
import { motion } from "framer-motion";
import { ROLES } from "../data";

export const RolesSection: React.FC = () => {
  return (
    <section id="roles" className="relative py-24 border-t border-white/[0.05] overflow-hidden">
      <div className="absolute inset-0 bg-orbit-radial opacity-60 pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <span className="nox-eyebrow">Modules by role</span>
          <h2 className="mt-4 font-orbital text-3xl md:text-4xl font-semibold text-nox-high">
            One platform. Every role sees what they need.
          </h2>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-5 gap-5">
          {ROLES.map((r, i) => (
            <motion.div
              key={r.audience}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.4, delay: i * 0.07 }}
              className="nox-card p-5 flex flex-col"
            >
              <span className="flex items-center justify-center w-9 h-9 rounded-full bg-orbit-cta text-ink-950 font-orbital font-semibold text-sm">
                {r.audience.charAt(0)}
              </span>
              <h3 className="mt-4 font-orbital text-base font-medium text-nox-high">
                {r.audience}
              </h3>
              <p className="mt-2 text-[13px] text-nox-mid leading-relaxed">{r.headline}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RolesSection;
