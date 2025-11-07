import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Increase timeout for report generation
export const maxDuration = 60; // 60 seconds
export const dynamic = 'force-dynamic';

/**
 * POST /api/reports/generate-weekly
 * 
 * Generates a weekly expense report CSV for the authenticated user
 * Can be called manually from the dashboard
 */
export async function POST(request: NextRequest) {
  console.log('📊 [Weekly Report] Starting CSV generation...');

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
    let startDate: string, endDate: string;
    try {
      const body = await request.json();
      if (body.dateRange) {
        startDate = body.dateRange.start;
        endDate = body.dateRange.end;
      } else {
        // Default to last 7 days
        const now = new Date();
        const weekAgo = new Date(now);
        weekAgo.setDate(now.getDate() - 7);
        startDate = weekAgo.toISOString().split('T')[0];
        endDate = now.toISOString().split('T')[0];
      }
    } catch {
      // Default to last 7 days
      const now = new Date();
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    }

    console.log(`📄 [Weekly Report] Generating CSV for period: ${startDate} to ${endDate}`);

    // Fetch expenses with categories
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select(`
        id, amount, description, expense_date, is_need,
        categories (name, color)
      `)
      .eq('user_id', user.id)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    if (expensesError) {
      console.error('❌ [Weekly Report] Error fetching expenses:', expensesError);
      return NextResponse.json(
        { error: 'Failed to fetch expenses' },
        { status: 500 }
      );
    }

    // Calculate summary
    const totalExpenses = expenses?.reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
    const totalNeeds = expenses?.filter(exp => exp.is_need).reduce((sum, exp) => sum + Number(exp.amount), 0) || 0;
    const totalWants = totalExpenses - totalNeeds;

    // Generate CSV content
    let csvContent = 'Weekly Expense Report\n';
    csvContent += `Period: ${startDate} to ${endDate}\n`;
    csvContent += `Total Expenses: ₹${totalExpenses.toLocaleString()}\n`;
    csvContent += `Needs: ₹${totalNeeds.toLocaleString()}\n`;
    csvContent += `Wants: ₹${totalWants.toLocaleString()}\n`;
    csvContent += '\n';
    csvContent += 'Date,Description,Category,Type,Amount\n';

    expenses?.forEach(exp => {
      const date = new Date(exp.expense_date).toLocaleDateString();
      const description = `"${exp.description?.replace(/"/g, '""') || ''}"`;
      const category = (exp.categories as any)?.name || 'Other';
      const type = exp.is_need ? 'Need' : 'Want';
      const amount = exp.amount;
      csvContent += `${date},${description},${category},${type},₹${amount}\n`;
    });

    console.log(`✅ [Weekly Report] CSV generated successfully (${expenses?.length || 0} transactions)`);

    // Return CSV as downloadable file
    const filename = `weekly-report-${startDate}-to-${endDate}.csv`;
    
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': csvContent.length.toString(),
      },
    });

  } catch (error) {
    console.error('❌ [Weekly Report] Error generating CSV:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to generate report',
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
