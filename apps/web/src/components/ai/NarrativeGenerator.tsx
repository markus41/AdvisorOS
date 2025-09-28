'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import {
  FileText,
  Wand2,
  Download,
  Copy,
  RefreshCw,
  Edit,
  Save,
  Eye,
  Settings,
  MessageSquare,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Users,
  Calendar,
  Target
} from 'lucide-react';

interface NarrativeSection {
  id: string;
  title: string;
  content: string;
  type: 'executive_summary' | 'performance' | 'analysis' | 'recommendations' | 'outlook' | 'custom';
  confidence: number;
  wordCount: number;
  editable: boolean;
}

interface GenerationOptions {
  style: 'executive' | 'technical' | 'client_friendly' | 'board_presentation';
  tone: 'formal' | 'professional' | 'conversational' | 'analytical';
  length: 'brief' | 'standard' | 'detailed' | 'comprehensive';
  audience: 'executives' | 'managers' | 'clients' | 'board' | 'technical';
  focus: 'performance' | 'risks' | 'opportunities' | 'compliance' | 'strategic';
  includeCharts: boolean;
  includeRecommendations: boolean;
  includeMetrics: boolean;
}

interface NarrativeData {
  financialData: any;
  benchmarkData?: any;
  priorPeriodData?: any;
  keyMetrics: any[];
  insights: any[];
  clientProfile?: any;
}

interface NarrativeGeneratorProps {
  data: NarrativeData;
  onGenerate?: (sections: NarrativeSection[], options: GenerationOptions) => void;
  onExport?: (format: 'pdf' | 'docx' | 'html') => void;
  onSave?: (sections: NarrativeSection[]) => void;
  initialSections?: NarrativeSection[];
  loading?: boolean;
  className?: string;
}

const DEFAULT_OPTIONS: GenerationOptions = {
  style: 'professional',
  tone: 'professional',
  length: 'standard',
  audience: 'clients',
  focus: 'performance',
  includeCharts: true,
  includeRecommendations: true,
  includeMetrics: true,
};

const SECTION_TEMPLATES = [
  {
    id: 'executive_summary',
    title: 'Executive Summary',
    description: 'High-level overview of key findings and recommendations',
    icon: MessageSquare,
  },
  {
    id: 'performance',
    title: 'Performance Analysis',
    description: 'Detailed analysis of financial performance and metrics',
    icon: TrendingUp,
  },
  {
    id: 'analysis',
    title: 'Variance Analysis',
    description: 'Analysis of variances from budget and prior periods',
    icon: Target,
  },
  {
    id: 'recommendations',
    title: 'Recommendations',
    description: 'Strategic recommendations and action items',
    icon: CheckCircle,
  },
  {
    id: 'outlook',
    title: 'Business Outlook',
    description: 'Future outlook and strategic considerations',
    icon: Calendar,
  },
];

export function NarrativeGenerator({
  data,
  onGenerate,
  onExport,
  onSave,
  initialSections = [],
  loading = false,
  className
}: NarrativeGeneratorProps) {
  const [sections, setSections] = useState<NarrativeSection[]>(initialSections);
  const [options, setOptions] = useState<GenerationOptions>(DEFAULT_OPTIONS);
  const [activeTab, setActiveTab] = useState('generate');
  const [editingSection, setEditingSection] = useState<string | null>(null);
  const [selectedSections, setSelectedSections] = useState<string[]>(['executive_summary', 'performance']);

  const handleGenerate = () => {
    if (!onGenerate) return;

    const generatedSections: NarrativeSection[] = selectedSections.map((sectionId) => {
      const template = SECTION_TEMPLATES.find(t => t.id === sectionId);
      const existingSection = sections.find(s => s.id === sectionId);

      return {
        id: sectionId,
        title: template?.title || 'Custom Section',
        content: existingSection?.content || generatePlaceholderContent(sectionId, options),
        type: sectionId as any,
        confidence: 0.85,
        wordCount: 0,
        editable: true,
      };
    });

    setSections(generatedSections);
    onGenerate(generatedSections, options);
  };

  const generatePlaceholderContent = (sectionId: string, opts: GenerationOptions): string => {
    // This would be replaced with actual AI-generated content
    switch (sectionId) {
      case 'executive_summary':
        return `This executive summary provides a comprehensive overview of the financial performance for the period. Key highlights include strong revenue growth, improved operational efficiency, and strategic positioning for future expansion. The analysis reveals several opportunities for optimization and risk mitigation that should be prioritized in the coming quarter.`;

      case 'performance':
        return `The financial performance analysis reveals significant trends in key metrics. Revenue growth of 15% year-over-year demonstrates strong market traction, while maintaining healthy profit margins. Operating expenses have been well-controlled, resulting in improved operational efficiency ratios compared to industry benchmarks.`;

      case 'analysis':
        return `Variance analysis shows favorable performance against budget in most key areas. Revenue exceeded projections by 8%, driven primarily by strong performance in core business segments. Operating expenses came in 3% under budget due to effective cost management initiatives implemented during the quarter.`;

      case 'recommendations':
        return `Based on the financial analysis, we recommend the following strategic actions: 1) Increase investment in high-performing business segments, 2) Implement additional cost optimization measures in underperforming areas, 3) Strengthen cash flow management processes, and 4) Consider strategic partnerships to accelerate growth.`;

      case 'outlook':
        return `The business outlook remains positive with several growth catalysts identified. Market conditions are favorable for continued expansion, and the company is well-positioned to capitalize on emerging opportunities. Key focus areas include technology investment, talent acquisition, and market penetration strategies.`;

      default:
        return 'Content will be generated based on your selected options and available data.';
    }
  };

  const handleSectionEdit = (sectionId: string, content: string) => {
    setSections(prev => prev.map(section =>
      section.id === sectionId
        ? { ...section, content, wordCount: content.split(' ').length }
        : section
    ));
  };

  const handleSave = () => {
    onSave?.(sections);
  };

  const copySection = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const getTotalWordCount = () => {
    return sections.reduce((total, section) => total + section.wordCount, 0);
  };

  const getAverageConfidence = () => {
    if (sections.length === 0) return 0;
    return sections.reduce((total, section) => total + section.confidence, 0) / sections.length;
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">AI Narrative Generator</h2>
          <p className="text-gray-600">Generate professional financial narratives using AI</p>
        </div>

        <div className="flex items-center gap-2">
          {sections.length > 0 && onSave && (
            <Button variant="outline" size="sm" onClick={handleSave} className="gap-2">
              <Save className="h-4 w-4" />
              Save Draft
            </Button>
          )}

          {sections.length > 0 && onExport && (
            <div className="flex items-center gap-1">
              <Button variant="outline" size="sm" onClick={() => onExport('pdf')} className="gap-2">
                <Download className="h-4 w-4" />
                PDF
              </Button>
              <Button variant="outline" size="sm" onClick={() => onExport('docx')} className="gap-2">
                <Download className="h-4 w-4" />
                Word
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Stats */}
      {sections.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Sections</p>
                  <p className="text-lg font-semibold">{sections.length}</p>
                </div>
                <FileText className="h-5 w-5 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Word Count</p>
                  <p className="text-lg font-semibold">{getTotalWordCount()}</p>
                </div>
                <MessageSquare className="h-5 w-5 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg Confidence</p>
                  <p className="text-lg font-semibold">{Math.round(getAverageConfidence() * 100)}%</p>
                </div>
                <CheckCircle className="h-5 w-5 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Reading Time</p>
                  <p className="text-lg font-semibold">{Math.ceil(getTotalWordCount() / 200)} min</p>
                </div>
                <Eye className="h-5 w-5 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="generate">Generate</TabsTrigger>
          <TabsTrigger value="edit">Edit & Review</TabsTrigger>
          <TabsTrigger value="preview">Preview</TabsTrigger>
        </TabsList>

        {/* Generate Tab */}
        <TabsContent value="generate" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Generation Options */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Generation Options
                </CardTitle>
                <CardDescription>
                  Customize the style and content of your narrative
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="style">Writing Style</Label>
                    <Select value={options.style} onValueChange={(value: any) => setOptions(prev => ({ ...prev, style: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executive">Executive</SelectItem>
                        <SelectItem value="technical">Technical</SelectItem>
                        <SelectItem value="client_friendly">Client Friendly</SelectItem>
                        <SelectItem value="board_presentation">Board Presentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="tone">Tone</Label>
                    <Select value={options.tone} onValueChange={(value: any) => setOptions(prev => ({ ...prev, tone: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="conversational">Conversational</SelectItem>
                        <SelectItem value="analytical">Analytical</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="length">Length</Label>
                    <Select value={options.length} onValueChange={(value: any) => setOptions(prev => ({ ...prev, length: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brief">Brief</SelectItem>
                        <SelectItem value="standard">Standard</SelectItem>
                        <SelectItem value="detailed">Detailed</SelectItem>
                        <SelectItem value="comprehensive">Comprehensive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label htmlFor="audience">Audience</Label>
                    <Select value={options.audience} onValueChange={(value: any) => setOptions(prev => ({ ...prev, audience: value }))}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="executives">Executives</SelectItem>
                        <SelectItem value="managers">Managers</SelectItem>
                        <SelectItem value="clients">Clients</SelectItem>
                        <SelectItem value="board">Board of Directors</SelectItem>
                        <SelectItem value="technical">Technical Team</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="focus">Primary Focus</Label>
                  <Select value={options.focus} onValueChange={(value: any) => setOptions(prev => ({ ...prev, focus: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="performance">Performance Analysis</SelectItem>
                      <SelectItem value="risks">Risk Assessment</SelectItem>
                      <SelectItem value="opportunities">Growth Opportunities</SelectItem>
                      <SelectItem value="compliance">Compliance & Governance</SelectItem>
                      <SelectItem value="strategic">Strategic Planning</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-3">
                  <Label>Include in Narrative</Label>
                  <div className="space-y-2">
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.includeCharts}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeCharts: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Chart references</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.includeRecommendations}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeRecommendations: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Recommendations</span>
                    </label>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={options.includeMetrics}
                        onChange={(e) => setOptions(prev => ({ ...prev, includeMetrics: e.target.checked }))}
                        className="rounded"
                      />
                      <span className="text-sm">Key metrics</span>
                    </label>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Section Selection */}
            <Card>
              <CardHeader>
                <CardTitle>Sections to Generate</CardTitle>
                <CardDescription>
                  Select which sections to include in your narrative
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {SECTION_TEMPLATES.map((template) => (
                  <div key={template.id} className="flex items-start space-x-3 p-3 border rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedSections.includes(template.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedSections(prev => [...prev, template.id]);
                        } else {
                          setSelectedSections(prev => prev.filter(id => id !== template.id));
                        }
                      }}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <template.icon className="h-4 w-4" />
                        <span className="font-medium text-sm">{template.title}</span>
                      </div>
                      <p className="text-xs text-gray-600">{template.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Generate Button */}
          <div className="flex justify-center">
            <Button
              onClick={handleGenerate}
              disabled={loading || selectedSections.length === 0}
              className="gap-2 px-8"
              size="lg"
            >
              {loading ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Generate Narrative
                </>
              )}
            </Button>
          </div>
        </TabsContent>

        {/* Edit Tab */}
        <TabsContent value="edit" className="space-y-4">
          {sections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No narrative generated yet</h3>
                <p className="text-gray-600">Generate a narrative first to start editing.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sections.map((section) => (
                <Card key={section.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="flex items-center gap-2">
                        {section.title}
                        <Badge variant="outline" className="text-xs">
                          {section.wordCount} words
                        </Badge>
                      </CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500">
                          {Math.round(section.confidence * 100)}% confidence
                        </span>
                        <Progress value={section.confidence * 100} className="w-16 h-2" />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => copySection(section.content)}
                          className="gap-1"
                        >
                          <Copy className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setEditingSection(
                            editingSection === section.id ? null : section.id
                          )}
                          className="gap-1"
                        >
                          <Edit className="h-3 w-3" />
                          {editingSection === section.id ? 'Done' : 'Edit'}
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {editingSection === section.id ? (
                      <Textarea
                        value={section.content}
                        onChange={(e) => handleSectionEdit(section.id, e.target.value)}
                        className="min-h-32"
                        placeholder="Edit section content..."
                      />
                    ) : (
                      <div className="prose prose-sm max-w-none">
                        <p className="whitespace-pre-wrap">{section.content}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Preview Tab */}
        <TabsContent value="preview" className="space-y-4">
          {sections.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No content to preview</h3>
                <p className="text-gray-600">Generate a narrative to see the preview.</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Financial Report Narrative</CardTitle>
                <CardDescription>
                  Preview of the generated narrative in report format
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none space-y-6">
                  {sections.map((section) => (
                    <div key={section.id}>
                      <h3 className="text-lg font-semibold border-b pb-2 mb-3">
                        {section.title}
                      </h3>
                      <div className="whitespace-pre-wrap text-gray-700">
                        {section.content}
                      </div>
                    </div>
                  ))}

                  <div className="border-t pt-4 mt-8 text-xs text-gray-500">
                    <p>Generated by AI • {new Date().toLocaleDateString()} • {getTotalWordCount()} words</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}