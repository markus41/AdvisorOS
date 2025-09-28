import { prisma } from '@cpa-platform/database'

export interface NotificationData {
  type: string
  organizationId: string
  userId?: string
  recipientId?: string
  title?: string
  message?: string
  data?: any
  priority?: 'low' | 'normal' | 'high' | 'urgent'
  channel?: 'in_app' | 'email' | 'sms' | 'all'
  sendAt?: Date
  expiresAt?: Date
}

export interface EmailNotificationData {
  to: string | string[]
  subject: string
  template: string
  variables?: Record<string, any>
  attachments?: Array<{
    filename: string
    content: Buffer | string
    contentType?: string
  }>
}

/**
 * Notification Service for handling all types of notifications
 */
export class NotificationService {
  /**
   * Send a notification
   */
  static async sendNotification(data: NotificationData): Promise<void> {
    try {
      const {
        type,
        organizationId,
        userId,
        recipientId,
        title,
        message,
        data: notificationData,
        priority = 'normal',
        channel = 'in_app',
        sendAt,
        expiresAt
      } = data

      // Create notification record
      const notification = await prisma.$transaction(async (tx) => {
        // Note: This assumes you have a notifications table
        // If not, you can store in a JSON field or implement your own storage

        // For now, we'll log to audit trail as notification
        await tx.auditLog.create({
          data: {
            action: 'notification_sent',
            entityType: 'notification',
            userId: recipientId || userId,
            organizationId,
            metadata: {
              type,
              title,
              message,
              priority,
              channel,
              data: notificationData,
              sendAt,
              expiresAt
            }
          }
        })

        return {
          id: 'notification_' + Date.now(),
          type,
          title,
          message,
          priority,
          channel
        }
      })

      // Handle different notification channels
      switch (channel) {
        case 'email':
          await this.sendEmailNotification(data)
          break
        case 'sms':
          await this.sendSMSNotification(data)
          break
        case 'all':
          await Promise.all([
            this.sendEmailNotification(data),
            this.sendSMSNotification(data)
          ])
          break
        case 'in_app':
        default:
          // In-app notifications are already stored
          break
      }

      console.log('Notification sent:', notification)
    } catch (error) {
      console.error('Failed to send notification:', error)
      // Don't throw to avoid breaking main operations
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(data: NotificationData): Promise<void> {
    try {
      // Get recipient email
      let recipientEmail: string

      if (data.recipientId) {
        const user = await prisma.user.findUnique({
          where: { id: data.recipientId },
          select: { email: true }
        })
        recipientEmail = user?.email || ''
      } else {
        // For client notifications, you might need to get email differently
        recipientEmail = ''
      }

      if (!recipientEmail) {
        console.warn('No email found for notification recipient')
        return
      }

      // Here you would integrate with your email service (SendGrid, AWS SES, etc.)
      console.log('Email notification would be sent to:', recipientEmail, {
        subject: data.title || 'Notification',
        body: data.message,
        type: data.type
      })

      // Example implementation with a hypothetical email service:
      // await EmailService.send({
      //   to: recipientEmail,
      //   subject: data.title || 'Notification',
      //   template: this.getEmailTemplate(data.type),
      //   variables: {
      //     message: data.message,
      //     ...data.data
      //   }
      // })
    } catch (error) {
      console.error('Failed to send email notification:', error)
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMSNotification(data: NotificationData): Promise<void> {
    try {
      // Get recipient phone number
      let recipientPhone: string

      if (data.recipientId) {
        const user = await prisma.user.findUnique({
          where: { id: data.recipientId },
          select: { id: true } // Assuming phone is in profile or custom fields
        })
        recipientPhone = '' // You'd get this from user profile
      } else {
        recipientPhone = ''
      }

      if (!recipientPhone) {
        console.warn('No phone number found for SMS notification')
        return
      }

      // Here you would integrate with your SMS service (Twilio, AWS SNS, etc.)
      console.log('SMS notification would be sent to:', recipientPhone, {
        message: data.message,
        type: data.type
      })

      // Example implementation:
      // await SMSService.send({
      //   to: recipientPhone,
      //   message: data.message || data.title || 'You have a new notification'
      // })
    } catch (error) {
      console.error('Failed to send SMS notification:', error)
    }
  }

  /**
   * Get email template for notification type
   */
  private static getEmailTemplate(type: string): string {
    const templates: Record<string, string> = {
      'client_created': 'client-created',
      'client_updated': 'client-updated',
      'client_archived': 'client-archived',
      'engagement_created': 'engagement-created',
      'engagement_completed': 'engagement-completed',
      'invoice_sent': 'invoice-sent',
      'invoice_overdue': 'invoice-overdue',
      'document_uploaded': 'document-uploaded',
      'task_assigned': 'task-assigned',
      'task_completed': 'task-completed',
      'reminder': 'reminder',
      'system_alert': 'system-alert',
      'default': 'default-notification'
    }

    return templates[type] || templates['default']
  }

  /**
   * Send client-related notifications
   */
  static async notifyClientCreated(
    clientId: string,
    clientName: string,
    organizationId: string,
    createdBy: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'client_created',
      organizationId,
      userId: createdBy,
      title: 'New Client Added',
      message: `New client "${clientName}" has been added to the system`,
      data: { clientId, clientName },
      priority: 'normal',
      channel: 'in_app'
    })
  }

  static async notifyClientUpdated(
    clientId: string,
    clientName: string,
    organizationId: string,
    updatedBy: string,
    changes: string[]
  ): Promise<void> {
    await this.sendNotification({
      type: 'client_updated',
      organizationId,
      userId: updatedBy,
      title: 'Client Updated',
      message: `Client "${clientName}" has been updated. Changes: ${changes.join(', ')}`,
      data: { clientId, clientName, changes },
      priority: 'normal',
      channel: 'in_app'
    })
  }

  static async notifyClientArchived(
    clientId: string,
    clientName: string,
    organizationId: string,
    archivedBy: string,
    reason?: string
  ): Promise<void> {
    await this.sendNotification({
      type: 'client_archived',
      organizationId,
      userId: archivedBy,
      title: 'Client Archived',
      message: `Client "${clientName}" has been archived${reason ? `. Reason: ${reason}` : ''}`,
      data: { clientId, clientName, reason },
      priority: 'normal',
      channel: 'in_app'
    })
  }

  /**
   * Send bulk notification
   */
  static async sendBulkNotification(
    notifications: NotificationData[]
  ): Promise<void> {
    try {
      await Promise.all(
        notifications.map(notification => this.sendNotification(notification))
      )
    } catch (error) {
      console.error('Failed to send bulk notifications:', error)
    }
  }

  /**
   * Schedule notification for later delivery
   */
  static async scheduleNotification(
    data: NotificationData,
    sendAt: Date
  ): Promise<void> {
    // Store in database with sendAt timestamp
    // A background job would pick these up and send them
    await this.sendNotification({
      ...data,
      sendAt
    })
  }

  /**
   * Send reminder notifications
   */
  static async sendReminders(organizationId: string): Promise<void> {
    try {
      // Get all notes with reminder dates that are due
      const dueReminders = await prisma.note.findMany({
        where: {
          reminderDate: {
            lte: new Date()
          },
          // Add a flag to track if reminder was sent
          // reminderSent: false
        },
        include: {
          client: {
            select: { id: true, businessName: true }
          },
          author: {
            select: { id: true, name: true, email: true }
          }
        }
      })

      for (const reminder of dueReminders) {
        await this.sendNotification({
          type: 'reminder',
          organizationId,
          recipientId: reminder.authorId,
          title: 'Reminder Due',
          message: `Reminder: ${reminder.title || reminder.content.substring(0, 100)}...`,
          data: {
            noteId: reminder.id,
            clientId: reminder.clientId,
            clientName: reminder.client?.businessName
          },
          priority: 'high',
          channel: 'all'
        })

        // Mark reminder as sent
        // await prisma.note.update({
        //   where: { id: reminder.id },
        //   data: { reminderSent: true }
        // })
      }
    } catch (error) {
      console.error('Failed to send reminders:', error)
    }
  }
}

// Helper function for backward compatibility
export async function sendNotification(data: NotificationData): Promise<void> {
  return NotificationService.sendNotification(data)
}