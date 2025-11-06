"use client"

import { useEffect, useState, useCallback } from 'react';
import PusherJS from 'pusher-js';
import { NotificationData } from '@/lib/pusher-service';

interface UsePusherOptions {
  userId: string;
  enabled?: boolean;
}

interface PusherHook {
  isConnected: boolean;
  notifications: NotificationData[];
  markAsRead: (notificationId: string) => void;
  clearAll: () => void;
  sendTestNotification: () => void;
}

export function usePusher({ userId, enabled = true }: UsePusherOptions): PusherHook {
  const [pusher, setPusher] = useState<PusherJS | null>(null);
  const [channel, setChannel] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [notifications, setNotifications] = useState<NotificationData[]>([]);

  // Initialize Pusher connection
  useEffect(() => {
    if (!enabled || !userId) return;

    const pusherKey = process.env.NEXT_PUBLIC_PUSHER_APP_KEY;
    const pusherCluster = process.env.NEXT_PUBLIC_PUSHER_CLUSTER;

    if (!pusherKey || !pusherCluster) {
      console.warn('Pusher configuration missing');
      return;
    }

    console.log('Initializing Pusher connection for user:', userId);

    const pusherInstance = new PusherJS(pusherKey, {
      cluster: pusherCluster,
      authEndpoint: '/api/pusher/auth',
      auth: {
        headers: {
          'X-User-ID': userId,
        },
      },
    });

    // Subscribe to user's private channel
    const userChannel = pusherInstance.subscribe(`private-user-${userId}`);

    // Connection event handlers
    pusherInstance.connection.bind('connected', () => {
      console.log('Pusher connected');
      setIsConnected(true);
    });

    pusherInstance.connection.bind('disconnected', () => {
      console.log('Pusher disconnected');
      setIsConnected(false);
    });

    pusherInstance.connection.bind('error', (error: any) => {
      console.error('Pusher connection error:', error);
      setIsConnected(false);
    });

    // Set up event listeners
    setupChannelListeners(userChannel);

    setPusher(pusherInstance);
    setChannel(userChannel);

    // Cleanup function
    return () => {
      console.log('Cleaning up Pusher connection');
      if (userChannel) {
        userChannel.unbind_all();
        pusherInstance.unsubscribe(`private-user-${userId}`);
      }
      pusherInstance.disconnect();
      setIsConnected(false);
      setPusher(null);
      setChannel(null);
    };
  }, [userId, enabled]);

  // Set up channel event listeners
  const setupChannelListeners = useCallback((userChannel: any) => {
    // Handle notifications
    userChannel.bind('notification', (data: NotificationData) => {
      console.log('🔔 [usePusher] Received notification:', data);
      console.log('📊 [usePusher] Current notifications count:', notifications.length);
      setNotifications(prev => {
        const updated = [data, ...prev].slice(0, 50);
        console.log('📊 [usePusher] Updated notifications count:', updated.length);
        return updated;
      }); // Keep last 50 notifications
      
      // Show browser notification if permission granted
      showBrowserNotification(data);
      
      // Dispatch custom event for toast notifications
      window.dispatchEvent(new CustomEvent('pusher-notification', { detail: data }));
    });

    // Handle expense updates
    userChannel.bind('expense-updated', (data: any) => {
      console.log('Expense updated:', data);
      // Trigger dashboard refresh or update specific components
      window.dispatchEvent(new CustomEvent('expense-updated', { detail: data }));
    });

    // Handle goal updates
    userChannel.bind('goal-updated', (data: any) => {
      console.log('Goal updated:', data);
      window.dispatchEvent(new CustomEvent('goal-updated', { detail: data }));
    });

    // Handle subscription updates
    userChannel.bind('subscription-updated', (data: any) => {
      console.log('Subscription updated:', data);
      window.dispatchEvent(new CustomEvent('subscription-updated', { detail: data }));
    });

    // Handle dashboard refresh
    userChannel.bind('dashboard-refresh', (data: any) => {
      console.log('Dashboard refresh requested');
      window.dispatchEvent(new CustomEvent('dashboard-refresh', { detail: data }));
    });
  }, []);

  // Show browser notification
  const showBrowserNotification = useCallback((notification: NotificationData) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(notification.title, {
        body: notification.message,
        icon: '/icon-192.png', // Add your app icon
        badge: '/icon-192.png',
        tag: notification.id,
        requireInteraction: false,
        silent: false,
      });
    }
  }, []);

  // Request notification permission
  const requestNotificationPermission = useCallback(async () => {
    if ('Notification' in window && Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      console.log('Notification permission:', permission);
      return permission === 'granted';
    }
    return Notification.permission === 'granted';
  }, []);

  // Mark notification as read
  const markAsRead = useCallback((notificationId: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === notificationId 
          ? { ...notification, read: true }
          : notification
      )
    );
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    setNotifications([]);
  }, []);

  // Send test notification (for development)
  const sendTestNotification = useCallback(async () => {
    if (!userId) return;

    try {
      await fetch('/api/notifications/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          type: 'general',
          title: 'Test Notification',
          message: 'This is a test notification from your BudgetBot app!',
        }),
      });
    } catch (error) {
      console.error('Error sending test notification:', error);
    }
  }, [userId]);

  // Request notification permission on first load
  useEffect(() => {
    if (enabled) {
      requestNotificationPermission();
    }
  }, [enabled, requestNotificationPermission]);

  return {
    isConnected,
    notifications,
    markAsRead,
    clearAll,
    sendTestNotification,
  };
}

// Hook for listening to specific events
export function usePusherEvent(eventName: string, handler: (data: any) => void, dependencies: any[] = []) {
  useEffect(() => {
    const eventHandler = (event: CustomEvent) => {
      handler(event.detail);
    };

    window.addEventListener(eventName, eventHandler as EventListener);
    
    return () => {
      window.removeEventListener(eventName, eventHandler as EventListener);
    };
  }, dependencies);
}