import { request } from './client';

interface NotificationSettings {
  bookingEmails: string[];
  emailConfigured: boolean;
}

export const getNotificationSettings = () => request<NotificationSettings>('/notifications/settings');
export const saveNotificationSettings = (bookingEmails: string[]) =>
  request<NotificationSettings>('/notifications/settings', { method: 'PUT', body: { bookingEmails } });
