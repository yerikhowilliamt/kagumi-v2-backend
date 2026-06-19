export const PRICE_SORT_OPTIONS = ['price_asc', 'price_desc'] as const;
export type PriceSortOption = (typeof PRICE_SORT_OPTIONS)[number];
