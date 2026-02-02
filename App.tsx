
import React, { useState, useEffect, useMemo } from 'react';
import { 
  Invoice, Client, InvoiceStatus, DocumentType, BusinessProfile, 
  ExpenseRecord, ProductItem, InventoryTransaction 
} from './types';
import { ApiService } from './services/api';
import Dashboard from './components/Dashboard';
import InvoiceForm from './components/InvoiceForm';
import InvoicePreview from './components/InvoicePreview';
import Settings from './components/Settings';
import ClientManager from './components/ClientManager';
import ItemManager from './components/ItemManager';
import InventoryDashboard from './components/InventoryDashboard';
import ExpenseManager from './components/ExpenseManager';
import FinancialAdvisor from './components/FinancialAdvisor';
import { DataTable } from './components/shared/DataTable';
import { StatusBadge } from './components/ui/StatusBadge';
import { 
  BarChart3, FileText, FileCheck, FileX, Package, Warehouse, 
  Users, Receipt, Settings2, Search, Plus, Eye, Pencil, Trash2 
} from 'lucide-react';

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [stockLedger, setStockLedger] = useState<InventoryTransaction[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [invs, quots, cns, clis, prods, prof, txs, exps] = await Promise.all([
        ApiService.getInvoices().catch(() => []),
        ApiService.getQuotations().catch(() => []),
        ApiService.getCreditNotes().catch(() => []),
        ApiService.getClients().catch(() => []),
        ApiService.getProducts().catch(() => []),
        ApiService.getBusinessProfile().catch(() => null),
        ApiService.getInventoryTransactions().catch(() => []),
        ApiService.getExpenses().catch(() => [])
      ]);
      
      setInvoices(invs);
      setQuotations(quots);
      setCreditNotes(cns);
      setClients(clis);
      setProducts(prods);
      setBusinessProfile(prof);
      setStockLedger(txs);
      setExpenses(exps);
    } catch (err) {
      console.error("Database Rehydration Failed:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const formatDate = (dateInput: any) => {
    if (!dateInput) return '---';
    try {
      const d = new Date(dateInput);
      return isNaN(d.getTime()) ? '---' : d.toLocaleDateString('en-GB');
    } catch (e) {
      return '---';
    }
  };

  const calculateInvoiceTotal = (inv: Invoice) => {
    const items = Array.isArray(inv.items) ? inv.items : [];
    return items.reduce((s, i) => {
      const qty = Number(i.quantity) || 0;
      const rate = Number(i.rate) || 0;
      const tax = Number(i.taxPercent) || 0;
      const disc = Number(i.discountPercent) || 0;
      return s + (qty * rate * (1 + tax / 100 - disc / 100));
    }, 0);
  };

  const handleInvoiceSubmit = async (invoice: Invoice) => {
    await ApiService.saveDocument(invoice, invoice.type);
    await fetchData();
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handleConvertToInvoice = (convertedInvoice: Invoice) => {
    setEditingInvoice(convertedInvoice);
    setActiveTab('invoices');
    setShowInvoiceForm(true);
    setPreviewInvoice(null);
  };

  const handleTabClick = (tab: string) => {
    setActiveTab(tab); 
    setShowInvoiceForm(false);
    sessionStorage.setItem("activeTab", tab);
  };

  useEffect(() => {
  const savedTab = sessionStorage.getItem("activeTab");
  if (savedTab) {
    setActiveTab(savedTab);
  }
  }, []);

  const effectiveProfile = useMemo(() => {
    return (businessProfile || { 
      name: 'Syntaxnow Invoicing Business', 
      currency: 'INR', 
      autoDeductInventory: true
    }) as BusinessProfile;
  }, [businessProfile]);

  const displayCurrency = String(effectiveProfile.currency || 'INR');

  const filteredDocs = useMemo(() => {
    let source: Invoice[] = [];
    if (activeTab === 'quotations') source = quotations;
    else if (activeTab === 'invoices') source = invoices;
    else if (activeTab === 'credit-notes') source = creditNotes;

    return source.filter(inv => 
      String(inv.invoiceNumber).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, quotations, creditNotes, activeTab, searchQuery]);

  if (isLoading) return <div className="flex h-screen items-center justify-center font-black animate-pulse text-indigo-600">Initializing Core Systems...</div>;

  const NavItems = [
    { id: 'dashboard', label: 'Overview', icon: BarChart3 },
    { id: 'quotations', label: 'Quotations', icon: FileText },
    { id: 'invoices', label: 'Invoices', icon: FileCheck },
    { id: 'credit-notes', label: 'Credit Notes', icon: FileX },
    { id: 'items', label: 'Catalog', icon: Package },
    { id: 'inventory', label: 'Inventory', icon: Warehouse },
    { id: 'clients', label: 'Clients', icon: Users },
    { id: 'expenses', label: 'Expenses', icon: Receipt },
    { id: 'settings', label: 'Settings', icon: Settings2 }
  ];

  const currentTabType = activeTab === 'quotations' ? DocumentType.QUOTATION : 
                       activeTab === 'credit-notes' ? DocumentType.CREDIT_NOTE : 
                       DocumentType.INVOICE;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col md:flex-row relative">
      <aside className="w-full md:w-64 bg-white border-r border-slate-200 p-6 flex flex-col sticky top-0 h-screen z-40 no-print">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">O</div>
          <span className="font-bold text-xl tracking-tight text-slate-800">Syntaxnow Invoicing</span>
        </div>
        <nav className="flex-1 space-y-1 overflow-y-auto">
          {NavItems.map((tab) => (
            <button 
              key={tab.id}
              onClick={()=>handleTabClick(tab.id)}
              className={`sidebar-button w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium ${activeTab === tab.id ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-10 max-w-7xl mx-auto w-full overflow-y-auto">
        {showInvoiceForm ? (
          <InvoiceForm 
            clients={clients} 
            products={products}
            business={effectiveProfile}
            onSubmit={handleInvoiceSubmit} 
            onCancel={() => { setShowInvoiceForm(false); setEditingInvoice(null); }}
            initialData={editingInvoice}
            defaultType={currentTabType}
          />
        ) : (
          <div className="space-y-8 animate-in fade-in duration-500">
            <header className="flex flex-col md:flex-row md:justify-between md:items-end gap-6">
              <div>
                <h1 className="text-4xl font-black text-slate-900 tracking-tight capitalize">{activeTab.replace('-', ' ')}</h1>
                <p className="text-slate-500">Active Business: {effectiveProfile.name}</p>
              </div>
              <div className="flex gap-4">
                <div className="relative group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                  <input 
                    placeholder="Search records..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-white border border-slate-200 rounded-xl pl-11 pr-4 py-3 text-sm outline-none w-64 shadow-sm focus:ring-4 focus:ring-indigo-500/5 transition-all"
                  />
                </div>
                {(['invoices', 'quotations', 'credit-notes'].includes(activeTab)) && (
                  <button 
                    onClick={() => { setEditingInvoice(null); setShowInvoiceForm(true); }}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Create New
                  </button>
                )}
              </div>
            </header>

            {activeTab === 'dashboard' && <Dashboard invoices={invoices} expenses={expenses} displayCurrency={displayCurrency} />}
            {activeTab === 'settings' && <Settings profile={effectiveProfile} onUpdate={async (p) => { await ApiService.updateBusinessProfile(p); fetchData(); }} />}
            {activeTab === 'items' && <ItemManager products={products} onAdd={async (p) => { await ApiService.saveProduct(p); fetchData(); }} onUpdate={async (p) => { await ApiService.saveProduct(p); fetchData(); }} onDelete={async (id) => { await ApiService.deleteProduct(id); fetchData(); }} />}
            {activeTab === 'inventory' && <InventoryDashboard products={products} transactions={stockLedger} onAdjustStock={async (pid, q, t, n) => { await ApiService.adjustStock(pid, q, t, n); fetchData(); }} />}
            {activeTab === 'clients' && (
              <ClientManager 
                clients={clients} 
                invoices={invoices}
                quotations={quotations}
                creditNotes={creditNotes}
                onAddClient={async (c) => { await ApiService.saveClient(c); fetchData(); }} 
                onUpdateClient={async (c) => { await ApiService.saveClient(c); fetchData(); }} 
                onDeleteClient={async (id) => { await ApiService.deleteClient(id); fetchData(); }}
                onViewDocument={(doc) => setPreviewInvoice(doc)}
                onEditDocument={(doc) => { setEditingInvoice(doc); setShowInvoiceForm(true); }}
                onCreateForClient={(clientId, type) => {
                  setEditingInvoice({ clientId, type } as any);
                  setShowInvoiceForm(true);
                }}
              />
            )}
            {activeTab === 'expenses' && <ExpenseManager expenses={expenses} currency={displayCurrency} onAddExpense={async (e) => { await ApiService.saveExpense(e); fetchData(); }} onDeleteExpense={async (id) => { await ApiService.deleteExpense(id); fetchData(); }} />}

            {(['invoices', 'quotations', 'credit-notes'].includes(activeTab)) && (
              <DataTable headers={['Date', 'ID', 'Client', 'Amount', 'Status', 'Actions']}>
                {filteredDocs.map(inv => (
                  <tr key={inv.id} className="group hover:bg-slate-50/50 transition-all">
                    <td className="px-8 py-6 text-xs text-slate-400 font-medium">{formatDate(inv.date)}</td>
                    <td className="px-8 py-6 font-black">{inv.invoiceNumber}</td>
                    <td className="px-8 py-6">{clients.find(c => c.id === inv.clientId)?.name || 'Walk-in Customer'}</td>
                    <td className="px-8 py-6 font-black">
                      {inv.currency} { calculateInvoiceTotal(inv).toLocaleString(undefined, { minimumFractionDigits: 2 }) }
                    </td>
                    <td className="px-8 py-6"><StatusBadge status={inv.status} /></td>
                    <td className="px-8 py-6 text-right space-x-2">
                      <button onClick={() => setPreviewInvoice(inv)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold text-xs" title="Preview">
                        <Eye className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => { setEditingInvoice(inv); setShowInvoiceForm(true); }} className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold text-xs" title="Edit">
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={async () => { if(confirm('Delete permanently?')) { await ApiService.deleteDocument(inv.id, currentTabType); fetchData(); } }} className="p-2 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all inline-flex items-center gap-1.5 font-bold text-xs" title="Delete">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </DataTable>
            )}
          </div>
        )}
      </main>

      {previewInvoice && (
        <InvoicePreview 
          invoice={previewInvoice} 
          client={clients.find(c => c.id === previewInvoice.clientId)} 
          onClose={() => setPreviewInvoice(null)} 
          business={effectiveProfile} 
          onConvert={handleConvertToInvoice}
        />
      )}

      <FinancialAdvisor 
        invoices={invoices} 
        expenses={expenses} 
        products={products} 
        currency={displayCurrency} 
      />
    </div>
  );
};

export default App;
