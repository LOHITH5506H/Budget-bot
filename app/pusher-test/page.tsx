"use client"

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { usePusher } from '@/hooks/use-pusher';
import { createClient } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Wifi, WifiOff, Bell, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

export default function PusherTestPage() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [config, setConfig] = useState<any>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  // Get user ID
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        addTestResult(`✅ User authenticated: ${user.email}`);
      } else {
        addTestResult('❌ No user authenticated');
      }
    };
    getUser();
  }, []);

  // Initialize Pusher
  const { isConnected, notifications, sendTestNotification } = usePusher({
    userId: userId || '',
    enabled: !!userId
  });

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  // Check Pusher config
  const checkConfig = async () => {
    addTestResult('🔍 Checking Pusher configuration...');
    try {
      const res = await fetch('/api/pusher/debug');
      const data = await res.json();
      setConfig(data);
      
      if (data.hasAppKey && data.hasAppId && data.hasSecret && data.hasCluster) {
        addTestResult('✅ All Pusher environment variables are set');
      } else {
        addTestResult('❌ Missing Pusher environment variables:');
        if (!data.hasAppKey) addTestResult('  - NEXT_PUBLIC_PUSHER_APP_KEY');
        if (!data.hasAppId) addTestResult('  - PUSHER_APP_ID');
        if (!data.hasSecret) addTestResult('  - PUSHER_SECRET');
        if (!data.hasCluster) addTestResult('  - NEXT_PUBLIC_PUSHER_CLUSTER');
      }
    } catch (error) {
      addTestResult('❌ Failed to check config: ' + error);
    }
  };

  // Test notification sending
  const testNotification = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "User not authenticated",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    addTestResult('📤 Sending test notification via API...');
    
    try {
      const res = await fetch('/api/pusher/trigger', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          event: 'subscription-added',
          data: {
            name: 'Test Subscription',
            amount: 999,
            billing_cycle: 'monthly',
            next_due_date: new Date().toISOString()
          }
        })
      });

      const data = await res.json();
      
      if (res.ok) {
        addTestResult('✅ Server sent notification successfully');
        addTestResult(`   Channel: ${data.channel}`);
        addTestResult(`   Event: ${data.event}`);
      } else {
        addTestResult('❌ Server failed to send notification');
        addTestResult(`   Error: ${data.error}`);
      }
    } catch (error) {
      addTestResult('❌ Error sending notification: ' + error);
    } finally {
      setLoading(false);
    }
  };

  // Listen for Pusher notifications
  useEffect(() => {
    const handlePusherNotification = (event: CustomEvent) => {
      const notification = event.detail;
      addTestResult(`🔔 Pusher notification received: ${notification.title}`);
      
      toast({
        title: "🎉 " + notification.title,
        description: notification.message,
      });
    };

    window.addEventListener('pusher-notification', handlePusherNotification as EventListener);
    
    return () => {
      window.removeEventListener('pusher-notification', handlePusherNotification as EventListener);
    };
  }, [toast]);

  // Log connection changes
  useEffect(() => {
    if (userId) {
      if (isConnected) {
        addTestResult(`🔌 Pusher connected to private-user-${userId}`);
      } else {
        addTestResult('🔌 Pusher disconnected');
      }
    }
  }, [isConnected, userId]);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pusher Real-Time Notifications Test</span>
              <div className="flex items-center space-x-2">
                {isConnected ? (
                  <><Wifi className="w-5 h-5 text-green-600" /><Badge className="bg-green-600">Connected</Badge></>
                ) : (
                  <><WifiOff className="w-5 h-5 text-red-600" /><Badge variant="destructive">Disconnected</Badge></>
                )}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Button onClick={checkConfig} variant="outline">
                Check Configuration
              </Button>
              <Button onClick={testNotification} disabled={loading || !isConnected}>
                {loading ? 'Sending...' : 'Send Test Notification'}
              </Button>
            </div>

            {config && (
              <div className="bg-gray-100 p-4 rounded-lg space-y-2">
                <h3 className="font-semibold">Configuration Status:</h3>
                <div className="text-sm space-y-1">
                  <div className="flex items-center space-x-2">
                    {config.hasAppKey ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>App Key: {config.appKey}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {config.hasAppId ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>App ID: {config.hasAppId ? 'Set' : 'Not Set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {config.hasSecret ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Secret: {config.hasSecret ? 'Set' : 'Not Set'}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    {config.hasCluster ? <CheckCircle className="w-4 h-4 text-green-600" /> : <XCircle className="w-4 h-4 text-red-600" />}
                    <span>Cluster: {config.cluster || 'Not Set'}</span>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Bell className="w-5 h-5 mr-2" />
              Received Notifications ({notifications.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No notifications received yet</p>
            ) : (
              <div className="space-y-2">
                {notifications.map((notif, index) => (
                  <div key={notif.id} className="bg-blue-50 border border-blue-200 p-3 rounded">
                    <div className="font-semibold">{notif.title}</div>
                    <div className="text-sm text-gray-600">{notif.message}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(notif.timestamp).toLocaleString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Test Results Log</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-black text-green-400 p-4 rounded font-mono text-xs space-y-1 max-h-96 overflow-y-auto">
              {testResults.length === 0 ? (
                <div className="text-gray-500">No tests run yet...</div>
              ) : (
                testResults.map((result, index) => (
                  <div key={index}>{result}</div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <AlertCircle className="w-5 h-5 mr-2 text-blue-600" />
              Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Click "Check Configuration" to verify Pusher environment variables</li>
              <li>Ensure the connection status shows "Connected" (green)</li>
              <li>Click "Send Test Notification" to trigger a notification</li>
              <li>You should see:
                <ul className="list-disc list-inside ml-6 mt-1">
                  <li>A toast notification appear at the bottom-right</li>
                  <li>The notification appear in the "Received Notifications" section</li>
                  <li>Success messages in the "Test Results Log"</li>
                </ul>
              </li>
              <li>If you don't see notifications, check the browser console (F12) for errors</li>
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
