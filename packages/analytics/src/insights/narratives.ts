/**
 * Narrative Generation Module
 * Provides templates and functions for generating narrative insights
 */

export interface NarrativeTemplate {
  pattern: string;
  template: string;
  variables: string[];
}

export const narrativeTemplates: Record<string, NarrativeTemplate> = {
  financial_health: {
    pattern: 'financial_health',
    template: 'Financial health analysis shows {metrics} with {trend} trend.',
    variables: ['metrics', 'trend']
  },
  variance_analysis: {
    pattern: 'variance_analysis',
    template: 'Budget variance analysis reveals {variance}% difference from planned values.',
    variables: ['variance']
  },
  trend_analysis: {
    pattern: 'trend_analysis',
    template: '{metric} shows a {direction} trend with {confidence}% confidence.',
    variables: ['metric', 'direction', 'confidence']
  }
};

export function generateNarrative(template: NarrativeTemplate, variables: Record<string, any>): string {
  let narrative = template.template;

  template.variables.forEach(variable => {
    const value = variables[variable];
    narrative = narrative.replace(`{${variable}}`, value?.toString() || '');
  });

  return narrative;
}