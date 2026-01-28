
import React from 'react';

interface DataTableProps {
  headers: string[];
  children: React.ReactNode;
}

export const DataTable: React.FC<DataTableProps> = ({ headers, children }) => (
  <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={`px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest ${i === headers.length - 1 ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-50">
          {children}
        </tbody>
      </table>
    </div>
  </div>
);
