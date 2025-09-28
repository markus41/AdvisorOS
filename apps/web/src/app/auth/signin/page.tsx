'use client'

import React, { useState, Suspense } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { signIn } from 'next-auth/react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@radix-ui/react-tabs'
import { Mail, ArrowLeft } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'
import { LoginForm } from '@/components/auth/login-form'
import { OAuthButtons } from '@/components/auth/oauth-buttons'

function SignInContent() {
  const searchParams = useSearchParams()
  const message = searchParams.get('message')
  const subdomain = searchParams.get('subdomain')
  const error = searchParams.get('error')

  const [activeTab, setActiveTab] = useState('credentials')
  const [isLoadingMagicLink, setIsLoadingMagicLink] = useState(false)
  const [magicLinkEmail, setMagicLinkEmail] = useState('')
  const [magicLinkSubdomain, setMagicLinkSubdomain] = useState(subdomain || '')
  const [magicLinkSent, setMagicLinkSent] = useState(false)
  const [selectedSubdomain, setSelectedSubdomain] = useState(subdomain || '')

  React.useEffect(() => {
    if (message) {
      toast.success(message)
    }
    if (error) {
      switch (error) {
        case 'OAuthSignin':
          toast.error('Error signing in with OAuth provider')
          break
        case 'OAuthCallback':
          toast.error('OAuth callback error')
          break
        case 'OAuthCreateAccount':
          toast.error('Could not create OAuth account')
          break
        case 'EmailCreateAccount':
          toast.error('Could not create email account')
          break
        case 'Callback':
          toast.error('Callback error')
          break
        case 'OAuthAccountNotLinked':
          toast.error('Account not linked. Please sign in with the same method you used to create your account.')
          break
        case 'EmailSignin':
          toast.error('Check your email for the sign in link')
          break
        case 'CredentialsSignin':
          toast.error('Invalid credentials')
          break
        case 'SessionRequired':
          toast.error('Please sign in to access this page')
          break
        default:
          toast.error('An error occurred during sign in')
      }
    }
  }, [message, error])

  const handleMagicLinkSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!magicLinkEmail || !magicLinkSubdomain) {
      toast.error('Please enter both email and organization')
      return
    }

    setIsLoadingMagicLink(true)

    try {
      const result = await signIn('email', {
        email: magicLinkEmail,
        subdomain: magicLinkSubdomain,
        redirect: false,
      })

      if (result?.error) {
        toast.error(result.error)
      } else {
        setMagicLinkSent(true)
        toast.success('Magic link sent! Check your email.')
      }
    } catch (error) {
      console.error('Magic link error:', error)
      toast.error('Failed to send magic link')
    } finally {
      setIsLoadingMagicLink(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <svg
              className="h-6 w-6 text-blue-600 dark:text-blue-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Sign in to your account
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Or{' '}
            <Link
              href="/auth/register"
              className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              create a new organization
            </Link>
          </p>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger
              value="credentials"
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === 'credentials'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              Password
            </TabsTrigger>
            <TabsTrigger
              value="oauth"
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === 'oauth'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              OAuth
            </TabsTrigger>
            <TabsTrigger
              value="magic-link"
              className={cn(
                'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
                activeTab === 'magic-link'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
              )}
            >
              Magic Link
            </TabsTrigger>
          </TabsList>

          {/* Credentials Tab */}
          <TabsContent value="credentials" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
              <LoginForm />
            </div>
          </TabsContent>

          {/* OAuth Tab */}
          <TabsContent value="oauth" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
              <div className="space-y-6">
                {/* Organization Selection for OAuth */}
                <div>
                  <label htmlFor="oauth-subdomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Organization
                  </label>
                  <input
                    type="text"
                    id="oauth-subdomain"
                    placeholder="your-organization"
                    value={selectedSubdomain}
                    onChange={(e) => setSelectedSubdomain(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                  />
                  <p className="mt-1 text-xs text-gray-500">
                    Enter your organization's subdomain to continue
                  </p>
                </div>

                <OAuthButtons subdomain={selectedSubdomain} disabled={!selectedSubdomain} />
              </div>
            </div>
          </TabsContent>

          {/* Magic Link Tab */}
          <TabsContent value="magic-link" className="space-y-6">
            <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
              {!magicLinkSent ? (
                <form onSubmit={handleMagicLinkSubmit} className="space-y-4">
                  <div>
                    <label htmlFor="magic-subdomain" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Organization
                    </label>
                    <input
                      type="text"
                      id="magic-subdomain"
                      placeholder="your-organization"
                      value={magicLinkSubdomain}
                      onChange={(e) => setMagicLinkSubdomain(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                      required
                      disabled={isLoadingMagicLink}
                    />
                  </div>

                  <div>
                    <label htmlFor="magic-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                      <input
                        type="email"
                        id="magic-email"
                        placeholder="your.email@example.com"
                        value={magicLinkEmail}
                        onChange={(e) => setMagicLinkEmail(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                        required
                        disabled={isLoadingMagicLink}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoadingMagicLink}
                    className="w-full py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
                  >
                    {isLoadingMagicLink ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Sending magic link...
                      </div>
                    ) : (
                      'Send magic link'
                    )}
                  </button>

                  <p className="text-xs text-gray-500 text-center">
                    We'll send you a secure link to sign in instantly
                  </p>
                </form>
              ) : (
                <div className="text-center space-y-4">
                  <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                    <Mail className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                    Check your email
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    We've sent a magic link to{' '}
                    <span className="font-medium">{magicLinkEmail}</span>
                  </p>
                  <button
                    onClick={() => setMagicLinkSent(false)}
                    className="inline-flex items-center text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    Back to form
                  </button>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Links */}
        <div className="text-center space-y-2">
          <Link
            href="/auth/forgot-password"
            className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Forgot your password?
          </Link>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Need help?{' '}
            <a
              href="mailto:support@cpaplatform.com"
              className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
            >
              Contact support
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SignInContent />
    </Suspense>
  )
}