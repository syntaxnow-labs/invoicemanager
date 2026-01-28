
import React, { useMemo, useState, useRef } from "react";
import { Invoice, Client, BusinessProfile, DocumentType, InvoiceStatus } from "../types";
import { Printer, X, ArrowRight, ShieldCheck, Mail, Send, Loader2, FileText } from "lucide-react";
import { ApiService } from "../services/api";
import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

interface InvoicePreviewProps {
  invoice: Invoice | null;
  client?: Client;
  business: BusinessProfile;
  onClose: () => void;
  onConvert?: (invoice: Invoice) => void;
}

const InvoicePreview: React.FC<InvoicePreviewProps> = ({
  invoice,
  client,
  business,
  onClose,
  onConvert
}) => {
  const [showEmailDialog, setShowEmailDialog] = useState(false);
  const [emailTo, setEmailTo] = useState(client?.email || '');
  const [emailSubject, setEmailSubject] = useState(`${invoice?.type || 'Document'} ${invoice?.invoiceNumber || ''} from ${business.name}`);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);
  
  const printRef = useRef<HTMLDivElement>(null);

  if (!invoice) return null;

  const safeItems = useMemo(() => {
    if (!invoice.items) return [];
    if (Array.isArray(invoice.items)) return invoice.items;
    return [];
  }, [invoice.items]);

  const totals = useMemo(() => {
    return safeItems.reduce(
      (acc: any, item: any) => {
        const qty = parseFloat(item.quantity) || 0;
        const rate = parseFloat(item.rate) || 0;
        const taxP = parseFloat(item.taxPercent) || 0;
        const discP = parseFloat(item.discountPercent) || 0;

        const base = qty * rate;
        const disc = base * (discP / 100);
        const taxable = base - disc;
        const tax = taxable * (taxP / 100);

        return {
          subtotal: acc.subtotal + base,
          tax: acc.tax + tax,
          total: acc.total + taxable + tax
        };
      },
      { subtotal: 0, tax: 0, total: 0 }
    );
  }, [safeItems]);

  const isQuotation = invoice.type === DocumentType.QUOTATION;

  const handlePrint = () => {
    window.print();
  };

  const handleConvert = () => {
    if (!onConvert) return;
    const convertedInvoice: Invoice = {
      ...invoice,
      id: '', 
      type: DocumentType.INVOICE,
      status: InvoiceStatus.DRAFT,
      invoiceNumber: '', 
      date: new Date().toISOString().split('T')[0],
      convertedFromId: invoice.id
    };
    onConvert(convertedInvoice);
  };

  const generatePDFBase64 = async (): Promise<string> => {
    if (!printRef.current) throw new Error("Reference to printable area missing.");

    const previewContainer = printRef.current.parentElement;
    if (previewContainer) previewContainer.scrollTop = 0;

    const canvas = await html2canvas(printRef.current, {
      scale: 3, 
      useCORS: true,
      logging: false,
      backgroundColor: "#ffffff",
      windowWidth: 1200, 
      onclone: (clonedDoc) => {
        const el = clonedDoc.getElementById('printable-invoice');
        if (el) {
          el.style.width = '210mm';
          el.style.display = 'block';
        }
      }
    });

    const imgData = canvas.toDataURL("image/jpeg", 1.0);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4"
    });

    const imgWidth = 210; 
    const imgHeight = (canvas.height * imgWidth) / canvas.width;
    
    pdf.addImage(imgData, "JPEG", 0, 0, imgWidth, imgHeight, undefined, 'FAST');
    
    return pdf.output('datauristring').split(',')[1];
  };

  const handleSendEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailTo) {
      setSendError("Please provide a recipient email address.");
      return;
    }
    
    setIsSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const pdfBase64 = await generatePDFBase64();

      const emailHtml = `
        <div style="font-family: sans-serif; color: #333; line-height: 1.6; max-width: 600px; padding: 20px; border: 1px solid #eee; border-radius: 12px;">
          <h2 style="color: #4f46e5; margin-bottom: 20px;">Document from ${business.name}</h2>
          <p>Dear ${client?.name || 'Customer'},</p>
          <p>Please find the attached <strong>${invoice.type} #${invoice.invoiceNumber}</strong> for your records.</p>
          <div style="background: #f8fafc; padding: 25px; border-radius: 12px; margin: 25px 0; border: 1px solid #e2e8f0;">
            <p style="margin: 0; font-size: 12px; color: #64748b; text-transform: uppercase; letter-spacing: 0.05em; font-weight: bold;">Amount Due</p>
            <p style="margin: 5px 0 0 0; font-size: 28px; font-weight: 800; color: #1e293b;">${invoice.currency} ${totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</p>
          </div>
          <p>Thank you for your business.</p>
          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 30px 0;">
          <p style="font-size: 12px; color: #94a3b8; line-height: 1.4;">
            <strong>${business.name}</strong><br>
            ${business.email || ''}<br>
            ${business.phone || ''}
          </p>
        </div>
      `;

      await ApiService.sendEmail({
        to: emailTo,
        subject: emailSubject,
        html: emailHtml,
        text: `Hello, please find attached ${invoice.type} #${invoice.invoiceNumber} from ${business.name}. Total: ${invoice.currency} ${totals.total.toLocaleString()}`,
        attachments: [{
          filename: `${invoice.type}-${invoice.invoiceNumber}.pdf`,
          content: pdfBase64,
          encoding: 'base64'
        }]
      });

      setSendSuccess(true);
      setTimeout(() => {
        setShowEmailDialog(false);
        setSendSuccess(false);
      }, 2500);
    } catch (err: any) {
      setSendError(err.message || "Failed to generate or deliver PDF.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 z-[9999] flex items-start justify-center overflow-y-auto pt-4 pb-4 print-container">
      <div className="bg-white w-full max-w-[210mm] shadow-2xl relative flex flex-col">
        {/* Action bar */}
        <div className="sticky top-0 bg-white border-b-2 border-slate-100 px-6 py-3 flex justify-between items-center no-print z-50">
          <div className="flex items-center gap-4">
            <span className="font-black text-[9px] uppercase tracking-widest text-slate-400">
              {invoice.type} Mode
            </span>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setShowEmailDialog(true)}
              className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-indigo-100 transition-all flex items-center gap-2"
            >
              <Mail className="w-3 h-3" />
              Send as PDF
            </button>
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <Printer className="w-3 h-3" />
              Print
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-100 text-slate-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-slate-200 flex items-center gap-2"
            >
              <X className="w-3 h-3" />
              Close
            </button>
          </div>
        </div>

        {/* Email Dialog */}
        {showEmailDialog && (
          <div className="absolute inset-x-0 top-14 bg-white border-b-4 border-indigo-600 shadow-2xl p-8 z-[60] animate-in slide-in-from-top-4 duration-300 no-print">
            <div className="max-w-xl mx-auto">
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                   <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600">
                      <Mail className="w-5 h-5" />
                   </div>
                   <h3 className="text-lg font-black text-slate-900 tracking-tight">Email Attachment</h3>
                </div>
                <button onClick={() => setShowEmailDialog(false)} className="text-slate-400 p-2">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {sendSuccess ? (
                <div className="py-12 text-center animate-in zoom-in duration-300">
                  <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldCheck className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-black text-slate-900">PDF Sent!</h4>
                </div>
              ) : (
                <form onSubmit={handleSendEmail} className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">To</label>
                    <input 
                      required type="email" value={emailTo}
                      onChange={e => setEmailTo(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Subject</label>
                    <input 
                      required value={emailSubject}
                      onChange={e => setEmailSubject(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-5 py-3 font-bold text-slate-800 outline-none"
                    />
                  </div>
                  <div className="pt-4 flex gap-4">
                    <button 
                      type="submit" disabled={isSending}
                      className="w-full py-4 bg-indigo-600 text-white rounded-xl font-black text-[10px] uppercase tracking-widest shadow-xl flex items-center justify-center gap-2"
                    >
                      {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      {isSending ? 'Generating PDF...' : 'Transmit Now'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}

        {/* ================= PRINTABLE CONTENT ================= */}
        <div 
          ref={printRef} 
          id="printable-invoice" 
          className="p-[15mm] text-slate-900 bg-white flex-1 overflow-visible"
          style={{ width: '210mm', minHeight: '297mm', boxSizing: 'border-box' }}
        >
          {/* Header Section */}
          <div className="flex justify-between items-start mb-10" style={{ marginBottom: '40px' }}>
            <div className="flex items-start" style={{ maxWidth: '65%' }}>
              {business.logoUrl && (
                <div className="mr-6" style={{ marginRight: '24px' }}>
                  <img 
                    src={business.logoUrl} 
                    alt="Logo" 
                    crossOrigin="anonymous"
                    style={{ maxHeight: '70px', maxWidth: '150px', objectFit: 'contain' }}
                  />
                </div>
              )}
              <div>
                <h2 style={{ fontSize: '24px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', marginBottom: '4px', lineHeight: '1.1' }}>
                  {business.name}
                </h2>
                <div style={{ fontSize: '11px', color: '#475569', lineHeight: '1.4' }}>
                  <p style={{ margin: '0 0 4px 0', whiteSpace: 'pre-line' }}>{business.address}</p>
                  <p style={{ margin: '0' }}>
                    {business.phone && <span style={{ marginRight: '12px' }}><b>P:</b> {business.phone}</span>}
                    {business.email && <span><b>E:</b> {business.email}</span>}
                  </p>
                  {business.gstNumber && (
                    <div style={{ 
                      marginTop: '8px', 
                      display: 'inline-block', 
                      padding: '4px 8px 9px 8px', 
                      backgroundColor: '#0f172a', 
                      color: '#ffffff', 
                      fontWeight: '800', 
                      fontSize: '9px', 
                      textTransform: 'uppercase',
                      lineHeight: '1',
                      borderRadius: '5px'
                    }}>
                      GSTIN: {business.gstNumber}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <h1 style={{ fontSize: '36px', fontWeight: '900', color: '#f1f5f9', textTransform: 'uppercase', lineHeight: '1', margin: '0' }}>
                {invoice.type}
              </h1>
              <div style={{ marginTop: '12px' }}>
                <p style={{ margin: '0', fontSize: '11px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase' }}>
                  # {invoice.invoiceNumber}
                </p>
                <p style={{ margin: '4px 0 0 0', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                  Date: {invoice.date}
                </p>
                {invoice.dueDate && (
                  <p style={{ margin: '2px 0 0 0', fontSize: '10px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>
                    Due: {invoice.dueDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Billing Info Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', padding: '20px 0', borderTop: '2px solid #0f172a', borderBottom: '2px solid #0f172a', marginBottom: '30px' }}>
            <div>
              <h4 style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>Bill To:</h4>
              <p style={{ fontSize: '16px', fontWeight: '900', color: '#0f172a', margin: '0 0 4px 0' }}>{client?.name || 'Walk-in Customer'}</p>
              <p style={{ fontSize: '11px', color: '#475569', margin: '0', lineHeight: '1.4', whiteSpace: 'pre-line' }}>{client?.billingAddress}</p>
              {client?.phone && <p style={{ fontSize: '10px', color: '#64748b', marginTop: '6px' }}><b>Phone:</b> {client.phone}</p>}
              {client?.gstNumber && <p style={{ fontSize: '10px', fontWeight: '800', color: '#0f172a', marginTop: '4px', textTransform: 'uppercase' }}>GSTIN: {client.gstNumber}</p>}
            </div>

            <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <h4 style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Total Payable</h4>
              <p style={{ fontSize: '32px', fontWeight: '900', color: '#0f172a', margin: '0', letterSpacing: '-0.02em' }}>
                {invoice.currency} {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </p>
              <div style={{ marginTop: '8px', fontSize: '9px', fontWeight: '800', color: '#94a3b8', textTransform: 'uppercase' }}>
                Status: {invoice.status}
              </div>
            </div>
          </div>

          {/* Table - Restoration of HSN Column */}
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '40px', tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid #0f172a' }}>
                <th style={{ width: '8%', padding: '10px', fontSize: '9px', fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }}>S.N</th>
                <th style={{ width: '35%', padding: '10px', fontSize: '9px', fontWeight: '900', textAlign: 'left', textTransform: 'uppercase' }}>Description</th>
                <th style={{ width: '12%', padding: '10px', fontSize: '9px', fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }}>HSN/SAC</th>
                <th style={{ width: '10%', padding: '10px', fontSize: '9px', fontWeight: '900', textAlign: 'center', textTransform: 'uppercase' }}>Qty</th>
                <th style={{ width: '15%', padding: '10px', fontSize: '9px', fontWeight: '900', textAlign: 'right', textTransform: 'uppercase' }}>Rate</th>
                <th style={{ width: '20%', padding: '10px', fontSize: '9px', fontWeight: '900', textAlign: 'right', textTransform: 'uppercase' }}>Total</th>
              </tr>
            </thead>
            <tbody>
              {safeItems.map((item: any, i: number) => {
                const taxable = (parseFloat(item.quantity) || 0) * (parseFloat(item.rate) || 0);
                const gst = taxable * ((parseFloat(item.taxPercent) || 0) / 100);
                return (
                  <tr key={i} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 10px', fontSize: '10px', textAlign: 'center', color: '#94a3b8', fontWeight: 'bold' }}>{i + 1}</td>
                    <td style={{ padding: '12px 10px' }}>
                      <p style={{ fontSize: '11px', fontWeight: '800', color: '#0f172a', margin: '0' }}>{item.description}</p>
                    </td>
                    <td style={{ padding: '12px 10px', fontSize: '10px', textAlign: 'center', fontWeight: '700', color: '#64748b' }}>
                      {item.hsnCode || '---'}
                    </td>
                    <td style={{ padding: '12px 10px', fontSize: '11px', textAlign: 'center', fontWeight: '800', color: '#0f172a' }}>{item.quantity}</td>
                    <td style={{ padding: '12px 10px', fontSize: '11px', textAlign: 'right', color: '#475569' }}>{item.rate.toLocaleString()}</td>
                    <td style={{ padding: '12px 10px', fontSize: '11px', textAlign: 'right', fontWeight: '900', color: '#0f172a' }}>
                      {(taxable + gst).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Totals & Footer Area */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 0.8fr', gap: '40px' }}>
            <div>
              <div style={{ marginBottom: '25px' }}>
                <h4 style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '8px' }}>Bank & Payment Terms</h4>
                <div style={{ fontSize: '10px', color: '#475569', backgroundColor: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0', whiteSpace: 'pre-line', fontStyle: 'italic', lineHeight: '1.5' }}>
                  {business.bankDetails || 'Standard Payment Terms Apply.'}
                </div>
              </div>
              {invoice.notes && (
                <div>
                  <h4 style={{ fontSize: '9px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', marginBottom: '4px' }}>Notes</h4>
                  <p style={{ fontSize: '10px', color: '#64748b', margin: '0', lineHeight: '1.4' }}>{invoice.notes}</p>
                </div>
              )}
            </div>

            <div>
              <div style={{ backgroundColor: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '8px', color: '#64748b', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  <span>Subtotal</span>
                  <span>{totals.subtotal.toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px', marginBottom: '12px', color: '#4f46e5', fontWeight: 'bold', textTransform: 'uppercase' }}>
                  <span>Tax Amount</span>
                  <span>+ {totals.tax.toLocaleString()}</span>
                </div>
                <div style={{ paddingTop: '12px', borderTop: '2px solid #0f172a', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                  <span style={{ fontSize: '10px', fontWeight: '900', textTransform: 'uppercase', color: '#0f172a' }}>Grand Total</span>
                  <span style={{ fontSize: '22px', fontWeight: '900', color: '#0f172a', lineHeight: '1' }}>
                    {invoice.currency} {totals.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
              
              <div style={{ marginTop: '50px', textAlign: 'center' }}>
                <div style={{ height: '40px' }}></div>
                <div style={{ width: '160px', height: '1.5px', backgroundColor: '#0f172a', margin: '0 auto 6px' }}></div>
                <p style={{ fontSize: '9px', fontWeight: '900', color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.2em', margin: '0' }}>Authorized Signatory</p>
                <p style={{ fontSize: '7px', fontWeight: '700', color: '#94a3b8', textTransform: 'uppercase', marginTop: '2px' }}>FOR {business.name}</p>
              </div>
            </div>
          </div>

          <div style={{ marginTop: 'auto', paddingTop: '40px', textAlign: 'center' }}>
            <p style={{ fontSize: '8px', color: '#cbd5e1', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.4em' }}>This is a computer generated document. Signature is not required</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InvoicePreview;
