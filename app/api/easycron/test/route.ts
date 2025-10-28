import { NextRequest, NextResponse } from 'next/server'
import { easyCronService } from '@/lib/easycron'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, type, data } = body

    console.log('Testing EasyCron integration:', { userId, type, data })

    if (!userId || !type || !data) {
      return NextResponse.json(
        { error: 'Missing required fields: userId, type, data' },
        { status: 400 }
      )
    }

    const easyCron = easyCronService

    let result: string | null
    switch (type) {
      case 'bill_reminder':
        const dueDate = new Date(data.dueDate)
        result = await easyCron.scheduleBillReminder(
          'test-subscription',
          data.billName,
          dueDate.getDate(), // Day of month (1-31)
          userId
        )
        break
      
      case 'goal_milestone':
        result = await easyCron.scheduleGoalMilestone(
          'test-goal',
          data.goalName || 'Test Goal',
          data.milestoneDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
          userId
        )
        break
      
      default:
        // Create a generic test job
        result = await easyCron.createJob({
          name: `test_job_${Date.now()}`,
          url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/webhooks/test`,
          cron_expression: '0 10 * * *', // Daily at 10 AM
          http_method: 'GET',
          timezone_from: 2, // UTC+2
          description: 'Test job for integration testing'
        })
        break
    }

    if (result) {
      return NextResponse.json({
        success: true,
        message: 'EasyCron job created successfully',
        jobId: result,
        status: 'enabled'
      })
    } else {
      return NextResponse.json(
        { 
          success: false,
          error: 'Failed to create EasyCron job',
          details: 'Job creation returned null'
        },
        { status: 400 }
      )
    }

  } catch (error) {
    console.error('EasyCron test error:', error)
    return NextResponse.json(
      { 
        success: false,
        error: 'EasyCron service error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}