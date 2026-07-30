// This data represents the multiplier for each country.
// 1.0 means full price. 0.3 means a 70% discount is needed to be 'fair'.
const pppMultipliers: Record<string, number> = {
    "US": 1.0,    // USA (Base)
    "GB": 0.9,    // United Kingdom
    "CA": 0.9,    // Canada
    "NG": 0.25,   // Nigeria (Significant discount needed)
    "IN": 0.3,    // India
    "BR": 0.45,   // Brazil
    "DE": 0.95,   // Germany
    "JP": 0.85    // Japan
};

// pricingEngine.ts

export const calculatePPPPrice = (originalPrice: number, countryCode: string) => {
    // Ensure you use 'countryCode' here to match the parameter above
    const multiplier = pppMultipliers[countryCode.toUpperCase()] || 1.0;
    const suggestedPrice = originalPrice * multiplier;
    
    return {
        suggestedPrice: Number(suggestedPrice.toFixed(2)),
        discountedPercentage: Math.round((1 - multiplier) * 100),
        multiplier
    };
};