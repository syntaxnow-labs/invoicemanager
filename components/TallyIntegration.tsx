
import React, { useState, useEffect } from 'react';
import { Invoice, ExpenseRecord, Client, BusinessProfile } from '../types';
import { TallyExportService } from '../services/tallyExport';

interface TallyIntegrationProps {
  invoices: Invoice[];
  expenses: ExpenseRecord[];
  clients: Client[];
  business: BusinessProfile;
}

const TallyIntegration: React.FC<TallyIntegrationProps> = ({ invoices, expenses, clients, business }) => {
  const [mappings, setMappings] = useState({
    salesLedger: 'Sales Account',
    taxLedger: 'Output GST',
    expenseLedger: 'Indirect Expenses',
    bankLedger: 'Bank Account'
  });

  useEffect(() => {
    const saved = localStorage.getItem('Syntaxnow_tally_mappings');
    if (saved) setMappings(JSON.parse(saved));
  }, []);

  const handleSaveMappings = () => {
    localStorage.setItem('Syntaxnow_tally_mappings', JSON.stringify(mappings));
    alert('Tally Ledger mappings saved successfully!');
  };

  const handleExport = () => {
    const xml = TallyExportService.generateVoucherXML(invoices, expenses, clients, business, mappings);
    TallyExportService.downloadXML(xml, `Syntaxnow Invoicing_Tally_Export_${new Date().toISOString().split('T')[0]}.xml`);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Tally ERP Integration</h2>
          <p className="text-slate-500 font-medium">Bridge your financial data with enterprise accounting</p>
        </div>
        <button 
          onClick={handleExport}
          className="px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all flex items-center gap-2"
        >
          <span>📥</span> Export Vouchers (XML)
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
          <h3 className="text-lg font-black text-slate-800 flex items-center gap-2">
            <span className="w-8 h-8 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center text-sm">🛠️</span>
            Ledger Mapping
          </h3>
          <p className="text-xs text-slate-400 font-medium">Map Syntaxnow Invoicing categories to your existing Tally Ledgers to prevent duplicate entries.</p>
          
          <div className="space-y-4">
            {[
              { key: 'salesLedger', label: 'Sales Account Name', placeholder: 'Sales @ 18%' },
              { key: 'taxLedger', label: 'Tax/GST Ledger Name', placeholder: 'Output CGST/SGST' },
              { key: 'expenseLedger', label: 'Base Expense Ledger', placeholder: 'General Expenses' },
              { key: 'bankLedger', label: 'Bank/Cash Ledger Name', placeholder: 'HDFC Bank A/c' }
            ].map(field => (
              <div key={field.key}>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">{field.label}</label>
                <input 
                  value={(mappings as any)[field.key]}
                  onChange={e => setMappings({...mappings, [field.key]: e.target.value})}
                  className="w-full bg-slate-50 border border-slate-100 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 outline-none font-bold text-slate-800"
                  placeholder={field.placeholder}
                />
              </div>
            ))}
          </div>

          <button 
            onClick={handleSaveMappings}
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-black transition-all"
          >
            Save Configuration
          </button>
        </div>

        <div className="bg-slate-50 p-10 rounded-[2.5rem] border border-slate-100 flex flex-col justify-between">
          <div className="space-y-6">
            <h3 className="text-lg font-black text-slate-800">How to Import?</h3>
            <ol className="space-y-4">
              {[
                "Configure your Ledger names on the left to match Tally.",
                "Click 'Export Vouchers' to download the XML file.",
                "Open Tally and go to 'Import of Data' > 'Vouchers'.",
                "Select the downloaded XML file and confirm."
              ].map((step, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="w-6 h-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-[10px] font-black shrink-0">{i+1}</span>
                  <p className="text-sm text-slate-600 font-medium">{step}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="mt-8 p-6 bg-white rounded-3xl border border-slate-100">
             <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-slate-400 uppercase">Export Statistics</span>
                <span className="text-[10px] font-black text-indigo-600 uppercase">Live</span>
             </div>
             <div className="grid grid-cols-2 gap-4">
                <div>
                   <p className="text-2xl font-black text-slate-900">{invoices.length}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Pending Invoices</p>
                </div>
                <div>
                   <p className="text-2xl font-black text-slate-900">{expenses.length}</p>
                   <p className="text-[9px] font-bold text-slate-400 uppercase">Expense Vouchers</p>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TallyIntegration;
