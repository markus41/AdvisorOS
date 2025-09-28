'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Send,
  Wand2,
  Copy,
  Save,
  RefreshCw,
  User,
  Mail,
  Calendar,
  Paperclip,
  MessageSquare,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  body: string;
  tone: string;
  category: string;
  variables: string[];
}

interface EmailDraft {
  subject: string;
  body: string;
  tone: 'professional' | 'friendly' | 'formal' | 'casual' | 'urgent';
  estimatedReadTime: number;
  keyPoints: string[];
  attachmentSuggestions: string[];
  followUpActions: string[];
  metadata: {
    template: string;
    generatedAt: Date;
    wordCount: number;
    sentiment: string;
  };
}

interface EmailComposerProps {
  clientName?: string;
  clientEmail?: string;
  templates?: EmailTemplate[];
  onSend: (email: {
    to: string;
    subject: string;
    body: string;
    attachments?: string[];
  }) => void;
  onSaveDraft?: (draft: EmailDraft) => void;
  isLoading?: boolean;
}

export const EmailComposer: React.FC<EmailComposerProps> = ({
  clientName = '',
  clientEmail = '',
  templates = [],
  onSend,
  onSaveDraft,
  isLoading = false
}) => {
  const [activeTab, setActiveTab] = useState('compose');
  const [formData, setFormData] = useState({
    to: clientEmail,
    subject: '',
    body: '',
    tone: 'professional' as const,
    purpose: '',
    keyPoints: [] as string[],
    attachments: [] as string[]
  });
  const [currentKeyPoint, setCurrentKeyPoint] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState('');
  const [aiSuggestions, setAiSuggestions] = useState<EmailDraft | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const toneOptions = [
    { value: 'professional', label: 'Professional', description: 'Standard business communication' },
    { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
    { value: 'formal', label: 'Formal', description: 'Very professional and structured' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
    { value: 'urgent', label: 'Urgent', description: 'Conveys importance and urgency' }
  ];

  const purposeOptions = [
    'Meeting request',
    'Document request',
    'Status update',
    'Invoice follow-up',
    'Tax deadline reminder',
    'Service introduction',
    'Year-end planning',
    'Compliance notification',
    'General inquiry',
    'Other'
  ];

  useEffect(() => {
    if (clientEmail && clientEmail !== formData.to) {
      setFormData(prev => ({ ...prev, to: clientEmail }));
    }
  }, [clientEmail]);

  const handleAddKeyPoint = () => {
    if (currentKeyPoint.trim()) {
      setFormData(prev => ({
        ...prev,
        keyPoints: [...prev.keyPoints, currentKeyPoint.trim()]
      }));
      setCurrentKeyPoint('');
    }
  };

  const handleRemoveKeyPoint = (index: number) => {
    setFormData(prev => ({
      ...prev,
      keyPoints: prev.keyPoints.filter((_, i) => i !== index)
    }));
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setFormData(prev => ({
        ...prev,
        subject: template.subject,
        body: template.body,
        tone: template.tone as any
      }));
      setSelectedTemplate(templateId);
    }
  };

  const handleGenerateAIDraft = async () => {
    if (!formData.purpose && formData.keyPoints.length === 0) {
      return;
    }

    setIsGenerating(true);
    try {
      const response = await fetch('/api/ai/draft-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName,
          purpose: formData.purpose,
          keyPoints: formData.keyPoints,
          tone: formData.tone,
          templateId: selectedTemplate
        })
      });

      if (response.ok) {
        const draft = await response.json();
        setAiSuggestions(draft.data);
        setActiveTab('ai-suggestions');
      }
    } catch (error) {
      console.error('Failed to generate AI draft:', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAcceptAISuggestion = () => {
    if (aiSuggestions) {
      setFormData(prev => ({
        ...prev,
        subject: aiSuggestions.subject,
        body: aiSuggestions.body
      }));
      setActiveTab('compose');
    }
  };

  const handleSend = () => {
    if (formData.to && formData.subject && formData.body) {
      onSend({
        to: formData.to,
        subject: formData.subject,
        body: formData.body,
        attachments: formData.attachments
      });
    }
  };

  const handleSaveDraft = () => {
    if (onSaveDraft && aiSuggestions) {
      onSaveDraft(aiSuggestions);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  const getWordCount = (text: string) => {
    return text.trim().split(/\s+/).length;
  };

  const getEstimatedReadTime = (text: string) => {
    const wordCount = getWordCount(text);
    return Math.ceil(wordCount / 200); // Average reading speed
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            AI Email Composer
          </CardTitle>
          <p className="text-sm text-gray-600">
            Compose professional emails with AI assistance
          </p>
        </CardHeader>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="compose">Compose</TabsTrigger>
          <TabsTrigger value="ai-suggestions">AI Suggestions</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
        </TabsList>

        <TabsContent value="compose" className="space-y-4">
          {/* Email Form */}
          <Card>
            <CardHeader>
              <CardTitle>Email Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="to">To</Label>
                  <Input
                    id="to"
                    type="email"
                    value={formData.to}
                    onChange={(e) => setFormData(prev => ({ ...prev, to: e.target.value }))}
                    placeholder="client@example.com"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select
                    value={formData.tone}
                    onValueChange={(value) => setFormData(prev => ({ ...prev, tone: value as any }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {toneOptions.map(tone => (
                        <SelectItem key={tone.value} value={tone.value}>
                          <div>
                            <div className="font-medium">{tone.label}</div>
                            <div className="text-xs text-gray-500">{tone.description}</div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="purpose">Purpose (for AI assistance)</Label>
                <Select
                  value={formData.purpose}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, purpose: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select email purpose" />
                  </SelectTrigger>
                  <SelectContent>
                    {purposeOptions.map(purpose => (
                      <SelectItem key={purpose} value={purpose}>
                        {purpose}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Key Points to Cover</Label>
                <div className="flex gap-2">
                  <Input
                    value={currentKeyPoint}
                    onChange={(e) => setCurrentKeyPoint(e.target.value)}
                    placeholder="Add a key point"
                    onKeyPress={(e) => e.key === 'Enter' && handleAddKeyPoint()}
                  />
                  <Button onClick={handleAddKeyPoint}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.keyPoints.map((point, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => handleRemoveKeyPoint(index)}
                    >
                      {point} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleGenerateAIDraft}
                  disabled={isGenerating || (!formData.purpose && formData.keyPoints.length === 0)}
                  className="gap-2"
                >
                  <Wand2 className={`h-4 w-4 ${isGenerating ? 'animate-spin' : ''}`} />
                  Generate AI Draft
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Email Content */}
          <Card>
            <CardHeader>
              <CardTitle>Email Content</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="subject">Subject</Label>
                <Input
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Email subject"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="body">Message</Label>
                <Textarea
                  id="body"
                  value={formData.body}
                  onChange={(e) => setFormData(prev => ({ ...prev, body: e.target.value }))}
                  placeholder="Type your message here..."
                  rows={12}
                />
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{getWordCount(formData.body)} words</span>
                  <span>~{getEstimatedReadTime(formData.body)} min read</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  onClick={handleSend}
                  disabled={!formData.to || !formData.subject || !formData.body || isLoading}
                  className="gap-2"
                >
                  <Send className="h-4 w-4" />
                  Send Email
                </Button>
                <Button variant="outline" onClick={handleSaveDraft} className="gap-2">
                  <Save className="h-4 w-4" />
                  Save Draft
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="ai-suggestions" className="space-y-4">
          {aiSuggestions ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  AI Generated Draft
                </CardTitle>
                <div className="flex items-center gap-4 text-sm text-gray-600">
                  <span>Tone: {aiSuggestions.tone}</span>
                  <span>Words: {aiSuggestions.metadata.wordCount}</span>
                  <span>Read time: {aiSuggestions.estimatedReadTime} min</span>
                  <span>Sentiment: {aiSuggestions.metadata.sentiment}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Subject</Label>
                  <div className="flex items-center gap-2">
                    <Input value={aiSuggestions.subject} readOnly />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(aiSuggestions.subject)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Message</Label>
                  <div className="relative">
                    <Textarea
                      value={aiSuggestions.body}
                      readOnly
                      rows={12}
                      className="pr-12"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={() => copyToClipboard(aiSuggestions.body)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {aiSuggestions.keyPoints.length > 0 && (
                  <div className="space-y-2">
                    <Label>Key Points Covered</Label>
                    <div className="flex flex-wrap gap-2">
                      {aiSuggestions.keyPoints.map((point, index) => (
                        <Badge key={index} variant="outline">
                          <CheckCircle className="h-3 w-3 mr-1" />
                          {point}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {aiSuggestions.attachmentSuggestions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Suggested Attachments</Label>
                    <div className="space-y-1">
                      {aiSuggestions.attachmentSuggestions.map((attachment, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Paperclip className="h-4 w-4 text-gray-500" />
                          {attachment}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {aiSuggestions.followUpActions.length > 0 && (
                  <div className="space-y-2">
                    <Label>Follow-up Actions</Label>
                    <div className="space-y-1">
                      {aiSuggestions.followUpActions.map((action, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Clock className="h-4 w-4 text-gray-500" />
                          {action}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <Button onClick={handleAcceptAISuggestion} className="gap-2">
                    <CheckCircle className="h-4 w-4" />
                    Use This Draft
                  </Button>
                  <Button variant="outline" onClick={handleGenerateAIDraft} className="gap-2">
                    <RefreshCw className="h-4 w-4" />
                    Regenerate
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <h3 className="text-lg font-medium mb-2">No AI suggestions yet</h3>
                <p className="text-gray-600 mb-4">
                  Fill in the email purpose and key points in the Compose tab, then generate an AI draft.
                </p>
                <Button onClick={() => setActiveTab('compose')}>
                  Go to Compose
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="templates" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map(template => (
              <Card key={template.id} className="cursor-pointer hover:bg-gray-50">
                <CardHeader onClick={() => handleTemplateSelect(template.id)}>
                  <CardTitle className="text-lg">{template.name}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{template.category}</Badge>
                    <Badge variant="secondary">{template.tone}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div>
                      <Label className="text-xs text-gray-500">Subject Preview</Label>
                      <p className="text-sm">{template.subject}</p>
                    </div>
                    <div>
                      <Label className="text-xs text-gray-500">Body Preview</Label>
                      <p className="text-sm text-gray-600 line-clamp-3">
                        {template.body.substring(0, 150)}...
                      </p>
                    </div>
                    {template.variables.length > 0 && (
                      <div>
                        <Label className="text-xs text-gray-500">Variables</Label>
                        <div className="flex flex-wrap gap-1">
                          {template.variables.map(variable => (
                            <Badge key={variable} variant="outline" className="text-xs">
                              {variable}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleTemplateSelect(template.id)}
                    className="w-full mt-3"
                    variant="outline"
                  >
                    Use Template
                  </Button>
                </CardContent>
              </Card>
            ))}

            {templates.length === 0 && (
              <Card className="col-span-2">
                <CardContent className="py-12 text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <h3 className="text-lg font-medium mb-2">No templates available</h3>
                  <p className="text-gray-600">
                    Email templates will help you compose emails faster with pre-written content.
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EmailComposer;