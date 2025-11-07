import { pusherService } from '@/lib/pusher-service';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

interface TriggerRequest {
  userId?: string;
  channel?: string;
  event: string;
  data: any;
}

export async function POST(request: NextRequest) {
  try {
    console.log("🔔 [Pusher Trigger] Starting request processing");
    
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.warn("⚠️ [Pusher Trigger] Unauthorized request");
      return NextResponse.json(
        { error: 'Unauthorized', success: false },
        { status: 401 }
      );
    }

    const body: TriggerRequest = await request.json();
    const { userId, channel, event, data } = body;
    
    // Validate required fields
    if (!event) {
      console.warn("⚠️ [Pusher Trigger] Missing event name");
      return NextResponse.json(
        { error: 'Event name is required', success: false },
        { status: 400 }
      );
    }

    // Determine channel - either explicit or user-based
    const targetChannel = channel || `private-user-${userId || user.id}`;
    
    console.log(`📡 [Pusher Trigger] Sending event: ${event} to channel: ${targetChannel}`);

    // Handle different event types with smart error handling
    let success = false;
    
    try {
      switch (event) {
        case 'subscription-added':
          success = await pusherService.sendSubscriptionAdded(
            userId || user.id,
            data
          );
          break;
          
        case 'subscription-updated':
          success = await pusherService.sendSubscriptionUpdated(
            userId || user.id,
            data
          );
          break;
          
        case 'subscription-deleted':
          success = await pusherService.sendSubscriptionDeleted(
            userId || user.id,
            data.name,
            data.id
          );
          break;
          
        case 'expense-updated':
          success = await pusherService.sendExpenseUpdate(
            userId || user.id,
            data
          );
          break;
          
        case 'goal-updated':
          success = await pusherService.sendGoalProgressUpdate(
            userId || user.id,
            data
          );
          break;
          
        case 'dashboard-refresh':
          success = await pusherService.sendDashboardRefresh(
            userId || user.id
          );
          break;
          
        default:
          // Generic event trigger with retry logic
          console.log(`📨 [Pusher Trigger] Generic event: ${event}`);
          success = await pusherService.sendNotificationToUser(
            userId || user.id,
            {
              id: `${event}-${Date.now()}`,
              title: data.title || 'Notification',
              message: data.message || '',
              type: 'general',
              timestamp: new Date().toISOString(),
              data: data
            }
          );
      }

      if (success) {
        console.log(`✅ [Pusher Trigger] Event sent successfully: ${event}`);
        return NextResponse.json({ 
          success: true,
          event,
          channel: targetChannel
        });
      } else {
        // Return 200 with success: false instead of 500
        // This prevents client-side errors when Pusher isn't critical
        console.warn(`⚠️ [Pusher Trigger] Event failed to send: ${event}`);
        return NextResponse.json(
          { 
            success: false,
            error: 'Failed to send notification (Pusher may not be configured)',
            event,
            channel: targetChannel
          },
          { status: 200 } // Changed from 500 to 200
        );
      }
    } catch (pusherError) {
      // Catch Pusher-specific errors and return 200 to not break client
      console.error('❌ [Pusher Trigger] Pusher error:', pusherError);
      return NextResponse.json(
        { 
          success: false,
          error: 'Pusher notification failed but operation continues',
          event,
          channel: targetChannel
        },
        { status: 200 } // Return 200 to not break client operations
      );
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ [Pusher Trigger] Error:', errorMessage);
    
    // Return 200 even on error to not break client operations
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: errorMessage,
        success: false
      },
      { status: 200 } // Changed from 500 to 200
    );
  }
}