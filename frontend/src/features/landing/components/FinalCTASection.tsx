// src/features/landing/components/FinalCTASection.tsx
import React, { useState } from "react";
import { motion } from "framer-motion";

export const FinalCTASection: React.FC = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    // TODO: wire to backend waitlist/demo-request endpoint once available
    setSubmitted(true);
  };

  return (
    <section id="final-cta" className="relative py-28 border-t border-white/[0.05] overflow-hidden">
      <div className="absolute inset-0 bg-orbit-core-glow pointer-events-none" />

      <div className="relative max-w-2xl mx-auto px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
        >
          <h2 className="font-orbital text-3xl md:text-4xl font-semibold text-nox-high">
            Bring everything into one orbit.
          </h2>
          <p className="mt-4 text-nox-mid">
            Book a demo, or join the waitlist to hear when Noxphere opens up fully.
          </p>

          {submitted ? (
            <p className="mt-8 font-mono text-sm text-core-400">
              You're on the list — we'll be in touch shortly.
            </p>
          ) : (
            <form
              onSubmit={handleSubmit}
              className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@youracademy.com"
                className="w-full sm:w-72 px-4 py-3 rounded-full bg-white/[0.04] border border-white/10 text-nox-high text-sm placeholder:text-nox-low focus:outline-none focus:border-core-400/50"
              />
              <button type="submit" className="nox-btn-primary w-full sm:w-auto">
                Book a demo
              </button>
            </form>
          )}
        </motion.div>
      </div>
    </section>
  );
};

export default FinalCTASection;
