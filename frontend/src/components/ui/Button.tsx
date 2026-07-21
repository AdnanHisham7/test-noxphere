// src/components/ui/Button.tsx
import React from "react";
import { clsx } from "clsx";
import { Spinner } from "./Spinner";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  icon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  variant = "primary",
  size = "md",
  loading = false,
  icon,
  children,
  className,
  disabled,
  ...props
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-body font-medium rounded transition-all duration-150 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed";

  const variants = {
    primary:
      "bg-volt-400 text-pitch-900 font-display font-bold uppercase tracking-wide hover:bg-volt-500",
    secondary:
      "bg-transparent border border-white/15 text-slate-300 hover:border-white/30 hover:text-white hover:bg-white/5",
    danger:
      "bg-ember-500 text-white font-display font-semibold uppercase tracking-wide hover:bg-ember-600",
    ghost: "text-slate-400 hover:text-white hover:bg-white/5",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      className={clsx(base, variants[variant], sizes[size], className)}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size="sm" /> : icon}
      {children}
    </button>
  );
};
