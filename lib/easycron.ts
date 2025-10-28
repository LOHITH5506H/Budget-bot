import axios from 'axios';

interface EasyCronJob {
  id?: string;
  name: string;
  url: string;
  cron_expression: string;
  http_method?: string;
  timezone_from?: number;
  description?: string;
  status?: 'Enable' | 'Disable';
}

interface EasyCronResponse {
  status: string;
  error?: {
    code: number;
    message: string;
  };
  cron_job_id?: string;
  cron_jobs?: EasyCronJob[];
}

class EasyCronService {
  private baseUrl = 'https://www.easycron.com/rest';
  private token: string;

  constructor() {
    this.token = process.env.EASYCRON_API_TOKEN || '';
    if (!this.token) {
      console.warn('EasyCron API token not provided. Scheduling features will not work.');
    }
  }

  private async makeRequest(endpoint: string, data: Record<string, any> = {}): Promise<EasyCronResponse> {
    try {
      const response = await axios.post(`${this.baseUrl}/${endpoint}`, {
        token: this.token,
        ...data,
      }, {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      });

      return response.data;
    } catch (error) {
      console.error('EasyCron API error:', error);
      throw new Error('Failed to communicate with EasyCron service');
    }
  }

  async createJob(job: EasyCronJob): Promise<string | null> {
    console.log('Creating EasyCron job:', job.name);
    
    const data = {
      cron_expression: job.cron_expression,
      url: job.url,
      http_method: job.http_method || 'GET',
      timezone_from: job.timezone_from || 2, // Default to GMT+2
      cron_job_name: job.name,
      description: job.description || '',
    };

    const result = await this.makeRequest('add', data);
    
    if (result.status === 'success' && result.cron_job_id) {
      console.log('EasyCron job created successfully:', result.cron_job_id);
      return result.cron_job_id;
    } else {
      console.error('Failed to create EasyCron job:', result.error);
      return null;
    }
  }

  async updateJob(jobId: string, updates: Partial<EasyCronJob>): Promise<boolean> {
    console.log('Updating EasyCron job:', jobId);
    
    const data: Record<string, any> = { id: jobId };
    
    if (updates.cron_expression) data.cron_expression = updates.cron_expression;
    if (updates.url) data.url = updates.url;
    if (updates.name) data.cron_job_name = updates.name;
    if (updates.description) data.description = updates.description;
    if (updates.status) data.status = updates.status;

    const result = await this.makeRequest('edit', data);
    
    if (result.status === 'success') {
      console.log('EasyCron job updated successfully');
      return true;
    } else {
      console.error('Failed to update EasyCron job:', result.error);
      return false;
    }
  }

  async deleteJob(jobId: string): Promise<boolean> {
    console.log('Deleting EasyCron job:', jobId);
    
    const result = await this.makeRequest('delete', { id: jobId });
    
    if (result.status === 'success') {
      console.log('EasyCron job deleted successfully');
      return true;
    } else {
      console.error('Failed to delete EasyCron job:', result.error);
      return false;
    }
  }

  async enableJob(jobId: string): Promise<boolean> {
    return this.updateJob(jobId, { status: 'Enable' });
  }

  async disableJob(jobId: string): Promise<boolean> {
    return this.updateJob(jobId, { status: 'Disable' });
  }

  async listJobs(): Promise<EasyCronJob[]> {
    console.log('Fetching EasyCron jobs');
    
    const result = await this.makeRequest('list');
    
    if (result.status === 'success' && result.cron_jobs) {
      return result.cron_jobs;
    } else {
      console.error('Failed to fetch EasyCron jobs:', result.error);
      return [];
    }
  }

  // Helper methods for common scheduling patterns
  generateCronExpression(type: 'daily' | 'weekly' | 'monthly', time: string, dayOfWeek?: number, dayOfMonth?: number): string {
    const [hour, minute] = time.split(':').map(Number);
    
    switch (type) {
      case 'daily':
        return `${minute} ${hour} * * *`;
      case 'weekly':
        const day = dayOfWeek || 0; // Default to Sunday
        return `${minute} ${hour} * * ${day}`;
      case 'monthly':
        const monthDay = dayOfMonth || 1; // Default to 1st
        return `${minute} ${hour} ${monthDay} * *`;
      default:
        throw new Error('Invalid cron type');
    }
  }

  // Schedule bill reminder
  async scheduleBillReminder(subscriptionId: string, subscriptionName: string, dueDate: number, userId: string): Promise<string | null> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronExpression = this.generateCronExpression('monthly', '09:00', undefined, Math.max(1, dueDate - 2)); // 2 days before due date
    
    return this.createJob({
      name: `Bill Reminder: ${subscriptionName}`,
      url: `${baseUrl}/api/notifications/send?type=bill_reminder&subscription_id=${subscriptionId}&user_id=${userId}`,
      cron_expression: cronExpression,
      description: `Automated bill reminder for ${subscriptionName} subscription`,
    });
  }

  // Schedule goal milestone reminder
  async scheduleGoalMilestone(goalId: string, goalName: string, targetDate: string, userId: string): Promise<string | null> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const target = new Date(targetDate);
    const reminderDate = new Date(target);
    reminderDate.setDate(target.getDate() - 7); // 1 week before target date
    
    const cronExpression = `0 10 ${reminderDate.getDate()} ${reminderDate.getMonth() + 1} *`;
    
    return this.createJob({
      name: `Goal Milestone: ${goalName}`,
      url: `${baseUrl}/api/notifications/send?type=goal_milestone&goal_id=${goalId}&user_id=${userId}`,
      cron_expression: cronExpression,
      description: `Automated milestone reminder for ${goalName} goal`,
    });
  }

  // Schedule weekly expense report
  async scheduleWeeklyReport(userId: string, dayOfWeek: number = 0, time: string = '18:00'): Promise<string | null> {
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000';
    const cronExpression = this.generateCronExpression('weekly', time, dayOfWeek);
    
    return this.createJob({
      name: `Weekly Report: User ${userId}`,
      url: `${baseUrl}/api/reports/generate?type=weekly&user_id=${userId}&format=email`,
      cron_expression: cronExpression,
      description: `Weekly expense report for user ${userId}`,
    });
  }
}

export const easyCronService = new EasyCronService();