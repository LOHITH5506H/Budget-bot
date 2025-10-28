import Pusher from 'pusher';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'bill_reminder' | 'goal_milestone' | 'expense_added' | 'goal_completed' | 'report_ready' | 'general';
  timestamp: string;
  data?: Record<string, any>;
  read?: boolean;
}

class PusherService {
  private pusher: Pusher | null = null;

  constructor() {
    if (this.isConfigured()) {
      this.pusher = new Pusher({
        appId: process.env.PUSHER_APP_ID!,
        key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
        secret: process.env.PUSHER_SECRET!,
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
        useTLS: true,
      });
      console.log('Pusher service initialized');
    } else {
      console.warn('Pusher configuration missing. Real-time notifications will not work.');
    }
  }

  private isConfigured(): boolean {
    return !!(
      process.env.PUSHER_APP_ID &&
      process.env.NEXT_PUBLIC_PUSHER_APP_KEY &&
      process.env.PUSHER_SECRET &&
      process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    );
  }

  // Send notification to specific user
  async sendNotificationToUser(userId: string, notification: NotificationData): Promise<boolean> {
    if (!this.pusher) {
      console.warn('Pusher not configured, skipping notification');
      return false;
    }

    try {
      console.log('Sending Pusher notification to user:', userId);
      
      const channelName = `private-user-${userId}`;
      await this.pusher.trigger(channelName, 'notification', notification);
      
      console.log('Pusher notification sent successfully');
      return true;
    } catch (error) {
      console.error('Error sending Pusher notification:', error);
      return false;
    }
  }

  // Send expense update to user
  async sendExpenseUpdate(userId: string, expenseData: any): Promise<boolean> {
    if (!this.pusher) return false;

    try {
      const channelName = `private-user-${userId}`;
      await this.pusher.trigger(channelName, 'expense-updated', {
        type: 'expense_update',
        data: expenseData,
        timestamp: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      console.error('Error sending expense update:', error);
      return false;
    }
  }

  // Send goal progress update
  async sendGoalProgressUpdate(userId: string, goalData: any): Promise<boolean> {
    if (!this.pusher) return false;

    try {
      const channelName = `private-user-${userId}`;
      await this.pusher.trigger(channelName, 'goal-updated', {
        type: 'goal_progress',
        data: goalData,
        timestamp: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      console.error('Error sending goal update:', error);
      return false;
    }
  }

  // Send subscription update
  async sendSubscriptionUpdate(userId: string, subscriptionData: any): Promise<boolean> {
    if (!this.pusher) return false;

    try {
      const channelName = `private-user-${userId}`;
      await this.pusher.trigger(channelName, 'subscription-updated', {
        type: 'subscription_update',
        data: subscriptionData,
        timestamp: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      console.error('Error sending subscription update:', error);
      return false;
    }
  }

  // Send real-time dashboard refresh
  async sendDashboardRefresh(userId: string): Promise<boolean> {
    if (!this.pusher) return false;

    try {
      const channelName = `private-user-${userId}`;
      await this.pusher.trigger(channelName, 'dashboard-refresh', {
        type: 'dashboard_refresh',
        timestamp: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      console.error('Error sending dashboard refresh:', error);
      return false;
    }
  }

  // Send report ready notification
  async sendReportReady(userId: string, reportInfo: { type: string; downloadUrl?: string }): Promise<boolean> {
    if (!this.pusher) return false;

    try {
      const notification: NotificationData = {
        id: `report-${Date.now()}`,
        type: 'report_ready',
        title: '📊 Report Ready',
        message: `Your ${reportInfo.type} report has been generated and is ready for download.`,
        timestamp: new Date().toISOString(),
        data: reportInfo,
      };

      return await this.sendNotificationToUser(userId, notification);
    } catch (error) {
      console.error('Error sending report ready notification:', error);
      return false;
    }
  }

  // Authenticate channel access for private channels
  async authenticateChannel(socketId: string, channelName: string, userId: string): Promise<string | null> {
    if (!this.pusher) return null;

    try {
      // Verify user has access to this channel
      if (channelName === `private-user-${userId}`) {
        const authSignature = this.pusher.authorizeChannel(socketId, channelName);
        return JSON.stringify(authSignature);
      }
      
      return null;
    } catch (error) {
      console.error('Error authenticating channel:', error);
      return null;
    }
  }

  // Send presence update (for user online/offline status)
  async updateUserPresence(userId: string, isOnline: boolean): Promise<boolean> {
    if (!this.pusher) return false;

    try {
      const channelName = 'presence-users';
      await this.pusher.trigger(channelName, 'user-presence', {
        userId,
        isOnline,
        timestamp: new Date().toISOString(),
      });
      
      return true;
    } catch (error) {
      console.error('Error updating user presence:', error);
      return false;
    }
  }

  // Send bulk notifications to multiple users (admin feature)
  async sendBulkNotification(userIds: string[], notification: Omit<NotificationData, 'id'>): Promise<number> {
    if (!this.pusher) return 0;

    let successCount = 0;
    
    const sendPromises = userIds.map(async (userId) => {
      try {
        const fullNotification: NotificationData = {
          ...notification,
          id: `bulk-${Date.now()}-${userId}`,
        };
        
        const success = await this.sendNotificationToUser(userId, fullNotification);
        if (success) successCount++;
      } catch (error) {
        console.error(`Error sending bulk notification to user ${userId}:`, error);
      }
    });

    await Promise.all(sendPromises);
    console.log(`Sent bulk notifications to ${successCount} of ${userIds.length} users`);
    
    return successCount;
  }

  // Get webhook signature for validating Pusher webhooks
  validateWebhookSignature(signature: string, body: string): boolean {
    if (!this.pusher) return false;

    try {
      const webhook = this.pusher.webhook({
        rawBody: body,
        headers: { 'x-pusher-signature': signature }
      });
      return webhook.isValid();
    } catch (error) {
      console.error('Error validating webhook signature:', error);
      return false;
    }
  }
}

export const pusherService = new PusherService();
export type { NotificationData };