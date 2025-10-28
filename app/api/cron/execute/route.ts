import { NextRequest, NextResponse } from 'next/server';
import { easyCronService } from '@/lib/easycron';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, subscription_id, goal_id, user_id } = body;

    console.log('EasyCron webhook received:', { type, subscription_id, goal_id, user_id });

    const supabase = await createClient();

    // Verify user exists
    const { data: user, error: userError } = await supabase
      .from('profiles')
      .select('id, display_name, email')
      .eq('id', user_id)
      .single();

    if (userError || !user) {
      console.error('User not found:', user_id);
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    switch (type) {
      case 'bill_reminder':
        await handleBillReminder(subscription_id, user_id, supabase);
        break;
      
      case 'goal_milestone':
        await handleGoalMilestone(goal_id, user_id, supabase);
        break;
      
      case 'weekly_report':
        await handleWeeklyReport(user_id, supabase);
        break;
      
      default:
        console.warn('Unknown cron job type:', type);
        return NextResponse.json({ error: 'Unknown job type' }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Cron job executed successfully' });

  } catch (error) {
    console.error('Cron job execution error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function handleBillReminder(subscriptionId: string, userId: string, supabase: any) {
  console.log('Handling bill reminder for subscription:', subscriptionId);

  // Get subscription details
  const { data: subscription, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('id', subscriptionId)
    .eq('user_id', userId)
    .single();

  if (error || !subscription) {
    console.error('Subscription not found:', subscriptionId);
    return;
  }

  // Calculate days until due
  const today = new Date();
  const currentDay = today.getDate();
  const daysUntilDue = subscription.due_date - currentDay;
  
  // Send notification via API
  const notificationData = {
    userId,
    type: 'bill_reminder',
    title: `Bill Due Soon: ${subscription.name}`,
    message: `Your ${subscription.name} bill of ₹${subscription.amount} is due in ${daysUntilDue} days.`,
    data: {
      subscriptionId,
      amount: subscription.amount,
      dueDate: subscription.due_date,
    },
  };

  // Send push notification and email
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationData),
  });

  console.log('Bill reminder sent for:', subscription.name);
}

async function handleGoalMilestone(goalId: string, userId: string, supabase: any) {
  console.log('Handling goal milestone for goal:', goalId);

  // Get goal details
  const { data: goal, error } = await supabase
    .from('savings_goals')
    .select('*')
    .eq('id', goalId)
    .eq('user_id', userId)
    .single();

  if (error || !goal) {
    console.error('Goal not found:', goalId);
    return;
  }

  // Calculate progress
  const progress = (goal.current_amount / goal.target_amount) * 100;
  const remaining = goal.target_amount - goal.current_amount;
  
  // Send notification via API
  const notificationData = {
    userId,
    type: 'goal_milestone',
    title: `Goal Update: ${goal.name}`,
    message: `You're ${progress.toFixed(1)}% of the way to your goal! Only ₹${remaining.toLocaleString()} left to go.`,
    data: {
      goalId,
      progress,
      remaining,
      targetAmount: goal.target_amount,
    },
  };

  // Send push notification and email
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/notifications/send`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(notificationData),
  });

  console.log('Goal milestone notification sent for:', goal.name);
}

async function handleWeeklyReport(userId: string, supabase: any) {
  console.log('Handling weekly report for user:', userId);

  // Generate and send weekly report
  await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/reports/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId,
      type: 'weekly',
      format: 'email',
    }),
  });

  console.log('Weekly report generated and sent for user:', userId);
}

export async function GET(request: NextRequest) {
  // Health check endpoint for EasyCron
  return NextResponse.json({ status: 'ok', timestamp: new Date().toISOString() });
}