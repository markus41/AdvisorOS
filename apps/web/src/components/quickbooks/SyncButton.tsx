'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { RefreshCw, ChevronDown, Users, FileText, Receipt, DollarSign, BarChart3 } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface SyncButtonProps {
  onSyncStart?: () => void;
  onSyncComplete?: () => void;
  disabled?: boolean;
}

const syncOptions = [
  { key: 'all', label: 'Full Sync', icon: RefreshCw, description: 'Sync all data' },
  { key: 'customers', label: 'Customers', icon: Users, description: 'Sync customer data' },
  { key: 'invoices', label: 'Invoices', icon: FileText, description: 'Sync invoices' },
  { key: 'bills', label: 'Bills', icon: Receipt, description: 'Sync bills and expenses' },
  { key: 'accounts', label: 'Chart of Accounts', icon: DollarSign, description: 'Sync account structure' },
  { key: 'reports', label: 'Financial Reports', icon: BarChart3, description: 'Sync P&L and Balance Sheet' },
];

export function SyncButton({ onSyncStart, onSyncComplete, disabled = false }: SyncButtonProps) {
  const [syncing, setSyncing] = useState(false);
  const [syncingType, setSyncingType] = useState<string | null>(null);

  const handleSync = async (entityType: string) => {
    try {
      setSyncing(true);
      setSyncingType(entityType);
      onSyncStart?.();

      const response = await fetch('/api/quickbooks/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          syncType: 'manual',
          entityType
        })
      });

      if (response.ok) {
        const result = await response.json();
        toast.success(result.message || 'Sync completed successfully');
        onSyncComplete?.();
      } else {
        const error = await response.json();

        if (response.status === 400 && error.error === 'QuickBooks not connected') {
          toast.error('Please connect QuickBooks first');
        } else if (response.status === 409) {
          toast.error('A sync is already in progress');
        } else {
          toast.error(error.error || 'Sync failed');
        }
      }
    } catch (error) {
      console.error('Sync error:', error);
      toast.error('Failed to start sync');
    } finally {
      setSyncing(false);
      setSyncingType(null);
    }
  };

  const isDisabled = disabled || syncing;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          disabled={isDisabled}
          className="min-w-[120px]"
        >
          {syncing ? (
            <>
              <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
              Syncing...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Sync Data
              <ChevronDown className="ml-2 h-4 w-4" />
            </>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Choose data to sync</DropdownMenuLabel>
        <DropdownMenuSeparator />

        {syncOptions.map((option) => {
          const Icon = option.icon;
          const isSyncingThis = syncingType === option.key;

          return (
            <DropdownMenuItem
              key={option.key}
              onClick={() => handleSync(option.key)}
              disabled={isDisabled}
              className="cursor-pointer"
            >
              <Icon className={`mr-2 h-4 w-4 ${isSyncingThis ? 'animate-spin' : ''}`} />
              <div className="flex flex-col">
                <span className="font-medium">{option.label}</span>
                <span className="text-xs text-muted-foreground">{option.description}</span>
              </div>
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}