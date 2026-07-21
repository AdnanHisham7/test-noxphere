// src/components/ui/Card.tsx
import { clsx } from "clsx";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  hover,
  onClick,
}) => (
  <div
    className={clsx(hover ? "card-hover cursor-pointer" : "card", className)}
    onClick={onClick}
  >
    {children}
  </div>
);
