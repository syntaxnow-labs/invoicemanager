
import React, { useState, useEffect } from 'react';
import { Invoice, Client, InvoiceItem, InvoiceStatus, DocumentType, ProductItem, BusinessProfile } from '../types';
import { ApiService } from '../services/api';
import { generateId } from '../utils/ids';

interface InvoiceFormProps {
  clients: Client[];
  products: ProductItem[];
  business: BusinessProfile;
  onSubmit: (invoice: Invoice) => void;
  onCancel: () => void;
  initialData?: Invoice | null;
  defaultType?: DocumentType;
}

const InvoiceForm: React.FC<InvoiceFormProps> = ({ 
  clients, 
  products,
  business,
  onSubmit, 
  onCancel, 
  initialData, 
  defaultType = DocumentType.INVOICE 
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Use initialData type if editing/converting, otherwise use default
  const activeDocType = initialData?.type || defaultType;
  const isQuote = activeDocType === DocumentType.QUOTATION;
  const isCreditNote = activeDocType === DocumentType.CREDIT_NOTE;
  
  const theme = {
    bg: isQuote ? 'bg-amber-600' : isCreditNote ? 'bg-rose-600' : 'bg-indigo-600',
    text: isQuote ? 'text-amber-600' : isCreditNote ? 'text-rose-600' : 'text-indigo-600',
    lightBg: isQuote ? 'bg-amber-50' : isCreditNote ? 'bg-rose-50' : 'bg-indigo-50',
    border: isQuote ? 'border-amber-100' : isCreditNote ? 'border-rose-100' : 'border-indigo-100',
  };

  const [formData, setFormData] = useState<Partial<Invoice>>({
    type: activeDocType,
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    dueDate: new Date(Date.now() + 14*24*60*60*1000).toISOString().split('T')[0],
    clientId: '',
    status: isQuote ? InvoiceStatus.DRAFT : InvoiceStatus.SENT,
    items: [],
    currency: business.currency || 'USD',
    notes: '',
    terms: business.bankDetails ? `Bank Details:\n${business.bankDetails}` : '1. Goods once sold will not be taken back.\n2. Please pay within 14 days.',
    ...initialData
  });

  // Ensure at least one item exists if it's a new document
  useEffect(() => {
    if (!formData.items || formData.items.length === 0) {
      setFormData(prev => ({
        ...prev,
        items: [{ id: generateId(), description: '', quantity: 1, rate: 0, taxPercent: 0, discountPercent: 0 }]
      }));
    }
  }, []);

  // AUTO-NUMBERING LOGIC
  // This triggers if there's no invoice number (new doc or conversion)
  // We depend on activeDocType so it refreshes if the user switches types
  useEffect(() => {
    if (!formData.invoiceNumber) {
      const fetchNumber = async () => {
        try {
          // Fetch from the API which handles prefixes and database sequences
          const { nextNumber } = await ApiService.getNextNumber(activeDocType);
          setFormData(prev => ({ ...prev, invoiceNumber: nextNumber }));
        } catch (e) {
          console.error("Failed to fetch next document number:", e);
          setFormData(prev => ({ ...prev, invoiceNumber: 'AUTO-GEN' }));
        }
      };
      fetchNumber();
    }
  }, [activeDocType, formData.invoiceNumber]);

  const addItem = () => {
    setFormData(prev => ({
      ...prev,
      items: [...(prev.items || []), { id: generateId(), description: '', quantity: 1, rate: 0, taxPercent: 0, discountPercent: 0 }]
    }));
  };

  const removeItem = (id: string) => {
    if ((formData.items?.length || 0) <= 1) return;
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).filter(i => i.id !== id)
    }));
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    setFormData(prev => ({
      ...prev,
      items: (prev.items || []).map(item => item.id === id ? { ...item, [field]: value } : item)
    }));
  };

  const handleProductSelect = (rowId: string, productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;
    updateItem(rowId, 'description', product.name);
    updateItem(rowId, 'rate', product.defaultRate);
    updateItem(rowId, 'taxPercent', product.defaultTax);
    updateItem(rowId, 'productId', product.id);
    updateItem(rowId, 'hsnCode', product.hsnCode);
  };

  const totals = (formData.items || []).reduce((acc, item) => {
    const qty = Number(item.quantity) || 0;
    const rate = Number(item.rate) || 0;
    const base = qty * rate;
    const disc = base * ((item.discountPercent || 0) / 100);
    const taxable = base - disc;
    const tax = taxable * ((item.taxPercent || 0) / 100);
    return {
      subtotal: acc.subtotal + base,
      tax: acc.tax + tax,
      total: acc.total + taxable + tax
    };
  }, { subtotal: 0, tax: 0, total: 0 });

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.clientId) {
      alert("Please select a client before saving.");
      return;
    }
    setIsSubmitting(true);
    try {
      await onSubmit(formData as Invoice);
    } catch (err) {
      alert("Error saving document: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleFormSubmit} className="bg-white p-6 md:p-12 rounded-[2.5rem] shadow-2xl border border-slate-100 max-w-7xl mx-auto animate-in fade-in zoom-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start mb-12 border-b border-slate-50 pb-8 gap-6">
        <div>
          <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-1">
            {initialData?.id ? 'Edit ' : (initialData?.convertedFromId ? 'Convert ' : 'New ')}{activeDocType}
          </h2>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${theme.bg}`}></span>
            Document ID: {formData.invoiceNumber || 'Generating...'}
          </p>
        </div>
        <div className="flex gap-4">
           <div className={`${theme.lightBg} ${theme.text} px-6 py-3 rounded-2xl border ${theme.border} font-black text-xs uppercase tracking-widest`}>
             {activeDocType}
           </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10 mb-12">
        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Client / Customer</label>
            <select 
              required
              value={formData.clientId}
              onChange={(e) => setFormData({...formData, clientId: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800 outline-none focus:ring-4 focus:ring-indigo-500/5 transition-all"
            >
              <option value="">Select Customer...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Document Date</label>
            <input 
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Payment Due Date</label>
            <input 
              type="date"
              required
              value={formData.dueDate}
              onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
            />
          </div>
        </div>

        <div className="bg-slate-50 rounded-[2rem] p-8 border border-slate-100 space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Status</label>
            <div className="flex flex-wrap gap-2">
              {[InvoiceStatus.DRAFT, InvoiceStatus.SENT, InvoiceStatus.PAID, InvoiceStatus.CANCELLED].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({...formData, status: s})}
                  className={`px-3 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${formData.status === s ? 'bg-slate-900 text-white' : 'bg-white text-slate-400 border border-slate-100'}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Currency</label>
            <input 
              value={formData.currency}
              onChange={e => setFormData({...formData, currency: e.target.value.toUpperCase()})}
              className="w-full bg-white border border-slate-100 rounded-xl px-4 py-3 font-black text-xs uppercase"
            />
          </div>
        </div>
      </div>

      <div className="mb-12 overflow-x-auto">
        <div className="flex justify-between items-end mb-6">
          <h3 className="text-xl font-black text-slate-900 tracking-tight">Line Items</h3>
          <button type="button" onClick={addItem} className={`px-5 py-2.5 ${theme.lightBg} ${theme.text} rounded-xl font-black text-[10px] uppercase border ${theme.border} hover:opacity-80 transition-all`}>
            + Add New Line
          </button>
        </div>

        <table className="w-full border-separate border-spacing-y-3 min-w-[1000px]">
          <thead>
            <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <th className="px-6 text-left">Description</th>
              <th className="px-4 text-center">Qty</th>
              <th className="px-4 text-right">Unit Price</th>
              <th className="px-4 text-center">Tax %</th>
              <th className="px-4 text-right">Total</th>
              <th className="px-4"></th>
            </tr>
          </thead>
          <tbody>
            {formData.items?.map((item) => (
              <tr key={item.id} className="group">
                <td className="bg-slate-50/50 rounded-l-2xl p-4 border border-slate-100 border-r-0">
                  <div className="flex flex-col gap-2">
                    <input 
                      required
                      value={item.description}
                      onChange={e => updateItem(item.id, 'description', e.target.value)}
                      className="bg-transparent font-bold text-slate-800 text-sm outline-none"
                      placeholder="Item name or service description..."
                    />
                    <div className="flex gap-4">
                      <select 
                        onChange={e => handleProductSelect(item.id, e.target.value)}
                        className="text-[9px] font-black uppercase text-indigo-500 bg-transparent outline-none cursor-pointer"
                      >
                        <option value="">Link Catalog Item...</option>
                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                      {item.hsnCode && <span className="text-[9px] font-black text-slate-300 uppercase tracking-wider">HSN: {item.hsnCode}</span>}
                    </div>
                  </div>
                </td>
                <td className="bg-slate-50/50 p-4 border-y border-slate-100 text-center">
                  <input 
                    type="number" step="0.01" required
                    value={item.quantity} 
                    onChange={e => updateItem(item.id, 'quantity', parseFloat(e.target.value) || 0)}
                    className="bg-white border border-slate-200 rounded-lg w-20 px-2 py-1 text-center font-bold text-sm"
                  />
                </td>
                <td className="bg-slate-50/50 p-4 border-y border-slate-100 text-right">
                  <input 
                    type="number" step="0.01" required
                    value={item.rate} 
                    onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="bg-white border border-slate-200 rounded-lg w-32 px-2 py-1 text-right font-bold text-sm"
                  />
                </td>
                <td className="bg-slate-50/50 p-4 border-y border-slate-100 text-center">
                  <input 
                    type="number" 
                    value={item.taxPercent} 
                    onChange={e => updateItem(item.id, 'taxPercent', parseFloat(e.target.value) || 0)}
                    className="bg-transparent text-center font-bold text-slate-400 text-xs w-12 outline-none"
                  />
                </td>
                <td className="bg-slate-50/50 p-4 border-y border-slate-100 text-right font-black text-slate-900">
                  {(Number(item.quantity || 0) * Number(item.rate || 0) * (1 + Number(item.taxPercent || 0)/100)).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </td>
                <td className="bg-slate-50/50 rounded-r-2xl p-4 border border-slate-100 border-l-0 text-center">
                  <button type="button" onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-rose-600 transition-colors text-xl font-light">×</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
        <div className="space-y-6">
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Notes / Description</label>
            <textarea 
              rows={3}
              value={formData.notes}
              onChange={e => setFormData({...formData, notes: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium text-xs text-slate-600 outline-none"
              placeholder="Internal notes or messages for the client..."
            />
          </div>
          <div>
            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Terms & Conditions</label>
            <textarea 
              rows={3}
              value={formData.terms}
              onChange={e => setFormData({...formData, terms: e.target.value})}
              className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-medium text-[10px] text-slate-400 outline-none"
            />
          </div>
        </div>

        <div className={`rounded-[2.5rem] p-10 text-white shadow-2xl ${theme.bg}`}>
          <div className="space-y-4">
            <div className="flex justify-between text-white/70 font-bold">
              <span className="text-[10px] uppercase tracking-widest">Gross Subtotal</span>
              <span>{formData.currency} {totals.subtotal.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-white/70 font-bold">
              <span className="text-[10px] uppercase tracking-widest">Calculated GST/Tax</span>
              <span>+ {formData.currency} {totals.tax.toLocaleString()}</span>
            </div>
            <div className="pt-6 border-t border-white/20 flex justify-between items-end">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">Grand Total Due</p>
                <p className="text-4xl font-black tracking-tighter">{formData.currency} {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
              </div>
              <div className="text-right">
                <button 
                  type="submit"
                  disabled={isSubmitting}
                  className="px-10 py-5 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-xl hover:scale-105 active:scale-95 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : (initialData?.id ? 'Update Document' : 'Generate Document')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 flex justify-between items-center">
        <button type="button" onClick={onCancel} className="text-slate-400 font-black text-[10px] uppercase tracking-widest hover:text-slate-600">
          Cancel & Close
        </button>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer">
             <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-slate-200 text-indigo-600 focus:ring-indigo-500" 
              checked={formData.status === InvoiceStatus.PAID}
              onChange={e => setFormData({...formData, status: e.target.checked ? InvoiceStatus.PAID : InvoiceStatus.SENT})}
            />
             <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Mark as Fully Paid</span>
          </label>
        </div>
      </div>
    </form>
  );
};

export default InvoiceForm;
