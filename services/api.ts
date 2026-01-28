
import { Invoice, Client, BusinessProfile, ProductItem, InventoryTransaction, ExpenseRecord, DocumentType } from '../types';

const API_BASE_URL = '/api';

const handleResponse = async (res: Response) => {
  if (!res.ok) {
    let errorDetail = '';
    try {
      errorDetail = await res.text();
    } catch (e) {
      errorDetail = res.statusText;
    }
    const errorMessage = `API ${res.status} at ${res.url}: ${errorDetail}`;
    console.error(errorMessage);
    throw new Error(errorMessage);
  }
  if (res.status === 204) return null;
  const contentType = res.headers.get("content-type");
  if (contentType && contentType.includes("application/json")) {
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }
  return null;
};

export const ApiService = {
  getBusinessProfile: async (): Promise<BusinessProfile> => {
    const res = await fetch(`${API_BASE_URL}/business`);
    return handleResponse(res);
  },
  
  updateBusinessProfile: async (profile: BusinessProfile) => {
    const res = await fetch(`${API_BASE_URL}/business`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(profile)
    });
    return handleResponse(res);
  },

  testSmtp: async (config: { smtpHost: string, smtpPort: number, smtpUser: string, smtpPass: string, smtpSecure: boolean }) => {
    const res = await fetch(`${API_BASE_URL}/test-smtp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    });
    return handleResponse(res);
  },

  getClients: async (): Promise<Client[]> => {
    const res = await fetch(`${API_BASE_URL}/clients`);
    return handleResponse(res);
  },

  saveClient: async (client: Partial<Client>): Promise<Client> => {
    const isUpdate = !!client.id;
    const url = isUpdate ? `${API_BASE_URL}/clients/${client.id}` : `${API_BASE_URL}/clients`;
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(client)
    });
    return handleResponse(res);
  },

  deleteClient: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/clients/${id}`, {
      method: 'DELETE'
    });
    await handleResponse(res);
  },

  saveDocument: async (doc: Partial<Invoice>, type: DocumentType): Promise<Invoice> => {
    const endpointMap: Record<string, string> = {
      [DocumentType.INVOICE]: 'invoices',
      [DocumentType.QUOTATION]: 'quotations',
      [DocumentType.CREDIT_NOTE]: 'credit-notes'
    };
    const endpoint = endpointMap[type];
    const isUpdate = !!doc.id && doc.id.length > 30;
    const url = isUpdate ? `${API_BASE_URL}/${endpoint}/${doc.id}` : `${API_BASE_URL}/${endpoint}`;
    
    const cleanDoc = {
      ...doc,
      items: doc.items?.map(item => ({
        productId: item.productId || null,
        description: item.description,
        quantity: Number(item.quantity),
        rate: Number(item.rate),
        taxPercent: Number(item.taxPercent || 0),
        discountPercent: Number(item.discountPercent || 0)
      }))
    };

    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanDoc)
    });
    return handleResponse(res);
  },

  getInvoices: async (): Promise<Invoice[]> => {
    const res = await fetch(`${API_BASE_URL}/invoices`);
    return handleResponse(res);
  },
  
  getQuotations: async (): Promise<Invoice[]> => {
    const res = await fetch(`${API_BASE_URL}/quotations`);
    return handleResponse(res);
  },

  getCreditNotes: async (): Promise<Invoice[]> => {
    const res = await fetch(`${API_BASE_URL}/credit-notes`);
    return handleResponse(res);
  },

  deleteDocument: async (id: string, type: DocumentType): Promise<void> => {
    const endpointMap: Record<string, string> = {
      [DocumentType.INVOICE]: 'invoices',
      [DocumentType.QUOTATION]: 'quotations',
      [DocumentType.CREDIT_NOTE]: 'credit-notes'
    };
    const res = await fetch(`${API_BASE_URL}/${endpointMap[type]}/${id}`, {
      method: 'DELETE'
    });
    await handleResponse(res);
  },
  
  getNextNumber: async (type: string): Promise<{ nextNumber: string }> => {
    const res = await fetch(`${API_BASE_URL}/next-number?type=${type}`);
    return handleResponse(res);
  },

  getProducts: async (): Promise<ProductItem[]> => {
    const res = await fetch(`${API_BASE_URL}/products`);
    return handleResponse(res);
  },
  
  saveProduct: async (product: ProductItem): Promise<ProductItem> => {
    const res = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(product)
    });
    return handleResponse(res);
  },

  deleteProduct: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE'
    });
    await handleResponse(res);
  },

  getInventoryTransactions: async (): Promise<InventoryTransaction[]> => {
    const res = await fetch(`${API_BASE_URL}/inventory/transactions`);
    return handleResponse(res);
  },
  
  adjustStock: async (productId: string, qty: number, type: string, note?: string) => {
    const res = await fetch(`${API_BASE_URL}/inventory/adjust`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, qty, type, note })
    });
    return handleResponse(res);
  },

  getExpenses: async (): Promise<ExpenseRecord[]> => {
    const res = await fetch(`${API_BASE_URL}/expenses`);
    return handleResponse(res);
  },

  saveExpense: async (expense: Partial<ExpenseRecord>): Promise<ExpenseRecord> => {
    const isUpdate = !!expense.id && expense.id.length > 30;
    const url = isUpdate ? `${API_BASE_URL}/expenses/${expense.id}` : `${API_BASE_URL}/expenses`;
    const res = await fetch(url, {
      method: isUpdate ? 'PUT' : 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(expense)
    });
    return handleResponse(res);
  },

  deleteExpense: async (id: string): Promise<void> => {
    const res = await fetch(`${API_BASE_URL}/expenses/${id}`, {
      method: 'DELETE'
    });
    await handleResponse(res);
  },

  sendEmail: async (data: { to: string, subject: string, html: string, text?: string, attachments?: { filename: string, content: string, encoding?: string }[] }) => {
    const res = await fetch(`${API_BASE_URL}/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return handleResponse(res);
  }
};
