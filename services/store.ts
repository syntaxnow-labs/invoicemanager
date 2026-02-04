import { create } from 'zustand';
import { ApiService } from '../services/api';

export const useClientStore = create((set) => ({
    clients: [],
    addClient: async (c) => { await ApiService.saveClient(c)},
    updateClient: async (c) => { await ApiService.saveClient(c)},
    deleteClient: async (id) => { await ApiService.deleteClient(id)}
}));

export const useInvoiceStore = create((set) => ({
    invoices: async (i) => { await ApiService.getInvoices()}
}));

export const useQuotationStore = create((set) => ({
    quotations: async (i) => { await ApiService.getQuotations()}
}));    

export const useCreditNoteStore = create((set) => ({
    creditNotes: async (i) => { await ApiService.getCreditNotes()}
}));

export const useProductStore = create((set) => ({
    products: async (i) => { await ApiService.getProducts()}
}));

export const useExpenseStore = create((set) => ({
    expenses: async (i) => { await ApiService.getExpenses()},
    addExpenses: async (c) => { await ApiService.saveExpense(c)},
    deleteExpenses: async (id) => { await ApiService.deleteExpense(id)}
}));

export const useInventoryStore = create((set) => ({
    inventory: async (i) => { await ApiService.getInventoryTransactions()}
}));

export const useBusinessStore = create((set) => ({
    business: async (i) => { await ApiService.getBusinessProfile()}
}));