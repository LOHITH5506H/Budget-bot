"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Download, FileText, BarChart, Target, CreditCard, Clock, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

type ReportType = "expense" | "goals" | "subscriptions" | "comprehensive"
type ReportPeriod = "week" | "month" | "quarter" | "year" | "custom"

interface Report {
  id: string
  type: ReportType
  period: ReportPeriod
  title: string
  generatedAt: Date
  status: "generating" | "ready" | "failed"
  downloadUrl?: string
  size?: string
}

interface ReportsManagerProps {
  userId: string
}

export function ReportsManager({ userId }: ReportsManagerProps) {
  const { toast } = useToast()
  const [selectedType, setSelectedType] = useState<ReportType>("expense")
  const [selectedPeriod, setSelectedPeriod] = useState<ReportPeriod>("month")
  const [isGenerating, setIsGenerating] = useState(false)
  const [reports, setReports] = useState<Report[]>([
    {
      id: "1",
      type: "expense",
      period: "month",
      title: "Monthly Expense Report - December 2024",
      generatedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
      status: "ready",
      downloadUrl: "/reports/expense-dec-2024.pdf",
      size: "2.3 MB"
    },
    {
      id: "2", 
      type: "comprehensive",
      period: "quarter",
      title: "Q4 2024 Financial Summary",
      generatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      status: "ready",
      downloadUrl: "/reports/q4-2024-summary.pdf",
      size: "4.1 MB"
    }
  ])

  const reportTypes = [
    { value: "expense", label: "Expense Report", icon: BarChart },
    { value: "goals", label: "Savings Goals", icon: Target },
    { value: "subscriptions", label: "Subscriptions", icon: CreditCard },
    { value: "comprehensive", label: "Comprehensive Report", icon: FileText }
  ]

  const reportPeriods = [
    { value: "week", label: "Last Week" },
    { value: "month", label: "Last Month" },
    { value: "quarter", label: "Last Quarter" },
    { value: "year", label: "Last Year" },
    { value: "custom", label: "Custom Range" }
  ]

  const generateReport = async () => {
    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/reports/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: selectedType,
          period: selectedPeriod,
          startDate: getPeriodStartDate(selectedPeriod),
          endDate: new Date()
        })
      })

      if (!response.ok) {
        throw new Error('Failed to generate report')
      }

      const data = await response.json()
      
      // Add new report to the list with generating status
      const newReport: Report = {
        id: data.reportId || Date.now().toString(),
        type: selectedType,
        period: selectedPeriod,
        title: `${reportTypes.find(t => t.value === selectedType)?.label} - ${formatPeriodTitle(selectedPeriod)}`,
        generatedAt: new Date(),
        status: "generating"
      }

      setReports(prev => [newReport, ...prev])

      // Simulate report generation progress
      setTimeout(() => {
        setReports(prev => prev.map(report => 
          report.id === newReport.id 
            ? { 
                ...report, 
                status: "ready", 
                downloadUrl: data.downloadUrl || `/reports/${newReport.id}.pdf`,
                size: "1.8 MB"
              }
            : report
        ))
        
        toast({
          title: "Report Generated",
          description: "Your report is ready for download!",
        })
      }, 3000) // Simulate 3 second generation time

      toast({
        title: "Generating Report",
        description: "Your report is being generated. You'll be notified when it's ready.",
      })

    } catch (error) {
      console.error('Error generating report:', error)
      toast({
        title: "Error",
        description: "Failed to generate report. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsGenerating(false)
    }
  }

  const downloadReport = async (report: Report) => {
    if (!report.downloadUrl) return

    try {
      const response = await fetch(report.downloadUrl)
      const blob = await response.blob()
      
      // Create download link
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.style.display = 'none'
      a.href = url
      a.download = `${report.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`
      
      document.body.appendChild(a)
      a.click()
      
      // Clean up
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Download Started",
        description: "Your report is being downloaded.",
      })
    } catch (error) {
      console.error('Error downloading report:', error)
      toast({
        title: "Error",
        description: "Failed to download report. Please try again.",
        variant: "destructive"
      })
    }
  }

  const getPeriodStartDate = (period: ReportPeriod): Date => {
    const now = new Date()
    switch (period) {
      case "week":
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
      case "month":
        return new Date(now.getFullYear(), now.getMonth() - 1, now.getDate())
      case "quarter":
        return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate())
      case "year":
        return new Date(now.getFullYear() - 1, now.getMonth(), now.getDate())
      default:
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
    }
  }

  const formatPeriodTitle = (period: ReportPeriod): string => {
    const now = new Date()
    switch (period) {
      case "week":
        return `Week of ${now.toLocaleDateString()}`
      case "month":
        return now.toLocaleDateString('default', { month: 'long', year: 'numeric' })
      case "quarter":
        const quarter = Math.floor(now.getMonth() / 3) + 1
        return `Q${quarter} ${now.getFullYear()}`
      case "year":
        return now.getFullYear().toString()
      default:
        return "Custom Period"
    }
  }

  const getStatusIcon = (status: Report['status']) => {
    switch (status) {
      case "generating":
        return <Clock className="w-4 h-4 text-yellow-600 animate-spin" />
      case "ready":
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />
    }
  }

  const getStatusBadge = (status: Report['status']) => {
    switch (status) {
      case "generating":
        return <Badge variant="outline" className="text-yellow-600">Generating</Badge>
      case "ready":
        return <Badge variant="default" className="bg-green-600">Ready</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  return (
    <div className="space-y-6">
      {/* Report Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileText className="w-5 h-5 mr-2 text-gray-600" />
            Generate New Report
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Report Type</label>
              <Select value={selectedType} onValueChange={(value: ReportType) => setSelectedType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select report type" />
                </SelectTrigger>
                <SelectContent>
                  {reportTypes.map((type) => {
                    const IconComponent = type.icon
                    return (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center">
                          <IconComponent className="w-4 h-4 mr-2" />
                          {type.label}
                        </div>
                      </SelectItem>
                    )
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Time Period</label>
              <Select value={selectedPeriod} onValueChange={(value: ReportPeriod) => setSelectedPeriod(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  {reportPeriods.map((period) => (
                    <SelectItem key={period.value} value={period.value}>
                      {period.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={generateReport} 
            disabled={isGenerating}
            className="w-full md:w-auto"
          >
            {isGenerating ? "Generating..." : "Generate Report"}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Reports */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-gray-600" />
              Generated Reports
            </div>
            <Badge variant="secondary">{reports.length} reports</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {reports.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No reports generated yet</p>
          ) : (
            <div className="space-y-3">
              {reports.map((report) => {
                const TypeIcon = reportTypes.find(t => t.value === report.type)?.icon || FileText
                return (
                  <div
                    key={report.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                  >
                    <div className="flex items-start space-x-3">
                      <TypeIcon className="w-5 h-5 text-gray-600 mt-0.5" />
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{report.title}</h4>
                        <div className="flex items-center space-x-4 mt-1">
                          <p className="text-xs text-gray-500">
                            Generated {report.generatedAt.toLocaleDateString()}
                          </p>
                          {report.size && (
                            <p className="text-xs text-gray-500">{report.size}</p>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(report.status)}
                      {getStatusBadge(report.status)}
                      {report.status === "ready" && (
                        <Button
                          onClick={() => downloadReport(report)}
                          variant="outline"
                          size="sm"
                        >
                          <Download className="w-4 h-4 mr-1" />
                          Download
                        </Button>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}