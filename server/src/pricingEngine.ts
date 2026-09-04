// server/src/pricingEngine.ts

// interface CountryData {
//     tier: 'LOW' | 'MID' | 'HIGH' | 'NONE';
//     rate?: number; // Optional: used for specific overrides like Nigeria
//     symbol?: string;
// }

// export const pppData: Record<string, CountryData> = {
//     // --- TIER: NONE (Full Price - GLOBAL20) ---
//     "US": { tier: "NONE" }, "CH": { tier: "NONE" }, "SG": { tier: "NONE" },
//     "LU": { tier: "NONE" }, "NO": { tier: "NONE" }, "IE": { tier: "NONE" },
//     "QA": { tier: "NONE" }, "IS": { tier: "NONE" }, "DK": { tier: "NONE" },
//     "AU": { tier: "NONE" }, "AE": { tier: "NONE" },

//     // --- TIER: LOW (20% Off - GLOBAL20) ---
//     "GB": { tier: "LOW" }, "DE": { tier: "LOW" }, "FR": { tier: "LOW" },
//     "JP": { tier: "LOW" }, "CA": { tier: "LOW" }, "KR": { tier: "LOW" },
//     "IT": { tier: "LOW" }, "ES": { tier: "LOW" }, "NL": { tier: "LOW" },
//     "SE": { tier: "LOW" }, "AT": { tier: "LOW" }, "BE": { tier: "LOW" },
//     "FI": { tier: "LOW" }, "NZ": { tier: "LOW" }, "HK": { tier: "LOW" },
//     "IL": { tier: "LOW" }, "KW": { tier: "LOW" }, "SA": { tier: "LOW" },

//     // --- TIER: MID (50% Off - GLOBAL50) ---
//     "BR": { tier: "MID" }, "MX": { tier: "MID" }, "CN": { tier: "MID" },
//     "IN": { tier: "MID" }, "MY": { tier: "MID" }, "TH": { tier: "MID" },
//     "PH": { tier: "MID" }, "RU": { tier: "MID" }, "TR": { tier: "MID" },
//     "ID": { tier: "MID" }, "CL": { tier: "MID" }, "CO": { tier: "MID" },
//     "PE": { tier: "MID" }, "AR": { tier: "MID" }, "VN": { tier: "MID" },
//     "PL": { tier: "MID" }, "GR": { tier: "MID" }, "PT": { tier: "MID" },
//     "CZ": { tier: "MID" }, "HU": { tier: "MID" }, "RO": { tier: "MID" },
//     "UA": { tier: "MID" }, "DZ": { tier: "MID" }, "MA": { tier: "MID" },

//     // --- TIER: HIGH (70% Off - GLOBAL70) ---
//     "NG": { tier: "HIGH", rate: 1339, symbol: "₦" }, // Explicit override for your home market
//     "GH": { tier: "HIGH", rate: 15, symbol: "GH₵" },
//     "KE": { tier: "HIGH", rate: 129, symbol: "KSh" },
//     "ZA": { tier: "HIGH", rate: 18.5, symbol: "R" },
//     "EG": { tier: "HIGH", rate: 48, symbol: "E£" },
//     "PK": { tier: "HIGH", rate: 278, symbol: "₨" },
//     "BD": { tier: "HIGH", rate: 117, symbol: "৳" },
//     "ET": { tier: "HIGH" }, "TZ": { tier: "HIGH" }, "UG": { tier: "HIGH" },
//     "RW": { tier: "HIGH" }, "ZM": { tier: "HIGH" }, "NP": { tier: "HIGH" },
//     "LK": { tier: "HIGH" }, "MM": { tier: "HIGH" }, "KH": { tier: "HIGH" },
//     "DEFAULT": { tier: "LOW", multiplier: 0.4, symbol: "$", rate: 1 }
// };

// // HELPER: To provide a clean list of all 195 countries to the dropdown
// export const getCountryList = () => {
//     const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
//     // This loops through all ISO codes available in the browser's international library
//     const allCodes = [
//         "AF", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT",
//         "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
//         "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO",
//         "KM", "CD", "CG", "CK", "CR", "HR", "CU", "CW", "CY", "CZ", "CI", "DK", "DJ", "DM", "DO", "EC", "EG",
//         "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE",
//         "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN",
//         "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE",
//         "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW",
//         "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA",
//         "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK",
//         "PW", "PS", "PA", "PG", "PY", "PR", "QA", "MK", "RO", "RU", "RW", "RE", "BL", "SH", "KN", "LC", "MF",
//         "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA",
//         "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
//         "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "UM", "UY", "UZ", "VU", "VE", "VN",
//         "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"
//     ];

//     return allCodes.map(code => ({
//         code,
//         name: regionNames.of(code) || code
//     })).sort((a, b) => a.name.localeCompare(b.name));
// };


// export const calculatePPPPrice = (originalPrice: number, countryCode: string) => {
//     const code = countryCode.toUpperCase();
//     const config = pppData[code] || { tier: "MID" }; // Default to 50% off for unlisted

//     const tierMultipliers = {
//         "NONE": 1.0,
//         "LOW": 0.8,
//         "MID": 0.5,
//         "HIGH": 0.3
//     };

//     const multiplier = tierMultipliers[config.tier];
//     const suggestedPriceUSD = originalPrice * multiplier;

//     // Resolve Country Name and Currency Symbol automatically
//     const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
//     const countryName = regionNames.of(code) || code;

//     // Logic: Use hardcoded rate if exists (like NG), otherwise stay in USD symbol
//     const symbol = config.symbol || "$";
//     const localAmount = config.rate ? (suggestedPriceUSD * config.rate) : suggestedPriceUSD;

//     return {
//         suggestedPrice: Number(suggestedPriceUSD.toFixed(2)),
//         localPriceFormatted: `${symbol} ${Math.round(localAmount).toLocaleString()}`,
//         discountPercentage: Math.round((1 - multiplier) * 100),
//         discountTier: config.tier,
//         symbol: symbol,
//         countryName: countryName
//     };
    
// };


// server/src/pricingEngine.ts

export interface CountryConfig {
  tier: 'NONE' | 'LOW' | 'MID' | 'HIGH';
  currency: string; // Dynamic currency code parameter used for standard JSON API fetches
  symbol: string;   // The visual symbol displayed next to prices
}

export const pppData: Record<string, CountryConfig> = {
  "AD": { tier: "NONE", currency: "EUR", symbol: "€" },
  "AE": { tier: "NONE", currency: "AED", symbol: "د.إ" },
  "AF": { tier: "HIGH", currency: "AFN", symbol: "؋" },
  "AG": { tier: "LOW",  currency: "XCD", symbol: "$" },
  "AL": { tier: "MID",  currency: "ALL", symbol: "L" },
  "AM": { tier: "MID",  currency: "AMD", symbol: "֏" },
  "AO": { tier: "HIGH", currency: "AOA", symbol: "Kz" },
  "AR": { tier: "MID",  currency: "ARS", symbol: "$" },
  "AT": { tier: "NONE", currency: "EUR", symbol: "€" },
  "AU": { tier: "NONE", currency: "AUD", symbol: "A$" },
  "AZ": { tier: "MID",  currency: "AZN", symbol: "₼" },
  "BA": { tier: "MID",  currency: "BAM", symbol: "KM" },
  "BB": { tier: "LOW",  currency: "BBD", symbol: "$" },
  "BD": { tier: "HIGH", currency: "BDT", symbol: "৳" },
  "BE": { tier: "NONE", currency: "EUR", symbol: "€" },
  "BF": { tier: "HIGH", currency: "XOF", symbol: "CFA" },
  "BG": { tier: "MID",  currency: "BGN", symbol: "лв" },
  "BH": { tier: "NONE", currency: "BHD", symbol: "BD " },
  "BI": { tier: "HIGH", currency: "BIF", symbol: "FBu" },
  "BJ": { tier: "HIGH", currency: "XOF", symbol: "CFA" },
  "BN": { tier: "NONE", currency: "BND", symbol: "B$" },
  "BO": { tier: "MID",  currency: "BOB", symbol: "Bs." },
  "BR": { tier: "MID",  currency: "BRL", symbol: "R$" },
  "BS": { tier: "LOW",  currency: "BSD", symbol: "$" },
  "BT": { tier: "HIGH", currency: "BTN", symbol: "Nu." },
  "BW": { tier: "MID",  currency: "BWP", symbol: "P" },
  "BY": { tier: "MID",  currency: "BYN", symbol: "Br" },
  "BZ": { tier: "MID",  currency: "BZD", symbol: "$" },
  "CA": { tier: "LOW",  currency: "CAD", symbol: "C$" },
  "CD": { tier: "HIGH", currency: "CDF", symbol: "FC" },
  "CF": { tier: "HIGH", currency: "XAF", symbol: "FCFA" },
  "CG": { tier: "HIGH", currency: "XAF", symbol: "FCFA" },
  "CH": { tier: "NONE", currency: "CHF", symbol: "CHF" },
  "CI": { tier: "HIGH", currency: "XOF", symbol: "CFA" },
  "CL": { tier: "MID",  currency: "CLP", symbol: "$" },
  "CM": { tier: "HIGH", currency: "XAF", symbol: "FCFA" },
  "CN": { tier: "MID",  currency: "CNY", symbol: "¥" },
  "CO": { tier: "MID",  currency: "COP", symbol: "$" },
  "CR": { tier: "MID",  currency: "CRC", symbol: "₡" },
  "CU": { tier: "MID",  currency: "CUP", symbol: "$" },
  "CV": { tier: "MID",  currency: "CVE", symbol: "$" },
  "CY": { tier: "NONE", currency: "EUR", symbol: "€" },
  "CZ": { tier: "MID",  currency: "CZK", symbol: "Kč" },
  "DE": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "DJ": { tier: "HIGH", currency: "DJF", symbol: "Fdj" },
  "DK": { tier: "NONE", currency: "DKK", symbol: "kr" },
  "DM": { tier: "MID",  currency: "XCD", symbol: "$" },
  "DO": { tier: "MID",  currency: "DOP", symbol: "$" },
  "DZ": { tier: "MID",  currency: "DZD", symbol: "د.ج" },
  "EC": { tier: "MID",  currency: "USD", symbol: "$" },
  "EE": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "EG": { tier: "HIGH", currency: "EGP", symbol: "E£" },
  "ER": { tier: "HIGH", currency: "ERN", symbol: "Nfk" },
  "ES": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "ET": { tier: "HIGH", currency: "ETB", symbol: "Br" },
  "FI": { tier: "NONE", currency: "EUR", symbol: "€" },
  "FJ": { tier: "MID",  currency: "FJD", symbol: "$" },
  "FM": { tier: "HIGH", currency: "USD", symbol: "$" },
  "FR": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "GA": { tier: "MID",  currency: "XAF", symbol: "FCFA" },
  "GB": { tier: "LOW",  currency: "GBP", symbol: "£" },
  "GD": { tier: "MID",  currency: "XCD", symbol: "$" },
  "GE": { tier: "MID",  currency: "GEL", symbol: "₾" },
  "GH": { tier: "HIGH", currency: "GHS", symbol: "GH₵" },
  "GM": { tier: "HIGH", currency: "GMD", symbol: "D" },
  "GN": { tier: "HIGH", currency: "GNF", symbol: "FG" },
  "GQ": { tier: "MID",  currency: "XAF", symbol: "FCFA" },
  "GR": { tier: "MID",  currency: "EUR", symbol: "€" },
  "GT": { tier: "MID",  currency: "GTQ", symbol: "Q" },
  "GW": { tier: "HIGH", currency: "XOF", symbol: "CFA" },
  "GY": { tier: "MID",  currency: "GYD", symbol: "$" },
  "HK": { tier: "LOW",  currency: "HKD", symbol: "HK$" },
  "HN": { tier: "MID",  currency: "HNL", symbol: "L" },
  "HR": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "HT": { tier: "HIGH", currency: "HTG", symbol: "G" },
  "HU": { tier: "MID",  currency: "HUF", symbol: "Ft" },
  "ID": { tier: "MID",  currency: "IDR", symbol: "Rp" },
  "IE": { tier: "NONE", currency: "EUR", symbol: "€" },
  "IL": { tier: "LOW",  currency: "ILS", symbol: "₪" },
  "IN": { tier: "MID",  currency: "INR", symbol: "₹" },
  "IQ": { tier: "MID",  currency: "IQD", symbol: "ع.د" },
  "IR": { tier: "MID",  currency: "IRR", symbol: "﷼" },
  "IS": { tier: "NONE", currency: "ISK", symbol: "kr" },
  "IT": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "JM": { tier: "MID",  currency: "JMD", symbol: "$" },
  "JO": { tier: "MID",  currency: "JOD", symbol: "JD" },
  "JP": { tier: "LOW",  currency: "JPY", symbol: "¥" },
  "KE": { tier: "HIGH", currency: "KES", symbol: "KSh" },
  "KG": { tier: "HIGH", currency: "KGS", symbol: "сом" },
  "KH": { tier: "HIGH", currency: "KHR", symbol: "៛" },
  "KI": { tier: "HIGH", currency: "AUD", symbol: "A$" },
  "KM": { tier: "HIGH", currency: "KMF", symbol: "CF" },
  "KN": { tier: "LOW",  currency: "XCD", symbol: "$" },
  "KP": { tier: "HIGH", currency: "KPW", symbol: "₩" },
  "KR": { tier: "LOW",  currency: "KRW", symbol: "₩" },
  "KW": { tier: "LOW",  currency: "KWD", symbol: "KD" },
  "KZ": { tier: "MID",  currency: "KZT", symbol: "₸" },
  "LA": { tier: "HIGH", currency: "LAK", symbol: "₭" },
  "LB": { tier: "HIGH", currency: "LBP", symbol: "ل.ل" },
  "LC": { tier: "LOW",  currency: "XCD", symbol: "$" },
  "LI": { tier: "NONE", currency: "CHF", symbol: "CHF" },
  "LK": { tier: "HIGH", currency: "LKR", symbol: "Rs" },
  "LR": { tier: "HIGH", currency: "LRD", symbol: "$" },
  "LS": { tier: "HIGH", currency: "LSL", symbol: "L" },
  "LT": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "LU": { tier: "NONE", currency: "EUR", symbol: "€" },
  "LV": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "LY": { tier: "MID",  currency: "LYD", symbol: "ل.د" },
  "MA": { tier: "MID",  currency: "MAD", symbol: "د.م." },
  "MC": { tier: "NONE", currency: "EUR", symbol: "€" },
  "MD": { tier: "HIGH", currency: "MDL", symbol: "L" },
  "ME": { tier: "MID",  currency: "EUR", symbol: "€" },
  "MG": { tier: "HIGH", currency: "MGA", symbol: "Ar" },
  "MH": { tier: "MID",  currency: "USD", symbol: "$" },
  "MK": { tier: "MID",  currency: "MKD", symbol: "ден" },
  "ML": { tier: "HIGH", currency: "XOF", symbol: "CFA" },
  "MM": { tier: "HIGH", currency: "MMK", symbol: "K" },
  "MN": { tier: "MID",  currency: "MNT", symbol: "₮" },
  "MR": { tier: "HIGH", currency: "MRU", symbol: "UM" },
  "MT": { tier: "NONE", currency: "EUR", symbol: "€" },
  "MU": { tier: "MID",  currency: "MUR", symbol: "₨" },
  "MV": { tier: "MID",  currency: "MVR", symbol: "Rf" },
  "MW": { tier: "HIGH", currency: "MWK", symbol: "MK" },
  "MX": { tier: "MID",  currency: "MXN", symbol: "$" },
  "MY": { tier: "MID",  currency: "MYR", symbol: "RM" },
  "MZ": { tier: "HIGH", currency: "MZN", symbol: "MT" },
  "NA": { tier: "MID",  currency: "NAD", symbol: "$" },
  "NE": { tier: "HIGH", currency: "XOF", symbol: "CFA" },
  "NG": { tier: "HIGH", currency: "NGN", symbol: "₦" },
  "NI": { tier: "HIGH", currency: "NIO", symbol: "C$" },
  "NL": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "NO": { tier: "NONE", currency: "NOK", symbol: "kr" },
  "NP": { tier: "HIGH", currency: "NPR", symbol: "Rs" },
  "NR": { tier: "MID",  currency: "AUD", symbol: "A$" },
  "NZ": { tier: "LOW",  currency: "NZD", symbol: "NZ$" },
  "OM": { tier: "NONE", currency: "OMR", symbol: "ر.ع." },
  "PA": { tier: "MID",  currency: "PAB", symbol: "B/." },
  "PE": { tier: "MID",  currency: "PEN", symbol: "S/." },
  "PG": { tier: "HIGH", currency: "PGK", symbol: "K" },
  "PH": { tier: "MID",  currency: "PHP", symbol: "₱" },
  "PK": { tier: "HIGH", currency: "PKR", symbol: "Rs" },
  "PL": { tier: "MID",  currency: "PLN", symbol: "zł" },
  "PT": { tier: "MID",  currency: "EUR", symbol: "€" },
  "PW": { tier: "LOW",  currency: "USD", symbol: "$" },
  "PY": { tier: "MID",  currency: "PYG", symbol: "₲" },
  "QA": { tier: "NONE", currency: "QAR", symbol: "ر.ق" },
  "RO": { tier: "MID",  currency: "RON", symbol: "lei" },
  "RS": { tier: "MID",  currency: "RSD", symbol: "дин." },
  "RU": { tier: "MID",  currency: "RUB", symbol: "₽" },
  "RW": { tier: "HIGH", currency: "RWF", symbol: "FRw" },
  "SA": { tier: "LOW",  currency: "SAR", symbol: "SR" },
  "SB": { tier: "HIGH", currency: "SBD", symbol: "$" },
  "SC": { tier: "LOW",  currency: "SCR", symbol: "₨" },
  "SD": { tier: "HIGH", currency: "SDG", symbol: "ج.س." },
  "SE": { tier: "LOW",  currency: "SEK", symbol: "kr" },
  "SG": { tier: "NONE", currency: "SGD", symbol: "S$" },
  "SI": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "SK": { tier: "LOW",  currency: "EUR", symbol: "€" },
  "SL": { tier: "HIGH", currency: "SLL", symbol: "Le" },
  "SM": { tier: "NONE", currency: "EUR", symbol: "€" },
  "SN": { tier: "HIGH", currency: "XOF", symbol: "CFA" },
  "SO": { tier: "HIGH", currency: "SOS", symbol: "Sh" },
  "SR": { tier: "MID",  currency: "SRD", symbol: "$" },
  "SS": { tier: "HIGH", currency: "SSP", symbol: "£" },
  "ST": { tier: "HIGH", currency: "STN", symbol: "Db" },
  "SV": { tier: "MID",  currency: "USD", symbol: "$" },
  "SY": { tier: "HIGH", currency: "SYP", symbol: "£" },
  "SZ": { tier: "HIGH", currency: "SZL", symbol: "L" },
  "TD": { tier: "HIGH", currency: "XAF", symbol: "FCFA" },
  "TG": { tier: "HIGH", currency: "XOF", symbol: "CFA" },
  "TH": { tier: "MID",  currency: "THB", symbol: "฿" },
  "TJ": { tier: "MID",  currency: "TJS", symbol: "ЅМ" },
  "TL": { tier: "HIGH", currency: "USD", symbol: "$" },
  "TM": { tier: "MID",  currency: "TMT", symbol: "m" },
  "TN": { tier: "MID",  currency: "TND", symbol: "د.ت" },
  "TO": { tier: "MID",  currency: "TOP", symbol: "T$" },
  "TR": { tier: "MID",  currency: "TRY", symbol: "₺" },
  "TT": { tier: "MID",  currency: "TTD", symbol: "$" },
  "TV": { tier: "MID",  currency: "AUD", symbol: "A$" },
  "TZ": { tier: "HIGH", currency: "TZS", symbol: "Sh" },
  "UA": { tier: "MID",  currency: "UAH", symbol: "₴" },
  "UG": { tier: "HIGH", currency: "UGX", symbol: "Sh" },

  "DEFAULT": { tier: "MID", currency: "USD", symbol: "$" }
};

export const calculatePPPPrice = (
  originalPriceUSD: number, 
  countryCode: string,
  liveRates: Record<string, number>
) => {
  const code = countryCode.toUpperCase();
  
  // Clean fallback pattern: Use default if code is missing entirely
  const config = pppData[code] || pppData["DEFAULT"];
  
  // Define strict tier percentage drops
  const tierMultipliers = { 
    "NONE": 1.0,  // Full price
    "LOW": 0.8,   // 20% off
    "MID": 0.5,   // 50% off
    "HIGH": 0.3   // 70% off
  };
  
  // Step 1: Safely pick the tier multiplier
  const multiplier = tierMultipliers[config.tier];
  
  // Step 2: Calculate the discount base directly in USD
  const suggestedPriceUSD = originalPriceUSD * multiplier; 
  
  // Step 3: Fetch the current live API rate multiplier safely (defaults to 1 if not loaded)
  const exchangeRate = liveRates[config.currency] || 1;
  
  // Step 4: Multiply the discounted USD total by the currency rate
  const localAmount = suggestedPriceUSD * exchangeRate;

  // Step 5: Automatically retrieve the official English country label mapping
  const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
  const countryName = regionNames.of(code) || code;

  return {
    suggestedPriceUSD: Number(suggestedPriceUSD.toFixed(2)),
    localPriceFormatted: `${config.symbol}${Math.round(localAmount).toLocaleString()}`,
    discountPercentage: Math.round((1 - multiplier) * 100),
    discountTier: config.tier,
    countryName: countryName
  };
};
