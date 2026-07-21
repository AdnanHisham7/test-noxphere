// src/features/landing/components/OrbitSystem.tsx
import React from "react";

interface OrbitNode {
  label: string;
  angle: number; // degrees, 0 = 3 o'clock
}

const INNER_NODES: OrbitNode[] = [
  { label: "Students", angle: 20 },
  { label: "Attendance", angle: 150 },
  { label: "Fees", angle: 270 },
];

const OUTER_NODES: OrbitNode[] = [
  { label: "Coaches", angle: 60 },
  { label: "Batches", angle: 190 },
  { label: "Reports", angle: 310 },
];

const CENTER = 280;
const INNER_R = 118;
const OUTER_R = 224;

function pointOn(radius: number, angleDeg: number) {
  const rad = (angleDeg * Math.PI) / 180;
  return {
    x: CENTER + radius * Math.cos(rad),
    y: CENTER + radius * Math.sin(rad),
  };
}

interface OrbitSystemProps {
  /** "hero" renders full size with labelled nodes, "compact" is a small decorative version */
  variant?: "hero" | "compact";
  className?: string;
}

export const OrbitSystem: React.FC<OrbitSystemProps> = ({
  variant = "hero",
  className = "",
}) => {
  const showLabels = variant === "hero";

  return (
    <svg
      viewBox="0 0 560 560"
      className={className}
      role="img"
      aria-label="Noxphere orbital system: students, attendance, fees, coaches, batches and reports connected around one core"
    >
      <defs>
        <radialGradient id="nox-core-grad" cx="50%" cy="45%" r="60%">
          <stop offset="0%" stopColor="#e0ff66" />
          <stop offset="55%" stopColor="#ccff00" />
          <stop offset="100%" stopColor="#99cc00" />
        </radialGradient>
        <radialGradient id="nox-core-halo" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ccff00" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#ccff00" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="nox-ring-stroke" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6e8bff" stopOpacity="0.55" />
          <stop offset="100%" stopColor="#a78bfa" stopOpacity="0.15" />
        </linearGradient>
      </defs>

      {/* ambient halo behind everything */}
      <circle cx={CENTER} cy={CENTER} r={260} fill="url(#nox-core-halo)" />

      {/* static ring guides */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={INNER_R}
        fill="none"
        stroke="url(#nox-ring-stroke)"
        strokeWidth="1"
        strokeDasharray="2 6"
      />
      <circle
        cx={CENTER}
        cy={CENTER}
        r={OUTER_R}
        fill="none"
        stroke="url(#nox-ring-stroke)"
        strokeWidth="1"
        strokeDasharray="2 6"
      />

      {/* orbiting inner group */}
      <g
        className="animate-orbit-slow"
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      >
        {INNER_NODES.map((node) => {
          const p = pointOn(INNER_R, node.angle);
          return (
            <g key={node.label}>
              <circle cx={p.x} cy={p.y} r={7} fill="#ccff00" />
              <circle
                cx={p.x}
                cy={p.y}
                r={13}
                fill="none"
                stroke="#ccff00"
                strokeOpacity="0.35"
              />
            </g>
          );
        })}
      </g>

      {/* orbiting outer group, opposite direction */}
      <g
        className="animate-orbit-reverse"
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      >
        {OUTER_NODES.map((node) => {
          const p = pointOn(OUTER_R, node.angle);
          return (
            <g key={node.label}>
              <circle cx={p.x} cy={p.y} r={6} fill="#6e8bff" />
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="none"
                stroke="#6e8bff"
                strokeOpacity="0.3"
              />
            </g>
          );
        })}
      </g>

      {/* labels — rendered static (not rotating) so they stay legible */}
      {showLabels &&
        [...INNER_NODES.map((n) => ({ ...n, r: INNER_R + 26 })), ...OUTER_NODES.map((n) => ({ ...n, r: OUTER_R + 26 }))].map(
          (node) => {
            const p = pointOn(node.r, node.angle);
            return (
              <text
                key={node.label}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                className="fill-nox-mid"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: 11, letterSpacing: "0.04em" }}
              >
                {node.label}
              </text>
            );
          },
        )}

      {/* the core */}
      <circle
        cx={CENTER}
        cy={CENTER}
        r={54}
        fill="url(#nox-core-grad)"
        className="animate-core-pulse"
        style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
      />
      <circle cx={CENTER} cy={CENTER} r={54} fill="none" stroke="#0a0a0f" strokeWidth="2" />
    </svg>
  );
};

export default OrbitSystem;
