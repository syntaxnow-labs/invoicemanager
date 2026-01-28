
export enum InvoiceStatus {
  DRAFT = 'Draft',
  SENT = 'Sent',
  PAID = 'Paid',
  PARTIAL = 'Partial',
  OVERDUE = 'Overdue',
  CANCELLED = 'Cancelled',
  ACCEPTED = 'Accepted',
  EXPIRED = 'Expired',
  DECLINED = 'Declined'
}

export enum DocumentType {
  INVOICE = 'Invoice',
  QUOTATION = 'Quotation',
  CREDIT_NOTE = 'Credit Note'
}

export enum PaymentMode {
  CASH = 'Cash',
  BANK_TRANSFER = 'Bank Transfer',
  UPI = 'UPI',
  CARD = 'Card',
  PAYPAL = 'PayPal',
  PHONEPE = 'PhonePe'
}

export enum ExpenseCategory {
  MARKETING = 'Marketing',
  RENT = 'Rent/Office',
  UTILITIES = 'Utilities',
  SALARY = 'Salary/Wages',
  TRAVEL = 'Travel',
  SOFTWARE = 'Software/SaaS',
  EQUIPMENT = 'Equipment',
  OTHER = 'Other'
}

export enum RecurringFrequency {
  WEEKLY = 'Weekly',
  MONTHLY = 'Monthly',
  YEARLY = 'Yearly'
}

export interface CustomFieldDefinition {
  id: string;
  label: string;
  placeholder?: string;
}

export interface RecurringTemplate {
  id: string;
  clientId: string;
  items: InvoiceItem[];
  currency: string;
  frequency: RecurringFrequency;
  startDate: string;
  endDate?: string;
  nextRunDate: string;
  lastRunDate?: string;
  isActive: boolean;
  notes?: string;
}

export interface ExpenseRecord {
  id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  vendor: string;
  mode: PaymentMode;
  reference: string;
  receiptUrl?: string;
  note?: string;
}

export interface InventoryTransaction {
  id: string;
  productId: string;
  type: 'IN' | 'OUT' | 'ADJUSTMENT';
  quantity: number;
  date: string;
  referenceId?: string; // e.g. Invoice ID
  note?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  itemType: 'Goods' | 'Service';
  sku?: string;
  unit?: string;
  description?: string;
  hsnCode?: string;
  defaultRate: number;
  defaultTax: number;
  trackInventory: boolean;
  stockLevel: number;
  lowStockThreshold: number;
}

export interface BusinessProfile {
  id?: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  gstNumber: string;
  logoUrl?: string;
  website?: string;
  bankDetails?: string;
  invoicePrefix?: string;
  quotationPrefix?: string;
  creditNotePrefix?: string;
  customFieldDefinitions?: CustomFieldDefinition[];
  phonepeMerchantId?: string;
  phonepeSaltKey?: string;
  phonepeSaltIndex?: string;
  autoDeductInventory: boolean;
  currency?: string;
  // SMTP Configuration
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPass?: string;
  smtpSecure?: boolean;
}

export interface Client {
  id: string;
  customerType: 'Business' | 'Individual';
  salutation?: string;
  firstName?: string;
  lastName?: string;
  name: string; // Display Name / Company Name
  email: string;
  phone?: string;
  mobile?: string;
  gstNumber?: string;
  gstTreatment?: string;
  pan?: string;
  placeOfSupply?: string;
  currency: string;
  paymentTerms?: string;
  billingAddress: string;
  billingStreet?: string;
  billingCity?: string;
  billingState?: string;
  billingZip?: string;
  billingCountry?: string;
  shippingAddress?: string;
  shippingStreet?: string;
  shippingCity?: string;
  shippingState?: string;
  shippingZip?: string;
  shippingCountry?: string;
}

export interface InvoiceItem {
  id: string;
  productId?: string; // Reference to catalog
  description: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  taxPercent: number;
  discountPercent: number;
}

export interface Invoice {
  id: string;
  type: DocumentType;
  invoiceNumber: string;
  clientId: string;
  date: string;
  dueDate: string;
  status: InvoiceStatus;
  items: InvoiceItem[];
  currency: string;
  notes?: string;
  terms?: string;
  customExchangeRate?: number;
  convertedFromId?: string;
  recurringTemplateId?: string;
  customFields?: Record<string, string>;
}

export interface PaymentRecord {
  id: string;
  invoiceId: string;
  amount: number;
  date: string;
  mode: PaymentMode;
  reference: string;
  note?: string;
}
