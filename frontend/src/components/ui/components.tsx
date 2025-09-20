import React, { ReactNode } from 'react';
import { Feather } from 'lucide-react';
import { Link } from 'react-router-dom';

// --- Bespoke Components for "The Scholar's Desk" Theme ---

export const Logo = ({ className = '', minimal = false, animated = false }: { className?: string; minimal?: boolean; animated?: boolean }) => (
  <Link to="/" className={`flex items-center space-x-2 group ${className}`}>
    {minimal ? (
      <Feather className={`text-gold-leaf ${animated ? 'group-hover:animate-bounce' : ''}`} size={24} />
    ) : (
      <>
        <Feather className={`text-gold-leaf ${animated ? 'group-hover:animate-pulse' : ''}`} size={28} />
        <span className="font-serif text-2xl font-bold text-parchment">
          Cite<span className="text-gold-leaf">AI</span>
        </span>
      </>
    )}
  </Link>
);

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button = ({ children, onClick, variant = 'primary', size = 'md', className = '', disabled = false, type = 'button' }: ButtonProps) => {
  const baseClasses = "inline-flex items-center justify-center rounded-md font-semibold font-serif transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-ink";
  const sizeClasses = { sm: 'px-4 py-2 text-sm', md: 'px-6 py-2 text-base', lg: 'px-8 py-3 text-lg' };
  const variantClasses = {
    primary: "bg-gold-leaf text-ink hover:bg-gold-leaf-light hover:shadow-gold-glow-md disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none",
    outline: "border-2 border-gold-leaf/50 text-gold-leaf bg-transparent hover:bg-gold-leaf/10 hover:border-gold-leaf",
    ghost: "bg-transparent text-gold-leaf hover:bg-gold-leaf/10",
  };
  return <button type={type} onClick={onClick} disabled={disabled} className={`${baseClasses} ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}>{children}</button>;
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

export const Input = ({ id, type = 'text', value, onChange, placeholder = '', className = '', disabled = false, label, maxLength }: InputProps) => (
  <div>
    {label && <label htmlFor={id} className="block text-sm font-serif font-semibold mb-2 text-muted-ink">{label}</label>}
    {type === 'textarea' ? (
      <textarea
        id={id}
        value={value}
        onChange={onChange as any}
        placeholder={placeholder}
        disabled={disabled}
        className={`w-full p-3 rounded-md border border-border bg-input text-foreground text-base transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring resize-none ${className}`}
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
        className={`w-full p-3 rounded-md border border-border bg-input text-foreground text-base transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-ring focus:border-ring ${className}`}
        maxLength={maxLength}
      />
    )}
  </div>
);

// Simple Stepper component used by the generator wizard
export const Stepper = ({ steps, currentStep = 0, onChange = (s: number) => {} }: { steps: string[]; currentStep?: number; onChange?: (step: number) => void }) => (
  <div className="flex items-center space-x-4" role="tablist" aria-label="Wizard steps">
    {steps.map((s, idx) => (
      <button
        key={s}
        onClick={() => onChange(idx)}
        role="tab"
        aria-selected={idx === currentStep}
        className={`px-3 py-1 rounded-md font-serif text-sm ${idx === currentStep ? 'bg-gold-500 text-royal-midnight' : 'text-parchment/80 bg-transparent hover:bg-gold-500/8'}`}
      >
        {s}
      </button>
    ))}
  </div>
);

// --- Overhauled Data Table Components ---
export const Table = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <div className="overflow-x-auto"><table className={`min-w-full divide-y-2 divide-border ${className}`}>{children}</table></div>
);
export const TableHeader = ({ children, className = '' }: { children: ReactNode, className?: string }) => <thead className={className}>{children}</thead>;
export const TableBody = ({ children, className = '' }: { children: ReactNode, className?: string }) => <tbody className={`divide-y divide-border ${className}`}>{children}</tbody>;
export const TableRow = ({ children, className = '' }: { children: ReactNode, className?: string }) => <tr className={`hover:bg-card/50 ${className}`}>{children}</tr>;
export const TableHead = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <th scope="col" className={`px-6 py-4 text-left text-xs font-serif font-bold text-muted-ink uppercase tracking-wider ${className}`}>{children}</th>
);
export const TableCell = ({ children, className = '' }: { children: ReactNode, className?: string }) => <td className={`px-6 py-4 whitespace-nowrap text-sm text-parchment ${className}`}>{children}</td>;


// --- Other Styled Components ---
export const Badge = ({ children, className = '' }: { children: ReactNode, className?: string }) => (
  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gold-leaf/10 text-gold-leaf-light border border-gold-leaf/20 ${className}`}>
    {children}
  </span>
);

export const PageHeader = ({ title }: { title: string }) => (
  <h1 className="text-5xl font-bold font-serif text-primary border-b-2 border-border pb-4 mb-8">{title}</h1>
);