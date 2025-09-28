import { ReportTemplate } from './index';
import { monthlyFinancialTemplate } from './monthly-financial-template';
import { taxPreparationTemplate } from './tax-preparation-template';
import { advisoryReportsTemplate } from './advisory-reports-template';

export interface TemplateCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  templates: ReportTemplate[];
}

export class TemplateRegistry {
  private static instance: TemplateRegistry;
  private templates: Map<string, ReportTemplate> = new Map();
  private categories: Map<string, TemplateCategory> = new Map();

  private constructor() {
    this.initializeTemplates();
  }

  public static getInstance(): TemplateRegistry {
    if (!TemplateRegistry.instance) {
      TemplateRegistry.instance = new TemplateRegistry();
    }
    return TemplateRegistry.instance;
  }

  private initializeTemplates(): void {
    // Register system templates
    this.registerTemplate(monthlyFinancialTemplate);
    this.registerTemplate(taxPreparationTemplate);
    this.registerTemplate(advisoryReportsTemplate);

    // Initialize categories
    this.initializeCategories();
  }

  private initializeCategories(): void {
    const categories: TemplateCategory[] = [
      {
        id: 'monthly_financial',
        name: 'Monthly Financial Reports',
        description: 'Comprehensive monthly financial reporting packages',
        icon: 'BarChart3',
        templates: this.getTemplatesByCategory('monthly_financial'),
      },
      {
        id: 'tax_preparation',
        name: 'Tax Preparation',
        description: 'Tax preparation documents and organizers',
        icon: 'Calculator',
        templates: this.getTemplatesByCategory('tax_preparation'),
      },
      {
        id: 'advisory',
        name: 'Advisory Reports',
        description: 'Strategic business advisory and consulting reports',
        icon: 'TrendingUp',
        templates: this.getTemplatesByCategory('advisory'),
      },
      {
        id: 'custom',
        name: 'Custom Reports',
        description: 'Custom and organization-specific report templates',
        icon: 'Settings',
        templates: this.getTemplatesByCategory('custom'),
      },
    ];

    categories.forEach(category => {
      this.categories.set(category.id, category);
    });
  }

  public registerTemplate(template: ReportTemplate): void {
    this.templates.set(template.id, template);
  }

  public getTemplate(id: string): ReportTemplate | undefined {
    return this.templates.get(id);
  }

  public getAllTemplates(): ReportTemplate[] {
    return Array.from(this.templates.values());
  }

  public getTemplatesByCategory(category: string): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.category === category
    );
  }

  public getCategories(): TemplateCategory[] {
    return Array.from(this.categories.values());
  }

  public getCategory(id: string): TemplateCategory | undefined {
    return this.categories.get(id);
  }

  public searchTemplates(query: string): ReportTemplate[] {
    const searchTerm = query.toLowerCase();
    return Array.from(this.templates.values()).filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.type.toLowerCase().includes(searchTerm)
    );
  }

  public getTemplatesByType(type: string): ReportTemplate[] {
    return Array.from(this.templates.values()).filter(
      template => template.type === type
    );
  }

  public validateTemplate(template: ReportTemplate): {
    isValid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Basic validation
    if (!template.id) errors.push('Template ID is required');
    if (!template.name) errors.push('Template name is required');
    if (!template.category) errors.push('Template category is required');
    if (!template.type) errors.push('Template type is required');
    if (!template.sections || template.sections.length === 0) {
      errors.push('Template must have at least one section');
    }

    // Section validation
    template.sections?.forEach((section, index) => {
      if (!section.id) errors.push(`Section ${index + 1} missing ID`);
      if (!section.name) errors.push(`Section ${index + 1} missing name`);
      if (!section.type) errors.push(`Section ${index + 1} missing type`);
      if (section.order < 0) errors.push(`Section ${index + 1} invalid order`);
    });

    // Data requirements validation
    const requiredDataSources = template.dataRequirements?.filter(req => req.required);
    if (requiredDataSources && requiredDataSources.length === 0) {
      errors.push('Template must have at least one required data source');
    }

    // Layout validation
    if (!template.layout) {
      errors.push('Template layout configuration is required');
    } else {
      if (!template.layout.pageSize) errors.push('Page size is required');
      if (!template.layout.orientation) errors.push('Page orientation is required');
      if (!template.layout.margins) errors.push('Page margins are required');
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }

  public cloneTemplate(templateId: string, newId: string, newName: string): ReportTemplate | null {
    const originalTemplate = this.getTemplate(templateId);
    if (!originalTemplate) return null;

    const clonedTemplate: ReportTemplate = {
      ...originalTemplate,
      id: newId,
      name: newName,
      version: '1.0.0',
      category: 'custom',
    };

    this.registerTemplate(clonedTemplate);
    return clonedTemplate;
  }

  public getTemplatePreview(templateId: string): {
    sections: string[];
    estimatedPages: number;
    dataRequirements: string[];
    chartCount: number;
  } | null {
    const template = this.getTemplate(templateId);
    if (!template) return null;

    return {
      sections: template.sections.map(section => section.name),
      estimatedPages: Math.ceil(template.sections.length / 3), // Rough estimate
      dataRequirements: template.dataRequirements.map(req => req.entity),
      chartCount: template.chartConfigs?.length || 0,
    };
  }

  public getCompatibleDataSources(templateId: string): string[] {
    const template = this.getTemplate(templateId);
    if (!template) return [];

    const sources = new Set<string>();
    template.dataRequirements.forEach(req => {
      sources.add(req.source);
    });

    return Array.from(sources);
  }

  public updateTemplate(templateId: string, updates: Partial<ReportTemplate>): boolean {
    const template = this.getTemplate(templateId);
    if (!template) return false;

    const updatedTemplate = { ...template, ...updates };
    const validation = this.validateTemplate(updatedTemplate);

    if (!validation.isValid) {
      console.error('Template validation failed:', validation.errors);
      return false;
    }

    this.registerTemplate(updatedTemplate);
    return true;
  }

  public removeTemplate(templateId: string): boolean {
    return this.templates.delete(templateId);
  }

  public getTemplateStatistics(): {
    totalTemplates: number;
    templatesByCategory: Record<string, number>;
    templatesByType: Record<string, number>;
    mostUsedSections: string[];
  } {
    const templates = this.getAllTemplates();

    const templatesByCategory: Record<string, number> = {};
    const templatesByType: Record<string, number> = {};
    const sectionCounts: Record<string, number> = {};

    templates.forEach(template => {
      // Count by category
      templatesByCategory[template.category] = (templatesByCategory[template.category] || 0) + 1;

      // Count by type
      templatesByType[template.type] = (templatesByType[template.type] || 0) + 1;

      // Count sections
      template.sections.forEach(section => {
        sectionCounts[section.type] = (sectionCounts[section.type] || 0) + 1;
      });
    });

    const mostUsedSections = Object.entries(sectionCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([section]) => section);

    return {
      totalTemplates: templates.length,
      templatesByCategory,
      templatesByType,
      mostUsedSections,
    };
  }
}

// Export singleton instance
export const templateRegistry = TemplateRegistry.getInstance();

// Export individual templates for direct access
export {
  monthlyFinancialTemplate,
  taxPreparationTemplate,
  advisoryReportsTemplate,
};