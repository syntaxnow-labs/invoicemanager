
import React, { useState, useMemo } from 'react';
import { Routes, Route, Navigate } from "react-router-dom";
import { 
  Invoice, Client, InvoiceStatus, DocumentType, BusinessProfile, 
  ExpenseRecord, ProductItem, InventoryTransaction 
} from './types';
import  Layout  from './components/Layout';
import Dashboard from "./components/Dashboard";
import Settings from "./components/Settings";
import ClientManager from "./components/ClientManager";
import ItemManager from "./components/ItemManager";
import InventoryDashboard from "./components/InventoryDashboard";
import ExpenseManager from "./components/ExpenseManager";

const App: React.FC = () => {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  
  const [businessProfile, setBusinessProfile] = useState<BusinessProfile | null>(null);
  const [quotations, setQuotations] = useState<Invoice[]>([]);
  const [creditNotes, setCreditNotes] = useState<Invoice[]>([]);
   const [clients, setClients] = useState<Client[]>([]);
  const [expenses, setExpenses] = useState<ExpenseRecord[]>([]);
  
 

  return (
    <Routes>
      {/* Redirect root */}
      <Route path="/" element={<Navigate to="/dashboard/overview" replace />} />

      {/* Layout route */}
      <Route path="/dashboard" element={<Layout />}>
        
        {/* Default dashboard */}
        <Route path="overview" element={<Dashboard />} />

        <Route path="quotations" element={<div>Quotations</div>} />
        <Route path="invoices" element={<div>Invoices</div>} />
        <Route path="credit-notes" element={<div>Credit Notes</div>} />
        <Route path="catalog" element={<div>Quotations</div>} />
        <Route path="inventory" element={<div>Invoices</div>} />
        <Route path="clients" element={<ClientManager />} />
        <Route path="expenses" element={<ExpenseManager />} />
        <Route path="settings" element={<div>settings</div>} />

        {/* Fallback */}
        {/* <Route path="*" element={<Navigate to="overview" replace />} /> */}
      </Route>
    </Routes>
  );
};

export default App;
