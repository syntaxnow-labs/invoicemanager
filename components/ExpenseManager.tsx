
import React, { useState, useEffect,useMemo } from 'react';
import { ExpenseRecord, ExpenseCategory, PaymentMode, BusinessProfile } from '../types';
import { DataTable } from './shared/DataTable';
import { Pencil, Trash2, Eye } from 'lucide-react';
import { useExpenseStore, useBusinessStore } from '../services/store';


const ExpenseManager: React.FC = ( ) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [receiptPreview, setReceiptPreview] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseRecord | null>(null);
  const expenses :ExpenseRecord[] = useExpenseStore((state:any) => state.expenses);
  const addExpenses = useExpenseStore((state:any) => state.addExpenses);
  const deleteExpenses = useExpenseStore((state:any) => state.deleteExpenses);
  const businessProfile = useBusinessStore((state:any) => state.businessProfile);

   const effectiveProfile = useMemo(() => {
      return (businessProfile || { 
        name: 'Syntaxnow Invoicing Business', 
        currency: 'USD', 
        autoDeductInventory: true
      }) as BusinessProfile;
    }, [businessProfile]);
  
    const currency  = String(effectiveProfile.currency || 'USD');
  
  const [formData, setFormData] = useState<Partial<ExpenseRecord>>({
    date: new Date().toISOString().split('T')[0],
    amount: 0,
    category: ExpenseCategory.OTHER,
    vendor: '',
    mode: PaymentMode.CASH,
    reference: ''
  });

  useEffect(() => {
    if (editingExpense) {
      setFormData({
        ...editingExpense
      });
      setIsAdding(true);
    }
  }, [editingExpense]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({ ...formData, receiptUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const resetForm = () => {
    setIsAdding(false);
    setEditingExpense(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
      amount: 0,
      category: ExpenseCategory.OTHER,
      vendor: '',
      mode: PaymentMode.CASH,
      reference: '',
      receiptUrl: undefined
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      // Create payload. Only include ID if we are UPDATING an existing record.
      const payload: Partial<ExpenseRecord> = {
        ...formData,
        amount: Number(formData.amount)
      };
      
      if (editingExpense) {
        payload.id = editingExpense.id;
      }

      await addExpenses(payload);
      resetForm();
    } catch (err) {
      alert("Failed to save expense: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (expense: ExpenseRecord) => {
    setEditingExpense(expense);
  };

  const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Expense Ledger</h2>
          <p className="text-slate-500 font-medium">Track your business overheads and spending</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-white px-6 py-3 rounded-2xl border border-slate-100 shadow-sm">
            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Total Period Spend</p>
            <p className="text-lg font-black text-rose-600">{currency} {totalExpense.toLocaleString()}</p>
          </div>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-rose-600 text-white rounded-xl font-bold shadow-lg hover:bg-rose-700 transition-all"
            >
              + Log Expense
            </button>
          )}
        </div>
      </div>

      {isAdding ? (
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl max-w-4xl mx-auto animate-in zoom-in-95">
          <h3 className="text-xl font-black mb-8 text-rose-600">
            {editingExpense ? 'Refine Expenditure Record' : 'New Expenditure Entry'}
          </h3>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Vendor / Payee</label>
              <input 
                required
                value={formData.vendor}
                onChange={e => setFormData({...formData, vendor: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-rose-500/10 outline-none font-bold text-slate-800"
                placeholder="e.g. AWS, Office Depot"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Amount ({currency})</label>
              <input 
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={e => setFormData({...formData, amount: parseFloat(e.target.value) || 0})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-rose-500/10 outline-none font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Category</label>
              <select 
                value={formData.category}
                onChange={e => setFormData({...formData, category: e.target.value as ExpenseCategory})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
              >
                {Object.values(ExpenseCategory).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Date</label>
              <input 
                type="date"
                required
                value={formData.date}
                onChange={e => setFormData({...formData, date: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-rose-500/10 outline-none font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Mode</label>
              <select 
                value={formData.mode}
                onChange={e => setFormData({...formData, mode: e.target.value as PaymentMode})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
              >
                {Object.values(PaymentMode).map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Receipt Image</label>
              <div className="relative">
                <input 
                  type="file"
                  onChange={handleFileChange}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 text-xs font-bold text-slate-400"
                  accept="image/*"
                />
                {formData.receiptUrl && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-emerald-500 text-xs font-black">✓ ATTACHED</span>}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reference / Note</label>
              <input 
                value={formData.reference}
                onChange={e => setFormData({...formData, reference: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-rose-500/10 outline-none font-bold text-slate-800"
                placeholder="Transaction ID or purpose"
              />
            </div>
            <div className="md:col-span-2 flex justify-end gap-4 pt-4">
              <button type="button" onClick={resetForm} className="px-8 py-4 text-slate-400 font-black text-[10px] uppercase tracking-widest">Cancel</button>
              <button type="submit" disabled={isSubmitting} className="px-10 py-4 bg-rose-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl shadow-rose-100 disabled:opacity-50">
                {isSubmitting ? 'Syncing...' : (editingExpense ? 'Update Record' : 'Log Expenditure')}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <DataTable headers={['Date', 'Vendor', 'Category', 'Amount', 'Ref', 'Actions']}>
          {expenses.map(e => (
            <tr key={e.id} className="group hover:bg-slate-50/50 transition-all">
              <td className="px-8 py-6 text-sm font-medium text-slate-500">{e.date}</td>
              <td className="px-8 py-6 font-black text-slate-800">{e.vendor}</td>
              <td className="px-8 py-6">
                <span className="px-2 py-1 bg-slate-100 text-slate-500 text-[8px] font-black uppercase rounded tracking-widest">{e.category}</span>
              </td>
              <td className="px-8 py-6 font-black text-rose-600">-{currency} {Number(e.amount || 0).toLocaleString()}</td>
              <td className="px-8 py-6 text-xs text-slate-400 font-mono">{e.reference}</td>
              <td className="px-8 py-6 text-right space-x-2">
                {e.receiptUrl && (
                  <button 
                    onClick={() => setReceiptPreview(e.receiptUrl!)}
                    className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold text-xs" 
                    title="View Receipt"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                )}
                <button 
                  onClick={() => handleEdit(e)}
                  className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold text-xs" 
                  title="Edit Record"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button 
                  onClick={() => { if(confirm('Delete permanently?')) deleteExpenses(e.id); }}
                  className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold text-xs" 
                  title="Delete Record"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </td>
            </tr>
          ))}
          {expenses.length === 0 && (
            <tr>
              <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">No expenses recorded yet.</td>
            </tr>
          )}
        </DataTable>
      )}

      {receiptPreview && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm z-[200] flex items-center justify-center p-10" onClick={() => setReceiptPreview(null)}>
          <img src={receiptPreview} className="max-w-full max-h-full rounded-2xl shadow-2xl object-contain border-4 border-white" alt="Receipt" />
          <button className="absolute top-10 right-10 text-white text-4xl font-light">×</button>
        </div>
      )}
    </div>
  );
};

export default ExpenseManager;
