// server/src/pricingEngine.ts

interface CountryData {
    name: string;
    multiplier: number;
    symbol: string;
    rate: number;
}

const pppData: Record<string, CountryData> = {
     // =========================================================================
    // --- REGION: WEST AFRICA ---
    // =========================================================================
    "NG": { name: "Nigeria", multiplier: 0.35, symbol: "₦", rate: 1363 },
    "GH": { name: "Ghana", multiplier: 0.35, symbol: "GH₵", rate: 15 },
    "CI": { name: "Côte d'Ivoire", multiplier: 0.35, symbol: "FCFA", rate: 605 },
    "SN": { name: "Senegal", multiplier: 0.35, symbol: "FCFA", rate: 605 },
    "BF": { name: "Burkina Faso", multiplier: 0.3, symbol: "FCFA", rate: 605 },
    "BJ": { name: "Benin", multiplier: 0.3, symbol: "FCFA", rate: 605 },
    "GM": { name: "Gambia", multiplier: 0.3, symbol: "D", rate: 68 },
    "GN": { name: "Guinea", multiplier: 0.3, symbol: "FG", rate: 8600 },
    "GW": { name: "Guinea-Bissau", multiplier: 0.3, symbol: "FCFA", rate: 605 },
    "LR": { name: "Liberia", multiplier: 0.3, symbol: "$", rate: 194 },
    "ML": { name: "Mali", multiplier: 0.3, symbol: "FCFA", rate: 605 },
    "NE": { name: "Niger", multiplier: 0.3, symbol: "FCFA", rate: 605 },
    "SL": { name: "Sierra Leone", multiplier: 0.3, symbol: "Le", rate: 22500 },
    "TG": { name: "Togo", multiplier: 0.3, symbol: "FCFA", rate: 605 },
    "CV": { name: "Cape Verde", multiplier: 0.45, symbol: "$", rate: 102 },
    "MR": { name: "Mauritania", multiplier: 0.35, symbol: "UM", rate: 39.5 },

    // =========================================================================
    // --- REGION: REST OF AFRICA ---
    // =========================================================================
    "AO": { name: "Angola", multiplier: 0.35, symbol: "Kz", rate: 850 },
    "BI": { name: "Burundi", multiplier: 0.3, symbol: "FBu", rate: 2870 },
    "BW": { name: "Botswana", multiplier: 0.55, symbol: "P", rate: 13.5 },
    "CD": { name: "Democratic Republic of the Congo", multiplier: 0.3, symbol: "FC", rate: 2800 },
    "CF": { name: "Central African Republic", multiplier: 0.3, symbol: "FCFA", rate: 605 },
    "CG": { name: "Republic of the Congo", multiplier: 0.35, symbol: "FCFA", rate: 605 },
    "CM": { name: "Cameroon", multiplier: 0.35, symbol: "FCFA", rate: 605 },
    "DJ": { name: "Djibouti", multiplier: 0.45, symbol: "Fdj", rate: 178 },
    "DZ": { name: "Algeria", multiplier: 0.5, symbol: "د.ج", rate: 134 },
    "EG": { name: "Egypt", multiplier: 0.35, symbol: "E£", rate: 47 },
    "ER": { name: "Eritrea", multiplier: 0.3, symbol: "Nfk", rate: 15.0 },
    "ET": { name: "Ethiopia", multiplier: 0.3, symbol: "Br", rate: 57 },
    "GA": { name: "Gabon", multiplier: 0.55, symbol: "FCFA", rate: 605 },
    "GQ": { name: "Equatorial Guinea", multiplier: 0.55, symbol: "FCFA", rate: 605 },
    "KE": { name: "Kenya", multiplier: 0.35, symbol: "KSh", rate: 129 },
    "KM": { name: "Comoros", multiplier: 0.3, symbol: "CF", rate: 453 },
    "LS": { name: "Lesotho", multiplier: 0.35, symbol: "L", rate: 18.5 },
    "LY": { name: "Libya", multiplier: 0.55, symbol: "ل.د", rate: 4.85 },
    "MA": { name: "Morocco", multiplier: 0.55, symbol: "د.م.", rate: 10.0 },
    "MG": { name: "Madagascar", multiplier: 0.3, symbol: "Ar", rate: 4500 },
    "MU": { name: "Mauritius", multiplier: 0.6, symbol: "₨", rate: 46.5 },
    "MW": { name: "Malawi", multiplier: 0.3, symbol: "MK", rate: 1730 },
    "MZ": { name: "Mozambique", multiplier: 0.3, symbol: "MT", rate: 64 },
    "NA": { name: "Namibia", multiplier: 0.55, symbol: "$", rate: 18.5 },
    "RW": { name: "Rwanda", multiplier: 0.3, symbol: "FRw", rate: 1310 },
    "SC": { name: "Seychelles", multiplier: 0.45, symbol: "SR", rate: 14.0 },
    "SD": { name: "Sudan", multiplier: 0.3, symbol: "LSd", rate: 600 },
    "SO": { name: "Somalia", multiplier: 0.3, symbol: "Sh.So.", rate: 570 },
    "SS": { name: "South Sudan", multiplier: 0.3, symbol: "SSP", rate: 130 },
    "ST": { name: "São Tomé and Príncipe", multiplier: 0.35, symbol: "Db", rate: 22.5 },
    "SZ": { name: "Eswatini", multiplier: 0.4, symbol: "E", rate: 18.5 },
    "TD": { name: "Chad", multiplier: 0.3, symbol: "FCFA", rate: 605 },
    "TN": { name: "Tunisia", multiplier: 0.5, symbol: "د.ت", rate: 3.12 },
    "TZ": { name: "Tanzania", multiplier: 0.35, symbol: "TSh", rate: 2600 },
    "UG": { name: "Uganda", multiplier: 0.35, symbol: "USh", rate: 3740 },
    "ZA": { name: "South Africa", multiplier: 0.55, symbol: "R", rate: 18.5 },
    "ZM": { name: "Zambia", multiplier: 0.35, symbol: "ZK", rate: 25.5 },
    "ZW": { name: "Zimbabwe", multiplier: 0.35, symbol: "ZiG", rate: 13.6 },

    // =========================================================================
    // --- REGION: NORTH AMERICA & CARIBBEAN ---
      // --- TIER 1: High Income (No or little discount) ---
    // =========================================================================
    "US": { name: "United States", multiplier: 1.0, symbol: "$", rate: 1 },
    "CA": { name: "Canada", multiplier: 0.9, symbol: "$", rate: 1.37 },
    "MX": { name: "Mexico", multiplier: 0.6, symbol: "$", rate: 18.2 },
    "AG": { name: "Antigua and Barbuda", multiplier: 0.7, symbol: "$", rate: 2.7 },
    "BS": { name: "Bahamas", multiplier: 0.85, symbol: "$", rate: 1.0 },
    "BB": { name: "Barbados", multiplier: 0.7, symbol: "$", rate: 2.02 },
    "BZ": { name: "Belize", multiplier: 0.6, symbol: "BZ$", rate: 2.0 },
    "CR": { name: "Costa Rica", multiplier: 0.65, symbol: "₡", rate: 525 },
    "CU": { name: "Cuba", multiplier: 0.5, symbol: "$", rate: 24 },
    "DM": { name: "Dominica", multiplier: 0.6, symbol: "$", rate: 2.7 },
    "DO": { name: "Dominican Republic", multiplier: 0.6, symbol: "RD$", rate: 59 },
    "GT": { name: "Guatemala", multiplier: 0.55, symbol: "Q", rate: 7.75 },
    "HN": { name: "Honduras", multiplier: 0.4, symbol: "L", rate: 24.7 },
    "HT": { name: "Haiti", multiplier: 0.3, symbol: "G", rate: 132 },
    "JM": { name: "Jamaica", multiplier: 0.6, symbol: "J$", rate: 156 },
    "KN": { name: "Saint Kitts and Nevis", multiplier: 0.7, symbol: "$", rate: 2.7 },
    "LC": { name: "Saint Lucia", multiplier: 0.6, symbol: "$", rate: 2.7 },
    "NI": { name: "Nicaragua", multiplier: 0.4, symbol: "C$", rate: 36.8 },
    "PA": { name: "Panama", multiplier: 0.65, symbol: "B/.", rate: 1.0 },
    "SV": { name: "El Salvador", multiplier: 0.45, symbol: "$", rate: 1.0 },
    "TT": { name: "Trinidad and Tobago", multiplier: 0.65, symbol: "TT$", rate: 6.8 },
    "VC": { name: "Saint Vincent and the Grenadines", multiplier: 0.6, symbol: "$", rate: 2.7 },

    // =========================================================================
    // --- REGION: SOUTH AMERICA ---
    // =========================================================================
    "AR": { name: "Argentina", multiplier: 0.5, symbol: "$", rate: 910 },
    "BO": { name: "Bolivia", multiplier: 0.5, symbol: "Bs", rate: 6.9 },
    "BR": { name: "Brazil", multiplier: 0.5, symbol: "R$", rate: 5.4 },
    "CL": { name: "Chile", multiplier: 0.7, symbol: "$", rate: 930 },
    "CO": { name: "Colombia", multiplier: 0.55, symbol: "$", rate: 4150 },
    "EC": { name: "Ecuador", multiplier: 0.6, symbol: "$", rate: 1.0 },
    "GY": { name: "Guyana", multiplier: 0.6, symbol: "$", rate: 209 },
    "PE": { name: "Peru", multiplier: 0.55, symbol: "S/.", rate: 3.8 },
    "PY": { name: "Paraguay", multiplier: 0.5, symbol: "₲", rate: 7550 },
    "SR": { name: "Suriname", multiplier: 0.55, symbol: "$", rate: 30.5 },
    "UY": { name: "Uruguay", multiplier: 0.7, symbol: "$U", rate: 39.3 },
    "VE": { name: "Venezuela", multiplier: 0.5, symbol: "Bs.S", rate: 36.4 },

    // =========================================================================
    // --- REGION: ASIA & MIDDLE EAST ---
    // =========================================================================
    "AF": { name: "Afghanistan", multiplier: 0.3, symbol: "؋", rate: 71.0 },
    "AM": { name: "Armenia", multiplier: 0.55, symbol: "֏", rate: 388 },
    "AZ": { name: "Azerbaijan", multiplier: 0.55, symbol: "₼", rate: 1.7 },
    "AE": { name: "United Arab Emirates", multiplier: 1.0, symbol: "د.إ", rate: 3.67 },
    "BH": { name: "Bahrain", multiplier: 0.85, symbol: ".د.ب", rate: 0.38 },
    "BD": { name: "Bangladesh", multiplier: 0.35, symbol: "৳", rate: 117 },
    "BN": { name: "Brunei", multiplier: 0.75, symbol: "B$", rate: 1.35 },
    "BT": { name: "Bhutan", multiplier: 0.35, symbol: "Nu.", rate: 83.5 },
    "CN": { name: "China", multiplier: 0.65, symbol: "¥", rate: 7.2 },
    "GE": { name: "Georgia", multiplier: 0.55, symbol: "₾", rate: 2.75 },
    "ID": { name: "Indonesia", multiplier: 0.55, symbol: "Rp", rate: 16300 },
    "IN": { name: "India", multiplier: 0.4, symbol: "₹", rate: 83.5 },
    "IQ": { name: "Iraq", multiplier: 0.55, symbol: "ع.د", rate: 1310 },
    "IR": { name: "Iran", multiplier: 0.5, symbol: "﷼", rate: 42000 },
    "IL": { name: "Israel", multiplier: 0.9, symbol: "₪", rate: 3.7 },
    "JP": { name: "Japan", multiplier: 0.85, symbol: "¥", rate: 157 },
    "JO": { name: "Jordan", multiplier: 0.65, symbol: "د.ا", rate: 0.71 },
    "KZ": { name: "Kazakhstan", multiplier: 0.6, symbol: "₸", rate: 460 },
    "KG": { name: "Kyrgyzstan", multiplier: 0.35, symbol: "сом", rate: 87 },
    "KH": { name: "Cambodia", multiplier: 0.35, symbol: "៛", rate: 4100 },
    "KP": { name: "North Korea", multiplier: 0.3, symbol: "₩", rate: 900 },
    "KR": { name: "South Korea", multiplier: 0.85, symbol: "₩", rate: 1380 },
    "KW": { name: "Kuwait", multiplier: 0.9, symbol: "د.ك", rate: 0.31 },
    "LA": { name: "Laos", multiplier: 0.3, symbol: "₭", rate: 21800 },
    "LB": { name: "Lebanon", multiplier: 0.5, symbol: "ل.ل", rate: 89500 },
    "LK": { name: "Sri Lanka", multiplier: 0.5, symbol: "Rs", rate: 305 },
    "MV": { name: "Maldives", multiplier: 0.65, symbol: ".ر", rate: 15.4 },
    "MY": { name: "Malaysia", multiplier: 0.75, symbol: "RM", rate: 4.6 },
    "MN": { name: "Mongolia", multiplier: 0.55, symbol: "₮", rate: 3400 },
    "MM": { name: "Myanmar", multiplier: 0.3, symbol: "Ks", rate: 2100 },
};

// HELPER: To get alphabetical list for the Frontend dropdown
export const getCountryList = () => {
    return Object.keys(pppData).map(code => ({
        code,
        name: pppData[code].name
    })).sort((a, b) => a.name.localeCompare(b.name));
};

export const calculatePPPPrice = (originalPrice: number, countryCode: string) => {
    const code = countryCode.toUpperCase();
    
    // 1. Get data from the Master List
    // Fallback: If country not in list, assume it's a Mid-Tier developing nation (0.4)
    const country = pppData[code] || { 
        name: new Intl.DisplayNames(['en'], { type: 'region' }).of(code) || code,
        multiplier: 0.4, 
        symbol: "$", 
        rate: 1 
    };
    
    // 2. The Math
    const suggestedPriceUSD = originalPrice * country.multiplier;
    const localAmount = suggestedPriceUSD * country.rate;
    
    return {
        suggestedPrice: Number(suggestedPriceUSD.toFixed(2)),
        localPriceFormatted: `${country.symbol}${Math.round(localAmount).toLocaleString()}`,
        discountPercentage: Math.round((1 - country.multiplier) * 100),
        symbol: country.symbol,
        countryName: country.name
    };
};