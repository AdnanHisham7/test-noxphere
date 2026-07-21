// src/features/landing/components/WhySection.tsx
import React from "react";
import { motion } from "framer-motion";
import { Check, Minus, X } from "lucide-react";
import { WHY_ROWS } from "../data";

const Cell: React.FC<{ value: boolean | "partial" }> = ({ value }) => {
  if (value === true) return <Check size={16} className="text-core-400 mx-auto" strokeWidth={2} />;
  if (value === "partial") return <Minus size={16} className="text-nox-low mx-auto" strokeWidth={2} />;
  return <X size={16} className="text-nox-low/50 mx-auto" strokeWidth={2} />;
};

export const WhySection: React.FC = () => {
  return (
    <section className="relative py-24 border-t border-white/[0.05]">
      <div className="max-w-5xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <span className="nox-eyebrow">Why Noxphere</span>
          <h2 className="mt-4 font-orbital text-3xl md:text-4xl font-semibold text-nox-high">
            Not generic sports software. Not a school ERP.
          </h2>
          <p className="mt-4 text-nox-mid leading-relaxed">
            Noxphere is built around how a football academy actually operates — batches,
            sessions, assessments and fees — not adapted from a template for every sport
            or every kind of school.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="nox-card mt-12 overflow-x-auto"
        >
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/[0.06]">
                <th className="text-left font-orbital font-medium text-nox-high px-5 py-4">
                  &nbsp;
                </th>
                <th className="font-mono text-[11px] uppercase tracking-wide text-nox-low px-5 py-4">
                  Generic school ERP
                </th>
                <th className="font-mono text-[11px] uppercase tracking-wide text-nox-low px-5 py-4">
                  General sports app
                </th>
                <th className="font-mono text-[11px] uppercase tracking-wide text-core-400 px-5 py-4">
                  Noxphere
                </th>
              </tr>
            </thead>
            <tbody>
              {WHY_ROWS.map((row) => (
                <tr key={row.label} className="border-b border-white/[0.04] last:border-0">
                  <td className="px-5 py-4 text-nox-mid">{row.label}</td>
                  <td className="px-5 py-4 text-center">
                    <Cell value={row.generic} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Cell value={row.sports} />
                  </td>
                  <td className="px-5 py-4 text-center bg-core-400/[0.04]">
                    <Cell value={row.noxphere} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>
      </div>
    </section>
  );
};

export default WhySection;
