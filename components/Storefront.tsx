
  import React, { useState } from 'react';
  import { ProductItem, Client, Invoice, DocumentType, InvoiceStatus } from '../types';

  interface StorefrontProps {
    products: ProductItem[];
    businessName: string;
    logoUrl?: string;
    onOrderPlaced: (orderData: { client: Partial<Client>, items: any[] }) => void;
    currency: string;
  }

  const Storefront: React.FC<StorefrontProps> = ({ products, businessName, logoUrl, onOrderPlaced, currency }) => {
    const [cart, setCart] = useState<Record<string, number>>({});
    const [customerInfo, setCustomerInfo] = useState({ name: '', email: '', address: '' });
    const [showCheckout, setShowCheckout] = useState(false);
    const [orderComplete, setOrderComplete] = useState(false);

    const updateCart = (productId: string, delta: number) => {
      setCart(prev => {
        const current = prev[productId] || 0;
        const next = Math.max(0, current + delta);
        if (next === 0) {
          const { [productId]: _, ...rest } = prev;
          return rest;
        }
        return { ...prev, [productId]: next };
      });
    };

    const cartItems = Object.entries(cart).map(([id, qty]) => ({
      product: products.find(p => p.id === id),
      quantity: qty
    }));

    const total = cartItems.reduce((sum, item) => {
      if (!item.product) return sum;
      // Explicit conversion to Number to ensure correct arithmetic operation
      return sum + (Number(item.product.defaultRate || 0) * Number(item.quantity));
    }, 0);

    const handlePlaceOrder = (e: React.FormEvent) => {
      e.preventDefault();
      const validItems = cartItems.filter(item => !!item.product).map(item => ({
        productId: item.product!.id,
        description: item.product!.name,
        quantity: item.quantity,
        rate: item.product!.defaultRate,
        taxPercent: item.product!.defaultTax,
        discountPercent: 0
      }));

      if (validItems.length === 0) return;

      onOrderPlaced({
        client: {
          name: customerInfo.name,
          email: customerInfo.email,
          billingAddress: customerInfo.address,
        },
        items: validItems
      });
      setOrderComplete(true);
      setCart({});
    };

    if (orderComplete) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
          <div className="bg-white p-12 rounded-[3rem] shadow-2xl border border-slate-100 text-center max-w-md animate-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center text-3xl mx-auto mb-6">✓</div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Order Received!</h2>
            <p className="text-slate-500 font-medium mb-8">Thank you for your order. {businessName} will review it and send an invoice to {customerInfo.email} shortly.</p>
            <button onClick={() => setOrderComplete(false)} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest">Back to Catalog</button>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-6 py-4 shadow-sm">
          <div className="max-w-7xl mx-auto flex justify-between items-center">
            <div className="flex items-center gap-3">
              {logoUrl ? <img src={logoUrl} className="h-8 w-auto" alt="Logo" /> : <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-black">O</div>}
              <span className="font-black text-slate-800 tracking-tight">{businessName} Store</span>
            </div>
            <button 
              onClick={() => cartItems.length > 0 && setShowCheckout(true)}
              className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-sm shadow-lg hover:bg-indigo-700 transition-all flex items-center gap-2"
            >
              <span>🛒</span> {cartItems.length} Items • {currency} {total.toLocaleString()}
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto p-6 md:p-10">
          <div className="mb-10 text-center">
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">Our Catalog</h1>
            <p className="text-slate-500 font-medium">Select items below to place your order directly.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {products.map(product => (
              <div key={product.id} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-xl transition-all">
                <div>
                  <div className="w-full h-40 bg-slate-50 rounded-2xl mb-4 flex items-center justify-center text-4xl grayscale opacity-50">📦</div>
                  <h3 className="text-lg font-black text-slate-800 mb-1">{product.name}</h3>
                  <p className="text-xs text-slate-400 font-medium line-clamp-2 mb-4">{product.description}</p>
                </div>
                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-50">
                  <span className="font-black text-slate-900">{currency} {product.defaultRate.toLocaleString()}</span>
                  {cart[product.id] ? (
                    <div className="flex items-center gap-3 bg-indigo-50 rounded-xl p-1">
                      <button onClick={() => updateCart(product.id, -1)} className="w-8 h-8 bg-white rounded-lg shadow-sm font-black text-indigo-600">-</button>
                      <span className="font-black text-indigo-600 text-xs">{cart[product.id]}</span>
                      <button onClick={() => updateCart(product.id, 1)} className="w-8 h-8 bg-white rounded-lg shadow-sm font-black text-indigo-600">+</button>
                    </div>
                  ) : (
                    <button 
                      onClick={() => updateCart(product.id, 1)}
                      className="px-4 py-2 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-all"
                    >
                      Add
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </main>

        {showCheckout && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
            <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh]">
              <div className="p-8 border-b border-slate-100 flex justify-between items-center">
                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Checkout</h2>
                <button onClick={() => setShowCheckout(false)} className="text-slate-400 text-2xl font-light">×</button>
              </div>
              
              <div className="flex-1 overflow-y-auto p-8 space-y-8">
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Order Summary</h3>
                  {cartItems.map(item => (
                    <div key={item.product?.id || Math.random()} className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl">
                      <div className="font-bold text-slate-800">{item.product?.name || 'Unknown Item'} <span className="text-slate-400 text-sm">x {item.quantity}</span></div>
                      {/* Explicit conversion to Number to ensure correct arithmetic operation */}
                      <div className="font-black text-slate-900">{currency} {(Number(item.product?.defaultRate || 0) * Number(item.quantity)).toLocaleString()}</div>
                    </div>
                  ))}
                  <div className="flex justify-between p-4 border-t border-slate-100">
                    <span className="font-black text-slate-900">Total</span>
                    <span className="font-black text-indigo-600 text-xl">{currency} {total.toLocaleString()}</span>
                  </div>
                </div>

                <form id="checkout-form" onSubmit={handlePlaceOrder} className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Customer Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <input 
                      required 
                      placeholder="Full Name" 
                      value={customerInfo.name}
                      onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    />
                    <input 
                      required 
                      type="email" 
                      placeholder="Email Address" 
                      value={customerInfo.email}
                      onChange={e => setCustomerInfo({...customerInfo, email: e.target.value})}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold"
                    />
                  </div>
                  <textarea 
                    required 
                    placeholder="Shipping / Billing Address" 
                    value={customerInfo.address}
                    onChange={e => setCustomerInfo({...customerInfo, address: e.target.value})}
                    className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-5 py-3 outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold min-h-[100px]"
                  />
                </form>
              </div>

              <div className="p-8 border-t border-slate-100">
                <button 
                  type="submit" 
                  form="checkout-form"
                  className="w-full py-5 bg-indigo-600 text-white rounded-[1.5rem] font-black text-xs uppercase tracking-widest shadow-xl hover:bg-indigo-700 transition-all"
                >
                  Place Order Now
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  export default Storefront;
