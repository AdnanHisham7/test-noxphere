// src/features/landing/components/FeaturesSection.tsx
import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Layers,
  CheckCircle2,
  Wallet,
  ClipboardList,
  TrendingUp,
  MessageCircle,
  PieChart,
  type LucideIcon,
} from "lucide-react";
import { FEATURES } from "../data";

const ICONS: LucideIcon[] = [
  Users,
  Layers,
  CheckCircle2,
  Wallet,
  ClipboardList,
  TrendingUp,
  MessageCircle,
  PieChart,
];

export const FeaturesSection: React.FC = () => {
  return (
    <section id="features" className="relative py-24 border-t border-white/[0.05]">
      <div className="max-w-6xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="max-w-xl"
        >
          <span className="nox-eyebrow">Core features</span>
          <h2 className="mt-4 font-orbital text-3xl md:text-4xl font-semibold text-nox-high">
            Everything your academy runs on, connected.
          </h2>
        </motion.div>

        <div className="mt-14 grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {FEATURES.map((f, i) => {
            const Icon = ICONS[i % ICONS.length];
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.4, delay: (i % 4) * 0.06 }}
                className="nox-card p-5"
              >
                <div className="nox-ring-badge">
                  <Icon size={18} strokeWidth={1.75} />
                </div>
                <h3 className="mt-4 font-orbital text-base font-medium text-nox-high">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-[13px] text-nox-mid leading-relaxed">{f.body}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
