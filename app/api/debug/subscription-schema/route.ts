import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

// Debug API route to check subscription table schema
export async function GET() {
  try {
    const supabase = await createClient()
    
    // Get table schema information
    const { data: schemaInfo, error: schemaError } = await supabase
      .rpc('get_table_schema', { table_name: 'subscriptions' })
    
    if (schemaError) {
      console.log('Schema RPC failed, trying direct query...')
      
      // Alternative: Try to get column info directly
      const { data: columns, error: colError } = await supabase
        .from('information_schema.columns')
        .select('column_name, data_type, is_nullable, column_default')
        .eq('table_name', 'subscriptions')
        .eq('table_schema', 'public')
      
      if (colError) {
        console.error('Column query failed:', colError)
        
        // Last resort: Try to insert a test record to see what fails
        const testInsert = {
          user_id: '00000000-0000-0000-0000-000000000000', // dummy ID
          name: 'TEST_SUBSCRIPTION',
          amount: 99.99,
          billing_cycle: 'monthly',
          next_due_date: '2025-12-01',
          is_active: true,
          logo_url: null,
        }
        
        const { error: insertError } = await supabase
          .from('subscriptions')
          .insert(testInsert)
        
        return NextResponse.json({
          message: 'Schema info not available, test insert attempted',
          testInsertError: insertError,
          attemptedData: testInsert
        })
      }
      
      return NextResponse.json({
        columns: columns,
        message: 'Got column info from information_schema'
      })
    }
    
    return NextResponse.json({
      schema: schemaInfo,
      message: 'Got schema info from RPC'
    })
    
  } catch (error) {
    console.error('Debug schema error:', error)
    return NextResponse.json(
      { error: 'Failed to get schema info', details: error },
      { status: 500 }
    )
  }
}

// Test insert endpoint
export async function POST() {
  try {
    const supabase = await createClient()
    
    // Try different insert variations to see what works
    const testVariations = [
      // Basic insert with minimal fields
      {
        name: 'Minimal Test',
        data: {
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'TEST_MINIMAL',
          amount: 99.99,
        }
      },
      // Insert with billing_cycle and next_due_date
      {
        name: 'With new fields',
        data: {
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'TEST_NEW_FIELDS',
          amount: 99.99,
          billing_cycle: 'monthly',
          next_due_date: '2025-12-01',
        }
      },
      // Insert with old due_date field
      {
        name: 'With old due_date',
        data: {
          user_id: '00000000-0000-0000-0000-000000000000',
          name: 'TEST_OLD_DATE',
          amount: 99.99,
          due_date: 15,
        }
      },
    ]
    
    const results = []
    
    for (const variation of testVariations) {
      const { error } = await supabase
        .from('subscriptions')
        .insert(variation.data)
      
      results.push({
        variation: variation.name,
        data: variation.data,
        error: error ? { 
          message: error.message, 
          code: error.code,
          details: error.details 
        } : null,
        success: !error
      })
    }
    
    return NextResponse.json({
      message: 'Test inserts completed',
      results: results
    })
    
  } catch (error) {
    return NextResponse.json(
      { error: 'Test insert failed', details: error },
      { status: 500 }
    )
  }
}