"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Calendar, CalendarPlus, Info } from "lucide-react"

interface CalendarSyncWidgetProps {
  userId: string
}

export function CalendarSyncWidget({ userId }: CalendarSyncWidgetProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Calendar className="w-5 h-5 mr-2 text-blue-600" />
          Google Calendar Integration
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-start space-x-3 p-3 bg-blue-50 rounded-lg">
            <CalendarPlus className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">Add to Calendar</h4>
              <p className="text-sm text-gray-600 mt-1">
                When creating subscriptions or goals, check the "Add to Google Calendar" option to add events directly to your calendar.
              </p>
            </div>
          </div>

          <div className="flex items-start space-x-3 p-3 bg-green-50 rounded-lg">
            <Info className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="text-sm font-medium text-gray-900">How it works</h4>
              <ul className="text-sm text-gray-600 mt-1 space-y-1 list-disc list-inside">
                <li>Create a subscription or goal with a due/target date</li>
                <li>Check the "Add to Google Calendar" checkbox</li>
                <li>A new tab will open with the pre-filled event</li>
                <li>Click "Save" in Google Calendar to add the event</li>
              </ul>
            </div>
          </div>

          <div className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border border-gray-200">
            <p className="font-medium mb-1">💡 Benefits:</p>
            <ul className="space-y-1 list-disc list-inside ml-2">
              <li>No API setup or authentication required</li>
              <li>Works with any Google account</li>
              <li>Full control over your calendar events</li>
              <li>Events open in a new tab for easy review</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
