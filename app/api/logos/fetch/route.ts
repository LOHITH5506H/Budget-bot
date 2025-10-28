import { NextRequest, NextResponse } from 'next/server';
import { logoService } from '@/lib/logo-service';
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { companyName, subscriptionId, userId } = body;

    console.log('Fetching logo for:', { companyName, subscriptionId });

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Fetch logo with fallback
    const logoUrl = await logoService.getLogoWithFallback(companyName);

    // If subscriptionId is provided, update the database
    if (subscriptionId && userId) {
      const supabase = await createClient();
      
      const { error } = await supabase
        .from('subscriptions')
        .update({ logo_url: logoUrl })
        .eq('id', subscriptionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error updating subscription logo:', error);
        return NextResponse.json({ 
          logoUrl, 
          warning: 'Logo fetched but failed to save to database' 
        });
      }
    }

    return NextResponse.json({ 
      logoUrl,
      companyName,
      cached: false // Could implement caching later
    });

  } catch (error) {
    console.error('Logo API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyName = searchParams.get('company');
    const userId = searchParams.get('user_id');

    if (!companyName) {
      return NextResponse.json({ error: 'Company name is required' }, { status: 400 });
    }

    // Fetch logo
    const logoUrl = await logoService.getLogoWithFallback(companyName);

    return NextResponse.json({ 
      logoUrl,
      companyName 
    });

  } catch (error) {
    console.error('Logo API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// Batch update logos for existing subscriptions
export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get all user subscriptions without logos
    const { data: subscriptions, error } = await supabase
      .from('subscriptions')
      .select('id, name, logo_url')
      .eq('user_id', userId)
      .is('logo_url', null);

    if (error) {
      console.error('Error fetching subscriptions:', error);
      return NextResponse.json({ error: 'Failed to fetch subscriptions' }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({ 
        message: 'No subscriptions need logo updates',
        updated: 0 
      });
    }

    // Fetch logos for all subscriptions
    const logosResults = await logoService.fetchLogosForSubscriptions(subscriptions);

    // Update database with new logos
    const updatePromises = logosResults.map(result => 
      supabase
        .from('subscriptions')
        .update({ logo_url: result.logo_url })
        .eq('id', result.id)
        .eq('user_id', userId)
    );

    const updateResults = await Promise.allSettled(updatePromises);
    const successfulUpdates = updateResults.filter(result => result.status === 'fulfilled').length;

    console.log(`Updated logos for ${successfulUpdates} of ${subscriptions.length} subscriptions`);

    return NextResponse.json({ 
      message: 'Logos updated successfully',
      updated: successfulUpdates,
      total: subscriptions.length,
      results: logosResults.map(r => ({ name: r.name, logo_url: r.logo_url }))
    });

  } catch (error) {
    console.error('Batch logo update error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}