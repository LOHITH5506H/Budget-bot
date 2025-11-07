"use client"

import { useEffect, useState } from 'react';
import { usePusher } from '@/hooks/use-pusher';
import { useToast } from '@/hooks/use-toast';
import { createClient } from '@/lib/supabase/client';

/**
 * Global Pusher Provider
 * This component initializes and maintains a Pusher connection throughout the app lifecycle.
 * It listens for real-time notifications and displays them as toasts.
 */
export function GlobalPusherProvider() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);

  // Get the authenticated user ID
  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        console.log('🌐 [GlobalPusher] Initializing for user:', user.id);
        setUserId(user.id);
      }
    };
    
    getUser();
  }, []);

  // Initialize Pusher connection when user is available
  const { isConnected, notifications } = usePusher({ 
    userId: userId || '', 
    enabled: !!userId 
  });

  // Listen for Pusher notifications globally and show toasts
  useEffect(() => {
    const handlePusherNotification = (event: any) => {
      const notification = event.detail;
      console.log('🔔 [GlobalPusher] Received notification:', notification);
      
      // Show toast notification
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    };

    window.addEventListener('pusher-notification', handlePusherNotification);
    
    return () => {
      window.removeEventListener('pusher-notification', handlePusherNotification);
    };
  }, [toast]);

  // Log connection status changes
  useEffect(() => {
    if (userId) {
      console.log(`🌐 [GlobalPusher] Connection status: ${isConnected ? 'Connected ✅' : 'Disconnected ❌'}`);
    }
  }, [isConnected, userId]);

  // Log new notifications
  useEffect(() => {
    if (notifications.length > 0) {
      console.log(`🌐 [GlobalPusher] Total notifications: ${notifications.length}`);
    }
  }, [notifications.length]);

  // This component doesn't render anything, it just maintains the Pusher connection
  return null;
}
