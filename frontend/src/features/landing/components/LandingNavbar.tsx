// src/features/landing/components/LandingNavbar.tsx
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const LINKS = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#roles", label: "Roles" },
  { href: "#faq", label: "FAQ" },
];

export const LandingNavbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-colors duration-300 ${
        scrolled ? "bg-ink-950/85 backdrop-blur-md border-b border-white/[0.06]" : "bg-transparent"
      }`}
    >
      <nav className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
        <a href="#top" className="flex items-center gap-2">
          <span className="relative flex items-center justify-center w-8 h-8 rounded-full bg-orbit-cta shadow-core-glow">
            <span className="absolute inset-0 rounded-full border border-white/30" />
          </span>
          <span className="font-orbital font-semibold text-lg tracking-tight text-nox-high">
            Noxphere
          </span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          {LINKS.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm text-nox-mid hover:text-nox-high transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <Link to="/login" className="hidden sm:inline text-sm text-nox-mid hover:text-nox-high transition-colors">
            Sign in
          </Link>
          <a href="#final-cta" className="nox-btn-primary !px-4 !py-2 text-xs">
            Book a demo
          </a>
        </div>
      </nav>
    </header>
  );
};

export default LandingNavbar;
