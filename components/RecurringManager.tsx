
import React, { useState } from 'react';
import { RecurringTemplate, Client, RecurringFrequency, InvoiceItem } from '../types';
import { CurrencyService } from '../services/exchangeRates';
import { generateId } from '../utils/ids';

interface RecurringManagerProps {
  templates: RecurringTemplate[];
  clients: Client[];
  onSave: (template: RecurringTemplate) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const RecurringManager: React.FC<RecurringManagerProps> = ({ templates, clients, onSave, onDelete, onToggle }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<RecurringTemplate | null>(null);

  const [formData, setFormData] = useState<Partial<RecurringTemplate>>({
    clientId: '',
    frequency: RecurringFrequency.MONTHLY,
    startDate: new Date().toISOString().split('T')[0],
    isActive: true,
    currency: 'USD',
    items: [{ id: generateId(), description: '', quantity: 1, rate: 0, taxPercent: 0, discountPercent: 0 }]
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const nextRunDate = formData.startDate!; // Automation logic handles incrementing this
    const template: RecurringTemplate = {
      ...(editingTemplate || {}),
      ...formData,
      id: editingTemplate?.id || generateId(),
      nextRunDate,
      isActive: true
    } as RecurringTemplate;
    onSave(template);
    setIsAdding(false);
    setEditingTemplate(null);
  };

  const updateItem = (id: string, field: keyof InvoiceItem, value: any) => {
    const newItems = (formData.items || []).map(item => 
      item.id === id ? { ...item, [field]: value } : item
    );
    setFormData({ ...formData, items: newItems });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Automated Billing</h2>
          <p className="text-slate-500 font-medium">Schedule recurring revenue streams</p>
        </div>
        {!isAdding && (
          <button 
            onClick={() => setIsAdding(true)}
            className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all"
          >
            + New Template
          </button>
        )}
      </div>

      {isAdding ? (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-xl space-y-8 max-w-4xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Target Client</label>
              <select 
                required
                value={formData.clientId}
                onChange={e => {
                  const client = clients.find(c => c.id === e.target.value);
                  setFormData({...formData, clientId: e.target.value, currency: client?.currency || 'USD'});
                }}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
              >
                <option value="" disabled>Select client...</option>
                {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Frequency</label>
              <select 
                value={formData.frequency}
                onChange={e => setFormData({...formData, frequency: e.target.value as RecurringFrequency})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
              >
                {Object.values(RecurringFrequency).map(f => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Start Date</label>
              <input 
                type="date"
                required
                value={formData.startDate}
                onChange={e => setFormData({...formData, startDate: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">End Date (Optional)</label>
              <input 
                type="date"
                value={formData.endDate || ''}
                onChange={e => setFormData({...formData, endDate: e.target.value})}
                className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="space-y-4 pt-6 border-t border-slate-50">
            <h4 className="text-xs font-black uppercase text-slate-400 tracking-widest">Subscription Items</h4>
            
            <div className="grid grid-cols-12 gap-4 px-4 mb-2">
              <div className="col-span-6 text-[10px] font-black text-slate-300 uppercase tracking-widest">Item Description</div>
              <div className="col-span-3 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Rate</div>
              <div className="col-span-3 text-[10px] font-black text-slate-300 uppercase tracking-widest text-right">Currency</div>
            </div>

            {formData.items?.map(item => (
              <div key={item.id} className="grid grid-cols-12 gap-4 items-center bg-slate-50 p-4 rounded-2xl">
                <div className="col-span-6">
                  <input 
                    placeholder="Description"
                    value={item.description}
                    onChange={e => updateItem(item.id, 'description', e.target.value)}
                    className="w-full bg-transparent font-bold text-slate-800 outline-none"
                  />
                </div>
                <div className="col-span-3">
                  <input 
                    type="number"
                    placeholder="Rate"
                    value={item.rate}
                    onChange={e => updateItem(item.id, 'rate', parseFloat(e.target.value) || 0)}
                    className="w-full bg-transparent font-bold text-slate-800 text-right outline-none"
                  />
                </div>
                <div className="col-span-3 text-right font-black text-slate-400 uppercase text-[10px]">
                  {formData.currency}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-4">
            <button type="button" onClick={() => setIsAdding(false)} className="px-6 py-3 text-slate-400 font-bold uppercase text-xs tracking-widest">Cancel</button>
            <button type="submit" className="px-8 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase text-xs tracking-widest shadow-xl">Activate Automation</button>
          </div>
        </form>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {templates.map(tpl => {
            const client = clients.find(c => c.id === tpl.clientId);
            const total = tpl.items.reduce((s, i) => s + (i.quantity * i.rate), 0);
            return (
              <div key={tpl.id} className={`bg-white p-8 rounded-[2rem] border ${tpl.isActive ? 'border-indigo-100 shadow-indigo-100/50' : 'border-slate-100 opacity-60'} shadow-lg transition-all`}>
                <div className="flex justify-between items-start mb-6">
                  <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${tpl.isActive ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    {tpl.isActive ? 'Active' : 'Paused'}
                  </span>
                  <div className="flex gap-2">
                    <button onClick={() => onToggle(tpl.id)} className="text-lg" title={tpl.isActive ? 'Pause' : 'Resume'}>{tpl.isActive ? '⏸️' : '▶️'}</button>
                    <button onClick={() => onDelete(tpl.id)} className="text-lg" title="Delete">🗑️</button>
                  </div>
                </div>
                <h3 className="text-xl font-black text-slate-900 mb-1">{client?.name}</h3>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-4">{tpl.frequency} Cycle</p>
                <div className="flex justify-between items-end pt-6 border-t border-slate-50">
                  <div>
                    <p className="text-[10px] font-black text-slate-300 uppercase">Next Generation</p>
                    <p className="font-bold text-indigo-600">{tpl.nextRunDate}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black">{tpl.currency} {total.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            );
          })}
          {templates.length === 0 && (
            <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
              <span className="text-4xl mb-4 block">🤖</span>
              <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No recurring automations configured</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RecurringManager;
