
import React, { useState, useMemo } from 'react';
import { ProductItem, InventoryTransaction } from '../types';

interface InventoryDashboardProps {
  products: ProductItem[];
  transactions: InventoryTransaction[];
  onAdjustStock: (productId: string, qty: number, type: 'IN' | 'OUT' | 'ADJUSTMENT', note?: string) => void;
}

const InventoryDashboard: React.FC<InventoryDashboardProps> = ({ products, transactions, onAdjustStock }) => {
  const [showAdjustmentModal, setShowAdjustmentModal] = useState<string | null>(null);
  const [adjustmentQty, setAdjustmentQty] = useState(0);
  const [adjustmentNote, setAdjustmentNote] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const trackedProducts = products.filter(p => p.trackInventory);
  
  const filteredProducts = useMemo(() => {
    if (filter === 'low') return trackedProducts.filter(p => p.stockLevel <= p.lowStockThreshold && p.stockLevel > 0);
    if (filter === 'out') return trackedProducts.filter(p => p.stockLevel <= 0);
    return trackedProducts;
  }, [trackedProducts, filter]);

  const stockValuation = useMemo(() => {
    return trackedProducts.reduce((acc, p) => acc + (p.stockLevel * p.defaultRate), 0);
  }, [trackedProducts]);

  const lowStockCount = trackedProducts.filter(p => p.stockLevel <= p.lowStockThreshold && p.stockLevel > 0).length;
  const outOfStockCount = trackedProducts.filter(p => p.stockLevel <= 0).length;

  const handleAdjust = (productId: string) => {
    onAdjustStock(productId, Math.abs(adjustmentQty), adjustmentQty > 0 ? 'IN' : 'OUT', adjustmentNote);
    setShowAdjustmentModal(null);
    setAdjustmentQty(0);
    setAdjustmentNote('');
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Inventory Value</p>
          <p className="text-3xl font-black text-indigo-600 tracking-tighter">${stockValuation.toLocaleString()}</p>
        </div>
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Total SKU Tracked</p>
          <p className="text-3xl font-black text-slate-900">{trackedProducts.length}</p>
        </div>
        <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all cursor-pointer ${filter === 'low' ? 'bg-amber-600 text-white border-amber-500' : 'bg-amber-50 text-amber-700 border-amber-100'}`} onClick={() => setFilter(filter === 'low' ? 'all' : 'low')}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${filter === 'low' ? 'text-white/70' : 'text-amber-600'}`}>Low Stock Alerts</p>
          <p className="text-3xl font-black">{lowStockCount}</p>
        </div>
        <div className={`p-8 rounded-[2.5rem] border shadow-sm transition-all cursor-pointer ${filter === 'out' ? 'bg-rose-600 text-white border-rose-500' : 'bg-rose-50 text-rose-700 border-rose-100'}`} onClick={() => setFilter(filter === 'out' ? 'all' : 'out')}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${filter === 'out' ? 'text-white/70' : 'text-rose-600'}`}>Out of Stock</p>
          <p className="text-3xl font-black">{outOfStockCount}</p>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h3 className="text-xl font-black text-slate-900">Live Inventory Levels</h3>
          {filter !== 'all' && (
            <button onClick={() => setFilter('all')} className="text-[10px] font-black uppercase text-indigo-600 bg-indigo-50 px-3 py-2 rounded-lg">Clear Filters</button>
          )}
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Product</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">SKU/HSN</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Status</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Value</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Stock</th>
                <th className="px-8 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filteredProducts.map(p => (
                <tr key={p.id} className="hover:bg-slate-50/50 transition-all">
                  <td className="px-8 py-6">
                    <p className="font-black text-slate-800">{p.name}</p>
                    <p className="text-xs text-slate-400">{p.description}</p>
                  </td>
                  <td className="px-8 py-6 font-mono text-xs text-slate-400">{p.hsnCode || '---'}</td>
                  <td className="px-8 py-6 text-center">
                    {p.stockLevel <= 0 ? (
                      <span className="px-3 py-1 bg-rose-100 text-rose-700 rounded-full text-[9px] font-black uppercase tracking-widest">Out of Stock</span>
                    ) : p.stockLevel <= p.lowStockThreshold ? (
                      <span className="px-3 py-1 bg-amber-100 text-amber-700 rounded-full text-[9px] font-black uppercase tracking-widest">Low Stock</span>
                    ) : (
                      <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[9px] font-black uppercase tracking-widest">Healthy</span>
                    )}
                  </td>
                  <td className="px-8 py-6 text-right font-bold text-slate-600">
                    ${(p.stockLevel * p.defaultRate).toLocaleString()}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <p className={`text-lg font-black ${p.stockLevel <= p.lowStockThreshold ? 'text-rose-600' : 'text-slate-900'}`}>{p.stockLevel}</p>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => setShowAdjustmentModal(p.id)}
                      className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
                    >
                      Update Stock
                    </button>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center text-slate-400 italic">No products match the current filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[2.5rem] p-10 text-white">
        <h3 className="text-xl font-black mb-8">Recent Inventory Movements</h3>
        <div className="space-y-4">
          {transactions.slice(0, 8).map(tx => {
            const product = products.find(p => p.id === tx.productId);
            return (
              <div key={tx.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black ${tx.type === 'IN' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {tx.type === 'IN' ? '↓' : '↑'}
                  </div>
                  <div>
                    <p className="font-bold">{product?.name}</p>
                    <p className="text-[10px] text-white/40 uppercase tracking-widest">{tx.date} • {tx.note || 'Regular Transaction'}</p>
                  </div>
                </div>
                <p className={`text-lg font-black ${tx.type === 'IN' ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {tx.type === 'IN' ? '+' : '-'}{tx.quantity}
                </p>
              </div>
            );
          })}
          {transactions.length === 0 && (
             <p className="text-white/30 text-center py-10 italic">No historical movements detected.</p>
          )}
        </div>
      </div>

      {showAdjustmentModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[200] flex items-center justify-center p-4">
          <div className="bg-white p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md animate-in zoom-in-95">
            <h4 className="text-xl font-black mb-6">Adjust Inventory</h4>
            <p className="text-sm text-slate-500 mb-6 font-medium">Add quantity for new arrivals, or subtract for breakage/sales adjustments.</p>
            
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Quantity Change (±)</label>
                <input 
                  type="number"
                  autoFocus
                  value={adjustmentQty}
                  onChange={e => setAdjustmentQty(parseInt(e.target.value) || 0)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 font-black text-slate-800 text-2xl"
                  placeholder="e.g. 50 or -10"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Reason / Note</label>
                <input 
                  value={adjustmentNote}
                  onChange={e => setAdjustmentNote(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-3 font-bold text-slate-800 outline-none"
                  placeholder="e.g. Bulk Restock"
                />
              </div>
            </div>

            <div className="flex gap-4">
              <button 
                onClick={() => setShowAdjustmentModal(null)}
                className="flex-1 py-4 font-black text-[10px] uppercase tracking-widest text-slate-400"
              >
                Cancel
              </button>
              <button 
                onClick={() => handleAdjust(showAdjustmentModal)}
                className="flex-1 py-4 bg-slate-900 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl"
              >
                Apply Change
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default InventoryDashboard;
