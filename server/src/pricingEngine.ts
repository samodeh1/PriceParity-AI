// This data represents the multiplier for each country.
// 1.0 means full price. 0.3 means a 70% discount is needed to be 'fair'.
const pppData: Record<string, { multiplier: number; symbol: string; rate: number }> = {
    "US": { multiplier: 1.0, symbol: "$", rate: 1 },
    "GB": { multiplier: 0.9, symbol: "£", rate: 0.78 },
    "NG": { multiplier: 0.25, symbol: "₦", rate: 1600 }, // Current approx rate
    "IN": { multiplier: 0.3, symbol: "₹", rate: 83 },
    "BR": { multiplier: 0.45, symbol: "R$", rate: 5.4 }
};


// pricingEngine.ts

export const calculatePPPPrice = (originalPrice: number, countryCode: string) => {
    const country = pppData[countryCode.toUpperCase()] || pppData["US"];
    
    const suggestedPriceUSD = originalPrice * country.multiplier;
    const localCurrencyPrice = suggestedPriceUSD * country.rate;
    
    return {
        suggestedPrice: Number(suggestedPriceUSD.toFixed(2)),
        localPriceFormatted: `${country.symbol}${Math.round(localCurrencyPrice).toLocaleString()}`,
        discountPercentage: Math.round((1 - country.multiplier) * 100),
        symbol: country.symbol
    };
};