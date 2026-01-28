
export interface GSTVerificationResult {
  isValid: boolean;
  legalName?: string;
  status?: string;
  message: string;
  pan?: string;
  stateCode?: string;
  stateName?: string;
}

const STATE_CODES: Record<string, string> = {
  "01": "Jammu and Kashmir", "02": "Himachal Pradesh", "03": "Punjab", "04": "Chandigarh",
  "05": "Uttarakhand", "06": "Haryana", "07": "Delhi", "08": "Rajasthan", "09": "Uttar Pradesh",
  "10": "Bihar", "11": "Sikkim", "12": "Arunachal Pradesh", "13": "Nagaland", "14": "Manipur",
  "15": "Mizoram", "16": "Tripura", "17": "Meghalaya", "18": "Assam", "19": "West Bengal",
  "20": "Jharkhand", "21": "Odisha", "22": "Chattisgarh", "23": "Madhya Pradesh", "24": "Gujarat",
  "26": "Dadra and Nagar Haveli and Daman and Diu", "27": "Maharashtra", "29": "Karnataka",
  "30": "Goa", "31": "Lakshadweep", "32": "Kerala", "33": "Tamil Nadu", "34": "Puducherry",
  "35": "Andaman and Nicobar Islands", "36": "Telangana", "37": "Andhra Pradesh", "38": "Ladakh"
};

export const GSTService = {
  /**
   * Validates GSTIN format and checksum locally, then attempts to fetch
   * Legal Entity Name from a public registry via a CORS-friendly proxy.
   */
  verifyGST: async (gstin: string): Promise<GSTVerificationResult> => {
    const cleanGst = gstin.trim().toUpperCase();
    
    // 1. Structural & Local Checksum Validation
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (!gstRegex.test(cleanGst)) {
      return { isValid: false, message: "Invalid GSTIN format." };
    }

    const charMap = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    let sum = 0;
    for (let i = 0; i < 14; i++) {
      let val = charMap.indexOf(cleanGst[i]);
      let multiplier = (i % 2 === 0) ? 1 : 2;
      let product = val * multiplier;
      sum += Math.floor(product / 36) + (product % 36);
    }
    const checkDigitIdx = (36 - (sum % 36)) % 36;
    if (cleanGst[14] !== charMap[checkDigitIdx]) {
      return { isValid: false, message: "Invalid GSTIN Checksum." };
    }

    const stateCode = cleanGst.substring(0, 2);
    const pan = cleanGst.substring(2, 12);
    const stateName = STATE_CODES[stateCode] || "Unknown State";

    // 2. Fetch Legal Name (CORS-Proxy approach for FREE lookup)
    try {
      // Using AllOrigins to bypass CORS on public search endpoints
      const publicApiUrl = `https://www.mastersindia.co/api/v1/custom/gstin/${cleanGst}/`;
      const proxiedUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(publicApiUrl)}`;
      
      const response = await fetch(proxiedUrl);
      if (response.ok) {
        const json = await response.json();
        // The data is inside 'contents' as a stringified JSON from AllOrigins
        const data = JSON.parse(json.contents);
        
        // MastersIndia typically returns legal name in lgnm or trade_name
        const legalName = data?.data?.lgnm || data?.data?.trade_name || data?.legal_name || null;
        
        if (legalName) {
          return {
            isValid: true,
            pan,
            stateCode,
            stateName,
            legalName: legalName,
            message: "Verified against Public Registry",
            status: "Active"
          };
        }
      }
    } catch (e) {
      console.warn("Public registry lookup failed or blocked. Using local verification.");
    }

    return {
      isValid: true,
      pan,
      stateCode,
      stateName,
      message: "Format Valid (Registry Offline)",
      status: "Verified"
    };
  }
};
