import Pusher from 'pusher';

interface NotificationData {
  id: string;
  title: string;
  message: string;
  type: 'bill_reminder' | 'goal_milestone' | 'expense_added' | 'goal_completed' | 'report_ready' | 'subscription_added' | 'subscription_updated' | 'subscription_deleted' | 'general';
  timestamp: string;
  data?: Record<string, any>;
  read?: boolean;
}

interface PusherError extends Error {
  status?: number;
  code?: string;
  data?: any;
}

class PusherService {
  private pusher: Pusher | null = null;
  private retryAttempts = 3;
  private retryDelay = 1000; // 1 second

  constructor() {
    if (this.isConfigured()) {
      try {
        this.pusher = new Pusher({
          appId: process.env.PUSHER_APP_ID!,
          key: process.env.NEXT_PUBLIC_PUSHER_APP_KEY!,
          secret: process.env.PUSHER_SECRET!,
          cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
          useTLS: true,
        });
        console.log('✅ Pusher service initialized successfully');
      } catch (error) {
        console.error('❌ Failed to initialize Pusher:', error);
        this.pusher = null;
      }
    } else {
      console.warn('⚠️ Pusher configuration missing. Real-time notifications will not work.');
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

  /**
   * Smart retry mechanism for failed Pusher operations
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    operationName: string,
    attempt: number = 1
  ): Promise<T | null> {
    try {
      return await operation();
    } catch (error) {
      const pusherError = error as PusherError;
      
      // Don't retry on authentication errors
      if (pusherError.status === 401 || pusherError.status === 403) {
        console.error(`🚫 ${operationName} failed - Authentication error:`, pusherError.message);
        return null;
      }

      // Don't retry on bad request errors
      if (pusherError.status === 400) {
        console.error(`🚫 ${operationName} failed - Bad request:`, pusherError.message);
        return null;
      }

      // Retry on network errors or server errors
      if (attempt < this.retryAttempts && (pusherError.code === 'ENOTFOUND' || pusherError.status === 500 || pusherError.status === 503)) {
        console.warn(`⚠️ ${operationName} failed (attempt ${attempt}/${this.retryAttempts}), retrying...`);
        await this.delay(this.retryDelay * attempt);
        return this.retryOperation(operation, operationName, attempt + 1);
      }

      console.error(`❌ ${operationName} failed after ${attempt} attempts:`, pusherError.message);
      return null;
    }
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Log operation result with emoji indicators
   */
  private logResult(operationName: string, success: boolean, details?: string): void {
    if (success) {
      console.log(`✅ ${operationName} successful${details ? ': ' + details : ''}`);
    } else {
      console.warn(`⚠️ ${operationName} failed${details ? ': ' + details : ''}`);
    }
  }

  // Send notification to specific user
  async sendNotificationToUser(userId: string, notification: NotificationData): Promise<boolean> {
    if (!this.pusher) {
      console.warn('⚠️ Pusher not configured, skipping notification');
      return false;
    }

    const operation = async () => {
      const channelName = `private-user-${userId}`;
      await this.pusher!.trigger(channelName, 'notification', notification);
      return true;
    };

    const result = await this.retryOperation(operation, `Send notification to user ${userId}`);
    this.logResult('Send notification', result !== null, notification.type);
    return result !== null;
  }

  // Send subscription added notification
  async sendSubscriptionAdded(userId: string, subscriptionData: {
    name: string;
    amount: number;
    billing_cycle: string;
    next_due_date: string;
  }): Promise<boolean> {
    const notification: NotificationData = {
      id: `subscription-added-${Date.now()}`,
      type: 'subscription_added',
      title: '✅ Subscription Added',
      message: `${subscriptionData.name} has been added successfully!`,
      timestamp: new Date().toISOString(),
      data: subscriptionData,
    };

    return await this.sendNotificationToUser(userId, notification);
  }

  // Send subscription updated notification
  async sendSubscriptionUpdated(userId: string, subscriptionData: {
    id: string;
    name: string;
    amount: number;
    billing_cycle: string;
    next_due_date: string;
  }): Promise<boolean> {
    const notification: NotificationData = {
      id: `subscription-updated-${Date.now()}`,
      type: 'subscription_updated',
      title: '📝 Subscription Updated',
      message: `${subscriptionData.name} has been updated successfully!`,
      timestamp: new Date().toISOString(),
      data: subscriptionData,
    };

    return await this.sendNotificationToUser(userId, notification);
  }

  // Send subscription deleted notification
  async sendSubscriptionDeleted(userId: string, subscriptionName: string, subscriptionId: string): Promise<boolean> {
    const notification: NotificationData = {
      id: `subscription-deleted-${Date.now()}`,
      type: 'subscription_deleted',
      title: '🗑️ Subscription Removed',
      message: `${subscriptionName} has been removed from your subscriptions.`,
      timestamp: new Date().toISOString(),
      data: { subscriptionId, subscriptionName },
    };

    return await this.sendNotificationToUser(userId, notification);
  }

  // Send expense update to user
  async sendExpenseUpdate(userId: string, expenseData: any): Promise<boolean> {
    if (!this.pusher) return false;

    const operation = async () => {
      const channelName = `private-user-${userId}`;
      await this.pusher!.trigger(channelName, 'expense-updated', {
        type: 'expense_update',
        data: expenseData,
        timestamp: new Date().toISOString(),
      });
      return true;
    };

    const result = await this.retryOperation(operation, 'Send expense update');
    this.logResult('Expense update', result !== null);
    return result !== null;
  }

  // Send goal progress update
  async sendGoalProgressUpdate(userId: string, goalData: any): Promise<boolean> {
    if (!this.pusher) return false;

    const operation = async () => {
      const channelName = `private-user-${userId}`;
      await this.pusher!.trigger(channelName, 'goal-updated', {
        type: 'goal_progress',
        data: goalData,
        timestamp: new Date().toISOString(),
      });
      return true;
    };

    const result = await this.retryOperation(operation, 'Send goal update');
    this.logResult('Goal update', result !== null);
    return result !== null;
  }

  // Send subscription update
  async sendSubscriptionUpdate(userId: string, subscriptionData: any): Promise<boolean> {
    if (!this.pusher) return false;

    const operation = async () => {
      const channelName = `private-user-${userId}`;
      await this.pusher!.trigger(channelName, 'subscription-updated', {
        type: 'subscription_update',
        data: subscriptionData,
        timestamp: new Date().toISOString(),
      });
      return true;
    };

    const result = await this.retryOperation(operation, 'Send subscription update');
    this.logResult('Subscription update', result !== null);
    return result !== null;
  }

  // Send real-time dashboard refresh
  async sendDashboardRefresh(userId: string): Promise<boolean> {
    if (!this.pusher) return false;

    const operation = async () => {
      const channelName = `private-user-${userId}`;
      await this.pusher!.trigger(channelName, 'dashboard-refresh', {
        type: 'dashboard_refresh',
        timestamp: new Date().toISOString(),
      });
      return true;
    };

    const result = await this.retryOperation(operation, 'Send dashboard refresh');
    this.logResult('Dashboard refresh', result !== null);
    return result !== null;
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