
import React from 'react';

interface StatusBadgeProps {
  status: any;
  className?: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, className = '' }) => {
  const sText = String(status || '').toUpperCase();
  
  const getColors = () => {
    if (sText === 'PAID' || sText === 'HEALTHY' || sText === 'ACCEPTED') return 'bg-emerald-100 text-emerald-700';
    if (sText === 'SENT' || sText === 'ACTIVE') return 'bg-indigo-100 text-indigo-700';
    if (sText === 'OVERDUE' || sText === 'OUT OF STOCK') return 'bg-rose-100 text-rose-700';
    if (sText === 'LOW STOCK' || sText === 'PARTIAL') return 'bg-amber-100 text-amber-700';
    return 'bg-slate-100 text-slate-600';
  };

  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${getColors()} ${className}`}>
      {String(status || 'Draft')}
    </span>
  );
};
