export default function HomePage() {
  return (
    <main className="min-h-screen bg-gray-50 py-12">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-8">
            CPA Advisory Platform
          </h1>
          <p className="text-xl text-gray-600 mb-12">
            Complete advisory platform for CPAs - Manage clients, sync with QuickBooks, and provide financial advisory services
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Client Management</h2>
              <p className="text-gray-600">Manage your clients with QuickBooks integration</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Document Management</h2>
              <p className="text-gray-600">Organize and manage client documents with OCR</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4">Financial Advisory</h2>
              <p className="text-gray-600">Provide comprehensive financial advisory services</p>
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}