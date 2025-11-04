import Pusher from 'pusher';
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

export async function POST(request: NextRequest) {
  try {
    console.log("PUSHER TRIGGER: Starting request processing");
    
    // Verify user is authenticated
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      console.log("PUSHER TRIGGER: User not authenticated");
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { channel, event, data } = await request.json();
    
    if (!channel || !event) {
      console.log("PUSHER TRIGGER: Missing required fields", { channel, event });
      return NextResponse.json(
        { error: 'Missing channel or event' },
        { status: 400 }
      );
    }

    console.log("PUSHER TRIGGER: Sending event", { channel, event, dataKeys: Object.keys(data || {}) });

    await pusher.trigger(channel, event, data);
    
    console.log("PUSHER TRIGGER: Event sent successfully");
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PUSHER TRIGGER: Error triggering Pusher event:', error);
    return NextResponse.json(
      { error: 'Failed to trigger event' },
      { status: 500 }
    );
  }
}