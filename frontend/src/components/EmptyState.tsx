import React from 'react'
import { FolderOpen } from 'lucide-react'

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <FolderOpen className="h-10 w-10 text-muted-foreground" />,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-border rounded-2xl bg-card/20 backdrop-blur-sm">
      <div className="p-3.5 bg-secondary rounded-2xl mb-4 text-muted-foreground border border-border">
        {icon}
      </div>
      <h3 className="text-base font-semibold text-foreground mb-1">{title}</h3>
      <p className="text-sm text-muted-foreground max-w-xs mb-5">{description}</p>
      {action && <div className="animate-fade-in">{action}</div>}
    </div>
  );
};

export default EmptyState;
