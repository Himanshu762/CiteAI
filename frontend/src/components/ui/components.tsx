import React, { ReactNode } from 'react';
import { FileText } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Clean Modern UI Components ---

export const Logo = ({ className = '', minimal = false }: { className?: string; minimal?: boolean; animated?: boolean }) => (
  <Link to="/" className={`flex items-center gap-2 ${className}`}>
    <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
      <FileText className="w-5 h-5 text-white" />
    </div>
    {!minimal && (
      <span className="text-xl font-bold text-slate-900 dark:text-white">
        CiteAI
      </span>
    )}
  </Link>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  className = '',
  disabled = false,
  type = 'button'
}: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-sm',
    lg: 'px-6 py-3 text-base'
  };

  const variantClasses = {
    primary: "bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500",
    secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-700 dark:text-white dark:hover:bg-slate-600",
    outline: "border border-slate-300 bg-transparent hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-800",
    ghost: "bg-transparent hover:bg-slate-100 dark:hover:bg-slate-800"
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
    >
      {children}
    </button>
  );
};

interface InputProps {
  id?: string;
  type?: 'text' | 'textarea' | 'email' | 'password' | 'number';
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement> | React.ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  label?: string;
  maxLength?: number;
}

export const Input = ({
  id,
  type = 'text',
  value,
  onChange,
  placeholder = '',
  className = '',
  disabled = false,
  label,
  maxLength
}: InputProps) => {
  const inputClasses = "w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-slate-800 dark:border-slate-600 dark:text-white transition-shadow";

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
          {label}
        </label>
      )}
      {type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={onChange as any}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClasses} resize-none ${className}`}
          rows={4}
          maxLength={maxLength}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={onChange as any}
          placeholder={placeholder}
          disabled={disabled}
          className={`${inputClasses} ${className}`}
          maxLength={maxLength}
        />
      )}
    </div>
  );
};

export const Stepper = ({ steps, currentStep = 0, onChange = (s: number) => { } }: { steps: string[]; currentStep?: number; onChange?: (step: number) => void }) => (
  <div className="flex items-center gap-2" role="tablist">
    {steps.map((s, idx) => (
      <button
        key={s}
        onClick={() => onChange(idx)}
        role="tab"
        aria-selected={idx === currentStep}
        className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${idx === currentStep
          ? 'bg-blue-600 text-white'
          : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
      >
        {s}
      </button>
    ))}
  </div>
);

// Table Components
export const Table = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className="overflow-x-auto">
    <table className={`min-w-full divide-y divide-slate-200 dark:divide-slate-700 ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <thead className={`bg-slate-50 dark:bg-slate-800 ${className}`}>{children}</thead>
);

export const TableBody = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <tbody className={`divide-y divide-slate-200 dark:divide-slate-700 ${className}`}>{children}</tbody>
);

export const TableRow = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <tr className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 ${className}`}>{children}</tr>
);

export const TableHead = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <th scope="col" className={`px-6 py-3 text-left text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider ${className}`}>
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm text-slate-900 dark:text-slate-100 ${className}`}>
    {children}
  </td>
);

export const Badge = ({ children, className = '', variant = 'default' }: { children: ReactNode, className?: string, variant?: 'default' | 'success' | 'warning' | 'error' }) => {
  const variants = {
    default: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    error: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
};

export const PageHeader = ({ title, description }: { title: string; description?: string }) => (
  <div className="mb-8">
    <h1 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h1>
    {description && (
      <p className="mt-2 text-slate-600 dark:text-slate-400">{description}</p>
    )}
  </div>
);

// Card Components for consistent panel styling
export const Card = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden ${className}`}>
    {children}
  </div>
);

export const CardHeader = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`px-6 py-4 border-b border-slate-200 dark:border-slate-700 ${className}`}>
    {children}
  </div>
);

export const CardContent = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`p-6 ${className}`}>
    {children}
  </div>
);

export const CardFooter = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className={`px-6 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 ${className}`}>
    {children}
  </div>
);

// Skeleton loader for loading states
export const Skeleton = ({ className = '', variant = 'default' }: { className?: string, variant?: 'default' | 'circle' | 'text' }) => {
  const variantClasses = {
    default: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 ${variantClasses[variant]} ${className}`} />
  );
};

// Progress bar component
export const ProgressBar = ({ value, max = 100, className = '', color = 'blue' }: { value: number, max?: number, className?: string, color?: 'blue' | 'green' | 'amber' | 'red' }) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  const colorClasses = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    amber: 'bg-amber-600',
    red: 'bg-red-600',
  };

  return (
    <div className={`w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden ${className}`}>
      <div
        className={`h-full rounded-full transition-all duration-300 ${colorClasses[color]}`}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
};

// Alert component for notifications
export const Alert = ({ children, variant = 'info', className = '' }: { children: ReactNode, variant?: 'info' | 'success' | 'warning' | 'error', className?: string }) => {
  const variantClasses = {
    info: 'bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-400',
    success: 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:border-green-800 dark:text-green-400',
    warning: 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-900/20 dark:border-amber-800 dark:text-amber-400',
    error: 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800 dark:text-red-400',
  };

  return (
    <div className={`p-4 rounded-lg border ${variantClasses[variant]} ${className}`}>
      {children}
    </div>
  );
};

// Tabs component
interface TabsProps {
  tabs: { id: string; label: string; icon?: React.ReactNode }[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs = ({ tabs, activeTab, onChange, className = '' }: TabsProps) => (
  <div className={`flex border-b border-slate-200 dark:border-slate-700 ${className}`}>
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === tab.id
            ? 'border-blue-600 text-blue-600 dark:text-blue-400'
            : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
          }`}
      >
        {tab.icon}
        {tab.label}
      </button>
    ))}
  </div>
);

// Empty state component
export const EmptyState = ({ icon, title, description, action }: {
  icon: React.ReactNode,
  title: string,
  description?: string,
  action?: React.ReactNode
}) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 text-slate-400">
      {icon}
    </div>
    <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">{title}</h3>
    {description && (
      <p className="text-sm text-slate-500 dark:text-slate-400 max-w-sm mb-4">{description}</p>
    )}
    {action}
  </div>
);