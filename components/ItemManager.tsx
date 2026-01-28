
import React, { useState, useRef } from 'react';
import { ProductItem } from '../types';
import { 
  Upload, Loader2, Search, Pencil, Trash2, 
  Package, Wrench, ChevronDown, Plus, XCircle, 
  Info, BarChart4, Box, Settings2, Globe, Tag
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ItemManagerProps {
  products: ProductItem[];
  onAdd: (product: ProductItem) => Promise<void>;
  onUpdate: (product: ProductItem) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

const SyntaxnowInput = ({ label, required, icon: Icon, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-tight">
      {Icon && <Icon className="w-3 h-3 text-slate-400" />}
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <input 
      className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all placeholder:text-slate-300"
      {...props}
    />
  </div>
);

const SyntaxnowSelect = ({ label, required, children, icon: Icon, ...props }: any) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-tight">
      {Icon && <Icon className="w-3 h-3 text-slate-400" />}
      {label} {required && <span className="text-rose-500">*</span>}
    </label>
    <div className="relative">
      <select 
        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all appearance-none cursor-pointer"
        {...props}
      >
        {children}
      </select>
      <ChevronDown className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
    </div>
  </div>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-4 mb-6">
    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] whitespace-nowrap">{children}</h4>
    <div className="h-px bg-slate-100 w-full" />
  </div>
);

const ItemManager: React.FC<ItemManagerProps> = ({ products, onAdd, onUpdate, onDelete }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingItem, setEditingItem] = useState<ProductItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    name: '',
    itemType: 'Goods',
    sku: '',
    unit: 'pcs',
    description: '',
    hsnCode: '',
    defaultRate: 0,
    defaultTax: 0,
    trackInventory: false,
    stockLevel: 0,
    lowStockThreshold: 5
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws);

        let successCount = 0;
        for (const row of data as any[]) {
          const newItem: any = {
            name: row.Name || row['Product Name'] || row.Item || row.name,
            sku: row.SKU || row['Part Number'] || row.sku || '',
            itemType: (row.Type || row['Item Type'] || '').toLowerCase().includes('service') ? 'Service' : 'Goods',
            unit: row.Unit || row.UOM || 'pcs',
            description: row.Description || row.description || '',
            hsnCode: String(row.HSN || row['HSN Code'] || row.hsn || ''),
            defaultRate: Number(row.Rate || row.Price || row['Unit Price'] || row.rate || 0),
            defaultTax: Number(row.Tax || row['Tax %'] || row.tax || 0),
            trackInventory: row['Track Inventory'] === 'Yes' || row.track === true || false,
            stockLevel: Number(row.Stock || row['Stock Level'] || row.stock || 0),
            lowStockThreshold: Number(row.Threshold || row['Low Stock Threshold'] || 5)
          };

          if (newItem.name) {
            await onAdd(newItem);
            successCount++;
          }
        }
        alert(`Successfully imported ${successCount} items to your catalog.`);
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to parse file. Ensure headers match common conventions.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingItem) {
        await onUpdate({ ...editingItem, ...formData } as ProductItem);
      } else {
        await onAdd(formData as ProductItem);
      }
      resetForm();
    } catch (err) {
      console.error("Failed to save product:", err);
      alert("Database error: Could not save item.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', itemType: 'Goods', sku: '', unit: 'pcs', description: '', 
      hsnCode: '', defaultRate: 0, defaultTax: 0, trackInventory: false, 
      stockLevel: 0, lowStockThreshold: 5 
    });
    setIsAdding(false);
    setEditingItem(null);
  };

  const handleEdit = (item: ProductItem) => {
    setEditingItem(item);
    setFormData(item);
    setIsAdding(true);
  };

  const filteredItems = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    p.sku?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.hsnCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Standard Catalog</h2>
          <p className="text-slate-500 font-medium">Enterprise Product & Service Repository</p>
        </div>
        <div className="flex gap-3">
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={handleFileUpload} 
            className="hidden" 
            accept=".xlsx, .xls, .csv" 
          />
          <button 
            onClick={() => fileInputRef.current?.click()}
            disabled={isImporting}
            className="px-6 py-3 bg-white border border-slate-200 text-slate-600 rounded-xl font-bold shadow-sm hover:bg-slate-50 transition-all flex items-center gap-2"
          >
            {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            Import Items
          </button>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Create New
            </button>
          )}
        </div>
      </div>

      {isAdding ? (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl max-w-5xl animate-in zoom-in-95 duration-300 mx-auto">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-xl font-black text-slate-900">{editingItem ? 'Update Catalog Record' : 'New Catalog Entry'}</h3>
             <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-all">
                <XCircle className="w-6 h-6" />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            <div className="flex gap-4 p-1 bg-slate-50 rounded-2xl w-fit">
               {['Goods', 'Service'].map(type => (
                 <button
                   key={type}
                   type="button"
                   onClick={() => setFormData({...formData, itemType: type})}
                   className={`px-8 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.itemType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {type}
                 </button>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
               {/* Basic Info Section */}
               <div className="space-y-8">
                  <SectionHeading>Basic Information</SectionHeading>
                  <SyntaxnowInput 
                    label="Item Name" 
                    required 
                    icon={Tag}
                    value={formData.name} 
                    onChange={(e:any) => setFormData({...formData, name: e.target.value})}
                    placeholder="e.g. Enterprise Software License"
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <SyntaxnowInput 
                       label="SKU / Part No." 
                       icon={Box}
                       value={formData.sku} 
                       onChange={(e:any) => setFormData({...formData, sku: e.target.value})}
                       placeholder="PROD-001"
                     />
                     <SyntaxnowSelect 
                       label="Unit" 
                       value={formData.unit}
                       onChange={(e:any) => setFormData({...formData, unit: e.target.value})}
                     >
                        <option value="pcs">Pcs (Pieces)</option>
                        <option value="box">Box</option>
                        <option value="kg">Kg (Kilograms)</option>
                        <option value="hrs">Hrs (Hours)</option>
                        <option value="days">Days</option>
                     </SyntaxnowSelect>
                  </div>
                  <SyntaxnowInput 
                    label="HSN / SAC Code" 
                    icon={Globe}
                    value={formData.hsnCode} 
                    onChange={(e:any) => setFormData({...formData, hsnCode: e.target.value})}
                    placeholder="998311"
                  />
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[11px] font-bold text-slate-500 flex items-center gap-1.5 uppercase tracking-tight">
                      <Info className="w-3 h-3 text-slate-400" />
                      Description
                    </label>
                    <textarea 
                      rows={3}
                      value={formData.description}
                      onChange={e => setFormData({...formData, description: e.target.value})}
                      className="bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:ring-4 focus:ring-indigo-600/5 transition-all resize-none"
                      placeholder="Enter detailed item description for documents..."
                    />
                  </div>
               </div>

               {/* Financials & Inventory */}
               <div className="space-y-8">
                  <SectionHeading>Sales Information</SectionHeading>
                  <div className="grid grid-cols-2 gap-4">
                     <SyntaxnowInput 
                       label="Selling Price" 
                       type="number"
                       icon={BarChart4}
                       value={formData.defaultRate} 
                       onChange={(e:any) => setFormData({...formData, defaultRate: parseFloat(e.target.value) || 0})}
                     />
                     <SyntaxnowInput 
                       label="Tax Rate (%)" 
                       type="number"
                       icon={Settings2}
                       value={formData.defaultTax} 
                       onChange={(e:any) => setFormData({...formData, defaultTax: parseFloat(e.target.value) || 0})}
                       placeholder="18"
                     />
                  </div>

                  <div className="pt-6">
                    <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-black text-slate-900 text-sm">Inventory Tracking</h4>
                          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Monitor live stock levels</p>
                        </div>
                        <button 
                          type="button"
                          onClick={() => setFormData({...formData, trackInventory: !formData.trackInventory})}
                          className={`w-14 h-8 rounded-full transition-all flex items-center p-1 ${formData.trackInventory ? 'bg-indigo-600' : 'bg-slate-300'}`}
                        >
                          <div className={`w-6 h-6 bg-white rounded-full shadow-sm transform transition-all ${formData.trackInventory ? 'translate-x-6' : 'translate-x-0'}`}></div>
                        </button>
                      </div>
                      
                      {formData.trackInventory && (
                        <div className="grid grid-cols-2 gap-4 animate-in slide-in-from-top-4">
                          <SyntaxnowInput 
                            label="Opening Stock" 
                            type="number"
                            value={formData.stockLevel} 
                            onChange={(e:any) => setFormData({...formData, stockLevel: parseInt(e.target.value) || 0})}
                          />
                          <SyntaxnowInput 
                            label="Reorder Level" 
                            type="number"
                            value={formData.lowStockThreshold} 
                            onChange={(e:any) => setFormData({...formData, lowStockThreshold: parseInt(e.target.value) || 0})}
                          />
                        </div>
                      )}
                    </div>
                  </div>
               </div>
            </div>

            <div className="flex justify-end gap-6 pt-12 border-t border-slate-100">
               <button 
                type="button" 
                onClick={resetForm}
                className="px-8 py-4 text-slate-400 font-black text-[11px] uppercase tracking-widest hover:text-slate-600"
               >
                 Discard
               </button>
               <button 
                type="submit"
                disabled={isSubmitting}
                className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest shadow-xl hover:shadow-indigo-600/20 active:scale-95 transition-all disabled:opacity-50"
               >
                 {isSubmitting ? 'Processing...' : (editingItem ? 'Update Item' : 'Save Item')}
               </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              placeholder="Filter items by name, SKU or HSN..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-5 py-4 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map(item => (
              <div 
                key={item.id} 
                onClick={() => handleEdit(item)}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 ${item.itemType === 'Service' ? 'bg-amber-50 text-amber-600' : 'bg-indigo-50 text-indigo-600'} rounded-2xl flex items-center justify-center text-xl font-black shadow-sm`}>
                    {item.itemType === 'Service' ? <Wrench className="w-6 h-6" /> : <Package className="w-6 h-6" />}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(item); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('Delete this item?')) onDelete(item.id); }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                
                <h4 className="text-lg font-black text-slate-900 mb-1">{item.name}</h4>
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-4">
                  {item.sku ? `SKU: ${item.sku}` : 'No SKU Assigned'}
                </p>

                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    Rate: {item.defaultRate.toLocaleString()}
                  </span>
                  <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    Tax: {item.defaultTax}%
                  </span>
                  {item.trackInventory && (
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest ${item.stockLevel <= item.lowStockThreshold ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
                      {item.stockLevel} {item.unit}
                    </span>
                  )}
                </div>

                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">View details</span>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Plus className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
            {filteredItems.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No items found in catalog</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ItemManager;
