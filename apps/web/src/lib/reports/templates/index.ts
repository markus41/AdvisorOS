// Report Templates Engine
export * from './monthly-financial-template';
export * from './tax-preparation-template';
export * from './advisory-reports-template';
export * from './template-registry';

export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  category: 'monthly_financial' | 'tax_preparation' | 'advisory' | 'custom';
  type: string;
  version: string;
  sections: ReportSection[];
  dataRequirements: DataRequirement[];
  chartConfigs?: ChartConfig[];
  brandingOptions?: BrandingOptions;
  layout: TemplateLayout;
}

export interface ReportSection {
  id: string;
  name: string;
  type: 'text' | 'table' | 'chart' | 'image' | 'financial_statement' | 'narrative';
  required: boolean;
  order: number;
  config: Record<string, any>;
  dataSource?: string;
}

export interface DataRequirement {
  source: 'quickbooks' | 'database' | 'manual' | 'calculated';
  entity: string;
  fields: string[];
  filters?: Record<string, any>;
  required: boolean;
}

export interface ChartConfig {
  id: string;
  type: 'line' | 'bar' | 'pie' | 'area' | 'gauge' | 'heatmap';
  title: string;
  dataSource: string;
  xAxis?: string;
  yAxis?: string;
  series?: string[];
  colors?: string[];
  options?: Record<string, any>;
}

export interface BrandingOptions {
  logo?: {
    enabled: boolean;
    position: 'header' | 'footer' | 'cover';
    size: 'small' | 'medium' | 'large';
  };
  colors?: {
    primary: string;
    secondary: string;
    accent: string;
    text: string;
  };
  fonts?: {
    heading: string;
    body: string;
    size: 'small' | 'medium' | 'large';
  };
  layout?: {
    margins: number;
    spacing: number;
    columnCount: number;
  };
}

export interface TemplateLayout {
  pageSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  header?: {
    enabled: boolean;
    height: number;
    content: string;
  };
  footer?: {
    enabled: boolean;
    height: number;
    content: string;
  };
  coverPage?: {
    enabled: boolean;
    template: string;
  };
  tableOfContents?: {
    enabled: boolean;
    depth: number;
  };
}