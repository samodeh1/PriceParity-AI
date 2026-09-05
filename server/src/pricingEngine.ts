// server/src/pricingEngine.ts

interface PPPDataEntry {
    tier: 'LOW' | 'MID' | 'HIGH' | 'NONE';
    currency: string;
    rate?: number; // Optional: used for specific overrides like Nigeria
    symbol?: string;
    name?: string;
}

export const pppData: Record<string, PPPDataEntry> = {
  "DEFAULT": { tier: "MID", currency: "USD", symbol: "$", rate: 1.0, name: "International" },
  "AD": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "AE": { tier: "NONE", currency: "AED", symbol: "د.إ", rate: 3.67 },
  "AF": { tier: "HIGH", currency: "AFN", symbol: "؋", rate: 65.5 },
  "AG": { tier: "LOW",  currency: "XCD", symbol: "$", rate: 2.7 },
  "AL": { tier: "MID",  currency: "ALL", symbol: "L", rate: 79.32 },
  "AM": { tier: "MID",  currency: "AMD", symbol: "֏", rate: 362.94 },
  "AO": { tier: "HIGH", currency: "AOA", symbol: "Kz", rate: 912.8 },
  "AR": { tier: "MID",  currency: "ARS", symbol: "$", rate: 1508.38 },
  "AT": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "AU": { tier: "NONE", currency: "AUD", symbol: "A$", rate: 1.39 },
  "AZ": { tier: "MID",  currency: "AZN", symbol: "₼", rate: 1.7 },
  "BA": { tier: "MID",  currency: "BAM", symbol: "KM", rate: 1.69 },
  "BB": { tier: "LOW",  currency: "BBD", symbol: "$", rate: 2.0 },
  "BD": { tier: "HIGH", currency: "BDT", symbol: "৳", rate: 122.89 },
  "BE": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "BF": { tier: "HIGH", currency: "XOF", symbol: "CFA", rate: 563.2 },
  "BG": { tier: "MID",  currency: "BGN", symbol: "лв", rate: 1.68 },
  "BH": { tier: "NONE", currency: "BHD", symbol: "BD ", rate: 0.377 },
  "BI": { tier: "HIGH", currency: "BIF", symbol: "FBu", rate: 2990.33 },
  "BJ": { tier: "HIGH", currency: "XOF", symbol: "CFA", rate: 563.2 },
  "BN": { tier: "NONE", currency: "BND", symbol: "B$", rate: 1.34 },
  "BO": { tier: "MID",  currency: "BOB", symbol: "Bs.", rate: 6.91 },
  "BR": { tier: "MID",  currency: "BRL", symbol: "R$", rate: 5.65 },
  "BS": { tier: "LOW",  currency: "BSD", symbol: "$", rate: 1.0 },
  "BT": { tier: "HIGH", currency: "BTN", symbol: "Nu.", rate: 84.45 },
  "BW": { tier: "MID",  currency: "BWP", symbol: "P", rate: 13.5 },
  "BY": { tier: "MID",  currency: "BYN", symbol: "Br", rate: 3.27 },
  "BZ": { tier: "MID",  currency: "BZD", symbol: "$", rate: 2.0 },
  "CA": { tier: "NONE",  currency: "CAD", symbol: "C$", rate: 1.0 },
  "CD": { tier: "HIGH", currency: "CDF", symbol: "FC", rate: 2840.0 },
  "CF": { tier: "HIGH", currency: "XAF", symbol: "FCFA", rate: 563.2 },
  "CG": { tier: "HIGH", currency: "XAF", symbol: "FCFA", rate: 563.2 },
  "CH": { tier: "NONE", currency: "CHF", symbol: "CHF", rate: 0.81 },
  "CI": { tier: "HIGH", currency: "XOF", symbol: "CFA", rate: 563.2 },
  "CL": { tier: "MID",  currency: "CLP", symbol: "$", rate: 920.0 },
  "CM": { tier: "HIGH", currency: "XAF", symbol: "FCFA", rate: 563.2 },
  "CN": { tier: "MID",  currency: "CNY", symbol: "¥", rate: 6.72 },
  "CO": { tier: "MID",  currency: "COP", symbol: "$", rate: 4150.0 },
  "CR": { tier: "MID",  currency: "CRC", symbol: "₡", rate: 515.0 },
  "CU": { tier: "MID",  currency: "CUP", symbol: "$", rate: 24.0 },
  "CV": { tier: "MID",  currency: "CVE", symbol: "$", rate: 95.0 },
  "CY": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "CZ": { tier: "MID",  currency: "CZK", symbol: "Kč", rate: 22.1 },
  "DE": { tier: "NONE",  currency: "EUR", symbol: "€", rate: 0.86 },
  "DJ": { tier: "HIGH", currency: "DJF", symbol: "Fdj", rate: 177.72 },
  "DK": { tier: "NONE", currency: "DKK", symbol: "kr", rate: 6.41 },
  "DM": { tier: "MID",  currency: "XCD", symbol: "$", rate: 2.7 },
  "DO": { tier: "MID",  currency: "DOP", symbol: "$", rate: 59.3 },
  "DZ": { tier: "MID",  currency: "DZD", symbol: "د.ج", rate: 134.5 },
  "EC": { tier: "MID",  currency: "USD", symbol: "$", rate: 1.0 },
  "EE": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "EG": { tier: "HIGH", currency: "EGP", symbol: "E£", rate: 48.5 },
  "EH": { tier: "MID",  currency: "MAD", symbol: "د.م.", rate: 9.85 },
  "ER": { tier: "HIGH", currency: "ERN", symbol: "Nfk", rate: 15.0 },
  "ES": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "ET": { tier: "HIGH", currency: "ETB", symbol: "Br", rate: 112.0 },
  "FI": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "FJ": { tier: "MID",  currency: "FJD", symbol: "$", rate: 2.22 },
  "FM": { tier: "HIGH", currency: "USD", symbol: "$", rate: 1.0 },
  "FR": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "GA": { tier: "MID",  currency: "XAF", symbol: "FCFA", rate: 563.2 },
  "GB": { tier: "NONE",  currency: "GBP", symbol: "£", rate: 1.0 },
  "GD": { tier: "MID",  currency: "XCD", symbol: "$", rate: 2.7 },
  "GE": { tier: "MID",  currency: "GEL", symbol: "₾", rate: 2.61 },
  "GH": { tier: "HIGH", currency: "GHS", symbol: "GH₵", rate: 15.1 },
  "GM": { tier: "HIGH", currency: "GMD", symbol: "D", rate: 73.5 },
  "GN": { tier: "HIGH", currency: "GNF", symbol: "FG", rate: 8560.0 },
  "GQ": { tier: "MID",  currency: "XAF", symbol: "FCFA", rate: 563.2 },
  "GR": { tier: "MID",  currency: "EUR", symbol: "€", rate: 0.86 },
  "GT": { tier: "MID",  currency: "GTQ", symbol: "Q", rate: 7.63 },
  "GW": { tier: "HIGH", currency: "XOF", symbol: "CFA", rate: 563.2 },
  "GY": { tier: "MID",  currency: "GYD", symbol: "$", rate: 208.6 },
  "HK": { tier: "LOW",  currency: "HKD", symbol: "HK$", rate: 7.82 },
  "HN": { tier: "MID",  currency: "HNL", symbol: "L", rate: 24.7 },
  "HR": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "HT": { tier: "HIGH", currency: "HTG", symbol: "G", rate: 130.77 },
  "HU": { tier: "MID",  currency: "HUF", symbol: "Ft", rate: 312.53 },
  "ID": { tier: "MID",  currency: "IDR", symbol: "Rp", rate: 15650.0 },
  "IE": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "IL": { tier: "LOW",  currency: "ILS", symbol: "₪", rate: 3.48 },
  "IN": { tier: "MID",  currency: "INR", symbol: "₹", rate: 84.45 },
  "IQ": { tier: "MID",  currency: "IQD", symbol: "ع.د", rate: 1310.0 },
  "IR": { tier: "MID",  currency: "IRR", symbol: "﷼", rate: 42000.0 },
  "IS": { tier: "NONE", currency: "ISK", symbol: "kr", rate: 137.5 },
  "IT": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "JM": { tier: "MID",  currency: "JMD", symbol: "$", rate: 156.4 },
  "JO": { tier: "MID",  currency: "JOD", symbol: "JD", rate: 0.709 },
  "JP": { tier: "LOW",  currency: "JPY", symbol: "¥", rate: 156.41 },
  "KE": { tier: "HIGH", currency: "KES", symbol: "KSh", rate: 129.45 },
  "KG": { tier: "HIGH", currency: "KGS", symbol: "сом", rate: 87.45 },
  "KH": { tier: "HIGH", currency: "KHR", symbol: "៛", rate: 4100.0 },
  "KI": { tier: "HIGH", currency: "AUD", symbol: "A$", rate: 1.39 },
  "KM": { tier: "HIGH", currency: "KMF", symbol: "CF", rate: 423.0 },
  "KN": { tier: "LOW",  currency: "XCD", symbol: "$", rate: 2.7 },
  "KP": { tier: "HIGH", currency: "KPW", symbol: "₩", rate: 900.0 },
  "KR": { tier: "LOW",  currency: "KRW", symbol: "₩", rate: 1340.0 },
  "KW": { tier: "LOW",  currency: "KWD", symbol: "KD", rate: 0.306 },
  "KZ": { tier: "MID",  currency: "KZT", symbol: "₸", rate: 475.0 },
  "LA": { tier: "HIGH", currency: "LAK", symbol: "₭", rate: 21800.0 },
  "LB": { tier: "HIGH", currency: "LBP", symbol: "ل.ل", rate: 89500.0 },
  "LC": { tier: "LOW",  currency: "XCD", symbol: "$", rate: 2.7 },
  "LI": { tier: "NONE", currency: "CHF", symbol: "CHF", rate: 0.81 },
  "LK": { tier: "HIGH", currency: "LKR", symbol: "Rs", rate: 328.09 },
  "LR": { tier: "HIGH", currency: "LRD", symbol: "$", rate: 194.0 },
  "LS": { tier: "HIGH", currency: "LSL", symbol: "L", rate: 18.2 },
  "LT": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "LU": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "LV": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "LY": { tier: "MID",  currency: "LYD", symbol: "ل.د", rate: 4.82 },
  "MA": { tier: "MID",  currency: "MAD", symbol: "د.م.", rate: 9.85 },
  "MC": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "MD": { tier: "HIGH", currency: "MDL", symbol: "L", rate: 17.6 },
  "ME": { tier: "MID",  currency: "EUR", symbol: "€", rate: 0.86 },
  "MG": { tier: "HIGH", currency: "MGA", symbol: "Ar", rate: 4580.0 },
  "MH": { tier: "MID",  currency: "USD", symbol: "$", rate: 1.0 },
  "MK": { tier: "MID",  currency: "MKD", symbol: "ден", rate: 52.8 },
  "ML": { tier: "HIGH", currency: "XOF", symbol: "CFA", rate: 563.2 },
  "MM": { tier: "HIGH", currency: "MMK", symbol: "K", rate: 2100.0 },
  "MN": { tier: "MID",  currency: "MNT", symbol: "₮", rate: 3440.0 },
  "MR": { tier: "HIGH", currency: "MRU", symbol: "UM", rate: 39.8 },
  "MT": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "MU": { tier: "MID",  currency: "MUR", symbol: "₨", rate: 46.2 },
  "MV": { tier: "MID",  currency: "MVR", symbol: "Rf", rate: 15.42 },
  "MW": { tier: "HIGH", currency: "MWK", symbol: "MK", rate: 1730.0 },
  "MX": { tier: "MID",  currency: "MXN", symbol: "$", rate: 19.4 },
  "MY": { tier: "MID",  currency: "MYR", symbol: "RM", rate: 4.36 },
  "MZ": { tier: "HIGH", currency: "MZN", symbol: "MT", rate: 63.8 },
  "NA": { tier: "MID",  currency: "NAD", symbol: "$", rate: 18.2 },
  "NE": { tier: "HIGH", currency: "XOF", symbol: "CFA", rate: 563.2 },
  "NG": { tier: "HIGH", currency: "NGN", symbol: "₦", rate: 1339.0 },
  "NI": { tier: "HIGH", currency: "NIO", symbol: "C$", rate: 36.8 },
  "NL": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "NO": { tier: "NONE", currency: "NOK", symbol: "kr", rate: 10.6 },
  "NP": { tier: "HIGH", currency: "NPR", symbol: "Rs", rate: 135.1 },
  "NR": { tier: "MID",  currency: "AUD", symbol: "A$", rate: 1.39 },
  "NZ": { tier: "LOW",  currency: "NZD", symbol: "NZ$", rate: 1.62 },
  "OM": { tier: "NONE", currency: "OMR", symbol: "ر.ع.", rate: 0.385 },
  "PA": { tier: "MID",  currency: "PAB", symbol: "B/.", rate: 1.0 },
  "PE": { tier: "MID",  currency: "PEN", symbol: "S/.", rate: 3.74 },
  "PG": { tier: "HIGH", currency: "PGK", symbol: "K", rate: 3.92 },
  "PH": { tier: "MID",  currency: "PHP", symbol: "₱", rate: 56.8 },
  "PK": { tier: "HIGH", currency: "PKR", symbol: "Rs", rate: 277.31 },
  "PL": { tier: "MID",  currency: "PLN", symbol: "zł", rate: 3.95 },
  "PT": { tier: "MID",  currency: "EUR", symbol: "€", rate: 0.86 },
  "PW": { tier: "LOW",  currency: "USD", symbol: "$", rate: 1.0 },
"QA": { tier: "NONE", currency: "QAR", symbol: "ر.ق", rate: 3.64 },
  "RO": { tier: "MID",  currency: "RON", symbol: "lei", rate: 4.28 },
  "RS": { tier: "MID",  currency: "RSD", symbol: "дин.", rate: 100.95 },
  "RU": { tier: "HIGH", currency: "RUB", symbol: "₽", rate: 91.2 },
  "RW": { tier: "HIGH", currency: "RWF", symbol: "FRw", rate: 1365.0 },
  "SA": { tier: "NONE", currency: "SAR", symbol: "ر.س", rate: 3.75 },
  "SB": { tier: "HIGH", currency: "SBD", symbol: "$", rate: 8.52 },
  "SC": { tier: "MID",  currency: "SCR", symbol: "₨", rate: 13.95 },
  "SD": { tier: "HIGH", currency: "SDG", symbol: "ج.س.", rate: 601.0 },
  "SE": { tier: "NONE", currency: "SEK", symbol: "kr", rate: 9.85 },
  "SG": { tier: "NONE", currency: "SGD", symbol: "S$", rate: 1.31 },
  "SH": { tier: "HIGH", currency: "SHP", symbol: "£", rate: 0.74 },
  "SI": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "SK": { tier: "LOW",  currency: "EUR", symbol: "€", rate: 0.86 },
  "SL": { tier: "HIGH", currency: "SLE", symbol: "Le", rate: 22.85 },
  "SM": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "SN": { tier: "HIGH", currency: "XOF", symbol: "CFA", rate: 563.2 },
  "SO": { tier: "HIGH", currency: "SOS", symbol: "Sh.So.", rate: 571.5 },
  "SR": { tier: "HIGH", currency: "SRD", symbol: "$", rate: 31.4 },
  "SS": { tier: "HIGH", currency: "SSP", symbol: "£", rate: 130.26 },
  "ST": { tier: "HIGH", currency: "STN", symbol: "Db", rate: 21.15 },
  "SV": { tier: "MID",  currency: "USD", symbol: "$", rate: 1.0 },
  "SY": { tier: "HIGH", currency: "SYP", symbol: "£", rate: 13000.0 },
  "SZ": { tier: "HIGH", currency: "SZL", symbol: "L", rate: 18.2 },
  "TD": { tier: "HIGH", currency: "XAF", symbol: "FCFA", rate: 563.2 },
  "TG": { tier: "HIGH", currency: "XOF", symbol: "CFA", rate: 563.2 },
  "TH": { tier: "MID",  currency: "THB", symbol: "฿", rate: 32.45 },
  "TJ": { tier: "HIGH", currency: "TJS", symbol: "ЅМ", rate: 10.7 },
  "TL": { tier: "HIGH", currency: "USD", symbol: "$", rate: 1.0 },
  "TM": { tier: "HIGH", currency: "TMT", symbol: "T", rate: 3.5 },
  "TN": { tier: "MID",  currency: "TND", symbol: "د.ت", rate: 3.05 },
  "TO": { tier: "MID",  currency: "TOP", symbol: "T$", rate: 2.33 },
  "TR": { tier: "HIGH", currency: "TRY", symbol: "₺", rate: 34.15 },
  "TT": { tier: "MID",  currency: "TTD", symbol: "$", rate: 6.78 },
  "TV": { tier: "HIGH", currency: "AUD", symbol: "A$", rate: 1.39 },
  "TW": { tier: "LOW",  currency: "TWD", symbol: "NT$", rate: 31.85 },
  "TZ": { tier: "HIGH", currency: "TZS", symbol: "TSh", rate: 2725.0 },
  "TK": { tier: "MID",  currency: "NZD", symbol: "NZ$", rate: 1.62 },
  "UA": { tier: "HIGH", currency: "UAH", symbol: "₴", rate: 41.35 },
  "UG": { tier: "HIGH", currency: "UGX", symbol: "USh", rate: 3670.0 },
  "US": { tier: "NONE", currency: "USD", symbol: "$", rate: 1.0 },
  "UY": { tier: "MID",  currency: "UYU", symbol: "$U", rate: 41.2 },
  "UZ": { tier: "HIGH", currency: "UZS", symbol: "сўм", rate: 12750.0 },
  "VA": { tier: "NONE", currency: "EUR", symbol: "€", rate: 0.86 },
  "VC": { tier: "LOW",  currency: "XCD", symbol: "$", rate: 2.7 },
  "VE": { tier: "HIGH", currency: "VES", symbol: "Bs.S", rate: 36.65 },
  "VN": { tier: "HIGH", currency: "VND", symbol: "₫", rate: 24780.0 },
  "VU": { tier: "HIGH", currency: "VUV", symbol: "VT", rate: 118.0 },
  "WF": { tier: "MID",  currency: "XPF", symbol: "₣", rate: 119.33 },
  "WS": { tier: "MID",  currency: "WST", symbol: "T", rate: 2.72 },
  "XK": { tier: "MID",  currency: "EUR", symbol: "€", rate: 0.86 },
  "YE": { tier: "HIGH", currency: "YER", symbol: "﷼", rate: 250.35 },
  "ZA": { tier: "MID",  currency: "ZAR", symbol: "R", rate: 18.2 },
  "ZM": { tier: "HIGH", currency: "ZMW", symbol: "ZK", rate: 26.4 },
  "ZW": { tier: "HIGH", currency: "ZWG", symbol: "ZiG", rate: 13.95 }
  
};

// HELPER: To provide a clean list of all 195 countries to the dropdown
export const getCountryList = () => {
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    // This loops through all ISO codes available in the browser's international library
    const allCodes = [
        "AF", "AL", "DZ", "AS", "AD", "AO", "AI", "AQ", "AG", "AR", "AM", "AW", "AU", "AT",
        "AZ", "BS", "BH", "BD", "BB", "BY", "BE", "BZ", "BJ", "BM", "BT", "BO", "BQ", "BA", "BW", "BV", "BR",
        "IO", "BN", "BG", "BF", "BI", "CV", "KH", "CM", "CA", "KY", "CF", "TD", "CL", "CN", "CX", "CC", "CO",
        "KM", "CD", "CG", "CK", "CR", "HR", "CU", "CW", "CY", "CZ", "CI", "DK", "DJ", "DM", "DO", "EC", "EG",
        "SV", "GQ", "ER", "EE", "SZ", "ET", "FK", "FO", "FJ", "FI", "FR", "GF", "PF", "TF", "GA", "GM", "GE",
        "DE", "GH", "GI", "GR", "GL", "GD", "GP", "GU", "GT", "GG", "GN", "GW", "GY", "HT", "HM", "VA", "HN",
        "HK", "HU", "IS", "IN", "ID", "IR", "IQ", "IE", "IM", "IL", "IT", "JM", "JP", "JE", "JO", "KZ", "KE",
        "KI", "KP", "KR", "KW", "KG", "LA", "LV", "LB", "LS", "LR", "LY", "LI", "LT", "LU", "MO", "MG", "MW",
        "MY", "MV", "ML", "MT", "MH", "MQ", "MR", "MU", "YT", "MX", "FM", "MD", "MC", "MN", "ME", "MS", "MA",
        "MZ", "MM", "NA", "NR", "NP", "NL", "NC", "NZ", "NI", "NE", "NG", "NU", "NF", "MP", "NO", "OM", "PK",
        "PW", "PS", "PA", "PG", "PY", "PR", "QA", "MK", "RO", "RU", "RW", "RE", "BL", "SH", "KN", "LC", "MF",
        "PM", "VC", "WS", "SM", "ST", "SA", "SN", "RS", "SC", "SL", "SG", "SX", "SK", "SI", "SB", "SO", "ZA",
        "GS", "SS", "ES", "LK", "SD", "SR", "SJ", "SE", "CH", "SY", "TW", "TJ", "TZ", "TH", "TL", "TG", "TK",
        "TO", "TT", "TN", "TR", "TM", "TC", "TV", "UG", "UA", "AE", "GB", "UM", "UY", "UZ", "VU", "VE", "VN",
        "VG", "VI", "WF", "EH", "YE", "ZM", "ZW"
    ];

    return allCodes.map(code => ({
        code,
        name: regionNames.of(code) || code
    })).sort((a, b) => a.name.localeCompare(b.name));
};


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

export const calculatePPPPrice = (originalPrice: number, countryCode: string) => {
    const code = countryCode.toUpperCase();
    
    // 1. Logic: Use the massive pppData list at the top of this file
    // FALLBACK: If country not in list, we treat as 'International' (40% discount)
    const country = pppData[code] || pppData["DEFAULT"];
    
    const tierMultipliers = {
        "NONE": 1.0, 
        "LOW": 0.8,   // 20% off (GLOBAL20)
        "MID": 0.5,   // 50% off (GLOBAL50)
        "HIGH": 0.3   // 70% off (GLOBAL70)
    };

    const multiplier = tierMultipliers[country.tier] || 0.6;
    const suggestedPriceUSD = originalPrice * multiplier;
    
    // 2. Local Math: Using the specific Rate and Symbol from pppData
    const localAmount = Math.round(suggestedPriceUSD * (country.rate ?? 1));
    const formattedPrice = `${country.symbol} ${localAmount.toLocaleString()}`;

    return {
        suggestedPrice: Number(suggestedPriceUSD.toFixed(2)),
        localPriceFormatted: formattedPrice,
        discountPercentage: Math.round((1 - multiplier) * 100),
        discountTier: country.tier,
        symbol: country.symbol,
        countryName: country.name,
        rate: country.rate
    };
};

