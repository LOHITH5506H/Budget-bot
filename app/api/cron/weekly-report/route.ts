import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { pdfService } from '@/lib/pdf-generator';
import { getSendPulseClient } from '@/lib/sendpulse';

/**
 * POST /api/cron/weekly-report
 * 
 * EasyCron endpoint to generate and email weekly reports to all active users
 * This should be scheduled to run every Sunday at 9 AM
 * 
 * Security: Validate EasyCron token in headers
 */
export async function POST(request: NextRequest) {
  console.log('🕐 [Cron: Weekly Report] Starting automated weekly report generation...');

  try {
    // Validate EasyCron token for security
    const authHeader = request.headers.get('authorization');
    const expectedToken = process.env.EASYCRON_API_TOKEN;

    if (!expectedToken) {
      console.error('❌ [Cron: Weekly Report] EASYCRON_API_TOKEN not configured');
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Check for bearer token
    const token = authHeader?.replace('Bearer ', '');
    
    if (!token || token !== expectedToken) {
      console.error('❌ [Cron: Weekly Report] Invalid or missing authorization token');
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    console.log('✅ [Cron: Weekly Report] Authorization validated');

    // Get service role client to access all users
    const supabase = await createClient();

    // Fetch all active users who want weekly reports
    // Note: You might want to add a preference field in profiles table
    const { data: users, error: usersError } = await supabase
      .from('profiles')
      .select('id, email, display_name')
      .not('email', 'is', null);

    if (usersError) {
      console.error('❌ [Cron: Weekly Report] Error fetching users:', usersError);
      return NextResponse.json(
        { error: 'Failed to fetch users', details: usersError.message },
        { status: 500 }
      );
    }

    if (!users || users.length === 0) {
      console.log('⚠️ [Cron: Weekly Report] No users found');
      return NextResponse.json(
        { message: 'No users to process', count: 0 },
        { status: 200 }
      );
    }

    console.log(`📧 [Cron: Weekly Report] Processing ${users.length} users...`);

    const results = {
      success: [] as string[],
      failed: [] as string[],
    };

    // Process each user
    for (const user of users) {
      try {
        console.log(`📊 [Cron: Weekly Report] Generating PDF for ${user.email}...`);

        // Generate weekly PDF
        const pdfBuffer = await pdfService.generateExpenseReport(
          user.id,
          'weekly'
        );

        console.log(`✅ [Cron: Weekly Report] PDF generated for ${user.email} (${pdfBuffer.length} bytes)`);

        // Email the PDF
        const sendPulse = getSendPulseClient();
        const emailSubject = `Your Weekly Budget Report - ${new Date().toLocaleDateString()}`;
        const emailBody = `
          <h2>Hi ${user.display_name || 'there'}!</h2>
          <p>Your weekly budget report is ready!</p>
          <p>Please find your detailed expense report attached. Here's a quick summary:</p>
          <ul>
            <li>Report Period: Last 7 days</li>
            <li>Generated: ${new Date().toLocaleString()}</li>
          </ul>
          <p>Review your spending patterns and stay on track with your financial goals!</p>
          <br/>
          <p>Best regards,<br/>BudgetBot Team</p>
        `;

        await sendPulse.sendEmail({
          to: [user.email],
          subject: emailSubject,
          html: emailBody,
          from: {
            name: 'BudgetBot',
            email: 'noreply@budgetbot.com'
          },
          attachments: [{
            filename: `weekly-report-${new Date().toISOString().split('T')[0]}.pdf`,
            content: pdfBuffer.toString('base64'),
            encoding: 'base64',
            type: 'application/pdf',
          }]
        });

        console.log(`✅ [Cron: Weekly Report] Report sent to ${user.email}`);
        results.success.push(user.email);

      } catch (error) {
        console.error(`❌ [Cron: Weekly Report] Failed for ${user.email}:`, error);
        results.failed.push(user.email);
      }

      // Add small delay to avoid rate limits
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log(`🎉 [Cron: Weekly Report] Completed! Success: ${results.success.length}, Failed: ${results.failed.length}`);

    return NextResponse.json({
      message: 'Weekly reports processed',
      total: users.length,
      success: results.success.length,
      failed: results.failed.length,
      successEmails: results.success,
      failedEmails: results.failed,
    });

  } catch (error) {
    console.error('❌ [Cron: Weekly Report] Fatal error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to process weekly reports',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    // Close Puppeteer browser to free resources
    try {
      await pdfService.closeBrowser();
      console.log('🔒 [Cron: Weekly Report] Browser closed');
    } catch (err) {
      console.error('⚠️ [Cron: Weekly Report] Error closing browser:', err);
    }
  }
}

/**
 * GET /api/cron/weekly-report
 * 
 * Alternative endpoint for GET requests
 */
export async function GET(request: NextRequest) {
  return POST(request);
}
