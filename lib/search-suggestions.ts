export function buildLocalSearchSuggestions(
  query: string,
  recentSearches: string[],
  trendingSearches: string[],
  fallbackSearches: string[],
  limit = 6,
): string[] {
  const normalizedQuery = query.trim().toLowerCase();

  if (normalizedQuery.length < 2) {
    return [];
  }

  const pool = [...recentSearches, ...trendingSearches, ...fallbackSearches];
  const unique = Array.from(
    new Map(
      pool
        .map((item) => item.trim())
        .filter(Boolean)
        .map((item) => [item.toLowerCase(), item]),
    ).values(),
  );

  return unique
    .filter((item) => item.toLowerCase().includes(normalizedQuery))
    .slice(0, limit);
}
