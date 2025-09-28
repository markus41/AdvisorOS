'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  FileText,
  User,
  Calendar,
  DollarSign,
  MessageSquare,
  Filter,
  Clock,
  Brain,
  Sparkles,
  X,
  ChevronRight
} from 'lucide-react';

interface SearchResult {
  id: string;
  type: 'document' | 'client' | 'transaction' | 'conversation' | 'insight';
  title: string;
  description: string;
  content: string;
  relevanceScore: number;
  metadata: {
    date?: Date;
    client?: string;
    category?: string;
    amount?: number;
    tags?: string[];
  };
  highlights: string[];
}

interface SearchFilter {
  type: 'all' | 'document' | 'client' | 'transaction' | 'conversation' | 'insight';
  dateRange?: {
    start: Date;
    end: Date;
  };
  clients?: string[];
  categories?: string[];
}

interface SmartSearchProps {
  onResultSelect?: (result: SearchResult) => void;
  className?: string;
}

export const SmartSearch: React.FC<SmartSearchProps> = ({
  onResultSelect,
  className
}) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<SearchFilter>({ type: 'all' });
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  const searchExamples = [
    'Show me all W-2 forms from 2023',
    'Find invoices over $10,000',
    'Tax returns for ABC Corp',
    'Communication with John Smith',
    'Overdue payments',
    'Compliance documents',
    'Year-end planning materials'
  ];

  const typeFilters = [
    { value: 'all', label: 'All Results', icon: Search },
    { value: 'document', label: 'Documents', icon: FileText },
    { value: 'client', label: 'Clients', icon: User },
    { value: 'transaction', label: 'Transactions', icon: DollarSign },
    { value: 'conversation', label: 'Communications', icon: MessageSquare },
    { value: 'insight', label: 'AI Insights', icon: Brain }
  ];

  useEffect(() => {
    if (query.trim().length > 2) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }

      searchTimeoutRef.current = setTimeout(() => {
        performSearch(query);
      }, 300);
    } else {
      setResults([]);
      setSuggestions([]);
    }

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, filters]);

  const performSearch = async (searchQuery: string) => {
    setIsSearching(true);
    try {
      const response = await fetch('/api/ai/smart-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery,
          filters,
          semantic: true
        })
      });

      if (response.ok) {
        const data = await response.json();
        setResults(data.results || []);
        setSuggestions(data.suggestions || []);

        // Add to recent searches
        setRecentSearches(prev => {
          const updated = [searchQuery, ...prev.filter(s => s !== searchQuery)];
          return updated.slice(0, 5);
        });
      }
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleResultClick = (result: SearchResult) => {
    onResultSelect?.(result);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
  };

  const handleExampleClick = (example: string) => {
    setQuery(example);
  };

  const getTypeIcon = (type: SearchResult['type']) => {
    switch (type) {
      case 'document':
        return <FileText className="h-4 w-4" />;
      case 'client':
        return <User className="h-4 w-4" />;
      case 'transaction':
        return <DollarSign className="h-4 w-4" />;
      case 'conversation':
        return <MessageSquare className="h-4 w-4" />;
      case 'insight':
        return <Brain className="h-4 w-4" />;
      default:
        return <Search className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: SearchResult['type']) => {
    switch (type) {
      case 'document':
        return 'bg-blue-100 text-blue-800';
      case 'client':
        return 'bg-green-100 text-green-800';
      case 'transaction':
        return 'bg-purple-100 text-purple-800';
      case 'conversation':
        return 'bg-orange-100 text-orange-800';
      case 'insight':
        return 'bg-pink-100 text-pink-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const highlightText = (text: string, highlights: string[]) => {
    if (!highlights.length) return text;

    let highlightedText = text;
    highlights.forEach(highlight => {
      const regex = new RegExp(`(${highlight})`, 'gi');
      highlightedText = highlightedText.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
    });

    return <span dangerouslySetInnerHTML={{ __html: highlightedText }} />;
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Smart Search
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search documents, clients, transactions..."
              className="pl-10 pr-12"
            />
            {query && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setQuery('')}
                className="absolute right-1 top-1/2 transform -translate-y-1/2 h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>

          {isSearching && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
            </div>
          )}
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
          </Button>

          <div className="flex flex-wrap gap-2">
            {typeFilters.slice(0, 4).map(filter => {
              const Icon = filter.icon;
              return (
                <Button
                  key={filter.value}
                  variant={filters.type === filter.value ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilters(prev => ({ ...prev, type: filter.value as any }))}
                  className="gap-1"
                >
                  <Icon className="h-3 w-3" />
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Search Results */}
        {query.trim().length > 2 && (
          <div className="space-y-4">
            {/* AI Suggestions */}
            {suggestions.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Sparkles className="h-4 w-4 text-purple-500" />
                  AI Suggestions
                </div>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-purple-50"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      {suggestion}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Search Results */}
            {results.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {results.length} results found
                  </span>
                  <span className="text-xs text-gray-500">
                    Sorted by relevance
                  </span>
                </div>

                <ScrollArea className="h-96">
                  <div className="space-y-3">
                    {results.map((result, index) => (
                      <Card
                        key={result.id}
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => handleResultClick(result)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-start gap-3 flex-1">
                              <div className={`p-2 rounded-lg ${getTypeColor(result.type)}`}>
                                {getTypeIcon(result.type)}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium text-sm truncate">
                                    {highlightText(result.title, result.highlights)}
                                  </h4>
                                  <Badge variant="outline" className="text-xs">
                                    {(result.relevanceScore * 100).toFixed(0)}% match
                                  </Badge>
                                </div>

                                <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                                  {highlightText(result.description, result.highlights)}
                                </p>

                                <div className="flex items-center gap-4 text-xs text-gray-500">
                                  {result.metadata.date && (
                                    <div className="flex items-center gap-1">
                                      <Calendar className="h-3 w-3" />
                                      {result.metadata.date.toLocaleDateString()}
                                    </div>
                                  )}
                                  {result.metadata.client && (
                                    <div className="flex items-center gap-1">
                                      <User className="h-3 w-3" />
                                      {result.metadata.client}
                                    </div>
                                  )}
                                  {result.metadata.amount && (
                                    <div className="flex items-center gap-1">
                                      <DollarSign className="h-3 w-3" />
                                      ${result.metadata.amount.toLocaleString()}
                                    </div>
                                  )}
                                </div>

                                {result.metadata.tags && result.metadata.tags.length > 0 && (
                                  <div className="flex flex-wrap gap-1 mt-2">
                                    {result.metadata.tags.slice(0, 3).map(tag => (
                                      <Badge key={tag} variant="secondary" className="text-xs">
                                        {tag}
                                      </Badge>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <ChevronRight className="h-4 w-4 text-gray-400 flex-shrink-0" />
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </div>
            )}

            {/* No Results */}
            {!isSearching && query.trim().length > 2 && results.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No results found</h3>
                <p className="text-gray-600 mb-4">
                  Try adjusting your search terms or filters
                </p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {suggestions.length > 0 ? suggestions.slice(0, 3).map((suggestion, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      Try: {suggestion}
                    </Badge>
                  )) : searchExamples.slice(0, 3).map((example, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer"
                      onClick={() => handleExampleClick(example)}
                    >
                      {example}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!query.trim() && (
          <div className="space-y-4">
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Clock className="h-4 w-4 text-gray-500" />
                  Recent Searches
                </div>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map((search, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-gray-50"
                      onClick={() => setQuery(search)}
                    >
                      {search}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Search Examples */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm font-medium">
                <Sparkles className="h-4 w-4 text-purple-500" />
                Try These Searches
              </div>
              <div className="grid grid-cols-1 gap-2">
                {searchExamples.map((example, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    size="sm"
                    onClick={() => handleExampleClick(example)}
                    className="justify-start text-left h-auto p-2"
                  >
                    <Search className="h-3 w-3 mr-2 text-gray-400 flex-shrink-0" />
                    <span className="text-sm">{example}</span>
                  </Button>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default SmartSearch;