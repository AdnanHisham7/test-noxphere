// src/components/ui/Skeleton.tsx
import { clsx } from "clsx";

interface SkeletonProps {
  className?: string;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({ className, count = 1 }) => (
  <>
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className={clsx("skeleton", className)} />
    ))}
  </>
);
