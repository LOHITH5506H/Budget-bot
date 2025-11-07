import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer';
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
  dateRange: {
    start: string;
    end: string;
  };
}

// PDF Styles
const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 10,
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: '#10b981',
    color: 'white',
    borderRadius: 5,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 10,
    opacity: 0.9,
  },
  summaryCards: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  card: {
    flex: 1,
    padding: 10,
    margin: 5,
    backgroundColor: '#f9fafb',
    borderRadius: 5,
  },
  cardTitle: {
    fontSize: 9,
    color: '#6b7280',
    marginBottom: 5,
    textTransform: 'uppercase',
  },
  cardValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#10b981',
  },
  section: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: 'white',
    borderRadius: 5,
    border: '1px solid #e5e7eb',
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#374151',
    borderBottom: '2px solid #e5e7eb',
    paddingBottom: 5,
  },
  table: {
    marginTop: 10,
  },
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 8,
    fontWeight: 'bold',
    fontSize: 9,
  },
  tableRow: {
    flexDirection: 'row',
    padding: 6,
    borderBottom: '1px solid #e5e7eb',
  },
  tableCell: {
    fontSize: 9,
  },
  footer: {
    marginTop: 20,
    textAlign: 'center',
    fontSize: 8,
    color: '#6b7280',
  },
});

// PDF Document Component
const ExpenseReportPDF = (data: ReportData, reportType: string) => {
  const { user, expenses, goals, subscriptions, summary, dateRange } = data;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>
            {reportType.charAt(0).toUpperCase() + reportType.slice(1)} Expense Report
          </Text>
          <Text style={styles.subtitle}>For: {user.display_name}</Text>
          <Text style={styles.subtitle}>
            Period: {dateRange.start} to {dateRange.end}
          </Text>
          <Text style={styles.subtitle}>
            Generated: {new Date().toLocaleDateString()}
          </Text>
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryCards}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Total Expenses</Text>
            <Text style={styles.cardValue}>₹{summary.totalExpenses.toLocaleString()}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Needs</Text>
            <Text style={styles.cardValue}>₹{summary.totalNeeds.toLocaleString()}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Wants</Text>
            <Text style={styles.cardValue}>₹{summary.totalWants.toLocaleString()}</Text>
          </View>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Transactions</Text>
            <Text style={styles.cardValue}>{expenses.length}</Text>
          </View>
        </View>

        {/* Recent Expenses */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Recent Expenses ({expenses.length} transactions)</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={[styles.tableCell, { width: '15%' }]}>Date</Text>
              <Text style={[styles.tableCell, { width: '35%' }]}>Description</Text>
              <Text style={[styles.tableCell, { width: '20%' }]}>Category</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>Type</Text>
              <Text style={[styles.tableCell, { width: '15%' }]}>Amount</Text>
            </View>
            {expenses.slice(0, 20).map((exp) => (
              <View key={exp.id} style={styles.tableRow}>
                <Text style={[styles.tableCell, { width: '15%' }]}>
                  {new Date(exp.expense_date).toLocaleDateString()}
                </Text>
                <Text style={[styles.tableCell, { width: '35%' }]}>
                  {exp.description}
                </Text>
                <Text style={[styles.tableCell, { width: '20%' }]}>
                  {(exp.categories as any)?.name || 'Other'}
                </Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>
                  {exp.is_need ? 'Need' : 'Want'}
                </Text>
                <Text style={[styles.tableCell, { width: '15%' }]}>
                  ₹{exp.amount.toLocaleString()}
                </Text>
              </View>
            ))}
          </View>
        </View>

        {/* Category Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Category Breakdown</Text>
          {summary.categoryBreakdown.slice(0, 8).map((cat, index) => (
            <View key={index} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 5 }}>
              <Text style={styles.tableCell}>{cat.category}</Text>
              <Text style={styles.tableCell}>
                ₹{cat.amount.toLocaleString()} ({cat.percentage.toFixed(1)}%)
              </Text>
            </View>
          ))}
        </View>

        {/* Active Goals */}
        {goals.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Savings Goals ({goals.length})</Text>
            {goals.map((goal) => {
              const progress = (goal.current_amount / goal.target_amount) * 100;
              return (
                <View key={goal.id} style={{ marginBottom: 8 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 3 }}>
                    <Text style={styles.tableCell}>{goal.name}</Text>
                    <Text style={styles.tableCell}>{progress.toFixed(1)}%</Text>
                  </View>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={[styles.tableCell, { fontSize: 8, color: '#6b7280' }]}>
                      ₹{goal.current_amount.toLocaleString()}
                    </Text>
                    <Text style={[styles.tableCell, { fontSize: 8, color: '#6b7280' }]}>
                      ₹{goal.target_amount.toLocaleString()}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Active Subscriptions */}
        {subscriptions.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Active Subscriptions ({subscriptions.length})</Text>
            <View style={styles.table}>
              <View style={styles.tableHeader}>
                <Text style={[styles.tableCell, { width: '40%' }]}>Service</Text>
                <Text style={[styles.tableCell, { width: '25%' }]}>Amount</Text>
                <Text style={[styles.tableCell, { width: '35%' }]}>Billing Cycle</Text>
              </View>
              {subscriptions.map((sub) => (
                <View key={sub.id} style={styles.tableRow}>
                  <Text style={[styles.tableCell, { width: '40%' }]}>{sub.name}</Text>
                  <Text style={[styles.tableCell, { width: '25%' }]}>₹{sub.amount.toLocaleString()}</Text>
                  <Text style={[styles.tableCell, { width: '35%' }]}>{sub.billing_cycle}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>This report was automatically generated by BudgetBot</Text>
          <Text>© {new Date().getFullYear()} BudgetBot. All rights reserved.</Text>
        </View>
      </Page>
    </Document>
  );
};

class ReactPDFService {
  async generateExpenseReport(
    userId: string,
    reportType: 'weekly' | 'monthly' | 'custom',
    dateRange?: { start: string; end: string }
  ): Promise<Buffer> {
    console.log(`📄 Generating ${reportType} expense report for user:`, userId);

    const supabase = await createClient();
    const reportData = await this.fetchReportData(userId, reportType, dateRange, supabase);

    // Generate PDF using react-pdf
    const pdfDoc = ExpenseReportPDF(reportData, reportType);

    const pdfBlob = await pdf(pdfDoc).toBlob();
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    console.log(`✅ ${reportType} report generated successfully for user:`, userId);
    return pdfBuffer;
  }

  private async fetchReportData(
    userId: string,
    reportType: 'weekly' | 'monthly' | 'custom',
    dateRange: { start: string; end: string } | undefined,
    supabase: any
  ): Promise<ReportData> {
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
      dateRange: { start: startDate, end: endDate },
    };
  }

  private calculateSummary(expenses: any[]): ReportData['summary'] {
    const totalExpenses = expenses.reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalNeeds = expenses.filter(exp => exp.is_need).reduce((sum, exp) => sum + Number(exp.amount), 0);
    const totalWants = totalExpenses - totalNeeds;

    // Category breakdown
    const categoryMap = new Map<string, number>();
    expenses.forEach(exp => {
      const category = exp.categories?.name || 'Other';
      categoryMap.set(category, (categoryMap.get(category) || 0) + Number(exp.amount));
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
      totalGoalSavings: 0,
      averageExpensePerDay,
      categoryBreakdown,
    };
  }
}

export const pdfService = new ReactPDFService();