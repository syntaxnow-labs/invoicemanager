
import { Invoice, BusinessProfile } from '../types';

export const PaymentService = {
  /**
   * Generates a PhonePe payment request.
   * Note: In a production environment, hashing and API calls must happen on a secure backend.
   */
  initiatePhonePePayment: async (invoice: Invoice, business: BusinessProfile, amount: number) => {
    if (!business.phonepeMerchantId || !business.phonepeSaltKey) {
      throw new Error("PhonePe configuration is incomplete. Please check Settings.");
    }

    const transactionId = `TXN${Date.now()}`;
    
    // Simulate the Payload for PhonePe
    const payload = {
      merchantId: business.phonepeMerchantId,
      merchantTransactionId: transactionId,
      amount: Math.round(amount * 100), // Amount in paisa
      redirectUrl: window.location.href,
      redirectMode: "REDIRECT",
      callbackUrl: "https://webhook.site/callback", // Replace with your actual backend webhook
      mobileNumber: business.phone,
      paymentInstrument: {
        type: "PAY_PAGE"
      }
    };

    console.log("Initiating PhonePe Payment with payload:", payload);
    
    // In a real implementation, we would base64 encode the payload and generate an X-VERIFY checksum
    // For this frontend demo, we simulate the redirection
    return new Promise<{ success: boolean; transactionId: string }>((resolve) => {
      alert(`Redirecting to PhonePe Secure Gateway...\nMerchant: ${business.phonepeMerchantId}\nAmount: ${invoice.currency} ${amount}`);
      
      // Simulate user finishing payment after 2 seconds
      setTimeout(() => {
        const confirmed = window.confirm("Did the PhonePe payment succeed?");
        resolve({ success: confirmed, transactionId });
      }, 2000);
    });
  }
};
