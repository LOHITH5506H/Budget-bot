import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pdfService } from '@/lib/pdf-generator';

// Increase timeout for PDF generation
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/generate-weekly
 * 
 * Generates a weekly expense report PDF for the authenticated user
 * Can be called manually from the dashboard
 */
export async function POST(request: NextRequest) {
  console.log('📊 [Weekly Report] Starting PDF generation...');

  try {
    // Authenticate user
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      console.error('❌ [Weekly Report] Authentication failed:', authError);
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log(`✅ [Weekly Report] User authenticated: ${user.email}`);

    // Parse request body for optional date range
    let dateRange: { start: string; end: string } | undefined;
    try {
      const body = await request.json();
      if (body.dateRange) {
        dateRange = body.dateRange;
      }
    } catch {
      // No body or invalid JSON, use default weekly range
    }

    // Generate PDF
    console.log(`📄 [Weekly Report] Generating PDF for user: ${user.id}`);
    const pdfBuffer = await pdfService.generateExpenseReport(
      user.id,
      'weekly',
      dateRange
    );

    console.log(`✅ [Weekly Report] PDF generated successfully (${pdfBuffer.length} bytes)`);

    // Return PDF as downloadable file
    const filename = `weekly-report-${new Date().toISOString().split('T')[0]}.pdf`;
    
    return new NextResponse(pdfBuffer as unknown as BodyInit, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ [Weekly Report] Error generating PDF:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate PDF report',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/reports/generate-weekly
 * 
 * Alternative endpoint for GET requests
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
