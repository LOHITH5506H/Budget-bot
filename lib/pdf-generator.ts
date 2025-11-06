import { Browser, Page } from 'puppeteer-core';
import { createClient } from '@/lib/supabase/server';

interface ReportData {
  user: {
    id: string;
    display_name: string;
    email: string;
  };
  expenses: Array<{
    id: string;
    amount: number;
    description: string;
    expense_date: string;
    is_need: boolean;
    categories: {
      name: string;
      color: string;
    };
  }>;
  goals: Array<{
    id: string;
    name: string;
    target_amount: number;
    current_amount: number;
    target_date: string | null;
    created_at: string;
  }>;
  subscriptions: Array<{
    id: string;
    name: string;
    amount: number;
    billing_cycle: string;
    next_due_date: string;
    due_date: number;
  }>;
  summary: {
    totalExpenses: number;
    totalNeeds: number;
    totalWants: number;
    totalGoalSavings: number;
    averageExpensePerDay: number;
    categoryBreakdown: Array<{
      category: string;
      amount: number;
      percentage: number;
    }>;
  };
}

class PuppeteerPDFService {
  private browser: Browser | null = null;

  private async getBrowser(): Promise<Browser> {
    if (!this.browser) {
      console.log('Launching Puppeteer browser for Vercel...');
      
      // Vercel/production environment
      if (process.env.VERCEL || process.env.NODE_ENV === 'production') {
        try {
          const chromium = await import('@sparticuz/chromium');
          const puppeteerCore = await import('puppeteer-core');
          
          this.browser = await puppeteerCore.default.launch({
            args: [...chromium.default.args, '--disable-gpu'],
            executablePath: await chromium.default.executablePath(),
            headless: true,
          });
        } catch (error) {
          console.error('Error launching Chromium for Vercel:', error);
          throw new Error('PDF generation is not available on this platform');
        }
      } else {
        // Local development
        const puppeteer = await import('puppeteer');
        this.browser = await puppeteer.default.launch({
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-gpu',
          ],
          executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
        });
      }
    }
    return this.browser;
  }

  async closeBrowser(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async generateExpenseReport(userId: string, reportType: 'weekly' | 'monthly' | 'custom', dateRange?: { start: string; end: string }): Promise<Buffer> {
    console.log(`Generating ${reportType} expense report for user:`, userId);

    const supabase = await createClient();
    const reportData = await this.fetchReportData(userId, reportType, dateRange, supabase);

    const browser = await this.getBrowser();
    const page = await browser.newPage();

    try {
      // Set page format
      await page.setViewport({ width: 1200, height: 800 });

      // Generate HTML content
      const htmlContent = this.generateReportHTML(reportData, reportType);

      // Set content and generate PDF
      await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: { top: '20px', bottom: '20px', left: '20px', right: '20px' },
        printBackground: true,
        displayHeaderFooter: true,
        headerTemplate: `<div style="font-size: 10px; margin: auto;">${reportData.user.display_name} - ${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Report</div>`,
        footerTemplate: `<div style="font-size: 10px; margin: auto;">Generated on ${new Date().toLocaleDateString()} - Page <span class="pageNumber"></span> of <span class="totalPages"></span></div>`,
      });

      console.log(`${reportType} report generated successfully for user:`, userId);
      return Buffer.from(pdfBuffer);

    } finally {
      await page.close();
    }
  }

  private async fetchReportData(userId: string, reportType: 'weekly' | 'monthly' | 'custom', dateRange: { start: string; end: string } | undefined, supabase: any): Promise<ReportData> {
    // Calculate date range based on report type
    let startDate: string, endDate: string;
    const now = new Date();

    if (dateRange) {
      startDate = dateRange.start;
      endDate = dateRange.end;
    } else if (reportType === 'weekly') {
      const weekAgo = new Date(now);
      weekAgo.setDate(now.getDate() - 7);
      startDate = weekAgo.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    } else {
      const monthAgo = new Date(now);
      monthAgo.setMonth(now.getMonth() - 1);
      startDate = monthAgo.toISOString().split('T')[0];
      endDate = now.toISOString().split('T')[0];
    }

    // Fetch user profile
    const { data: user } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', userId)
      .single();

    // Fetch expenses with categories
    const { data: expenses } = await supabase
      .from('expenses')
      .select(`
        id, amount, description, expense_date, is_need,
        categories (name, color)
      `)
      .eq('user_id', userId)
      .gte('expense_date', startDate)
      .lte('expense_date', endDate)
      .order('expense_date', { ascending: false });

    // Fetch savings goals
    const { data: goals } = await supabase
      .from('savings_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Fetch subscriptions
    const { data: subscriptions } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true);

    // Calculate summary statistics
    const summary = this.calculateSummary(expenses || []);

    return {
      user: user || { id: userId, display_name: 'User', email: '' },
      expenses: expenses || [],
      goals: goals || [],
      subscriptions: subscriptions || [],
      summary,
    };
  }

  private calculateSummary(expenses: any[]): ReportData['summary'] {
    const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);
    const totalNeeds = expenses.filter(exp => exp.is_need).reduce((sum, exp) => sum + exp.amount, 0);
    const totalWants = totalExpenses - totalNeeds;

    // Category breakdown
    const categoryMap = new Map<string, number>();
    expenses.forEach(exp => {
      const category = exp.categories?.name || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + exp.amount);
    });

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, amount]) => ({
      category,
      amount,
      percentage: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0,
    })).sort((a, b) => b.amount - a.amount);

    const averageExpensePerDay = expenses.length > 0 ? totalExpenses / expenses.length : 0;

    return {
      totalExpenses,
      totalNeeds,
      totalWants,
      totalGoalSavings: 0, // Calculate from goals if needed
      averageExpensePerDay,
      categoryBreakdown,
    };
  }

  private generateReportHTML(data: ReportData, reportType: string): string {
    const { user, expenses, goals, subscriptions, summary } = data;

    return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 20px;
          background: #f8f9fa;
          color: #333;
        }
        .header {
          text-align: center;
          margin-bottom: 30px;
          background: linear-gradient(135deg, #10b981, #3b82f6);
          color: white;
          padding: 20px;
          border-radius: 10px;
        }
        .header h1 {
          margin: 0;
          font-size: 28px;
        }
        .header p {
          margin: 5px 0;
          opacity: 0.9;
        }
        .summary-cards {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }
        .card {
          background: white;
          padding: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .card h3 {
          margin: 0 0 10px 0;
          color: #374151;
          font-size: 14px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .card .value {
          font-size: 24px;
          font-weight: bold;
          color: #10b981;
        }
        .section {
          background: white;
          padding: 20px;
          margin-bottom: 20px;
          border-radius: 8px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        .section h2 {
          margin: 0 0 15px 0;
          color: #374151;
          border-bottom: 2px solid #e5e7eb;
          padding-bottom: 5px;
        }
        table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
        }
        th, td {
          text-align: left;
          padding: 8px 12px;
          border-bottom: 1px solid #e5e7eb;
        }
        th {
          background: #f9fafb;
          font-weight: 600;
          color: #374151;
        }
        .expense-need {
          color: #059669;
          font-weight: 500;
        }
        .expense-want {
          color: #dc2626;
          font-weight: 500;
        }
        .category-breakdown {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 10px;
        }
        .category-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px;
          background: #f9fafb;
          border-radius: 4px;
        }
        .progress-bar {
          width: 100%;
          height: 8px;
          background: #e5e7eb;
          border-radius: 4px;
          overflow: hidden;
          margin: 5px 0;
        }
        .progress-fill {
          height: 100%;
          background: #10b981;
          transition: width 0.3s ease;
        }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Expense Report</h1>
        <p>For: ${user.display_name}</p>
        <p>Generated: ${new Date().toLocaleDateString('en-US', { 
          weekday: 'long', 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        })}</p>
      </div>

      <div class="summary-cards">
        <div class="card">
          <h3>Total Expenses</h3>
          <div class="value">₹${summary.totalExpenses.toLocaleString()}</div>
        </div>
        <div class="card">
          <h3>Needs</h3>
          <div class="value">₹${summary.totalNeeds.toLocaleString()}</div>
        </div>
        <div class="card">
          <h3>Wants</h3>
          <div class="value">₹${summary.totalWants.toLocaleString()}</div>
        </div>
        <div class="card">
          <h3>Avg/Transaction</h3>
          <div class="value">₹${Math.round(summary.averageExpensePerDay).toLocaleString()}</div>
        </div>
      </div>

      <div class="section">
        <h2>Recent Expenses (${expenses.length} transactions)</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Description</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${expenses.map(exp => `
              <tr>
                <td>${new Date(exp.expense_date).toLocaleDateString()}</td>
                <td>${exp.description}</td>
                <td>${exp.categories?.name || 'Other'}</td>
                <td class="${exp.is_need ? 'expense-need' : 'expense-want'}">
                  ${exp.is_need ? 'Need' : 'Want'}
                </td>
                <td>₹${exp.amount.toLocaleString()}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div class="section">
        <h2>Category Breakdown</h2>
        <div class="category-breakdown">
          ${summary.categoryBreakdown.map(cat => `
            <div class="category-item">
              <span>${cat.category}</span>
              <span>₹${cat.amount.toLocaleString()} (${cat.percentage.toFixed(1)}%)</span>
            </div>
          `).join('')}
        </div>
      </div>

      <div class="section">
        <h2>Active Savings Goals (${goals.length})</h2>
        ${goals.map(goal => {
          const progress = (goal.current_amount / goal.target_amount) * 100;
          return `
            <div style="margin-bottom: 15px;">
              <div style="display: flex; justify-content: space-between; align-items: center;">
                <strong>${goal.name}</strong>
                <span>${progress.toFixed(1)}%</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: ${Math.min(progress, 100)}%"></div>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px; color: #6b7280;">
                <span>₹${goal.current_amount.toLocaleString()}</span>
                <span>₹${goal.target_amount.toLocaleString()}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      <div class="section">
        <h2>Active Subscriptions (${subscriptions.length})</h2>
        <table>
          <thead>
            <tr>
              <th>Service</th>
              <th>Amount</th>
              <th>Billing Cycle</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            ${subscriptions.map(sub => `
              <tr>
                <td>${sub.name}</td>
                <td>₹${sub.amount.toLocaleString()}</td>
                <td>${sub.billing_cycle}</td>
                <td>${sub.due_date}th of each month</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>

      <div style="text-align: center; margin-top: 40px; color: #6b7280; font-size: 12px;">
        <p>This report was automatically generated by BudgetBot</p>
        <p>© ${new Date().getFullYear()} BudgetBot. All rights reserved.</p>
      </div>
    </body>
    </html>
    `;
  }
}

export const pdfService = new PuppeteerPDFService();