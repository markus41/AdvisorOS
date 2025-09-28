// AI Components - Comprehensive AI-powered user interface components
export { InsightsPanel } from './InsightsPanel';
export { SuggestionCard } from './SuggestionCard';
export { AIAssistantChat } from './AIAssistantChat';
export { DocumentAnalysisResults } from './DocumentAnalysisResults';
export { NarrativeGenerator } from './NarrativeGenerator';

// Re-export types for convenience
export type {
  // InsightsPanel types
  Insight,
  MetricCard,
  InsightsPanelProps,
} from './InsightsPanel';

export type {
  // SuggestionCard types
  Suggestion,
  SuggestionAction,
  SuggestionMetric,
  SuggestionCardProps,
} from './SuggestionCard';

export type {
  // AIAssistantChat types
  Message,
  ChatContext,
  AIAssistantChatProps,
} from './AIAssistantChat';

export type {
  // DocumentAnalysisResults types
  DocumentAnalysisResult,
  DocumentAnalysisResultsProps,
} from './DocumentAnalysisResults';

export type {
  // NarrativeGenerator types
  NarrativeSection,
  GenerationOptions,
  NarrativeData,
  NarrativeGeneratorProps,
} from './NarrativeGenerator';