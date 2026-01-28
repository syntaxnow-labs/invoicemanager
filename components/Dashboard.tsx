
import React, { useMemo, useState } from 'react';
import { 
  CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, XAxis, YAxis
} from 'recharts';
import { Invoice, InvoiceStatus, DocumentType, ExpenseRecord } from '../types';
import { CurrencyService } from '../services/exchangeRates';
// Added BarChart3 to imports
import { CircleDollarSign, TrendingDown, PieChart, Calendar, BarChart3 } from 'lucide-react';

interface DashboardProps {
  invoices: Invoice[];
  expenses: ExpenseRecord[];
  displayCurrency: string;
}

const Dashboard: React.FC<DashboardProps> = ({ invoices, expenses = [], displayCurrency }) => {
  const [dateFilter, setDateFilter] = useState<'this-month' | 'last-month' | 'this-year' | 'all'>('all');

  const currencyLabel = typeof displayCurrency === 'string' ? displayCurrency : 'USD';

  const isWithinPeriod = (dateStr: string) => {
    if (!dateStr) return false;
    const date = new Date(dateStr);
    const now = new Date();
    if (dateFilter === 'this-month') return date.getMonth() === now.getMonth() && date.getFullYear() === now.getFullYear();
    if (dateFilter === 'last-month') {
      const lastMonth = new Date(); lastMonth.setMonth(now.getMonth() - 1);
      return date.getMonth() === lastMonth.getMonth() && date.getFullYear() === lastMonth.getFullYear();
    }
    if (dateFilter === 'this-year') return date.getFullYear() === now.getFullYear();
    return true;
  };

  const filteredInvoices = useMemo(() => {
    return (invoices || []).filter(inv => isWithinPeriod(inv.date));
  }, [invoices, dateFilter]);

  const filteredExpenses = useMemo(() => {
    return (expenses || []).filter(exp => isWithinPeriod(exp.date));
  }, [expenses, dateFilter]);

  const stats = useMemo(() => {
    const rev = filteredInvoices.reduce((acc, inv) => {
      if (inv.type === DocumentType.INVOICE && inv.status === InvoiceStatus.PAID) {
        const total = (inv.items || []).reduce((sum, item) => {
          const qty = Number(item.quantity) || 0;
          const rate = Number(item.rate) || 0;
          const tax = Number(item.taxPercent) || 0;
          const disc = Number(item.discountPercent) || 0;
          return sum + (qty * rate * (1 + tax / 100 - disc / 100));
        }, 0);
        return acc + CurrencyService.convert(total, inv.currency || 'USD', currencyLabel);
      }
      return acc;
    }, 0);

    const expTotal = filteredExpenses.reduce((acc, exp) => acc + (Number(exp.amount) || 0), 0);

    return { 
      revenue: rev, 
      expenses: expTotal, 
      netProfit: rev - expTotal 
    };
  }, [filteredInvoices, filteredExpenses, currencyLabel]);

  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const data = months.map(m => ({ name: m, revenue: 0, expenses: 0 }));
    
    (invoices || []).forEach(inv => {
      if (inv.type === DocumentType.INVOICE && inv.status === InvoiceStatus.PAID) {
        const d = new Date(inv.date);
        const total = (inv.items || []).reduce((sum, item) => {
           const qty = Number(item.quantity) || 0;
           const rate = Number(item.rate) || 0;
           const tax = Number(item.taxPercent) || 0;
           const disc = Number(item.discountPercent) || 0;
           return sum + (qty * rate * (1 + tax / 100 - disc / 100));
        }, 0);
        data[d.getMonth()].revenue += CurrencyService.convert(total, inv.currency || 'USD', currencyLabel);
      }
    });

    (expenses || []).forEach(exp => {
      const d = new Date(exp.date);
      data[d.getMonth()].expenses += (Number(exp.amount) || 0);
    });

    return data;
  }, [invoices, expenses, currencyLabel]);

  const statCards = [
    { label: 'Settled Revenue', value: stats.revenue, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: CircleDollarSign },
    { label: 'Total Expenses', value: stats.expenses, color: 'text-rose-500', bg: 'bg-rose-50', icon: TrendingDown },
    { label: 'Operating Profit', value: stats.netProfit, color: stats.netProfit >= 0 ? 'text-indigo-600' : 'text-rose-600', bg: 'bg-indigo-50', icon: PieChart }
  ];

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-wrap items-center gap-6 sticky top-0 z-10 no-print">
        <div className="flex flex-col gap-1.5">
          <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1 flex items-center gap-1.5">
            <Calendar className="w-2.5 h-2.5" />
            Time Horizon
          </label>
          <select 
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value as any)}
            className="bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-xs font-bold outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
          >
            <option value="all">Lifetime Records</option>
            <option value="this-month">This Month</option>
            <option value="last-month">Last Month</option>
            <option value="this-year">This Year</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {statCards.map((item, idx) => (
          <div key={idx} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-6">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{item.label}</span>
              <div className={`p-3 rounded-2xl ${item.bg} ${item.color} group-hover:scale-110 transition-transform`}>
                <item.icon className="w-5 h-5" />
              </div>
            </div>
            <p className={`text-4xl font-black ${item.color} tracking-tighter`}>
              {currencyLabel} {Number(item.value).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </p>
          </div>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
        <h3 className="text-xl font-black mb-10 flex items-center gap-2">
          {/* BarChart3 is now imported */}
          <BarChart3 className="w-5 h-5 text-slate-400" />
          Financial Trajectory
        </h3>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10, fontWeight: 700}} />
              <Tooltip 
                contentStyle={{borderRadius: '24px', border: 'none', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.15)', fontWeight: 'bold'}}
                formatter={(value: any) => [Number(value).toLocaleString(undefined, { minimumFractionDigits: 2 }), 'Value']}
              />
              <Area type="monotone" dataKey="revenue" stroke="#10b981" fill="#10b981" fillOpacity={0.1} strokeWidth={4} />
              <Area type="monotone" dataKey="expenses" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.1} strokeWidth={4} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
