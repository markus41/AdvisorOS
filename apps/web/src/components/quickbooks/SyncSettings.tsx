'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Settings, Save, AlertCircle, Info } from 'lucide-react';

interface EntityOption {
  id: string;
  name: string;
  description: string;
}

interface ConfigurationLimits {
  syncInterval: { min: number; max: number; unit: string };
  maxRetries: { min: number; max: number };
  retryDelay: { min: number; max: number; unit: string };
  fullSyncFrequency: { min: number; max: number; unit: string };
  maxRecordsPerSync: { min: number; max: number };
}

interface SyncConfiguration {
  enabledEntities: string[];
  syncInterval: number;
  maxRetries: number;
  retryDelay: number;
  fullSyncFrequency: number;
  maxRecordsPerSync: number;
  enableWebhooks: boolean;
}

interface ConfigurationData {
  availableEntities: EntityOption[];
  defaultConfiguration: SyncConfiguration;
  limits: ConfigurationLimits;
}

export function SyncSettings() {
  const [configData, setConfigData] = useState<ConfigurationData | null>(null);
  const [configuration, setConfiguration] = useState<SyncConfiguration | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const fetchConfiguration = async () => {
    try {
      const response = await fetch('/api/quickbooks/sync/configure');
      const data = await response.json();
      setConfigData(data);
      setConfiguration(data.defaultConfiguration);
    } catch (error) {
      console.error('Failed to fetch configuration:', error);
    } finally {
      setLoading(false);
    }
  };

  const saveConfiguration = async () => {
    if (!configuration) return;

    setSaving(true);
    setSaveMessage(null);

    try {
      const response = await fetch('/api/quickbooks/sync/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(configuration)
      });

      if (response.ok) {
        setSaveMessage({ type: 'success', message: 'Configuration saved successfully!' });
      } else {
        const error = await response.json();
        setSaveMessage({ type: 'error', message: error.error || 'Failed to save configuration' });
      }
    } catch (error) {
      console.error('Failed to save configuration:', error);
      setSaveMessage({ type: 'error', message: 'Failed to save configuration' });
    } finally {
      setSaving(false);
    }
  };

  const handleEntityToggle = (entityId: string, checked: boolean) => {
    if (!configuration) return;

    setConfiguration({
      ...configuration,
      enabledEntities: checked
        ? [...configuration.enabledEntities, entityId]
        : configuration.enabledEntities.filter(id => id !== entityId)
    });
  };

  const updateConfiguration = (key: keyof SyncConfiguration, value: any) => {
    if (!configuration) return;

    setConfiguration({
      ...configuration,
      [key]: value
    });
  };

  const validateInput = (key: keyof SyncConfiguration, value: number): boolean => {
    if (!configData?.limits) return true;

    switch (key) {
      case 'syncInterval':
        return value >= configData.limits.syncInterval.min && value <= configData.limits.syncInterval.max;
      case 'maxRetries':
        return value >= configData.limits.maxRetries.min && value <= configData.limits.maxRetries.max;
      case 'retryDelay':
        return value >= configData.limits.retryDelay.min && value <= configData.limits.retryDelay.max;
      case 'fullSyncFrequency':
        return value >= configData.limits.fullSyncFrequency.min && value <= configData.limits.fullSyncFrequency.max;
      case 'maxRecordsPerSync':
        return value >= configData.limits.maxRecordsPerSync.min && value <= configData.limits.maxRecordsPerSync.max;
      default:
        return true;
    }
  };

  useEffect(() => {
    fetchConfiguration();
  }, []);

  useEffect(() => {
    if (saveMessage) {
      const timer = setTimeout(() => setSaveMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [saveMessage]);

  if (loading || !configData || !configuration) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Loading Settings...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5" />
          Sync Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {saveMessage && (
          <Alert variant={saveMessage.type === 'error' ? 'destructive' : 'default'}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{saveMessage.message}</AlertDescription>
          </Alert>
        )}

        {/* Entity Selection */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Sync Entities</Label>
            <p className="text-sm text-muted-foreground">
              Choose which QuickBooks entities to sync with your CPA platform
            </p>
          </div>

          <div className="grid gap-4">
            {configData.availableEntities.map((entity) => (
              <div key={entity.id} className="flex items-start space-x-3">
                <Checkbox
                  id={entity.id}
                  checked={configuration.enabledEntities.includes(entity.id)}
                  onCheckedChange={(checked) => handleEntityToggle(entity.id, checked as boolean)}
                />
                <div className="flex-1 space-y-1">
                  <Label htmlFor={entity.id} className="text-sm font-medium">
                    {entity.name}
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    {entity.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Separator />

        {/* Sync Frequency */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Sync Frequency</Label>
            <p className="text-sm text-muted-foreground">
              Configure how often automatic synchronization occurs
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="syncInterval">
                Sync Interval ({configData.limits.syncInterval.unit})
              </Label>
              <Input
                id="syncInterval"
                type="number"
                min={configData.limits.syncInterval.min}
                max={configData.limits.syncInterval.max}
                value={configuration.syncInterval}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (validateInput('syncInterval', value)) {
                    updateConfiguration('syncInterval', value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {configData.limits.syncInterval.min}-{configData.limits.syncInterval.max} hours
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullSyncFrequency">
                Full Sync Frequency ({configData.limits.fullSyncFrequency.unit})
              </Label>
              <Input
                id="fullSyncFrequency"
                type="number"
                min={configData.limits.fullSyncFrequency.min}
                max={configData.limits.fullSyncFrequency.max}
                value={configuration.fullSyncFrequency}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (validateInput('fullSyncFrequency', value)) {
                    updateConfiguration('fullSyncFrequency', value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {configData.limits.fullSyncFrequency.min}-{configData.limits.fullSyncFrequency.max} days
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Error Handling */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Error Handling</Label>
            <p className="text-sm text-muted-foreground">
              Configure retry behavior for failed synchronizations
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="maxRetries">Max Retries</Label>
              <Input
                id="maxRetries"
                type="number"
                min={configData.limits.maxRetries.min}
                max={configData.limits.maxRetries.max}
                value={configuration.maxRetries}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (validateInput('maxRetries', value)) {
                    updateConfiguration('maxRetries', value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {configData.limits.maxRetries.min}-{configData.limits.maxRetries.max} attempts
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retryDelay">
                Retry Delay ({configData.limits.retryDelay.unit})
              </Label>
              <Input
                id="retryDelay"
                type="number"
                min={configData.limits.retryDelay.min}
                max={configData.limits.retryDelay.max}
                value={configuration.retryDelay}
                onChange={(e) => {
                  const value = parseInt(e.target.value);
                  if (validateInput('retryDelay', value)) {
                    updateConfiguration('retryDelay', value);
                  }
                }}
              />
              <p className="text-xs text-muted-foreground">
                {configData.limits.retryDelay.min}-{configData.limits.retryDelay.max} minutes
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Performance Settings */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Performance Settings</Label>
            <p className="text-sm text-muted-foreground">
              Configure sync performance and resource usage
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="maxRecordsPerSync">Max Records Per Sync</Label>
            <Input
              id="maxRecordsPerSync"
              type="number"
              min={configData.limits.maxRecordsPerSync.min}
              max={configData.limits.maxRecordsPerSync.max}
              value={configuration.maxRecordsPerSync}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                if (validateInput('maxRecordsPerSync', value)) {
                  updateConfiguration('maxRecordsPerSync', value);
                }
              }}
            />
            <p className="text-xs text-muted-foreground">
              {configData.limits.maxRecordsPerSync.min}-{configData.limits.maxRecordsPerSync.max} records
            </p>
          </div>
        </div>

        <Separator />

        {/* Real-time Updates */}
        <div className="space-y-4">
          <div>
            <Label className="text-base font-medium">Real-time Updates</Label>
            <p className="text-sm text-muted-foreground">
              Enable webhooks for instant synchronization when data changes in QuickBooks
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <Switch
              id="enableWebhooks"
              checked={configuration.enableWebhooks}
              onCheckedChange={(checked) => updateConfiguration('enableWebhooks', checked)}
            />
            <Label htmlFor="enableWebhooks">Enable QuickBooks Webhooks</Label>
            {configuration.enableWebhooks && (
              <Badge variant="default" className="bg-green-100 text-green-800">
                Enabled
              </Badge>
            )}
          </div>

          {configuration.enableWebhooks && (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Webhooks provide real-time updates when data changes in QuickBooks.
                This reduces sync latency but requires a stable internet connection.
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Save Button */}
        <div className="pt-4">
          <Button
            onClick={saveConfiguration}
            disabled={saving}
            className="w-full md:w-auto"
          >
            {saving ? (
              <>
                <Settings className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Configuration
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}