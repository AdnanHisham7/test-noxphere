// src/components/ui/PlayerPlaceholder.tsx
import React from "react";
import { clsx } from "clsx";

interface PlayerPlaceholderProps {
  image: string;
  name: string;
  number: number | string;
  className?: string;
  nameTop?: string;
  numberTop?: string;
  nameSize?: string;
  numberSize?: string;
  nameWidth?: string;
}

export const PlayerPlaceholder: React.FC<PlayerPlaceholderProps> = ({
  image,
  name,
  number,
  className,
  nameTop = "38%",
  numberTop = "48%",
  nameSize = "10px",
  numberSize = "72px",
  nameWidth = "70%",
}) => {
  return (
    <div className={clsx("relative h-full w-full", className)}>
      {/* Base PNG */}
      <img
        src={image}
        alt={name}
        className="h-full w-full object-contain object-bottom select-none pointer-events-none"
      />

      {/* Player Name */}
      <div
        className="
          absolute
          left-1/2
          -translate-x-1/2
          text-center
          uppercase
          font-display
          font-black
          tracking-widest
          text-slate-300
          whitespace-nowrap
          pointer-events-none
          select-none
        "
        style={{
          top: nameTop,
          fontSize: nameSize,
          width: nameWidth,
        }}
      >
        {name}
      </div>

      {/* Jersey Number */}
      <div
        className="
          absolute
          left-1/2
          -translate-x-1/2
          font-display
          font-900
          leading-none
          text-white/80
          pointer-events-none
          select-none
        "
        style={{
          top: numberTop,
          fontSize: numberSize,
        }}
      >
        {number}
      </div>
    </div>
  );
};
