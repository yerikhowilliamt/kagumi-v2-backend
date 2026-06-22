export const SORT_OPTIONS = ['data_asc', 'data_desc'] as const;
export type SortOption = (typeof SORT_OPTIONS)[number];
