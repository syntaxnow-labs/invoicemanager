
import React, { useState, useEffect } from 'react';
import { BusinessProfile } from '../types';
import { GSTService, GSTVerificationResult } from '../services/gstService';
import { CurrencyService } from '../services/exchangeRates';
import { ApiService } from '../services/api';
import { 
  Building2, 
  Image as ImageIcon, 
  Save, 
  CheckCircle2, 
  Globe, 
  Mail, 
  Phone, 
  MapPin, 
  Layers, 
  Trash2,
  AlertCircle,
  Wallet,
  Zap,
  CreditCard,
  Server,
  Lock,
  Key,
  ShieldCheck,
  XCircle,
  Loader2
} from 'lucide-react';

interface SettingsProps {
  profile: BusinessProfile;
  onUpdate: (profile: BusinessProfile) => void;
}

const SectionHeader = ({ icon: Icon, title, description }: { icon: any, title: string, description: string }) => (
  <div className="mb-6">
    <div className="flex items-center gap-3 mb-1">
      <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
        <Icon className="w-5 h-5" />
      </div>
      <h3 className="text-lg font-black text-slate-900">{title}</h3>
    </div>
    <p className="text-slate-400 text-xs font-medium ml-12">{description}</p>
  </div>
);

const InputLabel = ({ children, icon: Icon }: { children?: React.ReactNode, icon?: any }) => (
  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 flex items-center gap-1.5">
    {Icon && <Icon className="w-3 h-3" />}
    {children}
  </label>
);

const Settings: React.FC<SettingsProps> = ({ profile, onUpdate }) => {
  const [localProfile, setLocalProfile] = useState(profile);
  const [isSaving, setIsSaving] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<GSTVerificationResult | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // SMTP Test States
  const [isTestingSmtp, setIsTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<{ success: boolean, message: string } | null>(null);

  useEffect(() => {
    setLocalProfile(profile);
  }, [profile]);

  const handleVerifyBusinessGST = async () => {
    if (!localProfile.gstNumber) return;
    setIsVerifying(true);
    try {
      const result = await GSTService.verifyGST(localProfile.gstNumber);
      setVerifyResult(result);
      if (result.isValid && result.legalName) {
        setLocalProfile(prev => ({ ...prev, name: result.legalName || prev.name }));
      }
    } finally {
      setIsVerifying(false);
    }
  };

  const handleTestSmtp = async () => {
    if (!localProfile.smtpHost || !localProfile.smtpUser || !localProfile.smtpPass) {
      setSmtpTestResult({ success: false, message: "Fill in Host, User, and Pass first." });
      return;
    }
    setIsTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const result = await ApiService.testSmtp({
        smtpHost: localProfile.smtpHost,
        smtpPort: localProfile.smtpPort || 587,
        smtpUser: localProfile.smtpUser,
        smtpPass: localProfile.smtpPass,
        smtpSecure: localProfile.smtpSecure || false
      });
      setSmtpTestResult({ success: true, message: result.message || "Connection Verified!" });
    } catch (err: any) {
      setSmtpTestResult({ success: false, message: err.message });
    } finally {
      setIsTestingSmtp(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(false);
    try {
      await onUpdate(localProfile);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error("Save failed:", err);
      alert("Failed to save settings. Please check your connection.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        alert("Logo must be under 2MB");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setLocalProfile({ ...localProfile, logoUrl: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLocalProfile({ ...localProfile, logoUrl: undefined });
  };

  return (
    <div className="max-w-5xl animate-in fade-in slide-in-from-bottom-4 duration-500 pb-24">
      <div className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">System Configuration</h2>
          <p className="text-slate-500 font-medium">Manage your identity, compliance, and automation preferences</p>
        </div>
        <div className="flex items-center gap-4">
          {saveSuccess && (
            <span className="text-emerald-500 font-black text-[10px] uppercase tracking-widest flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
              <CheckCircle2 className="w-4 h-4" />
              Settings Synced
            </span>
          )}
          <button 
            type="submit"
            form="settings-form"
            disabled={isSaving}
            className="px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-3 transition-all hover:-translate-y-0.5"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Syncing...' : 'Save Configuration'}
          </button>
        </div>
      </div>

      <form id="settings-form" onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <SectionHeader 
                icon={Building2} 
                title="Corporate Identity" 
                description="Your legal trade name and public-facing details."
              />
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputLabel icon={Building2}>Trade Name</InputLabel>
                  <input 
                    required
                    value={localProfile.name}
                    onChange={e => setLocalProfile({...localProfile, name: e.target.value})}
                    placeholder="Enter your registered business name"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>
                
                <div>
                  <InputLabel icon={Mail}>Business Email</InputLabel>
                  <input 
                    type="email"
                    value={localProfile.email}
                    onChange={e => setLocalProfile({...localProfile, email: e.target.value})}
                    placeholder="billing@company.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>
                
                <div>
                  <InputLabel icon={Phone}>Contact Phone</InputLabel>
                  <input 
                    value={localProfile.phone}
                    onChange={e => setLocalProfile({...localProfile, phone: e.target.value})}
                    placeholder="+1 (555) 000-0000"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <InputLabel icon={Globe}>Business Website</InputLabel>
                  <input 
                    value={localProfile.website || ''}
                    onChange={e => setLocalProfile({...localProfile, website: e.target.value})}
                    placeholder="https://www.yourcompany.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>

                <div className="md:col-span-2">
                  <InputLabel icon={MapPin}>Registered Address</InputLabel>
                  <textarea 
                    rows={3}
                    value={localProfile.address}
                    onChange={e => setLocalProfile({...localProfile, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 resize-none leading-relaxed transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <div className="flex justify-between items-start">
                <SectionHeader 
                  icon={Mail} 
                  title="Email Communications" 
                  description="Configure SMTP for automated document delivery."
                />
                <button
                  type="button"
                  onClick={handleTestSmtp}
                  disabled={isTestingSmtp}
                  className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-indigo-100 disabled:opacity-50 transition-all flex items-center gap-2"
                >
                  {isTestingSmtp ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                  Test Connection
                </button>
              </div>

              {smtpTestResult && (
                <div className={`mb-6 p-4 rounded-2xl flex items-start gap-3 animate-in slide-in-from-top-2 ${smtpTestResult.success ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                  {smtpTestResult.success ? <ShieldCheck className="w-5 h-5 shrink-0 mt-0.5" /> : <XCircle className="w-5 h-5 shrink-0 mt-0.5" />}
                  <div className="text-xs font-bold leading-relaxed">
                    <p className="font-black uppercase tracking-tight mb-0.5">{smtpTestResult.success ? 'Verification Success' : 'Connection Refused'}</p>
                    {smtpTestResult.message}
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputLabel icon={Server}>SMTP Host</InputLabel>
                  <input 
                    value={localProfile.smtpHost || ''}
                    onChange={e => setLocalProfile({...localProfile, smtpHost: e.target.value})}
                    placeholder="smtp.gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>
                
                <div>
                  <InputLabel icon={Layers}>SMTP Port</InputLabel>
                  <input 
                    type="number"
                    value={localProfile.smtpPort || ''}
                    onChange={e => setLocalProfile({...localProfile, smtpPort: parseInt(e.target.value) || 0})}
                    placeholder="587"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                  <p className="text-[8px] text-slate-400 mt-2 ml-1">Typically 587 (TLS) or 465 (SSL)</p>
                </div>

                <div className="flex items-center gap-4 mt-8">
                  <button
                    type="button"
                    onClick={() => setLocalProfile({...localProfile, smtpSecure: !localProfile.smtpSecure})}
                    className={`w-12 h-6 rounded-full transition-all cursor-pointer flex items-center p-1 ${localProfile.smtpSecure ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-all ${localProfile.smtpSecure ? 'translate-x-6' : 'translate-x-0'}`}></div>
                  </button>
                  <div>
                    <p className="text-sm font-black text-slate-800">Secure (SSL)</p>
                    <p className="text-[9px] text-slate-400 font-bold uppercase">Enable for port 465</p>
                  </div>
                </div>

                <div>
                  <InputLabel icon={Mail}>SMTP Username</InputLabel>
                  <input 
                    value={localProfile.smtpUser || ''}
                    onChange={e => setLocalProfile({...localProfile, smtpUser: e.target.value})}
                    placeholder="your-email@gmail.com"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>

                <div>
                  <InputLabel icon={Key}>SMTP Password / App Key</InputLabel>
                  <input 
                    type="password"
                    value={localProfile.smtpPass || ''}
                    onChange={e => setLocalProfile({...localProfile, smtpPass: e.target.value})}
                    placeholder="••••••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <SectionHeader 
                icon={Layers} 
                title="Document Control" 
                description="Configure sequence prefixes and numbering rules."
              />
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <InputLabel>Invoice Prefix</InputLabel>
                  <input 
                    value={localProfile.invoicePrefix}
                    onChange={e => setLocalProfile({...localProfile, invoicePrefix: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black text-indigo-600 outline-none"
                  />
                </div>
                <div>
                  <InputLabel>Quote Prefix</InputLabel>
                  <input 
                    value={localProfile.quotationPrefix}
                    onChange={e => setLocalProfile({...localProfile, quotationPrefix: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black text-amber-600 outline-none"
                  />
                </div>
                <div>
                  <InputLabel>Credit Note Prefix</InputLabel>
                  <input 
                    value={localProfile.creditNotePrefix}
                    onChange={e => setLocalProfile({...localProfile, creditNotePrefix: e.target.value.toUpperCase()})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black text-rose-600 outline-none"
                  />
                </div>
              </div>

              <div className="mt-8 pt-8 border-t border-slate-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      type="button"
                      onClick={() => setLocalProfile({...localProfile, autoDeductInventory: !localProfile.autoDeductInventory})}
                      className={`w-12 h-6 rounded-full transition-all cursor-pointer flex items-center p-1 ${localProfile.autoDeductInventory ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-all ${localProfile.autoDeductInventory ? 'translate-x-6' : 'translate-x-0'}`}></div>
                    </button>
                    <div>
                      <p className="text-sm font-black text-slate-800">Auto-Inventory Management</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Automatically deduct stock on marked payments</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <SectionHeader 
                icon={Zap} 
                title="Online Payments" 
                description="Configure PhonePe for direct customer payments."
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <InputLabel icon={CreditCard}>PhonePe Merchant ID</InputLabel>
                  <input 
                    value={localProfile.phonepeMerchantId || ''}
                    onChange={e => setLocalProfile({...localProfile, phonepeMerchantId: e.target.value})}
                    placeholder="M123456789"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <InputLabel>Salt Key</InputLabel>
                  <input 
                    type="password"
                    value={localProfile.phonepeSaltKey || ''}
                    onChange={e => setLocalProfile({...localProfile, phonepeSaltKey: e.target.value})}
                    placeholder="••••••••••••••••"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>
                <div>
                  <InputLabel>Salt Index</InputLabel>
                  <input 
                    type="number"
                    value={localProfile.phonepeSaltIndex || ''}
                    onChange={e => setLocalProfile({...localProfile, phonepeSaltIndex: e.target.value})}
                    placeholder="1"
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/5 outline-none font-bold text-slate-800 transition-all"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-8">
            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <InputLabel icon={ImageIcon}>Brand Visuals</InputLabel>
              <div className="relative group">
                <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-slate-100 rounded-[2rem] bg-slate-50/50 hover:bg-slate-50 hover:border-indigo-100 transition-all relative overflow-hidden h-48">
                  {localProfile.logoUrl ? (
                    <img src={localProfile.logoUrl} alt="Logo" className="max-h-24 object-contain group-hover:scale-110 transition-transform" />
                  ) : (
                    <div className="text-center">
                      <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-3">
                        <ImageIcon className="w-6 h-6 text-slate-300" />
                      </div>
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload High-Res Logo</span>
                    </div>
                  )}
                  <input type="file" onChange={handleLogoUpload} className="absolute inset-0 opacity-0 cursor-pointer" accept="image/*" />
                </div>
                {localProfile.logoUrl && (
                  <button 
                    type="button"
                    onClick={removeLogo}
                    className="absolute top-4 right-4 p-2 bg-white text-rose-500 rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <p className="text-[9px] text-slate-300 font-bold uppercase tracking-widest mt-4 text-center">PNG or JPG, Max 2MB recommended</p>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100">
              <InputLabel icon={Globe}>Regional & Fiscal</InputLabel>
              <div className="space-y-6">
                <div>
                  <select 
                    value={localProfile.currency || 'USD'}
                    onChange={e => setLocalProfile({...localProfile, currency: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-4 font-black text-slate-800"
                  >
                    {CurrencyService.getAvailableCurrencies().map(curr => (
                      <option key={curr} value={curr}>{curr}</option>
                    ))}
                  </select>
                </div>
                
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input 
                      value={localProfile.gstNumber}
                      onChange={e => {
                        setLocalProfile({...localProfile, gstNumber: e.target.value.toUpperCase()});
                        setVerifyResult(null);
                      }}
                      className={`flex-1 bg-slate-50 border ${verifyResult?.isValid ? 'border-emerald-500' : 'border-slate-200'} rounded-2xl px-5 py-4 font-bold text-slate-800 uppercase text-sm tracking-widest outline-none focus:ring-4 focus:ring-indigo-500/5`}
                      placeholder="GSTIN / TAX ID"
                    />
                    <button 
                      type="button"
                      disabled={isVerifying || !localProfile.gstNumber}
                      onClick={handleVerifyBusinessGST}
                      className="px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all disabled:opacity-50"
                    >
                      {isVerifying ? '...' : 'Check'}
                    </button>
                  </div>
                  {verifyResult && (
                    <div className={`p-3 rounded-xl flex items-start gap-2 ${verifyResult.isValid ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'} animate-in slide-in-from-top-2`}>
                      {verifyResult.isValid ? <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" /> : <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />}
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-tight">{verifyResult.message}</p>
                        {verifyResult.stateName && <p className="text-[9px] font-bold opacity-80">{verifyResult.stateName} Registry</p>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-900/10 text-white">
              <InputLabel icon={Wallet}><span className="text-white opacity-60">Payout Information</span></InputLabel>
              <textarea 
                rows={4}
                value={localProfile.bankDetails}
                onChange={e => setLocalProfile({...localProfile, bankDetails: e.target.value})}
                placeholder="Bank Name, Account No, SWIFT/IFSC..."
                className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:ring-4 focus:ring-indigo-500/10 outline-none font-medium text-xs text-indigo-100 resize-none leading-relaxed transition-all placeholder:text-white/20"
              />
              <p className="text-[9px] text-white/30 font-bold uppercase tracking-widest mt-4 flex items-center gap-2">
                <AlertCircle className="w-3 h-3" />
                This info appears on invoices
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white/50 backdrop-blur-sm fixed bottom-0 left-0 md:left-64 right-0 p-4 border-t border-slate-100 flex justify-end px-10 no-print z-50">
           <button 
            type="submit"
            disabled={isSaving}
            className="px-10 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl flex items-center gap-3 active:scale-95 transition-all"
          >
            <Save className="w-4 h-4" />
            {isSaving ? 'Synchronizing...' : 'Save All Changes'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Settings;
