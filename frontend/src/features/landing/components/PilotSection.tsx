// src/features/landing/components/PilotSection.tsx
import React from "react";
import { motion } from "framer-motion";

export const PilotSection: React.FC = () => {
  return (
    <section className="relative py-24 border-t border-white/[0.05]">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <span className="nox-eyebrow justify-center">Early access</span>
          <h2 className="mt-4 font-orbital text-3xl md:text-4xl font-semibold text-nox-high">
            Now onboarding pilot academies.
          </h2>
          <p className="mt-5 text-nox-mid leading-relaxed max-w-xl mx-auto">
            Noxphere is opening up to a small group of academies and associations before
            full launch. Pilot academies get direct input into what ships next and
            onboarding support from the team.
          </p>
          <div className="mt-8">
            <a href="#final-cta" className="nox-btn-primary">
              Apply for early access
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default PilotSection;
