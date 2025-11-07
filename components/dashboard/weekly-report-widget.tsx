'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function WeeklyReportWidget() {
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const generateReport = async () => {
    setIsGenerating(true);
    
    try {
      toast({
        title: '📊 Generating Report',
        description: 'Creating your weekly expense report...',
      });

      const response = await fetch('/api/reports/generate-weekly', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to generate report');
      }

      // Get the CSV as a blob
      const blob = await response.blob();
      
      // Create a download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `weekly-report-${new Date().toISOString().split('T')[0]}.pdf`;
      
      // Trigger download
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: '✅ Report Generated',
        description: 'Your weekly report has been downloaded successfully!',
      });

    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: '❌ Generation Failed',
        description: error instanceof Error ? error.message : 'Failed to generate report',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div>
          <CardTitle className="text-lg font-semibold">Weekly Report</CardTitle>
          <CardDescription className="text-sm">
            Download your expense report
          </CardDescription>
        </div>
        <FileText className="h-5 w-5 text-blue-600" />
      </CardHeader>
      <CardContent>
        <p className="text-sm text-gray-600 mb-4">
          Get a comprehensive PDF report of your expenses, goals, and subscriptions from the last 7 days.
        </p>
        
        <Button
          onClick={generateReport}
          disabled={isGenerating}
          className="w-full"
          variant="default"
        >
          {isGenerating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="mr-2 h-4 w-4" />
              Generate Report
            </>
          )}
        </Button>

        <p className="text-xs text-gray-500 mt-3 text-center">
          You also receive this report every Sunday via email
        </p>
      </CardContent>
    </Card>
  );
}
