"use client";

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from '@/lib/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Search, TrendingUp, Clock, X } from 'lucide-react';
import { apiClient } from '@/lib/api';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  placeholder?: string;
  className?: string;
  showSuggestions?: boolean;
  onSearch?: (query: string) => void;
}

export function SearchBar({
  placeholder,
  className = "",
  showSuggestions = true,
  onSearch
}: SearchBarProps) {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [trending, setTrending] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  const t = useTranslations();
  const placeholderText = t("common.search_bar.placeholder");
  const searchButtonText = t("common.search_bar.search_button");
  const loadingSuggestionsText = t("common.search_bar.loading_suggestions");
  const suggestionsTitleText = t("common.search_bar.suggestions_title");
  const recentSearchesTitleText = t("common.search_bar.recent_searches_title");
  const clearRecentSearchesText = t("common.search_bar.clear_recent_searches");
  const trendingTitleText = t("common.search_bar.trending_title");
  const noSuggestionsText = t("common.search_bar.no_suggestions", { query });
  const trendingDefaultWeb = t("common.search_bar.trending_defaults.web_development");
  const trendingDefaultLogo = t("common.search_bar.trending_defaults.logo_design");
  const trendingDefaultSeo = t("common.search_bar.trending_defaults.seo");
  const trendingDefaultMobile = t("common.search_bar.trending_defaults.mobile_app");
  const trendingDefaultMarketing = t("common.search_bar.trending_defaults.digital_marketing");
  const trendingDefaults = useMemo(
    () => ([
      trendingDefaultWeb,
      trendingDefaultLogo,
      trendingDefaultSeo,
      trendingDefaultMobile,
      trendingDefaultMarketing,
    ]),
    [trendingDefaultWeb, trendingDefaultLogo, trendingDefaultSeo, trendingDefaultMobile, trendingDefaultMarketing],
  );
  const resolvedPlaceholder = placeholder ?? placeholderText;

  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  const loadTrendingSearches = useCallback(async () => {
    try {
      const response = await apiClient.getTrendingSearches();
      setTrending(response.trending || []);
    } catch (error) {
      console.error('Failed to load trending searches:', error);
      // Set fallback trending searches
      setTrending(trendingDefaults);
    }
  }, [trendingDefaults]);

  useEffect(() => {
    // Load recent searches from localStorage
    if (typeof window !== 'undefined') {
      const recent = localStorage.getItem('recent_searches');
      if (recent) {
        try {
          setRecentSearches(JSON.parse(recent));
        } catch (e) {
          console.error('Error parsing recent searches:', e);
        }
      }
    }

    // Load trending searches
    loadTrendingSearches();
  }, [loadTrendingSearches]);

  useEffect(() => {
    // Close dropdown when clicking outside
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const loadSuggestions = async (searchQuery: string) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.getSearchSuggestions(searchQuery);
      setSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('Failed to load suggestions:', error);
      setSuggestions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (value: string) => {
    setQuery(value);
    setShowDropdown(true);

    // Debounce suggestions loading
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      if (showSuggestions) {
        loadSuggestions(value);
      }
    }, 300);
  };

  const handleSearch = (searchQuery?: string) => {
    const finalQuery = searchQuery || query;
    if (!finalQuery.trim()) return;

    // Save to recent searches
    if (typeof window !== 'undefined') {
      const updatedRecent = [finalQuery, ...recentSearches.filter(s => s !== finalQuery)].slice(0, 5);
      setRecentSearches(updatedRecent);
      localStorage.setItem('recent_searches', JSON.stringify(updatedRecent));
    }

    setShowDropdown(false);

    if (onSearch) {
      onSearch(finalQuery);
    } else {
      router.push(`/services?search=${encodeURIComponent(finalQuery)}`);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    handleSearch(suggestion);
  };

  const clearRecentSearches = () => {
    setRecentSearches([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem('recent_searches');
    }
  };

  const removeRecentSearch = (searchToRemove: string) => {
    const updated = recentSearches.filter(s => s !== searchToRemove);
    setRecentSearches(updated);
    if (typeof window !== 'undefined') {
      localStorage.setItem('recent_searches', JSON.stringify(updated));
    }
  };

  return (
    <div ref={searchRef} className={`relative ${className}`}>
      <form onSubmit={(e) => { e.preventDefault(); handleSearch(); }} className="relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
          <Input
            value={query}
            onChange={(e) => handleInputChange(e.target.value)}
            onFocus={() => setShowDropdown(true)}
            placeholder={resolvedPlaceholder}
            className="pl-10 pr-20 h-12 text-lg border-2 focus:border-primary"
          />
          <Button
            type="submit"
            size="sm"
            className="absolute right-2 top-1/2 transform -translate-y-1/2 px-4"
          >
            {searchButtonText}
          </Button>
        </div>
      </form>

      {/* Search Dropdown */}
      {showDropdown && showSuggestions && (
        <Card className="absolute top-full left-0 right-0 mt-2 z-50 max-h-96 overflow-y-auto shadow-xl border-2">
          <CardContent className="p-0">
            {/* Loading */}
            {loading && (
              <div className="p-4 text-center text-muted-foreground">
                {loadingSuggestionsText}
              </div>
            )}

            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="border-b">
                <div className="p-3 text-sm font-medium text-muted-foreground bg-muted/50">
                  {suggestionsTitleText}
                </div>
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    onClick={() => handleSuggestionClick(suggestion)}
                    className="w-full text-left px-4 py-2 hover:bg-muted/50 transition-colors flex items-center space-x-2"
                  >
                    <Search className="w-4 h-4 text-muted-foreground" />
                    <span>{suggestion}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Searches */}
            {recentSearches.length > 0 && !query && (
              <div className="border-b">
                <div className="p-3 text-sm font-medium text-muted-foreground bg-muted/50 flex items-center justify-between">
                  <span>{recentSearchesTitleText}</span>
                  <button
                    onClick={clearRecentSearches}
                    className="text-xs text-primary hover:underline"
                  >
                    {clearRecentSearchesText}
                  </button>
                </div>
                {recentSearches.map((search, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between px-4 py-2 hover:bg-muted/50 transition-colors group"
                  >
                    <button
                      onClick={() => handleSuggestionClick(search)}
                      className="flex items-center space-x-2 flex-1 text-left"
                    >
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{search}</span>
                    </button>
                    <button
                      onClick={() => removeRecentSearch(search)}
                      className="opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-muted rounded"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Trending */}
            {trending.length > 0 && !query && (
              <div>
                <div className="p-3 text-sm font-medium text-muted-foreground bg-muted/50 flex items-center space-x-2">
                  <TrendingUp className="w-4 h-4" />
                  <span>{trendingTitleText}</span>
                </div>
                <div className="p-4">
                  <div className="flex flex-wrap gap-2">
                    {trending.map((trend, index) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
                        onClick={() => handleSuggestionClick(trend)}
                      >
                        {trend}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* No results */}
            {!loading && query && suggestions.length === 0 && (
              <div className="p-4 text-center text-muted-foreground">
                {noSuggestionsText}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
