"use client"

import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';
import { usePusher } from '@/hooks/use-pusher';
import { createClient } from '@/lib/supabase/client';

export function GlobalPusherToasts() {
  const { toast } = useToast();
  const [userId, setUserId] = useState<string | null>(null);
  
  // Get current user ID
  useEffect(() => {
    const getUserId = async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);
  
  // Initialize Pusher only when we have a userId
  const { isConnected, notifications } = usePusher({ 
    userId: userId || '', 
    enabled: !!userId 
  });
  
  // Show toast for new Pusher notifications
  useEffect(() => {
    const handlePusherNotification = (event: CustomEvent) => {
      const notification = event.detail;
      console.log('🎉 [GlobalPusherToasts] Showing toast for:', notification.title);
      
      toast({
        title: notification.title,
        description: notification.message,
        duration: 5000,
      });
    };

    window.addEventListener('pusher-notification', handlePusherNotification as EventListener);
    
    return () => {
      window.removeEventListener('pusher-notification', handlePusherNotification as EventListener);
    };
  }, [toast]);
  
  // Optional: Log connection status
  useEffect(() => {
    if (userId) {
      console.log(`🔌 [GlobalPusherToasts] Pusher ${isConnected ? 'connected' : 'disconnected'}`);
    }
  }, [isConnected, userId]);

  // This component doesn't render anything visible
  return null;
}
