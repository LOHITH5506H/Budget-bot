/**
 * Utility functions for generating "Add to Calendar" URLs
 * This replaces the Google Calendar API integration with simple URL-based calendar additions
 */

export interface CalendarEvent {
  title: string
  description?: string
  startDate: Date
  endDate?: Date
  location?: string
}

/**
 * Generates a Google Calendar URL that opens in a new tab to add an event
 * @param event - Event details to add to calendar
 * @returns URL string for Google Calendar
 */
export function generateGoogleCalendarUrl(event: CalendarEvent): string {
  const baseUrl = "https://calendar.google.com/calendar/render"
  
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
  })

  // Format dates to Google Calendar format (YYYYMMDDTHHmmssZ)
  const formatDate = (date: Date): string => {
    return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z'
  }

  const start = formatDate(event.startDate)
  const end = event.endDate ? formatDate(event.endDate) : formatDate(new Date(event.startDate.getTime() + 60 * 60 * 1000))
  
  params.append("dates", `${start}/${end}`)

  if (event.description) {
    params.append("details", event.description)
  }

  if (event.location) {
    params.append("location", event.location)
  }

  return `${baseUrl}?${params.toString()}`
}

/**
 * Creates a Google Calendar event for a subscription/bill reminder
 */
export function createSubscriptionCalendarUrl(
  subscriptionName: string,
  amount: number,
  dueDate: Date,
  billingCycle: string = "monthly"
): string {
  const event: CalendarEvent = {
    title: `💰 Bill Due: ${subscriptionName}`,
    description: `${billingCycle.charAt(0).toUpperCase() + billingCycle.slice(1)} subscription\nAmount: ₹${amount}\nDue Date: ${dueDate.toLocaleDateString()}`,
    startDate: dueDate,
    endDate: new Date(dueDate.getTime() + 60 * 60 * 1000), // 1 hour duration
  }

  return generateGoogleCalendarUrl(event)
}

/**
 * Creates a Google Calendar event for a savings goal milestone
 */
export function createGoalCalendarUrl(
  goalName: string,
  targetAmount: number,
  targetDate: Date,
  currentAmount: number = 0,
  description?: string
): string {
  const progress = Math.round((currentAmount / targetAmount) * 100)
  
  const event: CalendarEvent = {
    title: `🎯 Goal Milestone: ${goalName}`,
    description: `${description || ''}\nTarget: ₹${targetAmount}\nCurrent: ₹${currentAmount}\nProgress: ${progress}%\nTarget Date: ${targetDate.toLocaleDateString()}`,
    startDate: targetDate,
    endDate: new Date(targetDate.getTime() + 60 * 60 * 1000),
  }

  return generateGoogleCalendarUrl(event)
}

/**
 * Opens a Google Calendar URL in a new tab
 */
export function openCalendarInNewTab(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer')
}
