'use client'

import React, { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Building, Search, Users, ArrowRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import toast from 'react-hot-toast'

const selectOrganizationSchema = z.object({
  subdomain: z.string().min(1, 'Please select an organization'),
})

type SelectOrganizationFormData = z.infer<typeof selectOrganizationSchema>

interface Organization {
  id: string
  name: string
  subdomain: string
  memberCount: number
  description?: string
}

function SelectOrganizationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')
  const callbackUrl = searchParams.get('callbackUrl') || '/dashboard'

  const [isLoading, setIsLoading] = useState(false)
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedOrg, setSelectedOrg] = useState<string>('')

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SelectOrganizationFormData>({
    resolver: zodResolver(selectOrganizationSchema),
  })

  const subdomain = watch('subdomain')

  useEffect(() => {
    if (error) {
      switch (error) {
        case 'UserNotInOrganization':
          toast.error('You are not a member of this organization')
          break
        case 'OAuthAccountNotLinked':
          toast.error('This OAuth account is not linked to any organization')
          break
        default:
          toast.error('An error occurred during sign in')
      }
    }
  }, [error])

  // Mock organizations - in real app, this would come from an API
  useEffect(() => {
    // Simulate loading organizations
    const mockOrganizations: Organization[] = [
      {
        id: '1',
        name: 'Smith & Associates CPA',
        subdomain: 'smith-cpa',
        memberCount: 15,
        description: 'Full-service accounting and tax preparation',
      },
      {
        id: '2',
        name: 'Johnson Tax Services',
        subdomain: 'johnson-tax',
        memberCount: 8,
        description: 'Tax preparation and bookkeeping services',
      },
      {
        id: '3',
        name: 'Metropolitan Accounting Group',
        subdomain: 'metro-accounting',
        memberCount: 32,
        description: 'Large-scale corporate accounting solutions',
      },
    ]
    setOrganizations(mockOrganizations)
  }, [])

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.subdomain.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleOrganizationSelect = (orgSubdomain: string) => {
    setSelectedOrg(orgSubdomain)
    setValue('subdomain', orgSubdomain)
  }

  const onSubmit = async (data: SelectOrganizationFormData) => {
    setIsLoading(true)

    try {
      // Redirect to OAuth provider with selected organization
      const provider = searchParams.get('provider') || 'google'
      const url = new URL(`/api/auth/signin/${provider}`, window.location.origin)
      url.searchParams.set('subdomain', data.subdomain)
      url.searchParams.set('callbackUrl', callbackUrl)

      window.location.href = url.toString()
    } catch (error) {
      console.error('Organization selection error:', error)
      toast.error('Failed to continue with selected organization')
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        {/* Header */}
        <div>
          <div className="mx-auto h-12 w-12 flex items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900">
            <Building className="h-6 w-6 text-blue-600 dark:text-blue-400" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
            Select your organization
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Choose which organization you'd like to access
          </p>
        </div>

        {/* Organization Selection */}
        <div className="bg-white dark:bg-gray-800 py-8 px-6 shadow rounded-lg">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Search */}
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Search organizations
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  id="search"
                  placeholder="Search by name or subdomain..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            {/* Organization List */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Available organizations
              </label>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {filteredOrganizations.length === 0 ? (
                  <div className="text-center py-8">
                    <Building className="mx-auto h-8 w-8 text-gray-400" />
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      {searchTerm ? 'No organizations found matching your search' : 'No organizations available'}
                    </p>
                  </div>
                ) : (
                  filteredOrganizations.map((org) => (
                    <div
                      key={org.id}
                      className={cn(
                        'border rounded-lg p-4 cursor-pointer transition-colors',
                        selectedOrg === org.subdomain
                          ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 dark:border-blue-400'
                          : 'border-gray-200 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700'
                      )}
                      onClick={() => handleOrganizationSelect(org.subdomain)}
                    >
                      <div className="flex items-start space-x-3">
                        <input
                          {...register('subdomain')}
                          type="radio"
                          value={org.subdomain}
                          className="mt-1 w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 focus:ring-blue-500 dark:focus:ring-blue-600 dark:ring-offset-gray-800 dark:bg-gray-700 dark:border-gray-600"
                          checked={selectedOrg === org.subdomain}
                          onChange={() => handleOrganizationSelect(org.subdomain)}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center space-x-2">
                            <h3 className="text-sm font-medium text-gray-900 dark:text-white">
                              {org.name}
                            </h3>
                            <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
                              <Users className="w-3 h-3 mr-1" />
                              {org.memberCount}
                            </div>
                          </div>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {org.subdomain}.cpa.com
                          </p>
                          {org.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                              {org.description}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {errors.subdomain && (
                <p className="mt-1 text-sm text-red-600">{errors.subdomain.message}</p>
              )}
            </div>

            {/* Continue Button */}
            <button
              type="submit"
              disabled={isLoading || !subdomain}
              className="w-full flex items-center justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed dark:focus:ring-offset-gray-800"
            >
              {isLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Continuing...
                </div>
              ) : (
                <>
                  Continue with selected organization
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Alternative Actions */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4">
          <div className="text-center space-y-3">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't see your organization?
            </p>
            <div className="space-y-2">
              <Link
                href="/auth/register"
                className="block w-full px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                Create new organization
              </Link>
              <button
                onClick={() => {
                  // Contact support functionality
                  window.location.href = 'mailto:support@cpaplatform.com?subject=Organization Access Request'
                }}
                className="block w-full px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-600"
              >
                Request access to organization
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <Link
            href="/auth/signin"
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Back to sign in
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

export default function SelectOrganizationPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    }>
      <SelectOrganizationContent />
    </Suspense>
  )
}