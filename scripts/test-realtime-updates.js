#!/usr/bin/env node

/**
 * Test script for real-time dashboard updates
 * Run this to simulate expense addition and verify Pusher notifications work
 */

const testExpenseUpdate = async () => {
  const testData = {
    userId: 'test-user-id',
    type: 'expense_update', 
    title: '💰 Test Expense Added',
    message: '₹150.00 expense recorded for Coffee',
    data: {
      amount: 150,
      description: 'Coffee',
      category_id: 'test-category',
      is_need: false,
      expense_date: new Date().toISOString().split('T')[0]
    }
  };

  try {
    const response = await fetch('http://localhost:3001/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(testData)
    });

    const result = await response.json();
    console.log('✅ Test notification sent:', result);
    
    if (result.success) {
      console.log('🎉 Real-time dashboard updates should be working!');
      console.log('📊 All dashboard widgets should automatically refresh when expenses are added');
    } else {
      console.log('❌ Test failed:', result.error);
    }
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Uncomment and modify the userId to test with a real user
// testExpenseUpdate();

console.log(`
🔄 Real-time Dashboard Updates Test Script

To test real-time updates:
1. Make sure your development server is running (npm run dev)
2. Add environment variables for Pusher in .env.local
3. Open your dashboard in the browser
4. Add an expense using the Quick Expense widget
5. Watch as all widgets automatically update without page refresh!

Features implemented:
✅ Real-time expense notifications via Pusher
✅ Automatic chart/graph updates
✅ AI insights regeneration
✅ Streak updates  
✅ Savings goals refresh
✅ Dashboard-wide refresh events

The following widgets now update automatically:
- 📊 Spending Overview (pie charts, bar charts)
- 🔥 Streak Widget
- 🎯 Savings Goals
- 💡 AI Insights
- 📈 All dashboard components
`);