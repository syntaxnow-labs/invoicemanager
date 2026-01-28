
import { Invoice, Client, BusinessProfile, RecurringTemplate, ProductItem, InventoryTransaction } from '../types';

const KEYS = {
  INVOICES: 'omni_invoices',
  CLIENTS: 'omni_clients',
  PREFS: 'omni_prefs',
  BUSINESS: 'omni_business',
  RECURRING: 'omni_recurring',
  ITEMS: 'omni_items',
  STOCK_LEDGER: 'omni_stock_ledger'
};

const DEFAULT_BUSINESS: BusinessProfile = {
  name: 'OmniInvoice Pro',
  email: 'contact@omniinvoice.com',
  phone: '+1 (555) 000-0000',
  address: '123 Enterprise Way, Silicon Valley\nCA 94043, United States',
  gstNumber: 'GSTIN123456789',
  website: 'www.omniinvoice.com',
  bankDetails: 'Bank: Silicon Valley Bank\nAccount: 0000 1111 2222\nIFSC/SWIFT: SVB000123',
  invoicePrefix: 'INV-',
  quotationPrefix: 'QT-',
  autoDeductInventory: true
};

export const StorageService = {
  getInvoices: (): Invoice[] => {
    const data = localStorage.getItem(KEYS.INVOICES);
    return data ? JSON.parse(data) : [];
  },
  saveInvoices: (invoices: Invoice[]) => {
    localStorage.setItem(KEYS.INVOICES, JSON.stringify(invoices));
  },
  getClients: (): Client[] => {
    const data = localStorage.getItem(KEYS.CLIENTS);
    return data ? JSON.parse(data) : [];
  },
  saveClients: (clients: Client[]) => {
    localStorage.setItem(KEYS.CLIENTS, JSON.stringify(clients));
  },
  getRecurringTemplates: (): RecurringTemplate[] => {
    const data = localStorage.getItem(KEYS.RECURRING);
    return data ? JSON.parse(data) : [];
  },
  saveRecurringTemplates: (templates: RecurringTemplate[]) => {
    localStorage.setItem(KEYS.RECURRING, JSON.stringify(templates));
  },
  getProducts: (): ProductItem[] => {
    const data = localStorage.getItem(KEYS.ITEMS);
    return data ? JSON.parse(data) : [];
  },
  saveProducts: (products: ProductItem[]) => {
    localStorage.setItem(KEYS.ITEMS, JSON.stringify(products));
  },
  getInventoryTransactions: (): InventoryTransaction[] => {
    const data = localStorage.getItem(KEYS.STOCK_LEDGER);
    return data ? JSON.parse(data) : [];
  },
  saveInventoryTransactions: (txs: InventoryTransaction[]) => {
    localStorage.setItem(KEYS.STOCK_LEDGER, JSON.stringify(txs));
  },
  getPreferredCurrency: (): string => {
    return localStorage.getItem(KEYS.PREFS) || 'USD';
  },
  setPreferredCurrency: (currency: string) => {
    localStorage.setItem(KEYS.PREFS, currency);
  },
  getBusinessProfile: (): BusinessProfile => {
    const data = localStorage.getItem(KEYS.BUSINESS);
    return data ? { ...DEFAULT_BUSINESS, ...JSON.parse(data) } : DEFAULT_BUSINESS;
  },
  saveBusinessProfile: (profile: BusinessProfile) => {
    localStorage.setItem(KEYS.BUSINESS, JSON.stringify(profile));
  }
};
