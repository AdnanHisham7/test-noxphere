// src/features/landing/components/LandingFooter.tsx
import React from "react";
import { Link } from "react-router-dom";

export const LandingFooter: React.FC = () => {
  return (
    <footer className="relative border-t border-white/[0.05] py-12">
      <div className="max-w-6xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex items-center gap-2">
          <span className="relative flex items-center justify-center w-7 h-7 rounded-full bg-orbit-cta">
            <span className="absolute inset-0 rounded-full border border-white/30" />
          </span>
          <span className="font-orbital font-semibold text-nox-high">Noxphere</span>
          <span className="text-nox-low text-xs font-mono ml-2 hidden sm:inline">
            Everything revolves here
          </span>
        </div>

        <div className="flex items-center gap-6 text-sm text-nox-mid">
          <a href="#features" className="hover:text-nox-high transition-colors">Features</a>
          <a href="#how-it-works" className="hover:text-nox-high transition-colors">How it works</a>
          <a href="#faq" className="hover:text-nox-high transition-colors">FAQ</a>
          <Link to="/login" className="hover:text-nox-high transition-colors">Sign in</Link>
        </div>

        <p className="text-xs text-nox-low font-mono">
          © {new Date().getFullYear()} Noxphere
        </p>
      </div>
    </footer>
  );
};

export default LandingFooter;
