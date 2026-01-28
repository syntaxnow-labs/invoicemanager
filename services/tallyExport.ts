
import { Invoice, ExpenseRecord, Client, BusinessProfile, DocumentType } from '../types';

export const TallyExportService = {
  generateVoucherXML: (
    invoices: Invoice[], 
    expenses: ExpenseRecord[], 
    clients: Client[], 
    business: BusinessProfile,
    mappings: { salesLedger: string; taxLedger: string; expenseLedger: string; bankLedger: string }
  ) => {
    let xml = `<?xml version="1.0"?>
<ENVELOPE>
  <HEADER>
    <TALLYREQUEST>Import Data</TALLYREQUEST>
  </HEADER>
  <BODY>
    <IMPORTDATA>
      <REQUESTDESC>
        <REPORTNAME>Vouchers</REPORTNAME>
      </REQUESTDESC>
      <REQUESTDATA>`;

    // Process Invoices as Sales Vouchers
    invoices.forEach(inv => {
      if (inv.type !== DocumentType.INVOICE) return;
      const client = clients.find(c => c.id === inv.clientId);
      const date = inv.date.replace(/-/g, '');
      const total = inv.items.reduce((s, i) => s + (i.quantity * i.rate * (1 + i.taxPercent/100 - i.discountPercent/100)), 0);
      const taxableValue = inv.items.reduce((s, i) => s + (i.quantity * i.rate * (1 - i.discountPercent/100)), 0);
      const taxValue = total - taxableValue;

      xml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Sales" ACTION="Create">
            <DATE>${date}</DATE>
            <VOUCHERNUMBER>${inv.invoiceNumber}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${client?.name || 'Cash'}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${client?.name || 'Cash'}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>YES</ISDEEMEDPOSITIVE>
              <AMOUNT>-${total.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${mappings.salesLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>
              <AMOUNT>${taxableValue.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${mappings.taxLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>
              <AMOUNT>${taxValue.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`;
    });

    // Process Expenses as Payment Vouchers
    expenses.forEach(exp => {
      const date = exp.date.replace(/-/g, '');
      xml += `
        <TALLYMESSAGE xmlns:UDF="TallyUDF">
          <VOUCHER VCHTYPE="Payment" ACTION="Create">
            <DATE>${date}</DATE>
            <VOUCHERNUMBER>${exp.reference || exp.id.slice(0, 8)}</VOUCHERNUMBER>
            <PARTYLEDGERNAME>${mappings.bankLedger}</PARTYLEDGERNAME>
            <PERSISTEDVIEW>Accounting Voucher View</PERSISTEDVIEW>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${mappings.expenseLedger} - ${exp.category}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>YES</ISDEEMEDPOSITIVE>
              <AMOUNT>-${exp.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
            <ALLLEDGERENTRIES.LIST>
              <LEDGERNAME>${mappings.bankLedger}</LEDGERNAME>
              <ISDEEMEDPOSITIVE>NO</ISDEEMEDPOSITIVE>
              <AMOUNT>${exp.amount.toFixed(2)}</AMOUNT>
            </ALLLEDGERENTRIES.LIST>
          </VOUCHER>
        </TALLYMESSAGE>`;
    });

    xml += `
      </REQUESTDATA>
    </IMPORTDATA>
  </BODY>
</ENVELOPE>`;

    return xml;
  },

  downloadXML: (xml: string, fileName: string) => {
    const blob = new Blob([xml], { type: 'text/xml' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  }
};
