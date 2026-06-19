export const TIME_SORT_OPTIONS = ['time_asc', 'time_desc', 'newest'] as const;
export type TimeSortOption = (typeof TIME_SORT_OPTIONS)[number];
