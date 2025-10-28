import { NextRequest, NextResponse } from 'next/server';
import { pdfService } from '@/lib/pdf-generator';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, type, format, dateRange, email } = body;

    console.log('Generating report:', { userId, type, format });

    if (!userId || !type) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      console.error('User not found:', userId);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Generate PDF report
    const pdfBuffer = await pdfService.generateExpenseReport(
      userId,
      type as 'weekly' | 'monthly' | 'custom',
      dateRange
    );

    const reportName = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;

    if (format === 'email') {
      // Send report via email using SendPulse
      const emailResult = await sendReportEmail(user, pdfBuffer, reportName, type);
      
      if (emailResult.success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Report generated and sent via email',
          sentTo: email || user.email
        });
      } else {
        return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
      }
    } else {
      // Return PDF as download
      return new NextResponse(pdfBuffer as any, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${reportName}"`,
          'Content-Length': pdfBuffer.length.toString(),
        },
      });
    }

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const type = searchParams.get('type') || 'monthly';
    const format = searchParams.get('format') || 'download';

    if (!userId) {
      return NextResponse.json({ error: 'Missing user_id parameter' }, { status: 400 });
    }

    // Generate PDF report
    const pdfBuffer = await pdfService.generateExpenseReport(
      userId,
      type as 'weekly' | 'monthly' | 'custom'
    );

    const reportName = `${type}-report-${new Date().toISOString().split('T')[0]}.pdf`;

    if (format === 'email') {
      // Handle email sending (called from cron jobs)
      const supabase = await createClient();
      const { data: user } = await supabase
        .from('profiles')
        .select('id, display_name, email')
        .eq('id', userId)
        .single();

      if (user) {
        await sendReportEmail(user, pdfBuffer, reportName, type);
      }

      return NextResponse.json({ success: true, message: 'Report sent via email' });
    }

    // Return PDF as download
    return new NextResponse(pdfBuffer as any, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${reportName}"`,
        'Content-Length': pdfBuffer.length.toString(),
      },
    });

  } catch (error) {
    console.error('Report generation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function sendReportEmail(user: any, pdfBuffer: Buffer, fileName: string, reportType: string): Promise<{ success: boolean }> {
  try {
    // Convert PDF buffer to base64 for email attachment
    const pdfBase64 = pdfBuffer.toString('base64');

    const emailData = {
      to: user.email,
      subject: `Your ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Expense Report - BudgetBot`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #10b981, #3b82f6); color: white; padding: 20px; text-align: center;">
            <h1>Your ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report is Ready!</h1>
          </div>
          
          <div style="padding: 20px; background: #f8f9fa;">
            <p>Hello ${user.display_name || 'there'},</p>
            
            <p>Your ${reportType} expense report has been generated and is attached to this email.</p>
            
            <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <h3 style="color: #374151; margin-top: 0;">📊 What's included in your report:</h3>
              <ul style="color: #6b7280;">
                <li>Complete expense breakdown by category</li>
                <li>Needs vs Wants analysis</li>
                <li>Savings goals progress</li>
                <li>Active subscriptions overview</li>
                <li>Spending insights and trends</li>
              </ul>
            </div>
            
            <p>Keep tracking your expenses to maintain better financial health!</p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.NEXT_PUBLIC_SITE_URL}/dashboard" 
                 style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                View Dashboard
              </a>
            </div>
            
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #6b7280; text-align: center;">
              This email was sent automatically by BudgetBot.<br>
              If you no longer wish to receive these reports, you can disable them in your account settings.
            </p>
          </div>
        </div>
      `,
      attachments: [
        {
          filename: fileName,
          content: pdfBase64,
          encoding: 'base64',
          type: 'application/pdf',
        },
      ],
    };

    // Send email using SendPulse API
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'email',
        userId: user.id,
        ...emailData,
      }),
    });

    const result = await response.json();
    return { success: result.success || false };

  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false };
  }
}