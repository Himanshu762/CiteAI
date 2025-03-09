import React, { ReactNode } from 'react';

// Logo Component
export const Logo = ({ 
  className = '', 
  minimal = false, 
  animated = false 
}: { 
  className?: string; 
  minimal?: boolean;
  animated?: boolean;
}) => (
  <div className={`inline-flex items-center ${className || ''} ${animated ? 'group' : ''}`}>
    {minimal ? (
      // Minimalist icon version
      <svg 
        viewBox="0 0 64 64" 
        className={`h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 transition-all duration-300 hover:drop-shadow-lg ${animated ? 'group-hover:animate-pulse' : ''}`}
      >
        <path 
          d="M32 12L12 32l20 20 20-20z" 
          className="fill-primary dark:fill-primary"
        />
        <path 
          d="M32 28l-8-8 16-16 16 16-8 8" 
          className={`stroke-accent dark:stroke-accent fill-none ${animated ? 'group-hover:stroke-[3px]' : ''}`}
          strokeWidth="2"
        />
      </svg>
    ) : (
      // Full detailed icon
      <svg 
        viewBox="0 0 100 100" 
        className={`h-8 w-8 md:h-10 md:w-10 lg:h-12 lg:w-12 transition-all duration-300 hover:drop-shadow-lg ${animated ? 'group-hover:animate-pulse' : ''}`}
      >
        {/* Book base */}
        <path 
          d="M20,20 L50,5 L80,20 V80 L50,95 L20,80 Z"
          className={`fill-primary dark:fill-primary stroke-accent dark:stroke-accent transition-all duration-300 ${animated ? 'group-hover:stroke-[3px]' : ''}`}
          strokeWidth="2"
        />
        
        {/* AI circuit pattern */}
        <path
          d="M35,35 L45,25 L65,40 L55,50 M50,60 L60,70"
          className="stroke-accent dark:stroke-accent transition-all duration-300"
          strokeWidth="3"
          strokeLinecap="round"
          fill="none"
        />
        
        {/* Dots */}
        <circle cx="35" cy="35" r="3" className="fill-accent dark:fill-accent" />
        <circle cx="45" cy="25" r="3" className="fill-accent dark:fill-accent" />
        <circle cx="65" cy="40" r="3" className="fill-accent dark:fill-accent" />
        <circle cx="55" cy="50" r="3" className="fill-accent dark:fill-accent" />
        <circle cx="50" cy="60" r="3" className="fill-accent dark:fill-accent" />
        <circle cx="60" cy="70" r="3" className="fill-accent dark:fill-accent" />
      </svg>
    )}
    
    {/* Text */}
    <div className="flex items-baseline ml-2">
      <span className="font-sans text-neutral text-lg md:text-xl lg:text-2xl font-bold">
        Cite
      </span>
      <span className={`font-sans text-accent text-lg md:text-xl lg:text-2xl font-bold ml-1 ${animated ? 'group-hover:animate-pulse' : ''}`}>
        AI
      </span>
    </div>
  </div>
);

// Badge Component
interface BadgeProps {
  children: ReactNode;
  variant?: 'default' | 'secondary' | 'success' | 'warning' | 'danger';
  className?: string;
}

export const Badge = ({ 
  children, 
  variant = 'default', 
  className = '' 
}: BadgeProps) => {
  const variantClasses = {
    default: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-300',
    secondary: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    success: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    warning: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    danger: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  };

  return (
    <span 
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
};

// Button Component
interface ButtonProps {
  children: ReactNode;
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
  const variantClasses = {
    primary: 'bg-indigo-600 text-white hover:bg-indigo-700 focus:ring-indigo-500',
    secondary: 'bg-purple-600 text-white hover:bg-purple-700 focus:ring-purple-500',
    outline: 'bg-transparent border border-indigo-600 text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500 dark:border-indigo-400 dark:text-indigo-400 dark:hover:bg-indigo-950',
    ghost: 'bg-transparent text-indigo-600 hover:bg-indigo-50 focus:ring-indigo-500 dark:text-indigo-400 dark:hover:bg-indigo-950'
  };

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2',
    lg: 'px-6 py-3 text-lg'
  };

  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 transition-colors
                ${variantClasses[variant]} ${sizeClasses[size]}
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${className}`}
    >
      {children}
    </button>
  );
};

// Table Components
interface TableProps {
  children: ReactNode;
  className?: string;
}

export const Table = ({ children, className = '' }: TableProps) => (
  <div className="overflow-x-auto">
    <table className={`min-w-full divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
      {children}
    </table>
  </div>
);

export const TableHeader = ({ children, className = '' }: TableProps) => (
  <thead className={className}>
    {children}
  </thead>
);

export const TableBody = ({ children, className = '' }: TableProps) => (
  <tbody className={`divide-y divide-gray-200 dark:divide-gray-700 ${className}`}>
    {children}
  </tbody>
);

export const TableRow = ({ children, className = '' }: TableProps) => (
  <tr className={`hover:bg-gray-50 dark:hover:bg-gray-800 ${className}`}>
    {children}
  </tr>
);

export const TableHead = ({ children, className = '' }: TableProps) => (
  <th 
    scope="col" 
    className={`px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider ${className}`}
  >
    {children}
  </th>
);

export const TableCell = ({ children, className = '' }: TableProps) => (
  <td className={`px-6 py-4 whitespace-nowrap text-sm ${className}`}>
    {children}
  </td>
);

// Input Component
interface InputProps {
  id?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
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
}: InputProps) => (
  <div className="w-full">
    {label && (
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label}
      </label>
    )}
    <input
      id={id}
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      disabled={disabled}
      maxLength={maxLength}
      className={`w-full p-3 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm 
                focus:ring-2 focus:ring-accent focus:border-accent 
                dark:bg-primary-800 dark:text-neutral ${className}`}
    />
  </div>
);

export const PageHeader = ({ 
  prefix = 'AI',
  title 
}: { 
  prefix?: string;
  title: string;
}) => {
  return (
    <div className="flex items-baseline gap-12 mt-8">
      <span className="text-accent font-bold text-3xl inline-block min-w-[3ch] relative z-10">{prefix}</span>
      <h1 className="text-primary dark:text-neutral text-3xl font-bold relative z-0">{title}</h1>
    </div>
  );
};

// Stepper Component
export interface StepperProps {
  steps: string[];
  currentStep: number;
  onChange?: (step: number) => void;
  className?: string;
}

export const Stepper = ({ 
  steps, 
  currentStep, 
  onChange, 
  className = '' 
}: StepperProps) => {
  return (
    <div className={`flex items-center w-full ${className}`}>
      {steps.map((step, index) => (
        <React.Fragment key={index}>
          {/* Step circle */}
          <div
            className={`relative flex items-center justify-center flex-shrink-0 w-8 h-8 rounded-full z-10 
              ${
                index < currentStep
                  ? 'bg-accent text-primary'
                  : index === currentStep
                  ? 'bg-accent/10 border-2 border-accent text-accent'
                  : 'bg-neutral-200 dark:bg-primary-700 text-primary-400 dark:text-neutral-400'
              } 
              ${onChange ? 'cursor-pointer' : ''}`}
            onClick={() => onChange?.(index)}
          >
            {index < currentStep ? (
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className="w-5 h-5" 
                viewBox="0 0 20 20" 
                fill="currentColor"
              >
                <path 
                  fillRule="evenodd" 
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                  clipRule="evenodd" 
                />
              </svg>
            ) : (
              <span className="text-sm font-medium">{index + 1}</span>
            )}
          </div>

          {/* Connector line */}
          {index < steps.length - 1 && (
            <div
              className={`flex-auto border-t-2 transition-colors 
                ${
                  index < currentStep
                    ? 'border-accent'
                    : 'border-neutral-200 dark:border-primary-700'
                }`}
            ></div>
          )}
        </React.Fragment>
      ))}
    </div>
  );
}; 