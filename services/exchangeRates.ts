
export const EXCHANGE_RATES: Record<string, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  INR: 83.12,
  JPY: 150.45,
  CAD: 1.35,
  AUD: 1.53
};

export const CurrencyService = {
  convert: (amount: number, from: string, to: string): number => {
    if (from === to) return amount;
    const baseAmount = amount / (EXCHANGE_RATES[from] || 1);
    return baseAmount * (EXCHANGE_RATES[to] || 1);
  },
  
  format: (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  },

  getAvailableCurrencies: () => Object.keys(EXCHANGE_RATES)
};
