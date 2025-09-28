'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  Card,
  Title,
  Text,
  TabGroup,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Badge,
  Flex,
} from '@tremor/react'
import {
  Building2,
  User,
  Link,
  Shield,
  CreditCard,
  Download,
  Bell,
  Palette,
  Globe,
  Lock,
  Key,
  Smartphone,
  Mail,
  Database,
  FileText,
  Settings as SettingsIcon,
  Save,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ExternalLink,
  Upload,
  Eye,
  EyeOff,
} from 'lucide-react'
import { DashboardLayout } from '@/components/layout/dashboard-layout'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { cn } from '@/lib/utils'

// Mock data for settings
const organizationData = {
  name: 'Johnson & Associates CPA',
  address: '123 Business District, Suite 500',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  phone: '+1 (555) 123-4567',
  email: 'contact@johnsoncpa.com',
  website: 'https://johnsoncpa.com',
  taxId: '12-3456789',
  logo: '/logo.png',
  timezone: 'America/New_York',
  fiscalYearStart: '01-01',
}

const userPreferences = {
  theme: 'system',
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  currency: 'USD',
  notifications: {
    email: true,
    push: true,
    sms: false,
    taskReminders: true,
    deadlineAlerts: true,
    clientUpdates: true,
    systemUpdates: false,
  },
}

const integrationStatus = {
  quickbooks: {
    connected: true,
    lastSync: '2024-01-15 14:30:00',
    status: 'active',
    company: 'Johnson & Associates Demo',
  },
  stripe: {
    connected: true,
    lastSync: '2024-01-15 16:45:00',
    status: 'active',
    account: 'acct_1234567890',
  },
  gmail: {
    connected: false,
    lastSync: null,
    status: 'disconnected',
  },
  docusign: {
    connected: true,
    lastSync: '2024-01-15 12:20:00',
    status: 'active',
  },
}

const securitySettings = {
  twoFactorEnabled: true,
  passwordPolicy: {
    minLength: 12,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSymbols: true,
    passwordExpiry: 90,
  },
  sessionTimeout: 480, // minutes
  ipWhitelist: ['192.168.1.0/24', '10.0.0.0/8'],
  auditLog: true,
}

const billingInfo = {
  plan: 'Professional',
  status: 'active',
  nextBilling: '2024-02-15',
  amount: 299,
  paymentMethod: {
    type: 'card',
    last4: '4242',
    brand: 'Visa',
    expiry: '12/25',
  },
  usage: {
    clients: 124,
    clientsLimit: 500,
    storage: 45.6,
    storageLimit: 100,
    users: 6,
    usersLimit: 25,
  },
}

interface SettingsSectionProps {
  title: string
  description: string
  icon: React.ComponentType<any>
  children: React.ReactNode
}

function SettingsSection({ title, description, icon: Icon, children }: SettingsSectionProps) {
  return (
    <div className="space-y-6">
      <div className="flex items-start space-x-4">
        <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

function OrganizationSettings() {
  const [orgData, setOrgData] = useState(organizationData)
  const [isUploading, setIsUploading] = useState(false)

  const handleSave = () => {
    console.log('Saving organization settings:', orgData)
    // In real implementation, this would make an API call
  }

  const handleLogoUpload = () => {
    setIsUploading(true)
    // Simulate file upload
    setTimeout(() => {
      setIsUploading(false)
      console.log('Logo uploaded successfully')
    }, 2000)
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Company Information"
        description="Basic information about your organization"
        icon={Building2}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="orgName">Organization Name</Label>
              <Input
                id="orgName"
                value={orgData.name}
                onChange={(e) => setOrgData({ ...orgData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="address">Address</Label>
              <Input
                id="address"
                value={orgData.address}
                onChange={(e) => setOrgData({ ...orgData, address: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  value={orgData.city}
                  onChange={(e) => setOrgData({ ...orgData, city: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  value={orgData.state}
                  onChange={(e) => setOrgData({ ...orgData, state: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP Code</Label>
                <Input
                  id="zipCode"
                  value={orgData.zipCode}
                  onChange={(e) => setOrgData({ ...orgData, zipCode: e.target.value })}
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={orgData.phone}
                onChange={(e) => setOrgData({ ...orgData, phone: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={orgData.email}
                onChange={(e) => setOrgData({ ...orgData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={orgData.website}
                onChange={(e) => setOrgData({ ...orgData, website: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="taxId">Tax ID</Label>
              <Input
                id="taxId"
                value={orgData.taxId}
                onChange={(e) => setOrgData({ ...orgData, taxId: e.target.value })}
              />
            </div>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Branding"
        description="Customize your organization's visual identity"
        icon={Palette}
      >
        <div className="space-y-4">
          <div>
            <Label>Company Logo</Label>
            <div className="flex items-center space-x-4 mt-2">
              <Avatar className="w-16 h-16">
                <AvatarImage src={orgData.logo} alt="Company Logo" />
                <AvatarFallback>
                  <Building2 className="w-8 h-8" />
                </AvatarFallback>
              </Avatar>
              <div>
                <Button
                  variant="outline"
                  onClick={handleLogoUpload}
                  disabled={isUploading}
                  className="flex items-center space-x-2"
                >
                  {isUploading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <Upload className="w-4 h-4" />
                  )}
                  <span>{isUploading ? 'Uploading...' : 'Upload Logo'}</span>
                </Button>
                <p className="text-xs text-gray-500 mt-1">
                  PNG or JPG up to 2MB. Recommended size: 200x200px
                </p>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Regional Settings"
        description="Configure timezone and regional preferences"
        icon={Globe}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="timezone">Timezone</Label>
            <Select value={orgData.timezone} onValueChange={(value) => setOrgData({ ...orgData, timezone: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="America/New_York">Eastern Time (EST/EDT)</SelectItem>
                <SelectItem value="America/Chicago">Central Time (CST/CDT)</SelectItem>
                <SelectItem value="America/Denver">Mountain Time (MST/MDT)</SelectItem>
                <SelectItem value="America/Los_Angeles">Pacific Time (PST/PDT)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="fiscalYear">Fiscal Year Start</Label>
            <Select value={orgData.fiscalYearStart} onValueChange={(value) => setOrgData({ ...orgData, fiscalYearStart: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="01-01">January 1st</SelectItem>
                <SelectItem value="04-01">April 1st</SelectItem>
                <SelectItem value="07-01">July 1st</SelectItem>
                <SelectItem value="10-01">October 1st</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center space-x-2">
          <Save className="w-4 h-4" />
          <span>Save Changes</span>
        </Button>
      </div>
    </div>
  )
}

function UserPreferences() {
  const [preferences, setPreferences] = useState(userPreferences)

  const handleSave = () => {
    console.log('Saving user preferences:', preferences)
  }

  const updateNotification = (key: string, value: boolean) => {
    setPreferences({
      ...preferences,
      notifications: {
        ...preferences.notifications,
        [key]: value,
      },
    })
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Display Preferences"
        description="Customize how the application looks and feels"
        icon={Palette}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="theme">Theme</Label>
            <Select value={preferences.theme} onValueChange={(value) => setPreferences({ ...preferences, theme: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light">Light</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="system">System</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="language">Language</Label>
            <Select value={preferences.language} onValueChange={(value) => setPreferences({ ...preferences, language: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="es">Spanish</SelectItem>
                <SelectItem value="fr">French</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Date & Time Formats"
        description="Configure how dates and times are displayed"
        icon={Globe}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <Label htmlFor="dateFormat">Date Format</Label>
            <Select value={preferences.dateFormat} onValueChange={(value) => setPreferences({ ...preferences, dateFormat: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="timeFormat">Time Format</Label>
            <Select value={preferences.timeFormat} onValueChange={(value) => setPreferences({ ...preferences, timeFormat: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="12h">12 Hour</SelectItem>
                <SelectItem value="24h">24 Hour</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="currency">Currency</Label>
            <Select value={preferences.currency} onValueChange={(value) => setPreferences({ ...preferences, currency: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USD">USD ($)</SelectItem>
                <SelectItem value="EUR">EUR (€)</SelectItem>
                <SelectItem value="GBP">GBP (£)</SelectItem>
                <SelectItem value="CAD">CAD (C$)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Notifications"
        description="Manage how you receive updates and alerts"
        icon={Bell}
      >
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Delivery Methods</h4>
              <div className="space-y-3">
                <Flex>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Email</span>
                  </div>
                  <Switch
                    checked={preferences.notifications.email}
                    onCheckedChange={(checked) => updateNotification('email', checked)}
                  />
                </Flex>
                <Flex>
                  <div className="flex items-center space-x-3">
                    <Bell className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">Push Notifications</span>
                  </div>
                  <Switch
                    checked={preferences.notifications.push}
                    onCheckedChange={(checked) => updateNotification('push', checked)}
                  />
                </Flex>
                <Flex>
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-4 h-4 text-gray-400" />
                    <span className="text-sm">SMS</span>
                  </div>
                  <Switch
                    checked={preferences.notifications.sms}
                    onCheckedChange={(checked) => updateNotification('sms', checked)}
                  />
                </Flex>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Task Notifications</h4>
              <div className="space-y-3">
                <Flex>
                  <span className="text-sm">Task Reminders</span>
                  <Switch
                    checked={preferences.notifications.taskReminders}
                    onCheckedChange={(checked) => updateNotification('taskReminders', checked)}
                  />
                </Flex>
                <Flex>
                  <span className="text-sm">Deadline Alerts</span>
                  <Switch
                    checked={preferences.notifications.deadlineAlerts}
                    onCheckedChange={(checked) => updateNotification('deadlineAlerts', checked)}
                  />
                </Flex>
              </div>
            </div>
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900 dark:text-white">Other Notifications</h4>
              <div className="space-y-3">
                <Flex>
                  <span className="text-sm">Client Updates</span>
                  <Switch
                    checked={preferences.notifications.clientUpdates}
                    onCheckedChange={(checked) => updateNotification('clientUpdates', checked)}
                  />
                </Flex>
                <Flex>
                  <span className="text-sm">System Updates</span>
                  <Switch
                    checked={preferences.notifications.systemUpdates}
                    onCheckedChange={(checked) => updateNotification('systemUpdates', checked)}
                  />
                </Flex>
              </div>
            </div>
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center space-x-2">
          <Save className="w-4 h-4" />
          <span>Save Preferences</span>
        </Button>
      </div>
    </div>
  )
}

function IntegrationSettings() {
  const [integrations, setIntegrations] = useState(integrationStatus)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge color="green" size="sm">Connected</Badge>
      case 'disconnected':
        return <Badge color="red" size="sm">Disconnected</Badge>
      case 'error':
        return <Badge color="yellow" size="sm">Error</Badge>
      default:
        return <Badge color="gray" size="sm">Unknown</Badge>
    }
  }

  const handleConnect = (integration: string) => {
    console.log(`Connecting ${integration}...`)
    // In real implementation, this would initiate OAuth flow
  }

  const handleDisconnect = (integration: string) => {
    if (confirm(`Are you sure you want to disconnect ${integration}?`)) {
      setIntegrations({
        ...integrations,
        [integration]: {
          ...integrations[integration as keyof typeof integrations],
          connected: false,
          status: 'disconnected',
        },
      })
    }
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Financial Integrations"
        description="Connect your accounting and payment systems"
        icon={Link}
      >
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                  <Database className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">QuickBooks Online</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Sync financial data and client information
                  </p>
                  {integrations.quickbooks.connected && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        Company: {integrations.quickbooks.company}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last sync: {new Date(integrations.quickbooks.lastSync!).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(integrations.quickbooks.status)}
                {integrations.quickbooks.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect('quickbooks')}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleConnect('quickbooks')}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Stripe</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Process payments and manage billing
                  </p>
                  {integrations.stripe.connected && (
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        Account: {integrations.stripe.account}
                      </p>
                      <p className="text-xs text-gray-500">
                        Last sync: {new Date(integrations.stripe.lastSync!).toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(integrations.stripe.status)}
                {integrations.stripe.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect('stripe')}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleConnect('stripe')}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Communication Integrations"
        description="Connect email and document signing services"
        icon={Mail}
      >
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                  <Mail className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Gmail</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Access email templates and client communication
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(integrations.gmail.status)}
                <Button size="sm" onClick={() => handleConnect('gmail')}>
                  Connect
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">DocuSign</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Electronic document signing and workflow
                  </p>
                  {integrations.docusign.connected && (
                    <p className="text-xs text-gray-500 mt-2">
                      Last sync: {new Date(integrations.docusign.lastSync!).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex items-center space-x-3">
                {getStatusBadge(integrations.docusign.status)}
                {integrations.docusign.connected ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDisconnect('docusign')}
                  >
                    Disconnect
                  </Button>
                ) : (
                  <Button size="sm" onClick={() => handleConnect('docusign')}>
                    Connect
                  </Button>
                )}
              </div>
            </div>
          </Card>
        </div>
      </SettingsSection>
    </div>
  )
}

function SecuritySettings() {
  const [security, setSecurity] = useState(securitySettings)
  const [showPasswords, setShowPasswords] = useState(false)

  const handleSave = () => {
    console.log('Saving security settings:', security)
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Two-Factor Authentication"
        description="Add an extra layer of security to your account"
        icon={Shield}
      >
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Authenticator App
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Use an authenticator app like Google Authenticator or Authy
                </p>
                {security.twoFactorEnabled && (
                  <div className="flex items-center space-x-2 mt-2">
                    <CheckCircle2 className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-green-600">Enabled</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {security.twoFactorEnabled ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSecurity({ ...security, twoFactorEnabled: false })}
                >
                  Disable
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => setSecurity({ ...security, twoFactorEnabled: true })}
                >
                  Setup
                </Button>
              )}
            </div>
          </div>
        </Card>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Password Policy"
        description="Configure password requirements for your organization"
        icon={Lock}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="minLength">Minimum Length</Label>
              <Input
                id="minLength"
                type="number"
                value={security.passwordPolicy.minLength}
                onChange={(e) => setSecurity({
                  ...security,
                  passwordPolicy: {
                    ...security.passwordPolicy,
                    minLength: parseInt(e.target.value),
                  },
                })}
                min="8"
                max="32"
              />
            </div>
            <div>
              <Label htmlFor="passwordExpiry">Password Expiry (days)</Label>
              <Input
                id="passwordExpiry"
                type="number"
                value={security.passwordPolicy.passwordExpiry}
                onChange={(e) => setSecurity({
                  ...security,
                  passwordPolicy: {
                    ...security.passwordPolicy,
                    passwordExpiry: parseInt(e.target.value),
                  },
                })}
                min="30"
                max="365"
              />
            </div>
          </div>
          <div className="space-y-4">
            <h4 className="font-medium text-gray-900 dark:text-white">Requirements</h4>
            <div className="space-y-3">
              <Flex>
                <span className="text-sm">Uppercase letters</span>
                <Switch
                  checked={security.passwordPolicy.requireUppercase}
                  onCheckedChange={(checked) => setSecurity({
                    ...security,
                    passwordPolicy: {
                      ...security.passwordPolicy,
                      requireUppercase: checked,
                    },
                  })}
                />
              </Flex>
              <Flex>
                <span className="text-sm">Lowercase letters</span>
                <Switch
                  checked={security.passwordPolicy.requireLowercase}
                  onCheckedChange={(checked) => setSecurity({
                    ...security,
                    passwordPolicy: {
                      ...security.passwordPolicy,
                      requireLowercase: checked,
                    },
                  })}
                />
              </Flex>
              <Flex>
                <span className="text-sm">Numbers</span>
                <Switch
                  checked={security.passwordPolicy.requireNumbers}
                  onCheckedChange={(checked) => setSecurity({
                    ...security,
                    passwordPolicy: {
                      ...security.passwordPolicy,
                      requireNumbers: checked,
                    },
                  })}
                />
              </Flex>
              <Flex>
                <span className="text-sm">Special characters</span>
                <Switch
                  checked={security.passwordPolicy.requireSymbols}
                  onCheckedChange={(checked) => setSecurity({
                    ...security,
                    passwordPolicy: {
                      ...security.passwordPolicy,
                      requireSymbols: checked,
                    },
                  })}
                />
              </Flex>
            </div>
          </div>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Session & Access Control"
        description="Manage session timeouts and IP restrictions"
        icon={Key}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
            <Input
              id="sessionTimeout"
              type="number"
              value={security.sessionTimeout}
              onChange={(e) => setSecurity({ ...security, sessionTimeout: parseInt(e.target.value) })}
              min="15"
              max="1440"
            />
            <p className="text-xs text-gray-500 mt-1">
              Users will be automatically logged out after this period of inactivity
            </p>
          </div>
          <div>
            <Flex>
              <span className="text-sm font-medium">Audit Logging</span>
              <Switch
                checked={security.auditLog}
                onCheckedChange={(checked) => setSecurity({ ...security, auditLog: checked })}
              />
            </Flex>
            <p className="text-xs text-gray-500 mt-1">
              Log all user actions for security monitoring
            </p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="ipWhitelist">IP Whitelist</Label>
            <Button variant="outline" size="sm">
              Add IP Range
            </Button>
          </div>
          <div className="space-y-2">
            {security.ipWhitelist.map((ip, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-sm font-mono">{ip}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSecurity({
                    ...security,
                    ipWhitelist: security.ipWhitelist.filter((_, i) => i !== index),
                  })}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      </SettingsSection>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="flex items-center space-x-2">
          <Save className="w-4 h-4" />
          <span>Save Security Settings</span>
        </Button>
      </div>
    </div>
  )
}

function BillingSettings() {
  const [billing, setBilling] = useState(billingInfo)

  const handleUpgrade = () => {
    console.log('Upgrading plan...')
  }

  const handleDowngrade = () => {
    console.log('Downgrading plan...')
  }

  const handleUpdatePayment = () => {
    console.log('Updating payment method...')
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Current Plan"
        description="Manage your subscription and billing information"
        icon={CreditCard}
      >
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                {billing.plan} Plan
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                ${billing.amount}/month • Next billing: {billing.nextBilling}
              </p>
              <div className="flex items-center space-x-2 mt-2">
                <Badge color="green" size="sm">{billing.status}</Badge>
                <Button variant="link" size="sm" className="p-0 h-auto">
                  View billing history
                </Button>
              </div>
            </div>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={handleDowngrade}>
                Downgrade
              </Button>
              <Button onClick={handleUpgrade}>
                Upgrade
              </Button>
            </div>
          </div>
        </Card>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Usage & Limits"
        description="Track your current usage against plan limits"
        icon={BarChart3}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text className="font-medium">Clients</Text>
                <Text className="text-sm text-gray-500">
                  {billing.usage.clients} / {billing.usage.clientsLimit}
                </Text>
              </div>
              <ProgressBar
                value={(billing.usage.clients / billing.usage.clientsLimit) * 100}
                color="blue"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text className="font-medium">Storage</Text>
                <Text className="text-sm text-gray-500">
                  {billing.usage.storage}GB / {billing.usage.storageLimit}GB
                </Text>
              </div>
              <ProgressBar
                value={(billing.usage.storage / billing.usage.storageLimit) * 100}
                color="green"
              />
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Text className="font-medium">Team Members</Text>
                <Text className="text-sm text-gray-500">
                  {billing.usage.users} / {billing.usage.usersLimit}
                </Text>
              </div>
              <ProgressBar
                value={(billing.usage.users / billing.usage.usersLimit) * 100}
                color="purple"
              />
            </div>
          </Card>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Payment Method"
        description="Manage your payment information"
        icon={CreditCard}
      >
        <Card className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {billing.paymentMethod.brand} •••• {billing.paymentMethod.last4}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Expires {billing.paymentMethod.expiry}
                </p>
                <Badge color="green" size="sm" className="mt-2">Primary</Badge>
              </div>
            </div>
            <Button variant="outline" onClick={handleUpdatePayment}>
              Update
            </Button>
          </div>
        </Card>
      </SettingsSection>
    </div>
  )
}

function BackupSettings() {
  const [isExporting, setIsExporting] = useState(false)
  const [lastBackup, setLastBackup] = useState('2024-01-14 23:30:00')

  const handleExport = async (format: string) => {
    setIsExporting(true)
    // Simulate export process
    await new Promise(resolve => setTimeout(resolve, 3000))
    setIsExporting(false)
    console.log(`Exporting data in ${format} format`)
  }

  const handleBackup = async () => {
    console.log('Creating backup...')
    setLastBackup(new Date().toISOString())
  }

  return (
    <div className="space-y-8">
      <SettingsSection
        title="Data Export"
        description="Download your data in various formats"
        icon={Download}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Client Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export all client information, contacts, and relationships
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('csv')}
                  disabled={isExporting}
                >
                  CSV
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('xlsx')}
                  disabled={isExporting}
                >
                  Excel
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('json')}
                  disabled={isExporting}
                >
                  JSON
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <Database className="w-6 h-6 text-green-600 dark:text-green-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Financial Data</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Export financial records, transactions, and reports
                  </p>
                </div>
              </div>
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('qbx')}
                  disabled={isExporting}
                >
                  QuickBooks
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleExport('pdf')}
                  disabled={isExporting}
                >
                  PDF
                </Button>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <FileText className="w-6 h-6 text-purple-600 dark:text-purple-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Documents</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Download all uploaded documents and files
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExport('zip')}
                disabled={isExporting}
              >
                {isExporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  'Download ZIP'
                )}
              </Button>
            </div>
          </Card>

          <Card className="p-6">
            <div className="space-y-4">
              <div className="flex items-start space-x-4">
                <Database className="w-6 h-6 text-orange-600 dark:text-orange-400 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">Complete Backup</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Full system backup including all data and settings
                  </p>
                </div>
              </div>
              <Button size="sm" onClick={handleBackup}>
                Create Backup
              </Button>
            </div>
          </Card>
        </div>
      </SettingsSection>

      <Separator />

      <SettingsSection
        title="Automatic Backups"
        description="Configure automatic backup schedules"
        icon={RefreshCw}
      >
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  Daily Backups
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Automatically backup your data every day at 11:30 PM
                </p>
              </div>
              <Switch defaultChecked />
            </div>
            {lastBackup && (
              <div className="flex items-center space-x-2 text-sm text-gray-500">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                <span>Last backup: {new Date(lastBackup).toLocaleString()}</span>
              </div>
            )}
          </div>
        </Card>
      </SettingsSection>
    </div>
  )
}

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState(0)

  const tabs = [
    { name: 'Organization', icon: Building2, component: OrganizationSettings },
    { name: 'Preferences', icon: User, component: UserPreferences },
    { name: 'Integrations', icon: Link, component: IntegrationSettings },
    { name: 'Security', icon: Shield, component: SecuritySettings },
    { name: 'Billing', icon: CreditCard, component: BillingSettings },
    { name: 'Backup & Export', icon: Download, component: BackupSettings },
  ]

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <SettingsIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                Settings
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Manage your organization, preferences, and system configuration
              </p>
            </div>
          </div>
        </motion.div>

        {/* Settings Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <Card>
            <TabGroup index={activeTab} onIndexChange={setActiveTab}>
              <TabList className="mb-8">
                {tabs.map((tab) => {
                  const Icon = tab.icon
                  return (
                    <Tab key={tab.name} className="flex items-center space-x-2">
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{tab.name}</span>
                    </Tab>
                  )
                })}
              </TabList>

              <TabPanels>
                {tabs.map((tab, index) => {
                  const Component = tab.component
                  return (
                    <TabPanel key={index}>
                      <Component />
                    </TabPanel>
                  )
                })}
              </TabPanels>
            </TabGroup>
          </Card>
        </motion.div>
      </div>
    </DashboardLayout>
  )
}