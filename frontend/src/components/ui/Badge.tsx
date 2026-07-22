// src/components/ui/Badge.tsx
type BadgeVariant = "green" | "red" | "blue" | "yellow" | "gray";
type BadgeSize = "sm" | "md";

interface BadgeProps {
  variant?: BadgeVariant;
  size?: BadgeSize;
  className?: string;
  children: React.ReactNode;
}

export const Badge: React.FC<BadgeProps> = ({ variant = "gray", size = "md", className, children }) => {
  const variants: Record<BadgeVariant, string> = {
    green: "pill-green",
    red: "pill-red",
    blue: "pill-blue",
    yellow: "pill-yellow",
    gray: "pill-gray",
  };
  const sizeClass = size === "sm" ? "text-[10px] px-2 py-0.5" : "";
  return <span className={`${variants[variant]} ${sizeClass}${className ? ` ${className}` : ""}`}>{children}</span>;
};