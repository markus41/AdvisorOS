import { z } from 'zod';
import { createTRPCRouter, organizationProcedure, adminProcedure } from '@/server/api/trpc';
import { ClientPortalService } from '@/server/services/clientPortal.service';
import {
  createPortalAccessSchema,
  updatePortalAccessSchema,
  revokePortalAccessSchema,
  inviteClientUserSchema,
  logPortalActivitySchema,
  getPortalActivityLogSchema,
  sendPortalMessageSchema,
  getPortalMessagesSchema,
  markMessageReadSchema,
  getPortalDashboardSchema,
  updateNotificationPreferencesSchema,
  updateSecuritySettingsSchema,
} from '@/lib/validations/clientPortal';

export const clientPortalRouter = createTRPCRouter({
  /**
   * Create portal access for a user
   * Requires: Admin role
   */
  createAccess: adminProcedure
    .input(createPortalAccessSchema)
    .mutation(async ({ ctx, input }) => {
      return await ClientPortalService.createPortalAccess(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Update portal access
   * Requires: Admin role
   */
  updateAccess: adminProcedure
    .input(updatePortalAccessSchema)
    .mutation(async ({ ctx, input }) => {
      return await ClientPortalService.updatePortalAccess(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Revoke portal access
   * Requires: Admin role
   */
  revokeAccess: adminProcedure
    .input(revokePortalAccessSchema)
    .mutation(async ({ ctx, input }) => {
      return await ClientPortalService.revokePortalAccess(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Invite client user
   * Requires: Admin role
   */
  inviteUser: adminProcedure
    .input(inviteClientUserSchema)
    .mutation(async ({ ctx, input }) => {
      return await ClientPortalService.inviteClientUser(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Log portal activity
   */
  logActivity: organizationProcedure
    .input(logPortalActivitySchema)
    .mutation(async ({ input }) => {
      return await ClientPortalService.logActivity(input);
    }),

  /**
   * Get portal activity log
   */
  getActivityLog: organizationProcedure
    .input(getPortalActivityLogSchema)
    .query(async ({ ctx, input }) => {
      return await ClientPortalService.getActivityLog(
        ctx.organizationId,
        input
      );
    }),

  /**
   * Send portal message
   */
  sendMessage: organizationProcedure
    .input(sendPortalMessageSchema)
    .mutation(async ({ ctx, input }) => {
      return await ClientPortalService.sendMessage(
        ctx.organizationId,
        ctx.userId,
        input
      );
    }),

  /**
   * Get portal messages
   */
  getMessages: organizationProcedure
    .input(getPortalMessagesSchema)
    .query(async ({ ctx, input }) => {
      return await ClientPortalService.getMessages(ctx.userId, input);
    }),

  /**
   * Mark message as read
   */
  markMessageRead: organizationProcedure
    .input(markMessageReadSchema)
    .mutation(async ({ input }) => {
      // Would update message read status
      return { success: true };
    }),

  /**
   * Get portal dashboard
   */
  getDashboard: organizationProcedure
    .input(getPortalDashboardSchema)
    .query(async ({ ctx, input }) => {
      return await ClientPortalService.getDashboard(
        ctx.userId,
        input.clientId,
        ctx.organizationId
      );
    }),

  /**
   * Update notification preferences
   */
  updateNotificationPreferences: organizationProcedure
    .input(updateNotificationPreferencesSchema)
    .mutation(async ({ ctx, input }) => {
      // Would update notification preferences
      return { success: true };
    }),

  /**
   * Update security settings
   */
  updateSecuritySettings: organizationProcedure
    .input(updateSecuritySettingsSchema)
    .mutation(async ({ ctx, input }) => {
      // Would update security settings
      return { success: true };
    }),

  /**
   * Check if user has portal access
   */
  checkAccess: organizationProcedure
    .input(z.object({
      clientId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const hasAccess = await ClientPortalService.checkAccess(
        ctx.userId,
        input.clientId
      );
      return { hasAccess };
    }),

  /**
   * Get user permissions for client
   */
  getPermissions: organizationProcedure
    .input(z.object({
      clientId: z.string().cuid(),
      userId: z.string().cuid().optional(),
    }))
    .query(async ({ ctx, input }) => {
      const userId = input.userId || ctx.userId;
      const permissions = await ClientPortalService.getUserPermissions(
        userId,
        input.clientId
      );
      return permissions;
    }),

  /**
   * List all portal access entries for a client
   */
  listClientAccess: organizationProcedure
    .input(z.object({
      clientId: z.string().cuid(),
      includeInactive: z.boolean().default(false),
    }))
    .query(async ({ ctx, input }) => {
      const where: any = {
        clientId: input.clientId,
        client: { organizationId: ctx.organizationId },
      };

      if (!input.includeInactive) {
        where.isActive = true;
      }

      const accessList = await ctx.prisma.clientPortalAccess.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      return accessList;
    }),

  /**
   * Get portal access by ID
   */
  getAccessById: organizationProcedure
    .input(z.object({
      accessId: z.string().cuid(),
    }))
    .query(async ({ ctx, input }) => {
      const access = await ctx.prisma.clientPortalAccess.findFirst({
        where: {
          id: input.accessId,
          client: { organizationId: ctx.organizationId },
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
            },
          },
          client: true,
        },
      });

      if (!access) {
        throw new Error('Portal access not found');
      }

      return access;
    }),
});