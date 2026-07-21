// src/components/ui/Input.tsx
import React from "react";
import { clsx } from "clsx";

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, icon, className, ...props }, ref) => {
    return (
      <div className="space-y-1.5">
        {label && <label className="label">{label}</label>}

        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
              {icon}
            </span>
          )}

          <input
            ref={ref}
            className={clsx(
              error ? "input-error" : "input",
              icon ? "pl-9" : "",
              className,
            )}
            {...props}
          />
        </div>

        {error && <p className="text-xs text-ember-400">{error}</p>}
      </div>
    );
  },
);

Input.displayName = "Input";
