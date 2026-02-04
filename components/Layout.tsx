import React, { useState, useEffect, useMemo } from "react";
import { NavLink, Outlet, useParams } from "react-router-dom";
import { BarChart3, FileText, FileCheck, FileX, Package, Warehouse, Users, Receipt, Settings2 } from "lucide-react";
import InvoicePreview from "../components/InvoicePreview";
import FinancialAdvisor from "../components/FinancialAdvisor";
import { 
  Invoice, Client, InvoiceStatus, DocumentType, BusinessProfile, 
  ExpenseRecord, ProductItem, InventoryTransaction 
} from '../types';
import { ApiService } from '../services/api';


const Layout = () => {
    
  const { tab = 'overview' } = useParams();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<Invoice[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [products, setProducts] = useState<ProductItem[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  const [stockLedger, setStockLedger] = useState<InventoryTransaction[]>([]);
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);

//    const fetchData = async () => {
//     try {
//       const [invs, quots, cns, clis, prods, prof, txs, exps] = await Promise.all([
//         ApiService.getInvoices().catch(() => []),
//         ApiService.getQuotations().catch(() => []),
//         ApiService.getCreditNotes().catch(() => []),
//         ApiService.getClients().catch(() => []),
//         ApiService.getProducts().catch(() => []),
//         ApiService.getBusinessProfile().catch(() => null),
//         ApiService.getInventoryTransactions().catch(() => []),
//         ApiService.getExpenses().catch(() => [])
//       ]);
      
//       setInvoices(invs);
//       setQuotations(quots);
//       setCreditNotes(cns);
//       setClients(clis);
//       setProducts(prods);
//       setBusinessProfile(prof);
//       setStockLedger(txs);
//       setExpenses(exps);
//     } catch (err) {
//       console.error("Database Rehydration Failed:", err);
//     } finally {
//       setIsLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchData();
//   }, []);

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
    //await ApiService.saveDocument(invoice, invoice.type);
    //await fetchData();
    setShowInvoiceForm(false);
    setEditingInvoice(null);
  };

  const handleConvertToInvoice = (convertedInvoice: Invoice) => {
    setEditingInvoice(convertedInvoice);
    setShowInvoiceForm(true);
    setPreviewInvoice(null);
  };

  const effectiveProfile = useMemo(() => {
    return (businessProfile || { 
      name: 'Syntaxnow Invoicing Business', 
      currency: 'USD', 
      autoDeductInventory: true
    }) as BusinessProfile;
  }, [businessProfile]);

  const displayCurrency = String(effectiveProfile.currency || 'USD');

  const filteredDocs = useMemo(() => {
    let source: Invoice[] = [];
    if (tab === 'quotations') source = quotations;
    else if (tab === 'invoices') source = invoices;
    else if (tab === 'credit-notes') source = creditNotes;

    return source.filter(inv => 
      String(inv.invoiceNumber).toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [invoices, quotations, creditNotes, tab, searchQuery]);
  
  if (isLoading) return <div className="flex h-screen items-center justify-center font-black animate-pulse text-indigo-600">Initializing Core Systems...</div>;
  
  const NavItems = [
    { id: 'dashboard', label: 'Overview', path: '/dashboard/overview', icon: BarChart3 },
    { id: 'quotations', label: 'Quotations', path: '/dashboard/quotations', icon: FileText },
    { id: 'invoices', label: 'Invoices', path: '/dashboard/invoices', icon: FileCheck },
    { id: 'credit-notes', label: 'Credit Notes', path: '/dashboard/credit-notes', icon: FileX },
    { id: 'items', label: 'Catalog', path: '/dashboard/catalog', icon: Package },
    { id: 'inventory', label: 'Inventory', path: '/dashboard/inventory', icon: Warehouse },
    { id: 'clients', label: 'Clients', path: '/dashboard/clients', icon: Users },
    { id: 'expenses', label: 'Expenses', path: '/dashboard/expenses', icon: Receipt },
    { id: 'settings', label: 'Settings', path: '/dashboard/settings', icon: Settings2 }
  ];

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r p-6">
        <nav className="space-y-1">
          {NavItems.map((tab) => (
            <NavLink
              key={tab.path}
              to={tab.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all
                ${isActive ? "bg-indigo-50 text-indigo-600" : "text-slate-500 hover:bg-slate-50"}`
              }
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-10 overflow-y-auto">
        <Outlet />
        {/* hello world */}
      </main>

      {/* {previewInvoice && (
        <InvoicePreview 
          invoice={previewInvoice} 
          client={clients.find(c => c.id === previewInvoice.clientId)} 
          onClose={() => setPreviewInvoice(null)} 
          business={effectiveProfile} 
          onConvert={handleConvertToInvoice}
        />
      )} */}

      {/* <FinancialAdvisor 
        invoices={invoices} 
        expenses={expenses} 
        products={products} 
        currency={displayCurrency} 
      /> */}
    </div>
  );
};

export default Layout;
