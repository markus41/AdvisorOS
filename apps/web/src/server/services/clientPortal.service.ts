import { PrismaClient, Prisma } from '@prisma/client';
import { TRPCError } from '@trpc/server';
import type {
  CreatePortalAccessInput,
  UpdatePortalAccessInput,
  RevokePortalAccessInput,
  InviteClientUserInput,
  LogPortalActivityInput,
  GetPortalActivityLogInput,
  SendPortalMessageInput,
  GetPortalMessagesInput,
} from '../../lib/validations/clientPortal';

const prisma = new PrismaClient();

export class ClientPortalService {
  /**
   * Create portal access for a user
   * SECURITY: Verify client belongs to organization
   */
  static async createPortalAccess(
    organizationId: string,
    adminUserId: string,
    data: CreatePortalAccessInput
  ) {
    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        organizationId,
      },
    });

    if (!client) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client not found',
      });
    }

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
    });

    if (!user) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'User not found',
      });
    }

    // Check if access already exists
    const existing = await prisma.clientPortalAccess.findFirst({
      where: {
        userId: data.userId,
        clientId: data.clientId,
      },
    });

    if (existing) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'Portal access already exists for this user',
      });
    }

    // Create portal access
    const access = await prisma.clientPortalAccess.create({
      data: {
        ...data,
        permissions: data.permissions || {},
        isActive: true,
        createdBy: adminUserId,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        client: true,
      },
    });

    // TODO: Send welcome email with portal access instructions

    return access;
  }

  /**
   * Update portal access
   */
  static async updatePortalAccess(
    organizationId: string,
    data: UpdatePortalAccessInput
  ) {
    const { id, ...updateData } = data;

    // Verify access belongs to organization
    const access = await prisma.clientPortalAccess.findFirst({
      where: {
        id,
        client: { organizationId },
      },
    });

    if (!access) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Portal access not found',
      });
    }

    const updated = await prisma.clientPortalAccess.update({
      where: { id },
      data: updateData,
    });

    return updated;
  }

  /**
   * Revoke portal access
   */
  static async revokePortalAccess(
    organizationId: string,
    adminUserId: string,
    data: RevokePortalAccessInput
  ) {
    // Verify access belongs to organization
    const access = await prisma.clientPortalAccess.findFirst({
      where: {
        id: data.id,
        client: { organizationId },
      },
    });

    if (!access) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Portal access not found',
      });
    }

    const updated = await prisma.clientPortalAccess.update({
      where: { id: data.id },
      data: {
        isActive: false,
        revokedAt: new Date(),
        revokedBy: adminUserId,
        revocationReason: data.reason,
      },
    });

    // TODO: Send notification email
    // TODO: Invalidate all active sessions

    return updated;
  }

  /**
   * Invite client user
   */
  static async inviteClientUser(
    organizationId: string,
    inviterUserId: string,
    data: InviteClientUserInput
  ) {
    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: data.clientId,
        organizationId,
      },
    });

    if (!client) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client not found',
      });
    }

    // Check if user with email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new TRPCError({
        code: 'CONFLICT',
        message: 'User with this email already exists',
      });
    }

    // Generate invitation token
    const token = await this.generateInvitationToken();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + data.expiresInDays);

    // Create invitation record (would need invitation table in schema)
    // For now, store in portal access with pending status

    // TODO: Send invitation email
    // TODO: Create invitation record in database

    return {
      token,
      expiresAt,
      invitationUrl: `${process.env.NEXTAUTH_URL}/portal/accept-invitation?token=${token}`,
    };
  }

  /**
   * Log portal activity
   */
  static async logActivity(data: LogPortalActivityInput) {
    // Verify user has access to client portal
    const access = await prisma.clientPortalAccess.findFirst({
      where: {
        userId: data.userId,
        clientId: data.clientId,
        isActive: true,
      },
    });

    if (!access) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No active portal access found',
      });
    }

    // Create activity log (would need activity table in schema)
    // Using raw query for now
    await prisma.$executeRaw`
      INSERT INTO portal_activity_logs (
        id, user_id, client_id, activity_type, metadata, created_at
      ) VALUES (
        gen_random_uuid(), ${data.userId}, ${data.clientId},
        ${data.activityType}, ${JSON.stringify(data.metadata)}, NOW()
      )
    `;

    return { success: true };
  }

  /**
   * Get portal activity log
   */
  static async getActivityLog(
    organizationId: string,
    filters: GetPortalActivityLogInput
  ) {
    // Verify client belongs to organization
    const client = await prisma.client.findFirst({
      where: {
        id: filters.clientId,
        organizationId,
      },
    });

    if (!client) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Client not found',
      });
    }

    // Build query
    // Would use activity table, using placeholder for now
    return {
      activities: [],
      total: 0,
      nextCursor: null,
    };
  }

  /**
   * Send portal message
   */
  static async sendMessage(
    organizationId: string,
    senderId: string,
    data: SendPortalMessageInput
  ) {
    // Verify sender has access
    const senderAccess = await prisma.clientPortalAccess.findFirst({
      where: {
        userId: senderId,
        clientId: data.clientId,
        isActive: true,
        canMessageAdvisor: true,
      },
    });

    if (!senderAccess) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'You do not have permission to send messages',
      });
    }

    // Verify recipient exists
    const recipient = await prisma.user.findUnique({
      where: { id: data.recipientId },
    });

    if (!recipient) {
      throw new TRPCError({
        code: 'NOT_FOUND',
        message: 'Recipient not found',
      });
    }

    // Create message (would need messages table)
    // Using raw query placeholder
    await prisma.$executeRaw`
      INSERT INTO portal_messages (
        id, client_id, sender_id, recipient_id, subject, body,
        priority, created_at, is_read
      ) VALUES (
        gen_random_uuid(), ${data.clientId}, ${senderId},
        ${data.recipientId}, ${data.subject}, ${data.body},
        ${data.priority}, NOW(), false
      )
    `;

    // TODO: Send email notification
    // TODO: Create in-app notification

    return { success: true };
  }

  /**
   * Get portal messages
   */
  static async getMessages(
    userId: string,
    filters: GetPortalMessagesInput
  ) {
    // Verify user has access
    const access = await prisma.clientPortalAccess.findFirst({
      where: {
        userId,
        clientId: filters.clientId,
        isActive: true,
      },
    });

    if (!access) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No portal access found',
      });
    }

    // Would query messages table
    return {
      messages: [],
      total: 0,
      nextCursor: null,
    };
  }

  /**
   * Get portal dashboard data
   */
  static async getDashboard(userId: string, clientId: string, organizationId: string) {
    // Verify user has access
    const access = await prisma.clientPortalAccess.findFirst({
      where: {
        userId,
        clientId,
        isActive: true,
        client: { organizationId },
      },
      include: {
        client: true,
      },
    });

    if (!access) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'No portal access found',
      });
    }

    // Get dashboard data based on permissions
    const dashboard: any = {
      client: access.client,
      permissions: {
        canViewFinancials: access.canViewFinancials,
        canUploadDocuments: access.canUploadDocuments,
        canMessageAdvisor: access.canMessageAdvisor,
        canApproveInvoices: access.canApproveInvoices,
        canViewReports: access.canViewReports,
        canExportData: access.canExportData,
      },
    };

    // Get recent activity if permission
    if (access.canViewReports) {
      // dashboard.recentActivity = await this.getRecentActivity(clientId);
    }

    // Get financial summary if permission
    if (access.canViewFinancials) {
      // dashboard.financialSummary = await this.getFinancialSummary(clientId);
    }

    // Get documents if permission
    if (access.canUploadDocuments || access.canViewReports) {
      dashboard.recentDocuments = await prisma.document.findMany({
        where: {
          clientId,
          organizationId,
        },
        take: 10,
        orderBy: { uploadedAt: 'desc' },
      });
    }

    // Get upcoming tasks
    dashboard.upcomingTasks = await prisma.task.findMany({
      where: {
        engagement: {
          clientId,
          organizationId,
        },
        status: { in: ['pending', 'in_progress'] },
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
    });

    return dashboard;
  }

  /**
   * Check if user has portal access to client
   */
  static async checkAccess(userId: string, clientId: string): Promise<boolean> {
    const access = await prisma.clientPortalAccess.findFirst({
      where: {
        userId,
        clientId,
        isActive: true,
        OR: [
          { expiresAt: null },
          { expiresAt: { gt: new Date() } },
        ],
      },
    });

    return !!access;
  }

  /**
   * Get user permissions for client
   */
  static async getUserPermissions(userId: string, clientId: string) {
    const access = await prisma.clientPortalAccess.findFirst({
      where: {
        userId,
        clientId,
        isActive: true,
      },
    });

    if (!access) {
      return null;
    }

    return {
      accessLevel: access.accessLevel,
      canViewFinancials: access.canViewFinancials,
      canUploadDocuments: access.canUploadDocuments,
      canMessageAdvisor: access.canMessageAdvisor,
      canApproveInvoices: access.canApproveInvoices,
      canManageUsers: access.canManageUsers,
      canViewReports: access.canViewReports,
      canExportData: access.canExportData,
      customPermissions: access.permissions,
    };
  }

  // Helper methods

  private static async generateInvitationToken(): Promise<string> {
    const { randomBytes } = await import('crypto');
    return randomBytes(32).toString('hex');
  }
}