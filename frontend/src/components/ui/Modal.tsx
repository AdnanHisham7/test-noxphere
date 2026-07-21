// src/components/ui/Modal.tsx
import React from "react";
import { clsx } from "clsx";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg" | "xl";
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = "md",
}) => {
  if (!isOpen) return null;

  const sizes = {
    sm: "max-w-sm",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal Box */}
      <div
        className={clsx(
          "relative card shadow-panel w-full max-h-[calc(100vh-2rem)] flex flex-col overflow-hidden animate-slide-up",
          sizes[size],
        )}
      >
        {/* Fixed Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5 flex-shrink-0">
          <h2 className="font-display font-bold text-white uppercase tracking-wide">
            {title}
          </h2>
          <button
            onClick={onClose}
            className="btn-ghost text-slate-400 hover:text-white p-1 transition-colors"
          >
            ✕
          </button>
        </div>
        
        {/* Scrollable Body Content */}
        <div className="p-5 overflow-y-auto min-h-0 custom-scrollbar">
          {children}
        </div>
      </div>
    </div>
  );
};