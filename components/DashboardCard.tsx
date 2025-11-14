'use client';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: string;
  progress?: number;
  color?: 'blue' | 'green' | 'purple' | 'orange';
}

export default function DashboardCard({ 
  title, 
  value, 
  subtitle, 
  icon, 
  progress,
  color = 'blue' 
}: DashboardCardProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-600',
    green: 'bg-green-50 border-green-200 text-green-600',
    purple: 'bg-purple-50 border-purple-200 text-purple-600',
    orange: 'bg-orange-50 border-orange-200 text-orange-600',
  };

  const progressColors = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    purple: 'bg-purple-500',
    orange: 'bg-orange-500',
  };

  return (
    <div className={`rounded-lg border-2 p-6 ${colorClasses[color]}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium opacity-80">{title}</p>
          <p className="mt-2 text-3xl font-bold">{value}</p>
          {subtitle && (
            <p className="mt-1 text-sm opacity-70">{subtitle}</p>
          )}
        </div>
        {icon && (
          <div className="text-4xl">{icon}</div>
        )}
      </div>
      
      {progress !== undefined && (
        <div className="mt-4">
          <div className="h-2 w-full rounded-full bg-white bg-opacity-50">
            <div 
              className={`h-2 rounded-full transition-all ${progressColors[color]}`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            />
          </div>
          <p className="mt-1 text-xs opacity-70">{progress.toFixed(0)}% of goal</p>
        </div>
      )}
    </div>
  );
}
