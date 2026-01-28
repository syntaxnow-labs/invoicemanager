
import React from 'react';
import { PaymentRecord } from '../../types';
import { DataTable } from './DataTable';

export const PaymentTable: React.FC<{ payments: PaymentRecord[] }> = ({ payments }) => (
  <DataTable headers={['Date', 'Reference', 'Amount', 'Mode']}>
    {payments.map(p => (
      <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
        <td className="px-8 py-6 text-sm font-medium">{p.date}</td>
        <td className="px-8 py-6 text-sm font-mono text-indigo-600">{p.reference}</td>
        <td className="px-8 py-6 font-black">{p.amount.toLocaleString()}</td>
        <td className="px-8 py-6 text-right">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{p.mode}</span>
        </td>
      </tr>
    ))}
    {payments.length === 0 && (
      <tr>
        <td colSpan={4} className="px-8 py-20 text-center text-slate-400 italic">No transactions found</td>
      </tr>
    )}
  </DataTable>
);
