import { ArrowLeft, LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: LucideIcon;
  onBack?: () => void;
  actions?: React.ReactNode;
  variant?: 'default' | 'gradient';
}

export function PageHeader({
  title,
  subtitle,
  icon: Icon,
  onBack,
  actions,
  variant = 'default',
}: PageHeaderProps) {
  const baseClasses = variant === 'gradient'
    ? 'bg-gradient-to-r from-purple-600 to-purple-700 text-white'
    : 'bg-white border-b border-gray-200';

  const titleColor = variant === 'gradient' ? 'text-white' : 'text-gray-900';
  const subtitleColor = variant === 'gradient' ? 'text-purple-100' : 'text-gray-600';

  return (
    <div className={`${baseClasses} rounded-xl shadow-md p-6 mb-6`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          {onBack && (
            <button
              onClick={onBack}
              className={`p-2 rounded-lg transition-colors ${
                variant === 'gradient'
                  ? 'hover:bg-white/20 text-white'
                  : 'hover:bg-gray-100 text-gray-600'
              }`}
              aria-label="Go back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
          )}
          <div className="flex items-center gap-3 flex-1">
            {Icon && (
              <div
                className={`p-3 rounded-lg ${
                  variant === 'gradient' ? 'bg-white/20' : 'bg-purple-50'
                }`}
              >
                <Icon
                  className={`w-6 h-6 ${
                    variant === 'gradient' ? 'text-white' : 'text-purple-600'
                  }`}
                />
              </div>
            )}
            <div>
              <h2 className={`text-2xl font-semibold mb-1 ${titleColor}`}>
                {title}
              </h2>
              {subtitle && (
                <p className={`text-sm ${subtitleColor}`}>{subtitle}</p>
              )}
            </div>
          </div>
        </div>
        {actions && <div className="flex items-center gap-3">{actions}</div>}
      </div>
    </div>
  );
}
