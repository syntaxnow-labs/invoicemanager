
import React, { useState } from 'react';
import { GoogleGenAI } from "@google/genai";
import { Invoice, ExpenseRecord, ProductItem } from '../types';
import { Bot, Sparkles, X, ChevronRight } from 'lucide-react';

interface FinancialAdvisorProps {
  invoices: Invoice[];
  expenses: ExpenseRecord[];
  products: ProductItem[];
  currency: string;
}

const FinancialAdvisor: React.FC<FinancialAdvisorProps> = ({ invoices, expenses, products, currency }) => {
  const [insight, setInsight] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const getAIAdvice = async () => {
    setLoading(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const dataSummary = {
        totalRevenue: invoices.reduce((s, i) => s + i.items.reduce((si, it) => si + (it.quantity * it.rate), 0), 0),
        totalExpenses: expenses.reduce((s, e) => s + e.amount, 0),
        expenseCategories: expenses.reduce((acc: any, e) => {
          acc[e.category] = (acc[e.category] || 0) + e.amount;
          return acc;
        }, {}),
        inventoryValue: products.reduce((s, p) => s + (p.stockLevel * p.defaultRate), 0),
        lowStockItems: products.filter(p => p.stockLevel <= p.lowStockThreshold).length
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: `Analyze this business data and provide 3 short, actionable financial insights in bullet points. 
        Data: ${JSON.stringify(dataSummary)}. Currency: ${currency}. 
        Keep it professional and concise. Avoid generic advice.`,
      });

      setInsight(response.text || "No insights available at the moment.");
    } catch (error) {
      setInsight("Encountered an issue reaching the cloud brain. Verify your integration settings.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={`fixed bottom-8 right-8 z-[150] transition-all duration-500 ${isOpen ? 'w-80' : 'w-16'}`}>
      {isOpen ? (
        <div className="bg-slate-900 text-white rounded-[2.5rem] p-8 shadow-2xl border border-white/10 animate-in slide-in-from-bottom-10 flex flex-col">
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-2">
              <Bot className="w-4 h-4 text-indigo-400" />
              <h3 className="font-black text-[10px] uppercase tracking-widest text-white/50">Financial Advisor</h3>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/20 hover:text-white transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="flex-1 min-h-[160px] mb-8">
            {loading ? (
              <div className="space-y-4">
                <div className="h-3 bg-white/5 rounded-full animate-pulse w-full"></div>
                <div className="h-3 bg-white/5 rounded-full animate-pulse w-4/5"></div>
                <div className="h-3 bg-white/5 rounded-full animate-pulse w-2/3"></div>
              </div>
            ) : (
              <div className="text-xs leading-relaxed text-slate-300 whitespace-pre-line font-medium">
                {insight || "Connect with your business intelligence to discover growth opportunities and efficiency gains."}
              </div>
            )}
          </div>

          <button 
            onClick={getAIAdvice}
            disabled={loading}
            className="w-full py-4 bg-indigo-600 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-indigo-500 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? 'Processing...' : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Analyze Health
              </>
            )}
          </button>
        </div>
      ) : (
        <button 
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-indigo-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:scale-110 transition-transform active:scale-95 group relative"
        >
          <Bot className="w-7 h-7" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-500 rounded-full border-2 border-slate-50"></div>
        </button>
      )}
    </div>
  );
};

export default FinancialAdvisor;
