
import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  variant?: 'white' | 'dark' | 'glass';
}

export const Card: React.FC<CardProps> = ({ children, className = '', variant = 'white' }) => {
  const variants = {
    white: 'bg-white border-slate-100 shadow-sm',
    dark: 'bg-slate-900 text-white shadow-2xl',
    glass: 'bg-white/95 backdrop-blur-md border-slate-200'
  };

  return (
    <div className={`rounded-[2.5rem] border p-8 ${variants[variant]} ${className}`}>
      {children}
    </div>
  );
};
