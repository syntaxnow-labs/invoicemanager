
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Client, Invoice, DocumentType, InvoiceStatus } from '../types';
import { CurrencyService } from '../services/exchangeRates';
import { GSTService, GSTVerificationResult } from '../services/gstService';
import { DataTable } from './shared/DataTable';
import { StatusBadge } from './ui/StatusBadge';
import { 
  Eye, Pencil, Trash2, ArrowLeft, Plus, 
  FileText, FileCheck, FileX, LayoutDashboard,
  Mail, Phone, MapPin, Building2, TrendingUp, AlertCircle, Search, 
  User, CreditCard, ChevronDown, CheckCircle, Globe, Smartphone, Landmark,
  XCircle, Upload, Loader2
} from 'lucide-react';
import * as XLSX from 'xlsx';
import { useClientStore } from '../services/store';


interface ClientManagerProps {
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

const ClientManager: React.FC = ({
}) => {
  const clients = useClientStore((state: any) => state.clients);
  const addClient = useClientStore((state:any) => state.addClient);
  const updateClient = useClientStore((state:any) => state.updateClient);
  const deleteClient = useClientStore((state:any) => state.deleteClient);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [quotations, setQuotations] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<Invoice[]>([]);
  const [previewInvoice, setPreviewInvoice] = useState<Invoice | null>(null);
  const [showInvoiceForm, setShowInvoiceForm] = useState(false);
  const [editingInvoice, setEditingInvoice] = useState<Invoice | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'overview' | 'invoices' | 'quotations' | 'credit-notes'>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<GSTVerificationResult | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [sameAsBilling, setSameAsBilling] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<any>({
    customerType: 'Business',
    salutation: 'Mr.',
    firstName: '',
    lastName: '',
    name: '', // Display Name
    email: '',
    phone: '',
    mobile: '',
    gstNumber: '',
    gstTreatment: 'Registered Business - Regular',
    pan: '',
    placeOfSupply: '',
    currency: 'INR',
    paymentTerms: 'Due on Receipt',
    billingStreet: '',
    billingCity: '',
    billingState: '',
    billingZip: '',
    billingCountry: '',
    shippingStreet: '',
    shippingCity: '',
    shippingState: '',
    shippingZip: '',
    shippingCountry: ''
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
          const newClient: any = {
            name: row['Company Name'] || row.Name || row['Display Name'] || row.name,
            firstName: row['First Name'] || row.firstname || '',
            lastName: row['Last Name'] || row.lastname || '',
            email: row.Email || row['Customer Email'] || row.email || '',
            phone: row.Phone || row['Work Phone'] || row.phone || '',
            mobile: row.Mobile || row.mobile || '',
            gstNumber: row.GSTIN || row['GST Number'] || row.gst || '',
            customerType: row.Type === 'Individual' ? 'Individual' : 'Business',
            currency: row.Currency || 'USD',
            billingStreet: row['Billing Street'] || row.Street || row.address || '',
            billingCity: row['Billing City'] || row.City || '',
            billingState: row['Billing State'] || row.State || '',
            billingZip: row['Billing Zip'] || row.Zip || '',
            billingCountry: row['Billing Country'] || row.Country || '',
            gstTreatment: row['GST Treatment'] || 'Registered Business - Regular'
          };

          if (newClient.name || (newClient.firstName && newClient.lastName)) {
            // Auto-compute name if missing
            if (!newClient.name) newClient.name = `${newClient.firstName} ${newClient.lastName}`.trim();
            await addClient(newClient);
            successCount++;
          }
        }
        alert(`Successfully imported ${successCount} customers to your portfolio.`);
      } catch (err) {
        console.error("Import error:", err);
        alert("Failed to parse file. Check format.");
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  // Auto-generate display name if not explicitly set
  useEffect(() => {
    if (formData.firstName || formData.lastName) {
      const computed = `${formData.salutation ? formData.salutation + ' ' : ''}${formData.firstName} ${formData.lastName}`.trim();
      setFormData((prev: any) => ({ ...prev, name: prev.name && prev.name !== computed ? prev.name : computed }));
    }
  }, [formData.firstName, formData.lastName, formData.salutation]);

  // Sync shipping to billing
  useEffect(() => {
    if (sameAsBilling) {
      setFormData((prev: any) => ({
        ...prev,
        shippingStreet: prev.billingStreet,
        shippingCity: prev.billingCity,
        shippingState: prev.billingState,
        shippingZip: prev.billingZip,
        shippingCountry: prev.billingCountry
      }));
    }
  }, [sameAsBilling, formData.billingStreet, formData.billingCity, formData.billingState, formData.billingZip, formData.billingCountry]);

  const selectedClient = useMemo(() => 
    clients.find(c => c.id === selectedClientId), 
    [clients, selectedClientId]
  );

  const clientStats = useMemo(() => {
    if (!selectedClientId) return null;
    const clientInvs = invoices.filter(i => i.clientId === selectedClientId && i.status === InvoiceStatus.PAID);
    const totalPaid = clientInvs.reduce((acc, inv) => {
       const invTotal = (inv.items || []).reduce((s, it) => s + (it.quantity * it.rate), 0);
       return acc + invTotal;
    }, 0);
    const pendingInvs = invoices.filter(i => i.clientId === selectedClientId && i.status !== InvoiceStatus.PAID);
    return { totalPaid, pendingCount: pendingInvs.length, quoteCount: quotations.filter(q => q.clientId === selectedClientId).length };
  }, [selectedClientId, invoices, quotations]);

  const handleVerifyGST = async () => {
    if (!formData.gstNumber) return;
    setIsVerifying(true);
    setVerifyResult(null);
    const result = await GSTService.verifyGST(formData.gstNumber);
    setVerifyResult(result);
    setIsVerifying(false);
    
    if (result.isValid && result.legalName) {
      setFormData((prev: any) => ({ ...prev, name: result.legalName }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Construct simplified address fields for legacy compatibility if needed
    const billingAddress = `${formData.billingStreet}\n${formData.billingCity}, ${formData.billingState} ${formData.billingZip}\n${formData.billingCountry}`.trim();
    const shippingAddress = `${formData.shippingStreet}\n${formData.shippingCity}, ${formData.shippingState} ${formData.shippingZip}\n${formData.shippingCountry}`.trim();

    const payload = {
      ...formData,
      billingAddress,
      shippingAddress
    };

    try {
      if (editingClient) {
        await updateClient({ ...editingClient, ...payload } as Client);
      } else {
        await addClient(payload);
      }
      resetForm();
    } catch (err) {
      alert("Error saving client: " + err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      customerType: 'Business', salutation: 'Mr.', firstName: '', lastName: '', name: '', email: '', phone: '', mobile: '', gstNumber: '',
      gstTreatment: 'Registered Business - Regular', pan: '', placeOfSupply: '', currency: 'USD', paymentTerms: 'Due on Receipt',
      billingStreet: '', billingCity: '', billingState: '', billingZip: '', billingCountry: '',
      shippingStreet: '', shippingCity: '', shippingState: '', shippingZip: '', shippingCountry: ''
    });
    setVerifyResult(null);
    setIsAdding(false);
    setEditingClient(null);
  };

  const handleEdit = (client: any) => {
    setEditingClient(client);
    setFormData({
      ...client,
      customerType: client.customerType || 'Business',
      salutation: client.salutation || 'Mr.',
      firstName: client.firstName || '',
      lastName: client.lastName || '',
      name: client.name || '',
      email: client.email || '',
      phone: client.phone || '',
      mobile: client.mobile || '',
      gstNumber: client.gstNumber || '',
      gstTreatment: client.gstTreatment || 'Registered Business - Regular',
      pan: client.pan || '',
      placeOfSupply: client.placeOfSupply || '',
      currency: client.currency || 'USD',
      paymentTerms: client.paymentTerms || 'Due on Receipt',
      billingStreet: client.billingStreet || '',
      billingCity: client.billingCity || '',
      billingState: client.billingState || '',
      billingZip: client.billingZip || '',
      billingCountry: client.billingCountry || '',
      shippingStreet: client.shippingStreet || '',
      shippingCity: client.shippingCity || '',
      shippingState: client.shippingState || '',
      shippingZip: client.shippingZip || '',
      shippingCountry: client.shippingCountry || ''
    });
    setIsAdding(true);
  };

  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const onCreateForClient = (clientId: string, type: DocumentType) => {
    setSelectedClientId(clientId);
    setEditingInvoice(null);
    setShowInvoiceForm(true);
  };

  const onViewDocument = (doc: Invoice) => {
    setPreviewInvoice(doc);
    setShowInvoiceForm(true);
  };

  const onEditDocument = (doc: Invoice) => {
    setEditingInvoice(doc);
    setShowInvoiceForm(true);
      
  };


  const renderDocTable = (docs: Invoice[], type: DocumentType) => (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest">{type} History</h4>
        <button 
          onClick={() => onCreateForClient(selectedClientId!, type)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all"
        >
          <Plus className="w-3 h-3" />
          Create New
        </button>
      </div>
      <DataTable headers={['Date', 'ID', 'Amount', 'Status', 'Actions']}>
        {docs.filter(d => d.clientId === selectedClientId).map(doc => (
          <tr key={doc.id} className="group hover:bg-slate-50/50 transition-all">
            <td className="px-8 py-4 text-xs font-medium text-slate-400">{doc.date}</td>
            <td className="px-8 py-4 font-bold text-slate-800">{doc.invoiceNumber}</td>
            <td className="px-8 py-4 font-black">
              {doc.currency} {(doc.items || []).reduce((s, it) => s + (it.quantity * it.rate), 0).toLocaleString()}
            </td>
            <td className="px-8 py-4"><StatusBadge status={doc.status} /></td>
            <td className="px-8 py-4 text-right space-x-2">
              <button onClick={() => onViewDocument(doc)} className="p-1.5 text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Eye className="w-3.5 h-3.5" /></button>
              <button onClick={() => onEditDocument(doc)} className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"><Pencil className="w-3.5 h-3.5" /></button>
            </td>
          </tr>
        ))}
        {docs.filter(d => d.clientId === selectedClientId).length === 0 && (
          <tr>
             <td colSpan={5} className="px-8 py-12 text-center text-slate-300 italic text-sm">No {type.toLowerCase()} records found for this customer.</td>
          </tr>
        )}
      </DataTable>
    </div>
  );

  if (selectedClientId && selectedClient) {
    return (
      <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
        <button 
          onClick={() => setSelectedClientId(null)}
          className="flex items-center gap-2 text-slate-400 hover:text-indigo-600 transition-colors font-black text-[10px] uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Portfolio
        </button>

        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
          <div className="p-8 md:p-12 bg-slate-900 text-white relative">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-indigo-600 rounded-[1.5rem] flex items-center justify-center text-3xl font-black shadow-2xl">
                  {selectedClient.name.charAt(0)}
                </div>
                <div>
                  <h2 className="text-3xl font-black tracking-tight mb-1">{selectedClient.name}</h2>
                  <div className="flex flex-wrap gap-4 text-indigo-200/60 text-xs font-bold uppercase tracking-widest">
                    <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5" /> {selectedClient.email}</span>
                    {selectedClient.phone && <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" /> {selectedClient.phone}</span>}
                    {selectedClient.gstNumber && <span className="flex items-center gap-1.5"><Building2 className="w-3.5 h-3.5" /> GST: {selectedClient.gstNumber}</span>}
                  </div>
                </div>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => handleEdit(selectedClient)}
                  className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-black uppercase tracking-widest transition-all"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-[10px] font-black text-indigo-300/60 uppercase tracking-widest mb-1">Lifetime Value</p>
                <p className="text-2xl font-black">{selectedClient.currency} {clientStats?.totalPaid.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-[10px] font-black text-amber-300/60 uppercase tracking-widest mb-1">Active Quotes</p>
                <p className="text-2xl font-black">{clientStats?.quoteCount}</p>
              </div>
              <div className="bg-white/5 border border-white/10 p-6 rounded-2xl">
                <p className="text-[10px] font-black text-rose-300/60 uppercase tracking-widest mb-1">Pending Docs</p>
                <p className="text-2xl font-black">{clientStats?.pendingCount}</p>
              </div>
            </div>
          </div>

          <div className="flex border-b border-slate-100 px-8 bg-slate-50/30">
            {[
              { id: 'overview', label: 'Overview', icon: LayoutDashboard },
              { id: 'quotations', label: 'Quotations', icon: FileText },
              { id: 'invoices', label: 'Invoices', icon: FileCheck },
              { id: 'credit-notes', label: 'Credit Notes', icon: FileX }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveSubTab(tab.id as any)}
                className={`flex items-center gap-2 px-6 py-4 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 -mb-px ${activeSubTab === tab.id ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          <div className="p-8 md:p-12">
            {activeSubTab === 'overview' && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                       <MapPin className="w-3 h-3" />
                       Primary Billing Address
                    </h4>
                    <p className="text-sm text-slate-800 font-bold whitespace-pre-line leading-relaxed">
                      {selectedClient.billingAddress}
                    </p>
                  </div>
                  <div className="flex flex-col gap-4">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Quick Actions</h4>
                     <div className="grid grid-cols-2 gap-4">
                        <button 
                          onClick={() => onCreateForClient(selectedClientId, DocumentType.INVOICE)}
                          className="p-6 bg-indigo-50 text-indigo-600 rounded-3xl border border-indigo-100 hover:shadow-lg transition-all text-left"
                        >
                          <Plus className="w-6 h-6 mb-2" />
                          <p className="font-black text-xs uppercase">New Invoice</p>
                        </button>
                        <button 
                          onClick={() => onCreateForClient(selectedClientId, DocumentType.QUOTATION)}
                          className="p-6 bg-amber-50 text-amber-600 rounded-3xl border border-amber-100 hover:shadow-lg transition-all text-left"
                        >
                          <Plus className="w-6 h-6 mb-2" />
                          <p className="font-black text-xs uppercase">New Quote</p>
                        </button>
                     </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Recent Activity</h4>
                  <div className="space-y-3">
                    {invoices.filter(i => i.clientId === selectedClientId).slice(0, 5).map(inv => (
                      <div key={inv.id} className="flex justify-between items-center p-4 border border-slate-100 rounded-xl hover:bg-slate-50 transition-all cursor-pointer" onClick={() => onViewDocument(inv)}>
                        <div className="flex items-center gap-3">
                          <div className={`w-2 h-2 rounded-full ${inv.status === InvoiceStatus.PAID ? 'bg-emerald-400' : 'bg-amber-400'}`}></div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">Invoice {inv.invoiceNumber}</p>
                            <p className="text-[10px] text-slate-400 uppercase font-black">{inv.date}</p>
                          </div>
                        </div>
                        <span className="font-black text-xs text-slate-900">{inv.currency} {(inv.items || []).reduce((s, it) => s + (it.quantity * it.rate), 0).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeSubTab === 'invoices' && renderDocTable(invoices, DocumentType.INVOICE)}
            {activeSubTab === 'quotations' && renderDocTable(quotations, DocumentType.QUOTATION)}
            {activeSubTab === 'credit-notes' && renderDocTable(creditNotes, DocumentType.CREDIT_NOTE)}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Client Portfolio</h2>
          <p className="text-slate-500 font-medium">Enterprise Relationship Management</p>
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
            Import Portfolio
          </button>
          {!isAdding && (
            <button 
              onClick={() => setIsAdding(true)}
              className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> Add New Customer
            </button>
          )}
        </div>
      </div>

      {isAdding ? (
        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] border border-slate-100 shadow-xl max-w-5xl animate-in zoom-in-95 duration-300 mx-auto">
          <div className="flex justify-between items-center mb-10">
             <h3 className="text-xl font-black text-slate-900">{editingClient ? 'Update Customer Profile' : 'New Customer Account'}</h3>
             <button onClick={resetForm} className="text-slate-400 hover:text-slate-600 transition-all">
                <XCircle className="w-6 h-6" />
             </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-12">
            {/* Customer Type Toggle */}
            <div className="flex gap-4 p-1 bg-slate-50 rounded-2xl w-fit">
               {['Business', 'Individual'].map(type => (
                 <button
                   key={type}
                   type="button"
                   onClick={() => setFormData({...formData, customerType: type})}
                   className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${formData.customerType === type ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                 >
                   {type}
                 </button>
               ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-10">
               {/* Contact Section */}
               <div className="space-y-8">
                  <SectionHeading>Primary Contact</SectionHeading>
                  <div className="flex gap-4">
                     <div className="w-24 shrink-0">
                       <SyntaxnowSelect 
                         label="Title" 
                         value={formData.salutation} 
                         onChange={(e:any) => setFormData({...formData, salutation: e.target.value})}
                       >
                         <option value="Mr.">Mr.</option>
                         <option value="Mrs.">Mrs.</option>
                         <option value="Ms.">Ms.</option>
                         <option value="Dr.">Dr.</option>
                       </SyntaxnowSelect>
                     </div>
                     <div className="flex-1">
                       <SyntaxnowInput 
                         label="First Name" 
                         value={formData.firstName} 
                         onChange={(e:any) => setFormData({...formData, firstName: e.target.value})}
                       />
                     </div>
                  </div>
                  <SyntaxnowInput 
                    label="Last Name" 
                    value={formData.lastName} 
                    onChange={(e:any) => setFormData({...formData, lastName: e.target.value})}
                  />
                  <SyntaxnowInput 
                    label="Company / Display Name" 
                    required 
                    icon={Building2}
                    value={formData.name} 
                    onChange={(e:any) => setFormData({...formData, name: e.target.value})}
                  />
                  <SyntaxnowInput 
                    label="Customer Email" 
                    required 
                    icon={Mail}
                    type="email"
                    value={formData.email} 
                    onChange={(e:any) => setFormData({...formData, email: e.target.value})}
                  />
                  <div className="grid grid-cols-2 gap-4">
                     <SyntaxnowInput 
                       label="Work Phone" 
                       icon={Phone}
                       value={formData.phone} 
                       onChange={(e:any) => setFormData({...formData, phone: e.target.value})}
                     />
                     <SyntaxnowInput 
                       label="Mobile" 
                       icon={Smartphone}
                       value={formData.mobile} 
                       onChange={(e:any) => setFormData({...formData, mobile: e.target.value})}
                     />
                  </div>
               </div>

               {/* Tax & Financials */}
               <div className="space-y-8">
                  <SectionHeading>Tax & Financials</SectionHeading>
                  <SyntaxnowSelect 
                    label="GST Treatment" 
                    icon={Landmark}
                    value={formData.gstTreatment}
                    onChange={(e:any) => setFormData({...formData, gstTreatment: e.target.value})}
                  >
                    <option value="Registered Business - Regular">Registered Business - Regular</option>
                    <option value="Registered Business - Composition">Registered Business - Composition</option>
                    <option value="Unregistered Business">Unregistered Business</option>
                    <option value="Consumer">Consumer</option>
                    <option value="Overseas">Overseas</option>
                  </SyntaxnowSelect>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SyntaxnowInput 
                        label="GSTIN / Tax ID" 
                        icon={CreditCard}
                        value={formData.gstNumber}
                        onChange={(e:any) => {
                          setFormData({...formData, gstNumber: e.target.value.toUpperCase()});
                          setVerifyResult(null);
                        }}
                      />
                    </div>
                    <div className="pt-6">
                      <button 
                        type="button"
                        disabled={isVerifying || !formData.gstNumber}
                        onClick={handleVerifyGST}
                        className={`px-4 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isVerifying ? 'bg-slate-100 text-slate-400' : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100'}`}
                      >
                        {isVerifying ? 'Wait...' : 'Verify'}
                      </button>
                    </div>
                  </div>

                  {verifyResult && (
                    <div className={`p-4 rounded-xl flex items-start gap-3 animate-in slide-in-from-top-2 ${verifyResult.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                      {verifyResult.isValid ? <CheckCircle className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
                      <div className="text-xs font-bold">{verifyResult.message}</div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                     <SyntaxnowInput label="PAN" value={formData.pan} onChange={(e:any) => setFormData({...formData, pan: e.target.value.toUpperCase()})} />
                     <SyntaxnowSelect label="Place of Supply" value={formData.placeOfSupply} onChange={(e:any) => setFormData({...formData, placeOfSupply: e.target.value})}>
                        <option value="">Select State...</option>
                        <option value="Maharashtra">Maharashtra</option>
                        <option value="Delhi">Delhi</option>
                        <option value="Karnataka">Karnataka</option>
                        <option value="Tamil Nadu">Tamil Nadu</option>
                        {/* More states can be added here */}
                     </SyntaxnowSelect>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <SyntaxnowSelect label="Currency" icon={Globe} value={formData.currency} onChange={(e:any) => setFormData({...formData, currency: e.target.value})}>
                        {CurrencyService.getAvailableCurrencies().map(c => <option key={c} value={c}>{c}</option>)}
                     </SyntaxnowSelect>
                     <SyntaxnowSelect label="Payment Terms" value={formData.paymentTerms} onChange={(e:any) => setFormData({...formData, paymentTerms: e.target.value})}>
                        <option value="Due on Receipt">Due on Receipt</option>
                        <option value="Net 15">Net 15</option>
                        <option value="Net 30">Net 30</option>
                        <option value="Net 60">Net 60</option>
                     </SyntaxnowSelect>
                  </div>
               </div>

               {/* Address Section */}
               <div className="md:col-span-2 space-y-8 pt-6">
                  <div className="flex justify-between items-center">
                    <SectionHeading>Address Details</SectionHeading>
                    <button 
                      type="button"
                      onClick={() => setSameAsBilling(!sameAsBilling)}
                      className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${sameAsBilling ? 'text-indigo-600' : 'text-slate-400'}`}
                    >
                      <div className={`w-10 h-5 rounded-full p-1 transition-all ${sameAsBilling ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                         <div className={`w-3 h-3 bg-white rounded-full transition-all ${sameAsBilling ? 'translate-x-5' : 'translate-x-0'}`} />
                      </div>
                      Same for Shipping
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                     <div className="space-y-6">
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Billing Address</h5>
                        <SyntaxnowInput label="Street" placeholder="House/Apt No., Street" value={formData.billingStreet} onChange={(e:any) => setFormData({...formData, billingStreet: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                           <SyntaxnowInput label="City" value={formData.billingCity} onChange={(e:any) => setFormData({...formData, billingCity: e.target.value})} />
                           <SyntaxnowInput label="State" value={formData.billingState} onChange={(e:any) => setFormData({...formData, billingState: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <SyntaxnowInput label="Zip Code" value={formData.billingZip} onChange={(e:any) => setFormData({...formData, billingZip: e.target.value})} />
                           <SyntaxnowInput label="Country" value={formData.billingCountry} onChange={(e:any) => setFormData({...formData, billingCountry: e.target.value})} />
                        </div>
                     </div>

                     <div className={`space-y-6 transition-all ${sameAsBilling ? 'opacity-40 pointer-events-none' : ''}`}>
                        <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Shipping Address</h5>
                        <SyntaxnowInput label="Street" value={formData.shippingStreet} onChange={(e:any) => setFormData({...formData, shippingStreet: e.target.value})} />
                        <div className="grid grid-cols-2 gap-4">
                           <SyntaxnowInput label="City" value={formData.shippingCity} onChange={(e:any) => setFormData({...formData, shippingCity: e.target.value})} />
                           <SyntaxnowInput label="State" value={formData.shippingState} onChange={(e:any) => setFormData({...formData, shippingState: e.target.value})} />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                           <SyntaxnowInput label="Zip Code" value={formData.shippingZip} onChange={(e:any) => setFormData({...formData, shippingZip: e.target.value})} />
                           <SyntaxnowInput label="Country" value={formData.shippingCountry} onChange={(e:any) => setFormData({...formData, shippingCountry: e.target.value})} />
                        </div>
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
                 {isSubmitting ? 'Processing...' : (editingClient ? 'Update Customer' : 'Save Customer')}
               </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="relative max-w-md">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              placeholder="Search database..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-slate-100 rounded-2xl pl-12 pr-5 py-4 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium shadow-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredClients.map(client => (
              <div 
                key={client.id} 
                onClick={() => setSelectedClientId(client.id)}
                className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group relative overflow-hidden cursor-pointer"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className={`w-12 h-12 ${client.customerType === 'Business' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'} rounded-2xl flex items-center justify-center text-xl font-black shadow-sm`}>
                    {client.name.charAt(0)}
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleEdit(client); }}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      title="Edit"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); if(confirm('Permanently delete customer?')) deleteClient(client.id); }}
                      className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h4 className="text-lg font-black text-slate-900 mb-1">{client.name}</h4>
                <p className="text-slate-400 text-sm font-medium mb-4 truncate">{client.email}</p>
                <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-slate-100 text-slate-500 rounded-lg text-[9px] font-black uppercase tracking-widest">
                    {client.currency}
                  </span>
                  {client.gstNumber && (
                    <span className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest">
                      TAX Verified
                    </span>
                  )}
                </div>
                <div className="pt-4 border-t border-slate-50 flex justify-between items-center">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest">View History</span>
                  <div className="p-1.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:bg-indigo-600 group-hover:text-white transition-all">
                    <Eye className="w-3.5 h-3.5" />
                  </div>
                </div>
              </div>
            ))}
            {filteredClients.length === 0 && (
              <div className="col-span-full py-20 text-center bg-white border border-dashed border-slate-200 rounded-[2.5rem]">
                <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">No clients found in database</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientManager;
