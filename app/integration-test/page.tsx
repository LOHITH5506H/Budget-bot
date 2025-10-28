"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Calendar, 
  FileText, 
  Bell, 
  Image, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download,
  RefreshCw,
  Zap
} from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface TestResult {
  service: string
  status: "pending" | "testing" | "success" | "error"
  message: string
  details?: string
}

export default function IntegrationTestPage() {
  const { toast } = useToast()
  const [testResults, setTestResults] = useState<TestResult[]>([
    { service: "EasyCron", status: "pending", message: "Not tested yet" },
    { service: "Puppeteer PDF", status: "pending", message: "Not tested yet" },
    { service: "Logo.dev", status: "pending", message: "Not tested yet" },
    { service: "Pusher", status: "pending", message: "Not tested yet" },
  ])

  const updateTestResult = (service: string, status: TestResult['status'], message: string, details?: string) => {
    setTestResults(prev => prev.map(result => 
      result.service === service 
        ? { ...result, status, message, details }
        : result
    ))
  }

  const testEasyCron = async () => {
    updateTestResult("EasyCron", "testing", "Testing EasyCron integration...")
    
    try {
      const response = await fetch('/api/easycron/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          type: 'bill_reminder',
          data: {
            billName: 'Test Subscription',
            amount: 9.99,
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
          }
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        updateTestResult("EasyCron", "success", "EasyCron job created successfully", 
          `Job ID: ${result.jobId}, Status: ${result.status}`)
      } else {
        updateTestResult("EasyCron", "error", "EasyCron test failed", result.error)
      }
    } catch (error) {
      updateTestResult("EasyCron", "error", "EasyCron connection failed", 
        error instanceof Error ? error.message : "Unknown error")
    }
  }

  const testPuppeteerPDF = async () => {
    updateTestResult("Puppeteer PDF", "testing", "Generating test PDF report...")
    
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          type: 'expense',
          period: 'week',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          endDate: new Date().toISOString()
        })
      })

      if (response.ok) {
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/pdf')) {
          // PDF was generated successfully
          updateTestResult("Puppeteer PDF", "success", "PDF report generated successfully", 
            `PDF size: ${response.headers.get('content-length')} bytes`)
        } else {
          const result = await response.json()
          updateTestResult("Puppeteer PDF", "success", "PDF generation initiated", 
            `Report ID: ${result.reportId}`)
        }
      } else {
        const error = await response.json()
        updateTestResult("Puppeteer PDF", "error", "PDF generation failed", error.error)
      }
    } catch (error) {
      updateTestResult("Puppeteer PDF", "error", "PDF service unavailable", 
        error instanceof Error ? error.message : "Unknown error")
    }
  }

  const testLogoService = async () => {
    updateTestResult("Logo.dev", "testing", "Searching for service logos...")
    
    try {
      const response = await fetch('/api/logos/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: 'Netflix' })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        const suggestionCount = result.suggestions?.length || 0
        updateTestResult("Logo.dev", "success", `Found ${suggestionCount} logo suggestions`, 
          `Sample logos for Netflix retrieved successfully`)
      } else {
        updateTestResult("Logo.dev", "error", "Logo search failed", result.error)
      }
    } catch (error) {
      updateTestResult("Logo.dev", "error", "Logo service unavailable", 
        error instanceof Error ? error.message : "Unknown error")
    }
  }

  const testPusher = async () => {
    updateTestResult("Pusher", "testing", "Testing Pusher notifications...")
    
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: 'test-user',
          type: 'general',
          title: 'Integration Test',
          message: 'This is a test notification from the integration test page'
        })
      })

      const result = await response.json()
      
      if (response.ok && result.success) {
        updateTestResult("Pusher", "success", "Pusher notification sent successfully", 
          `Notification delivered via ${result.channels?.join(', ') || 'Pusher'}`)
      } else {
        updateTestResult("Pusher", "error", "Pusher notification failed", result.error)
      }
    } catch (error) {
      updateTestResult("Pusher", "error", "Pusher service unavailable", 
        error instanceof Error ? error.message : "Unknown error")
    }
  }

  const runAllTests = async () => {
    // Reset all results
    setTestResults(prev => prev.map(result => ({ ...result, status: "pending", message: "Queued for testing..." })))
    
    toast({
      title: "Running Integration Tests",
      description: "Testing all services. This may take a few moments...",
    })

    // Run tests sequentially to avoid overwhelming the services
    await testEasyCron()
    await new Promise(resolve => setTimeout(resolve, 1000)) // 1 second delay
    
    await testPuppeteerPDF()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testLogoService()
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    await testPusher()
    
    const allPassed = testResults.every(result => result.status === "success")
    toast({
      title: "Integration Tests Complete",
      description: allPassed ? "All services are working correctly!" : "Some tests failed. Check the results below.",
      variant: allPassed ? "default" : "destructive"
    })
  }

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-gray-400" />
      case "testing":
        return <RefreshCw className="w-4 h-4 text-blue-500 animate-spin" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "error":
        return <XCircle className="w-4 h-4 text-red-500" />
    }
  }

  const getStatusBadge = (status: TestResult['status']) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline">Pending</Badge>
      case "testing":
        return <Badge variant="outline" className="text-blue-600">Testing</Badge>
      case "success":
        return <Badge variant="default" className="bg-green-600">Success</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
    }
  }

  const getServiceIcon = (service: string) => {
    switch (service) {
      case "EasyCron":
        return <Calendar className="w-5 h-5" />
      case "Puppeteer PDF":
        return <FileText className="w-5 h-5" />
      case "Logo.dev":
        return <Image className="w-5 h-5" />
      case "Pusher":
        return <Bell className="w-5 h-5" />
      default:
        return <Zap className="w-5 h-5" />
    }
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Integration Tests</h1>
          <p className="text-gray-600">Test all external service integrations</p>
        </div>
        <Button onClick={runAllTests} className="bg-emerald-600 hover:bg-emerald-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Run All Tests
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {testResults.map((result) => (
          <Card key={result.service}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  {getServiceIcon(result.service)}
                  <span className="ml-2">{result.service}</span>
                </div>
                {getStatusIcon(result.status)}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Status:</span>
                  {getStatusBadge(result.status)}
                </div>
                
                <div>
                  <span className="text-sm font-medium">Message:</span>
                  <p className="text-sm text-gray-600 mt-1">{result.message}</p>
                </div>
                
                {result.details && (
                  <div>
                    <span className="text-sm font-medium">Details:</span>
                    <p className="text-xs text-gray-500 mt-1 font-mono bg-gray-50 p-2 rounded">
                      {result.details}
                    </p>
                  </div>
                )}
                
                <div className="pt-2">
                  <Button
                    onClick={() => {
                      switch (result.service) {
                        case "EasyCron": testEasyCron(); break
                        case "Puppeteer PDF": testPuppeteerPDF(); break
                        case "Logo.dev": testLogoService(); break
                        case "Pusher": testPusher(); break
                      }
                    }}
                    variant="outline"
                    size="sm"
                    disabled={result.status === "testing"}
                    className="w-full"
                  >
                    {result.status === "testing" ? "Testing..." : "Test Service"}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Service Information</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="easycron" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="easycron">EasyCron</TabsTrigger>
              <TabsTrigger value="pdf">Puppeteer</TabsTrigger>
              <TabsTrigger value="logo">Logo.dev</TabsTrigger>
              <TabsTrigger value="pusher">Pusher</TabsTrigger>
            </TabsList>
            
            <TabsContent value="easycron" className="space-y-2">
              <h4 className="font-semibold">EasyCron Scheduling Service</h4>
              <p className="text-sm text-gray-600">
                Handles scheduled tasks like bill reminders and goal milestone notifications.
                Creates reliable cron jobs that trigger at specified intervals.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Endpoint:</strong> /api/easycron/test<br />
                <strong>Features:</strong> Bill reminders, Goal milestones, Custom schedules
              </div>
            </TabsContent>
            
            <TabsContent value="pdf" className="space-y-2">
              <h4 className="font-semibold">Puppeteer PDF Generation</h4>
              <p className="text-sm text-gray-600">
                Generates comprehensive PDF reports including expense analysis, savings goals, 
                and subscription overviews using headless Chrome.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Endpoint:</strong> /api/reports/generate<br />
                <strong>Features:</strong> Expense reports, Goal tracking, Visual charts
              </div>
            </TabsContent>
            
            <TabsContent value="logo" className="space-y-2">
              <h4 className="font-semibold">Logo.dev API Integration</h4>
              <p className="text-sm text-gray-600">
                Automatically fetches company logos when adding subscriptions to enhance 
                the visual experience and brand recognition.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Endpoint:</strong> /api/logos/search<br />
                <strong>Features:</strong> Logo suggestions, Brand recognition, Visual enhancement
              </div>
            </TabsContent>
            
            <TabsContent value="pusher" className="space-y-2">
              <h4 className="font-semibold">Pusher Real-time Notifications</h4>
              <p className="text-sm text-gray-600">
                Provides real-time push notifications for instant updates on expenses, 
                goals, and important financial events.
              </p>
              <div className="text-xs text-gray-500">
                <strong>Endpoint:</strong> /api/notifications/send<br />
                <strong>Features:</strong> Real-time updates, Push notifications, Event streaming
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}