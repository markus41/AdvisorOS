'use client'

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import {
  User,
  Building,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  Mail,
  Phone,
  MapPin,
  Edit,
  Check,
  X,
  AlertCircle,
  Key,
  Smartphone,
  Globe,
  Moon,
  Sun,
  Monitor
} from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { usePortalAuth } from '@/lib/portal-auth'
import { useTheme } from 'next-themes'

interface UserProfile {
  name: string
  email: string
  phone: string
  title: string
  avatar?: string
}

interface BusinessInfo {
  businessName: string
  businessType: string
  address: string
  city: string
  state: string
  zipCode: string
  ein: string
  website: string
}

interface NotificationSettings {
  emailNotifications: boolean
  smsNotifications: boolean
  documentRequests: boolean
  invoiceReminders: boolean
  messageNotifications: boolean
  reportReady: boolean
  deadlineReminders: boolean
  marketingEmails: boolean
}

interface SecuritySettings {
  twoFactorEnabled: boolean
  sessionTimeout: number
  loginNotifications: boolean
  passwordLastChanged: string
}

interface PrivacySettings {
  shareDataWithCPA: boolean
  allowAnalytics: boolean
  dataRetention: string
  marketingConsent: boolean
}

const sampleUserProfile: UserProfile = {
  name: 'John Smith',
  email: 'john.smith@example.com',
  phone: '+1 (555) 123-4567',
  title: 'Business Owner'
}

const sampleBusinessInfo: BusinessInfo = {
  businessName: 'Smith Consulting LLC',
  businessType: 'Professional Services',
  address: '123 Business Ave',
  city: 'New York',
  state: 'NY',
  zipCode: '10001',
  ein: '12-3456789',
  website: 'https://smithconsulting.com'
}

const sampleNotificationSettings: NotificationSettings = {
  emailNotifications: true,
  smsNotifications: false,
  documentRequests: true,
  invoiceReminders: true,
  messageNotifications: true,
  reportReady: true,
  deadlineReminders: true,
  marketingEmails: false
}

const sampleSecuritySettings: SecuritySettings = {
  twoFactorEnabled: false,
  sessionTimeout: 30,
  loginNotifications: true,
  passwordLastChanged: '2024-09-15'
}

const samplePrivacySettings: PrivacySettings = {
  shareDataWithCPA: true,
  allowAnalytics: true,
  dataRetention: '7years',
  marketingConsent: false
}

interface EditableFieldProps {
  label: string
  value: string
  type?: 'text' | 'email' | 'tel' | 'url'
  placeholder?: string
  onSave: (value: string) => void
  validation?: (value: string) => string | null
}

function EditableField({ label, value, type = 'text', placeholder, onSave, validation }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState(value)
  const [error, setError] = useState<string | null>(null)

  const handleSave = () => {
    if (validation) {
      const validationError = validation(editValue)
      if (validationError) {
        setError(validationError)
        return
      }
    }
    onSave(editValue)
    setIsEditing(false)
    setError(null)
  }

  const handleCancel = () => {
    setEditValue(value)
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor={label.toLowerCase().replace(/\s+/g, '-')}>{label}</Label>
      {isEditing ? (
        <div className="flex items-center space-x-2">
          <Input
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            placeholder={placeholder}
            className={error ? 'border-red-300 dark:border-red-600' : ''}
          />
          <Button size="sm" onClick={handleSave}>
            <Check className="w-4 h-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <span className="text-gray-900 dark:text-white">{value || 'Not set'}</span>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(true)}>
            <Edit className="w-4 h-4" />
          </Button>
        </div>
      )}
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 flex items-center space-x-1">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </p>
      )}
    </div>
  )
}

interface NotificationToggleProps {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}

function NotificationToggle({ label, description, checked, onChange }: NotificationToggleProps) {
  return (
    <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
      <div className="flex-1">
        <h4 className="font-medium text-gray-900 dark:text-white">{label}</h4>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} />
    </div>
  )
}

interface PasswordChangeFormProps {
  onSubmit: (currentPassword: string, newPassword: string) => void
}

function PasswordChangeForm({ onSubmit }: PasswordChangeFormProps) {
  const [showPasswords, setShowPasswords] = useState(false)
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    if (!currentPassword) {
      newErrors.currentPassword = 'Current password is required'
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required'
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters'
    }

    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSubmit(currentPassword, newPassword)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="current-password">Current Password</Label>
        <div className="relative">
          <Input
            id="current-password"
            type={showPasswords ? 'text' : 'password'}
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={errors.currentPassword ? 'border-red-300 dark:border-red-600' : ''}
          />
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={() => setShowPasswords(!showPasswords)}
            className="absolute right-0 top-0 h-full px-3"
          >
            {showPasswords ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </Button>
        </div>
        {errors.currentPassword && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.currentPassword}</p>
        )}
      </div>

      <div>
        <Label htmlFor="new-password">New Password</Label>
        <Input
          id="new-password"
          type={showPasswords ? 'text' : 'password'}
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={errors.newPassword ? 'border-red-300 dark:border-red-600' : ''}
        />
        {errors.newPassword && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.newPassword}</p>
        )}
      </div>

      <div>
        <Label htmlFor="confirm-password">Confirm New Password</Label>
        <Input
          id="confirm-password"
          type={showPasswords ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={errors.confirmPassword ? 'border-red-300 dark:border-red-600' : ''}
        />
        {errors.confirmPassword && (
          <p className="text-sm text-red-600 dark:text-red-400 mt-1">{errors.confirmPassword}</p>
        )}
      </div>

      <Button type="submit" className="w-full">
        Change Password
      </Button>
    </form>
  )
}

export default function SettingsPage() {
  const { session } = usePortalAuth()
  const { theme, setTheme } = useTheme()
  const [userProfile, setUserProfile] = useState<UserProfile>(sampleUserProfile)
  const [businessInfo, setBusinessInfo] = useState<BusinessInfo>(sampleBusinessInfo)
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>(sampleNotificationSettings)
  const [securitySettings, setSecuritySettings] = useState<SecuritySettings>(sampleSecuritySettings)
  const [privacySettings, setPrivacySettings] = useState<PrivacySettings>(samplePrivacySettings)

  const handleProfileSave = (field: keyof UserProfile, value: string) => {
    setUserProfile(prev => ({ ...prev, [field]: value }))
    console.log('Save profile field:', field, value)
  }

  const handleBusinessSave = (field: keyof BusinessInfo, value: string) => {
    setBusinessInfo(prev => ({ ...prev, [field]: value }))
    console.log('Save business field:', field, value)
  }

  const handleNotificationChange = (field: keyof NotificationSettings, value: boolean) => {
    setNotificationSettings(prev => ({ ...prev, [field]: value }))
    console.log('Update notification:', field, value)
  }

  const handleSecurityChange = (field: keyof SecuritySettings, value: boolean | number) => {
    setSecuritySettings(prev => ({ ...prev, [field]: value }))
    console.log('Update security:', field, value)
  }

  const handlePrivacyChange = (field: keyof PrivacySettings, value: boolean | string) => {
    setPrivacySettings(prev => ({ ...prev, [field]: value }))
    console.log('Update privacy:', field, value)
  }

  const handlePasswordChange = (currentPassword: string, newPassword: string) => {
    console.log('Change password')
    // Handle password change logic
  }

  const handleEnable2FA = () => {
    console.log('Enable 2FA')
    // Handle 2FA setup logic
  }

  const emailValidation = (value: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(value) ? null : 'Please enter a valid email address'
  }

  const phoneValidation = (value: string) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]+$/
    return phoneRegex.test(value) ? null : 'Please enter a valid phone number'
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          Settings
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mt-2">
          Manage your account settings, preferences, and security options
        </p>
      </motion.div>

      {/* Settings Tabs */}
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-5">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="business">Business</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="privacy">Privacy</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <User className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Personal Information
                </CardTitle>
                <CardDescription>
                  Update your personal details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <EditableField
                  label="Full Name"
                  value={userProfile.name}
                  onSave={(value) => handleProfileSave('name', value)}
                />
                <EditableField
                  label="Email Address"
                  value={userProfile.email}
                  type="email"
                  onSave={(value) => handleProfileSave('email', value)}
                  validation={emailValidation}
                />
                <EditableField
                  label="Phone Number"
                  value={userProfile.phone}
                  type="tel"
                  onSave={(value) => handleProfileSave('phone', value)}
                  validation={phoneValidation}
                />
                <EditableField
                  label="Job Title"
                  value={userProfile.title}
                  onSave={(value) => handleProfileSave('title', value)}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Appearance Settings */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Monitor className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Appearance
                </CardTitle>
                <CardDescription>
                  Customize the look and feel of your portal
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label>Theme Preference</Label>
                    <div className="grid grid-cols-3 gap-3 mt-2">
                      <Button
                        variant={theme === 'light' ? 'default' : 'outline'}
                        onClick={() => setTheme('light')}
                        className="flex items-center space-x-2"
                      >
                        <Sun className="w-4 h-4" />
                        <span>Light</span>
                      </Button>
                      <Button
                        variant={theme === 'dark' ? 'default' : 'outline'}
                        onClick={() => setTheme('dark')}
                        className="flex items-center space-x-2"
                      >
                        <Moon className="w-4 h-4" />
                        <span>Dark</span>
                      </Button>
                      <Button
                        variant={theme === 'system' ? 'default' : 'outline'}
                        onClick={() => setTheme('system')}
                        className="flex items-center space-x-2"
                      >
                        <Monitor className="w-4 h-4" />
                        <span>System</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Building className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Business Information
                </CardTitle>
                <CardDescription>
                  Update your business details and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <EditableField
                  label="Business Name"
                  value={businessInfo.businessName}
                  onSave={(value) => handleBusinessSave('businessName', value)}
                />
                <EditableField
                  label="Business Type"
                  value={businessInfo.businessType}
                  onSave={(value) => handleBusinessSave('businessType', value)}
                />
                <EditableField
                  label="Street Address"
                  value={businessInfo.address}
                  onSave={(value) => handleBusinessSave('address', value)}
                />
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <EditableField
                    label="City"
                    value={businessInfo.city}
                    onSave={(value) => handleBusinessSave('city', value)}
                  />
                  <EditableField
                    label="State"
                    value={businessInfo.state}
                    onSave={(value) => handleBusinessSave('state', value)}
                  />
                  <EditableField
                    label="ZIP Code"
                    value={businessInfo.zipCode}
                    onSave={(value) => handleBusinessSave('zipCode', value)}
                  />
                </div>
                <EditableField
                  label="EIN"
                  value={businessInfo.ein}
                  onSave={(value) => handleBusinessSave('ein', value)}
                />
                <EditableField
                  label="Website"
                  value={businessInfo.website}
                  type="url"
                  onSave={(value) => handleBusinessSave('website', value)}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Notification Preferences
                </CardTitle>
                <CardDescription>
                  Choose how you want to be notified about important updates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <NotificationToggle
                  label="Email Notifications"
                  description="Receive notifications via email"
                  checked={notificationSettings.emailNotifications}
                  onChange={(checked) => handleNotificationChange('emailNotifications', checked)}
                />
                <NotificationToggle
                  label="SMS Notifications"
                  description="Receive notifications via text message"
                  checked={notificationSettings.smsNotifications}
                  onChange={(checked) => handleNotificationChange('smsNotifications', checked)}
                />
                <NotificationToggle
                  label="Document Requests"
                  description="Get notified when your CPA requests documents"
                  checked={notificationSettings.documentRequests}
                  onChange={(checked) => handleNotificationChange('documentRequests', checked)}
                />
                <NotificationToggle
                  label="Invoice Reminders"
                  description="Receive reminders about upcoming invoice due dates"
                  checked={notificationSettings.invoiceReminders}
                  onChange={(checked) => handleNotificationChange('invoiceReminders', checked)}
                />
                <NotificationToggle
                  label="Message Notifications"
                  description="Get notified when you receive new messages"
                  checked={notificationSettings.messageNotifications}
                  onChange={(checked) => handleNotificationChange('messageNotifications', checked)}
                />
                <NotificationToggle
                  label="Report Ready"
                  description="Get notified when your reports are ready for download"
                  checked={notificationSettings.reportReady}
                  onChange={(checked) => handleNotificationChange('reportReady', checked)}
                />
                <NotificationToggle
                  label="Deadline Reminders"
                  description="Receive reminders about important tax deadlines"
                  checked={notificationSettings.deadlineReminders}
                  onChange={(checked) => handleNotificationChange('deadlineReminders', checked)}
                />
                <NotificationToggle
                  label="Marketing Emails"
                  description="Receive promotional emails and newsletters"
                  checked={notificationSettings.marketingEmails}
                  onChange={(checked) => handleNotificationChange('marketingEmails', checked)}
                />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Security Tab */}
        <TabsContent value="security" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Shield className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Security Settings
                </CardTitle>
                <CardDescription>
                  Manage your account security and access settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Two-Factor Authentication */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Smartphone className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">
                        Two-Factor Authentication
                      </h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Add an extra layer of security to your account
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {securitySettings.twoFactorEnabled ? (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400">
                        Enabled
                      </Badge>
                    ) : (
                      <Badge variant="secondary">Disabled</Badge>
                    )}
                    <Button
                      size="sm"
                      onClick={handleEnable2FA}
                      variant={securitySettings.twoFactorEnabled ? 'outline' : 'default'}
                    >
                      {securitySettings.twoFactorEnabled ? 'Manage' : 'Enable'}
                    </Button>
                  </div>
                </div>

                {/* Session Timeout */}
                <div className="space-y-2">
                  <Label>Session Timeout</Label>
                  <Select
                    value={securitySettings.sessionTimeout.toString()}
                    onValueChange={(value) => handleSecurityChange('sessionTimeout', parseInt(value))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15">15 minutes</SelectItem>
                      <SelectItem value="30">30 minutes</SelectItem>
                      <SelectItem value="60">1 hour</SelectItem>
                      <SelectItem value="120">2 hours</SelectItem>
                      <SelectItem value="0">Never</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Automatically log out after a period of inactivity
                  </p>
                </div>

                {/* Login Notifications */}
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Login Notifications
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Get notified when someone logs into your account
                    </p>
                  </div>
                  <Switch
                    checked={securitySettings.loginNotifications}
                    onCheckedChange={(checked) => handleSecurityChange('loginNotifications', checked)}
                  />
                </div>

                {/* Password Last Changed */}
                <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white">Password</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Last changed on {new Date(securitySettings.passwordLastChanged).toLocaleDateString()}
                      </p>
                    </div>
                    <Key className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Change Password */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Change Password</CardTitle>
                <CardDescription>
                  Update your password to keep your account secure
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PasswordChangeForm onSubmit={handlePasswordChange} />
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        {/* Privacy Tab */}
        <TabsContent value="privacy" className="space-y-6">
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Eye className="w-5 h-5 mr-2 text-blue-600 dark:text-blue-400" />
                  Privacy Settings
                </CardTitle>
                <CardDescription>
                  Control how your data is used and shared
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Share Data with CPA
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow your CPA to access your financial data and documents
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.shareDataWithCPA}
                    onCheckedChange={(checked) => handlePrivacyChange('shareDataWithCPA', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Analytics & Performance
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Help us improve the platform by sharing usage analytics
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.allowAnalytics}
                    onCheckedChange={(checked) => handlePrivacyChange('allowAnalytics', checked)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Data Retention Period</Label>
                  <Select
                    value={privacySettings.dataRetention}
                    onValueChange={(value) => handlePrivacyChange('dataRetention', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="3years">3 years</SelectItem>
                      <SelectItem value="5years">5 years</SelectItem>
                      <SelectItem value="7years">7 years</SelectItem>
                      <SelectItem value="indefinite">Indefinite</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    How long to retain your data after account closure
                  </p>
                </div>

                <div className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">
                      Marketing Consent
                    </h4>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Allow us to contact you about new features and services
                    </p>
                  </div>
                  <Switch
                    checked={privacySettings.marketingConsent}
                    onCheckedChange={(checked) => handlePrivacyChange('marketingConsent', checked)}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Data Export */}
          <motion.div variants={itemVariants}>
            <Card>
              <CardHeader>
                <CardTitle>Data Export</CardTitle>
                <CardDescription>
                  Download a copy of all your data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Request a complete export of your account data including documents, messages, and financial information.
                    </p>
                  </div>
                  <Button variant="outline">
                    Request Export
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  )
}