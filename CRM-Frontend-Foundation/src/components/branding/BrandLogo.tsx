import { Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

export function BrandLogo({
  compact = false,
  className,
  textClassName,
}: {
  compact?: boolean;
  className?: string;
  textClassName?: string;
}) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center shadow-sm">
        <Zap size={18} className="text-white" />
      </div>
      {!compact && (
        <span className={cn('text-xl font-bold text-gray-900 tracking-tight', textClassName)}>
          Nex<span className="text-indigo-600">CRM</span>
        </span>
      )}
    </div>
  );
}
