// server/src/pricingEngine.ts

interface CountryData {
    tier: 'LOW' | 'MID' | 'HIGH' | 'NONE';
    rate?: number; // Optional: used for specific overrides like Nigeria
    symbol?: string;
}

export const pppData: Record<string, CountryData> = {
    // --- TIER: NONE (Full Price - GLOBAL20) ---
    "US": { tier: "NONE" }, "CH": { tier: "NONE" }, "SG": { tier: "NONE" },
    "LU": { tier: "NONE" }, "NO": { tier: "NONE" }, "IE": { tier: "NONE" },
    "QA": { tier: "NONE" }, "IS": { tier: "NONE" }, "DK": { tier: "NONE" },
    "AU": { tier: "NONE" }, "AE": { tier: "NONE" },

    // --- TIER: LOW (20% Off - GLOBAL20) ---
    "GB": { tier: "LOW" }, "DE": { tier: "LOW" }, "FR": { tier: "LOW" },
    "JP": { tier: "LOW" }, "CA": { tier: "LOW" }, "KR": { tier: "LOW" },
    "IT": { tier: "LOW" }, "ES": { tier: "LOW" }, "NL": { tier: "LOW" },
    "SE": { tier: "LOW" }, "AT": { tier: "LOW" }, "BE": { tier: "LOW" },
    "FI": { tier: "LOW" }, "NZ": { tier: "LOW" }, "HK": { tier: "LOW" },
    "IL": { tier: "LOW" }, "KW": { tier: "LOW" }, "SA": { tier: "LOW" },

    // --- TIER: MID (50% Off - GLOBAL50) ---
    "BR": { tier: "MID" }, "MX": { tier: "MID" }, "CN": { tier: "MID" },
    "IN": { tier: "MID" }, "MY": { tier: "MID" }, "TH": { tier: "MID" },
    "PH": { tier: "MID" }, "RU": { tier: "MID" }, "TR": { tier: "MID" },
    "ID": { tier: "MID" }, "CL": { tier: "MID" }, "CO": { tier: "MID" },
    "PE": { tier: "MID" }, "AR": { tier: "MID" }, "VN": { tier: "MID" },
    "PL": { tier: "MID" }, "GR": { tier: "MID" }, "PT": { tier: "MID" },
    "CZ": { tier: "MID" }, "HU": { tier: "MID" }, "RO": { tier: "MID" },
    "UA": { tier: "MID" }, "DZ": { tier: "MID" }, "MA": { tier: "MID" },

    // --- TIER: HIGH (70% Off - GLOBAL70) ---
    "NG": { tier: "HIGH", rate: 1339, symbol: "₦" }, // Explicit override for your home market
    "GH": { tier: "HIGH", rate: 15, symbol: "GH₵" },
    "KE": { tier: "HIGH", rate: 129, symbol: "KSh" },
    "ZA": { tier: "HIGH", rate: 18.5, symbol: "R" },
    "EG": { tier: "HIGH", rate: 48, symbol: "E£" },
    "PK": { tier: "HIGH", rate: 278, symbol: "₨" },
    "BD": { tier: "HIGH", rate: 117, symbol: "৳" },
    "ET": { tier: "HIGH" }, "TZ": { tier: "HIGH" }, "UG": { tier: "HIGH" },
    "RW": { tier: "HIGH" }, "ZM": { tier: "HIGH" }, "NP": { tier: "HIGH" },
    "LK": { tier: "HIGH" }, "MM": { tier: "HIGH" }, "KH": { tier: "HIGH" },
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


export const calculatePPPPrice = (originalPrice: number, countryCode: string) => {
    const code = countryCode.toUpperCase();
    const config = pppData[code] || { tier: "MID" }; // Default to 50% off for unlisted

    const tierMultipliers = {
        "NONE": 1.0,
        "LOW": 0.8,
        "MID": 0.5,
        "HIGH": 0.3
    };

    const multiplier = tierMultipliers[config.tier];
    const suggestedPriceUSD = originalPrice * multiplier;

    // Resolve Country Name and Currency Symbol automatically
    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
    const countryName = regionNames.of(code) || code;

    // Logic: Use hardcoded rate if exists (like NG), otherwise stay in USD symbol
    const symbol = config.symbol || "$";
    const localAmount = config.rate ? (suggestedPriceUSD * config.rate) : suggestedPriceUSD;

    return {
        suggestedPrice: Number(suggestedPriceUSD.toFixed(2)),
        localPriceFormatted: `${symbol} ${Math.round(localAmount).toLocaleString()}`,
        discountPercentage: Math.round((1 - multiplier) * 100),
        discountTier: config.tier,
        symbol: symbol,
        countryName: countryName
    };
};