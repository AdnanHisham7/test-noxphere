// src/components/ui/EmptyState.tsx
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => (
  <div className="flex flex-col items-center justify-center py-16 text-center space-y-4">
    {icon && <div className="text-4xl text-slate-600">{icon}</div>}
    <div>
      <p className="font-display font-semibold text-slate-400 uppercase tracking-wide">
        {title}
      </p>
      {description && (
        <p className="text-sm text-slate-600 mt-1">{description}</p>
      )}
    </div>
    {action}
  </div>
);
