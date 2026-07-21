// src/features/landing/components/AnalyticsSection.tsx
import React from "react";
import { motion } from "framer-motion";

const STATS = [
  { label: "Attendance rate", value: 92, color: "#ccff00" },
  { label: "Fee collection", value: 78, color: "#6e8bff" },
  { label: "Active students", value: 96, color: "#a78bfa" },
];

const RADIUS = 70;
const CIRC = 2 * Math.PI * RADIUS;

export const AnalyticsSection: React.FC = () => {
  return (
    <section className="relative py-24 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="nox-eyebrow">Reports & analytics</span>
          <h2 className="mt-4 font-orbital text-3xl md:text-4xl font-semibold text-nox-high">
            A 360° view of your academy, always current.
          </h2>
          <p className="mt-5 text-nox-mid leading-relaxed max-w-md">
            Attendance trends, fee collection and student activity roll up automatically —
            by batch, coach or centre — so reports are ready before you need them, not the
            night before.
          </p>

          <div className="mt-8 space-y-4">
            {STATS.map((s) => (
              <div key={s.label} className="flex items-center gap-4">
                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: s.color }} />
                <span className="text-sm text-nox-mid flex-1">{s.label}</span>
                <span className="font-mono text-sm text-nox-high">{s.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="flex justify-center"
        >
          <svg viewBox="0 0 220 220" className="w-64 h-64">
            <circle cx="110" cy="110" r={RADIUS} fill="none" stroke="#22222f" strokeWidth="14" />
            {STATS.map((s, i) => {
              const offset = STATS.slice(0, i).reduce((acc, cur) => acc + (cur.value / 100) * CIRC, 0);
              return (
                <circle
                  key={s.label}
                  cx="110"
                  cy="110"
                  r={RADIUS}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="14"
                  strokeLinecap="round"
                  strokeDasharray={`${(s.value / 100) * CIRC * 0.34} ${CIRC}`}
                  strokeDashoffset={-offset * 0.34 - i * 6}
                  transform="rotate(-90 110 110)"
                  opacity={0.9}
                />
              );
            })}
            <text
              x="110"
              y="104"
              textAnchor="middle"
              className="fill-nox-high"
              style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 26, fontWeight: 600 }}
            >
              360°
            </text>
            <text
              x="110"
              y="126"
              textAnchor="middle"
              className="fill-nox-low"
              style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 10, letterSpacing: "0.08em" }}
            >
              ACADEMY VIEW
            </text>
          </svg>
        </motion.div>
      </div>
    </section>
  );
};

export default AnalyticsSection;
