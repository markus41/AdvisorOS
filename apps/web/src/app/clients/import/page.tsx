'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import {
  Upload,
  Download,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  ArrowLeft
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import Link from 'next/link'
import { toast } from 'react-hot-toast'

interface ImportResult {
  success: boolean
  totalRows: number
  imported: number
  updated: number
  skipped: number
  errors: Array<{
    row: number
    field: string
    error: string
  }>
}

const SAMPLE_CSV_DATA = `businessName,legalName,taxId,primaryContactName,primaryContactEmail,primaryContactPhone,businessType,industry,status,riskLevel,annualRevenue
Acme Corporation,Acme Corporation Inc.,12-3456789,John Doe,john@acme.com,555-123-4567,Corporation,Technology,active,medium,1000000
Smith & Associates,Smith & Associates LLC,98-7654321,Jane Smith,jane@smith.com,555-987-6543,LLC,Consulting,active,low,500000
Tech Startup,Tech Startup Inc.,11-2233445,Bob Johnson,bob@techstartup.com,555-456-7890,Corporation,Technology,prospect,high,250000`

export default function ClientImportPage() {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [skipDuplicates, setSkipDuplicates] = useState(true)
  const [updateExisting, setUpdateExisting] = useState(false)
  const [activeTab, setActiveTab] = useState('upload')

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0]
    if (selectedFile) {
      if (selectedFile.type !== 'text/csv' && !selectedFile.name.endsWith('.csv')) {
        toast.error('Please select a CSV file')
        return
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB')
        return
      }
      setFile(selectedFile)
    }
  }

  const handleImport = async () => {
    if (!file) {
      toast.error('Please select a file to import')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('skipDuplicates', skipDuplicates.toString())
      formData.append('updateExisting', updateExisting.toString())

      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      const response = await fetch('/api/clients/import', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        throw new Error('Import failed')
      }

      const result: ImportResult = await response.json()
      setImportResult(result)
      setActiveTab('results')

      if (result.success) {
        toast.success(`Import completed! ${result.imported} clients imported.`)
      } else {
        toast.error(`Import completed with ${result.errors.length} errors.`)
      }
    } catch (error) {
      toast.error('Import failed. Please try again.')
      console.error('Import error:', error)
    } finally {
      setIsUploading(false)
      setTimeout(() => setUploadProgress(0), 1000)
    }
  }

  const downloadSampleCSV = () => {
    const blob = new Blob([SAMPLE_CSV_DATA], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'client-import-sample.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center space-x-4 mb-4">
          <Button asChild variant="ghost" size="sm">
            <Link href="/clients" className="flex items-center">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Clients
            </Link>
          </Button>
        </div>

        <div>
          <h1 className="text-3xl font-bold tracking-tight">Import Clients</h1>
          <p className="text-muted-foreground">
            Import multiple clients from a CSV file
          </p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="upload">Upload & Import</TabsTrigger>
          <TabsTrigger value="results" disabled={!importResult}>
            Results
          </TabsTrigger>
        </TabsList>

        <TabsContent value="instructions" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Import Instructions</h3>

            <div className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Required Fields</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">businessName</code> - Business name (required)</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">primaryContactName</code> - Primary contact name (required)</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">primaryContactEmail</code> - Primary contact email (required)</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">Optional Fields</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• <code className="bg-gray-100 px-1 rounded">legalName</code> - Legal business name</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">taxId</code> - Tax ID/EIN</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">primaryContactPhone</code> - Primary contact phone</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">businessType</code> - Business entity type</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">industry</code> - Industry sector</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">status</code> - Client status (active, inactive, prospect)</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">riskLevel</code> - Risk level (low, medium, high)</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">annualRevenue</code> - Annual revenue amount</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">businessAddress</code> - Business address</li>
                  <li>• <code className="bg-gray-100 px-1 rounded">website</code> - Company website</li>
                </ul>
              </div>

              <div>
                <h4 className="font-medium mb-2">File Requirements</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• File format: CSV (.csv)</li>
                  <li>• Maximum file size: 10MB</li>
                  <li>• First row must contain column headers</li>
                  <li>• Encoding: UTF-8</li>
                </ul>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-medium">Download Sample CSV</h4>
                  <p className="text-sm text-gray-600">
                    Use this template to format your data correctly
                  </p>
                </div>
                <Button variant="outline" onClick={downloadSampleCSV}>
                  <Download className="mr-2 h-4 w-4" />
                  Download Sample
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="upload" className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-lg font-semibold mb-4">Upload CSV File</h3>

            {/* File Upload */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="file-upload">Select CSV File</Label>
                <div className="mt-2">
                  <Input
                    ref={fileInputRef}
                    id="file-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileSelect}
                    className="file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
                  />
                </div>
                {file && (
                  <div className="mt-2 flex items-center text-sm text-gray-600">
                    <FileText className="mr-2 h-4 w-4" />
                    {file.name} ({(file.size / 1024).toFixed(1)} KB)
                  </div>
                )}
              </div>

              {/* Options */}
              <div className="space-y-3">
                <h4 className="font-medium">Import Options</h4>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="skip-duplicates"
                    checked={skipDuplicates}
                    onCheckedChange={setSkipDuplicates}
                  />
                  <Label htmlFor="skip-duplicates" className="text-sm">
                    Skip duplicate clients (based on business name or email)
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="update-existing"
                    checked={updateExisting}
                    onCheckedChange={setUpdateExisting}
                  />
                  <Label htmlFor="update-existing" className="text-sm">
                    Update existing clients with new data
                  </Label>
                </div>
              </div>

              {/* Progress */}
              {isUploading && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Importing clients...</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="w-full" />
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-4 pt-4">
                <Button
                  onClick={handleImport}
                  disabled={!file || isUploading}
                  className="flex items-center"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  {isUploading ? 'Importing...' : 'Import Clients'}
                </Button>

                {file && (
                  <Button
                    variant="outline"
                    onClick={() => {
                      setFile(null)
                      if (fileInputRef.current) {
                        fileInputRef.current.value = ''
                      }
                    }}
                  >
                    Clear File
                  </Button>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="results" className="space-y-6">
          {importResult && (
            <div className="space-y-6">
              {/* Summary */}
              <div className="rounded-lg border bg-card p-6">
                <h3 className="text-lg font-semibold mb-4">Import Summary</h3>

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {importResult.totalRows}
                    </div>
                    <div className="text-sm text-gray-600">Total Rows</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {importResult.imported}
                    </div>
                    <div className="text-sm text-gray-600">Imported</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {importResult.updated}
                    </div>
                    <div className="text-sm text-gray-600">Updated</div>
                  </div>

                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-600">
                      {importResult.skipped}
                    </div>
                    <div className="text-sm text-gray-600">Skipped</div>
                  </div>
                </div>

                <div className="mt-4 flex items-center">
                  {importResult.success ? (
                    <div className="flex items-center text-green-600">
                      <CheckCircle className="mr-2 h-5 w-5" />
                      Import completed successfully
                    </div>
                  ) : (
                    <div className="flex items-center text-red-600">
                      <XCircle className="mr-2 h-5 w-5" />
                      Import completed with {importResult.errors.length} errors
                    </div>
                  )}
                </div>
              </div>

              {/* Errors */}
              {importResult.errors.length > 0 && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-6">
                  <h4 className="font-medium text-red-800 mb-4 flex items-center">
                    <AlertCircle className="mr-2 h-5 w-5" />
                    Import Errors ({importResult.errors.length})
                  </h4>

                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {importResult.errors.map((error, index) => (
                      <div
                        key={index}
                        className="flex items-start space-x-3 text-sm text-red-700"
                      >
                        <Badge variant="outline" className="text-red-600 border-red-300">
                          Row {error.row}
                        </Badge>
                        <div>
                          <span className="font-medium">{error.field}:</span> {error.error}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center space-x-4">
                <Button asChild>
                  <Link href="/clients">
                    View All Clients
                  </Link>
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setActiveTab('upload')
                    setImportResult(null)
                    setFile(null)
                    if (fileInputRef.current) {
                      fileInputRef.current.value = ''
                    }
                  }}
                >
                  Import Another File
                </Button>
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}