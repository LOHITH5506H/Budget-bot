import { NextResponse } from 'next/server';

export async function GET() {
  const config = {
    hasAppKey: !!process.env.NEXT_PUBLIC_PUSHER_APP_KEY,
    hasAppId: !!process.env.PUSHER_APP_ID,
    hasSecret: !!process.env.PUSHER_SECRET,
    hasCluster: !!process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
    appKey: process.env.NEXT_PUBLIC_PUSHER_APP_KEY ? `${process.env.NEXT_PUBLIC_PUSHER_APP_KEY.slice(0, 8)}...` : 'NOT_SET'
  };

  return NextResponse.json(config);
}
