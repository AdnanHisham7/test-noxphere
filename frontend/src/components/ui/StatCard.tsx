// src/components/ui/StatCard.tsx
import { clsx } from "clsx";

interface StatCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  icon?: React.ReactNode;
  trend?: { value: number; positive: boolean };
  accent?: "volt" | "ice" | "ember" | "field";
}

export const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  sublabel,
  icon,
  trend,
  accent = "volt",
}) => {
  const accents = {
    volt: "text-volt-400",
    ice: "text-ice-400",
    ember: "text-ember-400",
    field: "text-field-400",
  };

  return (
    <div className="card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <span className="section-title">{label}</span>
        {icon && (
          <span className={clsx("text-lg", accents[accent])}>{icon}</span>
        )}
      </div>
      <div>
        <span
          className={clsx(
            "font-display font-extrabold text-3xl tabular-nums",
            accents[accent],
          )}
        >
          {value}
        </span>
        {sublabel && (
          <p className="text-xs text-slate-500 mt-0.5">{sublabel}</p>
        )}
      </div>
      {trend && (
        <div
          className={clsx(
            "flex items-center gap-1 text-xs",
            trend.positive ? "text-field-400" : "text-ember-400",
          )}
        >
          <span>{trend.positive ? "▲" : "▼"}</span>
          <span>{Math.abs(trend.value)}% vs last week</span>
        </div>
      )}
    </div>
  );
};
