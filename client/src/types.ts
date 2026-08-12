export interface PricingResult {
    suggestedPrice: number;
    discountPercentage: number;
    multiplier: number;
    productName: string;
    localizedPitch: string;
    localPriceFormatted?: string;
    countryName?: string;
}
