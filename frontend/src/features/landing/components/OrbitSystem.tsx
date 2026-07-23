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
  /** Path or URL to your transparent PNG logo */
  logoSrc?: string;
  className?: string;
}

export const OrbitSystem: React.FC<OrbitSystemProps> = ({
  variant = "hero",
  logoSrc = "/assets/logo.png",
  className = "",
}) => {
  const showLabels = variant === "hero";
  const LOGO_SIZE = 96; // Adjust size as needed to fit your logo bounds

  return (
    <svg
      viewBox="0 0 560 560"
      className={className}
      role="img"
      aria-label="Noxphere orbital system: students, attendance, fees, coaches, batches and reports connected around one core"
    >
      <defs>
        <style>{`
          @keyframes nox-spin {
            from { transform: rotate(0deg); }
            to { transform: rotate(360deg); }
          }
          @keyframes nox-spin-reverse {
            from { transform: rotate(360deg); }
            to { transform: rotate(0deg); }
          }
          .animate-orbit-slow {
            animation: nox-spin 25s linear infinite;
          }
          .animate-orbit-reverse {
            animation: nox-spin-reverse 35s linear infinite;
          }
          .animate-counter-slow {
            animation: nox-spin-reverse 25s linear infinite;
          }
          .animate-counter-reverse {
            animation: nox-spin 35s linear infinite;
          }
        `}</style>

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
              {/* Dot indicator */}
              <circle cx={p.x} cy={p.y} r={7} fill="#ccff00" />
              <circle
                cx={p.x}
                cy={p.y}
                r={13}
                fill="none"
                stroke="#ccff00"
                strokeOpacity="0.35"
              />

              {/* Label group counter-rotates around dot center */}
              {showLabels && (
                <g
                  className="animate-counter-slow"
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                >
                  <text
                    x={p.x}
                    y={p.y + 24}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      fill: "#e2e8f0",
                    }}
                  >
                    {node.label}
                  </text>
                </g>
              )}
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
              {/* Dot indicator */}
              <circle cx={p.x} cy={p.y} r={6} fill="#6e8bff" />
              <circle
                cx={p.x}
                cy={p.y}
                r={12}
                fill="none"
                stroke="#6e8bff"
                strokeOpacity="0.3"
              />

              {/* Label group counter-rotates around dot center */}
              {showLabels && (
                <g
                  className="animate-counter-reverse"
                  style={{ transformOrigin: `${p.x}px ${p.y}px` }}
                >
                  <text
                    x={p.x}
                    y={p.y + 24}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: 11,
                      fontWeight: 600,
                      letterSpacing: "0.04em",
                      fill: "#e2e8f0",
                    }}
                  >
                    {node.label}
                  </text>
                </g>
              )}
            </g>
          );
        })}
      </g>

      {/* Center Logo (Replaces the background core circle completely) */}
      {logoSrc && (
        <image
          href={logoSrc}
          x={CENTER - LOGO_SIZE / 2}
          y={CENTER - LOGO_SIZE / 2}
          width={LOGO_SIZE}
          height={LOGO_SIZE}
          preserveAspectRatio="xMidYMid meet"
          className="animate-core-pulse"
          style={{ transformOrigin: `${CENTER}px ${CENTER}px` }}
        />
      )}
    </svg>
  );
};

export default OrbitSystem;