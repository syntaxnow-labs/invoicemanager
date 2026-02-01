
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
     test
    </div>
  );
};

export default Dashboard;
