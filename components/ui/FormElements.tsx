
import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
}

export const Input: React.FC<InputProps> = ({ label, className = '', ...props }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
    <input 
      className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800 transition-all ${className}`}
      {...props}
    />
  </div>
);

export const Select: React.FC<InputProps & { children: React.ReactNode }> = ({ label, children, className = '', ...props }) => (
  <div className="w-full">
    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{label}</label>
    <select 
      className={`w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800 appearance-none transition-all ${className}`}
      {...props as any}
    >
      {children}
    </select>
  </div>
);
