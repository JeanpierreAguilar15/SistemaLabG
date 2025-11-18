'use client'

import { useEffect, useState } from 'react'
import { useAuthStore } from '@/lib/store'

export default function DebugPage() {
  const { accessToken, user } = useAuthStore()
  const [mounted, setMounted] = useState(false)
  const [testResults, setTestResults] = useState<any>({})

  useEffect(() => {
    setMounted(true)
  }, [])

  const testEndpoint = async (name: string, url: string) => {
    try {
      console.log(`Testing ${name}:`, url)
      const response = await fetch(url, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      const status = response.status
      let data = null
      let error = null

      try {
        const text = await response.text()
        data = text ? JSON.parse(text) : null
      } catch (e) {
        error = 'Failed to parse response'
      }

      setTestResults((prev: any) => ({
        ...prev,
        [name]: { status, data, error, url }
      }))
    } catch (err: any) {
      setTestResults((prev: any) => ({
        ...prev,
        [name]: { error: err.message, url }
      }))
    }
  }

  const runTests = () => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL
    testEndpoint('packages', `${apiUrl}/admin/packages`)
    testEndpoint('suppliers', `${apiUrl}/admin/suppliers`)
    testEndpoint('inventory', `${apiUrl}/admin/inventory/items`)
  }

  if (!mounted) return <div>Loading...</div>

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-3xl font-bold">Debug Information</h1>

      {/* Environment Variables */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <strong>NEXT_PUBLIC_API_URL:</strong>{' '}
            <span className="text-blue-600">{process.env.NEXT_PUBLIC_API_URL || 'UNDEFINED'}</span>
          </div>
          <div>
            <strong>NODE_ENV:</strong>{' '}
            <span className="text-blue-600">{process.env.NODE_ENV}</span>
          </div>
        </div>
      </div>

      {/* Auth State */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Authentication State</h2>
        <div className="space-y-2 font-mono text-sm">
          <div>
            <strong>User:</strong>{' '}
            <span className="text-blue-600">{user ? JSON.stringify(user) : 'null'}</span>
          </div>
          <div>
            <strong>Access Token:</strong>{' '}
            <span className="text-blue-600">
              {accessToken ? `${accessToken.substring(0, 50)}...` : 'null'}
            </span>
          </div>
        </div>
      </div>

      {/* Test Endpoints */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-xl font-semibold mb-4">Test Endpoints</h2>
        <button
          onClick={runTests}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 mb-4"
        >
          Run Tests
        </button>

        <div className="space-y-4">
          {Object.entries(testResults).map(([name, result]: [string, any]) => (
            <div key={name} className="border-l-4 border-blue-500 pl-4">
              <h3 className="font-semibold">{name}</h3>
              <div className="font-mono text-xs space-y-1">
                <div><strong>URL:</strong> {result.url}</div>
                <div>
                  <strong>Status:</strong>{' '}
                  <span className={result.status === 200 ? 'text-green-600' : 'text-red-600'}>
                    {result.status || 'ERROR'}
                  </span>
                </div>
                {result.error && (
                  <div className="text-red-600"><strong>Error:</strong> {result.error}</div>
                )}
                {result.data && (
                  <div>
                    <strong>Data:</strong>
                    <pre className="bg-gray-100 p-2 mt-1 overflow-auto max-h-40">
                      {JSON.stringify(result.data, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Console Logs */}
      <div className="bg-yellow-50 p-6 rounded-lg border border-yellow-200">
        <h2 className="text-xl font-semibold mb-2">Console Instructions</h2>
        <p className="text-sm">
          Open browser console (F12) and check for any errors or console.log messages
          from the admin pages.
        </p>
      </div>
    </div>
  )
}
