import { NextRequest, NextResponse } from 'next/server';
import { pusherService } from '@/lib/pusher-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    
    const socketId = params.get('socket_id');
    const channelName = params.get('channel_name');
    const userId = request.headers.get('X-User-ID');

    console.log('Pusher auth request:', { socketId, channelName, userId });

    if (!socketId || !channelName || !userId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify user exists and is authenticated
    const supabase = await createClient();
    const { data: user, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();

    if (error || !user) {
      console.error('User authentication failed:', userId);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    // Authenticate the channel access
    const authSignature = await pusherService.authenticateChannel(socketId, channelName, userId);
    
    if (!authSignature) {
      console.error('Channel authentication failed:', channelName);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    console.log('Pusher authentication successful for user:', userId);
    
    // Return auth signature in the format Pusher expects
    return NextResponse.json(authSignature);

  } catch (error) {
    console.error('Pusher auth error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({ error: 'Method not allowed' }, { status: 405 });
}