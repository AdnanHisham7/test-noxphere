// src/features/landing/components/HeroSection.tsx
import React from "react";
import { motion } from "framer-motion";
import OrbitSystem from "./OrbitSystem";

export const HeroSection: React.FC = () => {
  return (
    <section id="top" className="relative overflow-hidden pt-40 pb-24 md:pt-48 md:pb-32">
      <div className="absolute inset-0 bg-orbit-radial pointer-events-none" />

      <div className="relative max-w-6xl mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <span className="nox-eyebrow">
            <span className="w-1.5 h-1.5 rounded-full bg-core-400 animate-core-pulse" />
            Everything revolves here
          </span>

          <h1 className="mt-5 font-orbital font-semibold text-4xl md:text-[3.25rem] leading-[1.08] text-nox-high tracking-tight">
            The football academy operating system
          </h1>

          <p className="mt-6 text-lg text-nox-mid max-w-md leading-relaxed">
            Manage students, fees, attendance, coaches, batches and reports in one place.
          </p>

          <div className="mt-9 flex flex-wrap items-center gap-4">
            <a href="#final-cta" className="nox-btn-primary">
              Book a demo
            </a>
            <a href="#how-it-works" className="nox-btn-secondary">
              See how it works
            </a>
          </div>

          <p className="mt-8 text-xs text-nox-low font-mono">
            Built for academy owners, associations, admins, coaches and guardians.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
          className="relative"
        >
          <OrbitSystem variant="hero" className="w-full max-w-[520px] mx-auto" />

          <div className="absolute left-1/2 -translate-x-1/2 bottom-2 md:bottom-6 nox-card px-5 py-4 flex items-center gap-5 animate-orbit-float">
            <div>
              <div className="font-orbital text-xl font-semibold text-nox-high">3</div>
              <div className="text-[11px] text-nox-low font-mono uppercase tracking-wide">Centres</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="font-orbital text-xl font-semibold text-nox-high">412</div>
              <div className="text-[11px] text-nox-low font-mono uppercase tracking-wide">Students</div>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div>
              <div className="font-orbital text-xl font-semibold text-core-400">96%</div>
              <div className="text-[11px] text-nox-low font-mono uppercase tracking-wide">Attendance today</div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
