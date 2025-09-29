/**
 * Advanced Role-Based Access Control (RBAC) Permission Service
 * Manages permissions, roles, and access control for the AdvisorOS platform
 */

import { prisma } from '@/server/db'
import { type User, type TeamMember, type Permission, type RolePermission } from '@prisma/client'

export interface PermissionContext {
  path?: string
  type?: 'query' | 'mutation' | 'subscription'
  input?: any
  resource?: string
  conditions?: Record<string, any>
}

export interface PermissionDefinition {
  name: string
  description: string
  category: string
  action: string
  resource: string
  isSystemLevel?: boolean
}

// Core permissions for the system
export const CORE_PERMISSIONS: PermissionDefinition[] = [
  // User Management
  { name: 'users:create', description: 'Create new users', category: 'user_management', action: 'create', resource: 'users' },
  { name: 'users:read', description: 'View user information', category: 'user_management', action: 'read', resource: 'users' },
  { name: 'users:update', description: 'Update user information', category: 'user_management', action: 'update', resource: 'users' },
  { name: 'users:delete', description: 'Delete users', category: 'user_management', action: 'delete', resource: 'users' },
  { name: 'users:invite', description: 'Invite new users', category: 'user_management', action: 'create', resource: 'users' },

  // Client Management
  { name: 'clients:create', description: 'Create new clients', category: 'client_management', action: 'create', resource: 'clients' },
  { name: 'clients:read', description: 'View client information', category: 'client_management', action: 'read', resource: 'clients' },
  { name: 'clients:update', description: 'Update client information', category: 'client_management', action: 'update', resource: 'clients' },
  { name: 'clients:delete', description: 'Delete clients', category: 'client_management', action: 'delete', resource: 'clients' },
  { name: 'clients:export', description: 'Export client data', category: 'client_management', action: 'export', resource: 'clients' },

  // Document Management
  { name: 'documents:create', description: 'Upload documents', category: 'document_management', action: 'create', resource: 'documents' },
  { name: 'documents:read', description: 'View documents', category: 'document_management', action: 'read', resource: 'documents' },
  { name: 'documents:update', description: 'Update document metadata', category: 'document_management', action: 'update', resource: 'documents' },
  { name: 'documents:delete', description: 'Delete documents', category: 'document_management', action: 'delete', resource: 'documents' },
  { name: 'documents:download', description: 'Download documents', category: 'document_management', action: 'read', resource: 'documents' },
  { name: 'documents:share', description: 'Share documents', category: 'document_management', action: 'create', resource: 'documents' },

  // Financial Data
  { name: 'financial:read', description: 'View financial data', category: 'financial_management', action: 'read', resource: 'financial_data' },
  { name: 'financial:update', description: 'Update financial data', category: 'financial_management', action: 'update', resource: 'financial_data' },
  { name: 'financial:export', description: 'Export financial data', category: 'financial_management', action: 'export', resource: 'financial_data' },

  // Billing & Invoicing
  { name: 'billing:create', description: 'Create invoices', category: 'billing', action: 'create', resource: 'invoices' },
  { name: 'billing:read', description: 'View billing information', category: 'billing', action: 'read', resource: 'invoices' },
  { name: 'billing:update', description: 'Update billing information', category: 'billing', action: 'update', resource: 'invoices' },
  { name: 'billing:delete', description: 'Delete invoices', category: 'billing', action: 'delete', resource: 'invoices' },

  // Reporting
  { name: 'reports:create', description: 'Generate reports', category: 'reporting', action: 'create', resource: 'reports' },
  { name: 'reports:read', description: 'View reports', category: 'reporting', action: 'read', resource: 'reports' },
  { name: 'reports:export', description: 'Export reports', category: 'reporting', action: 'export', resource: 'reports' },
  { name: 'reports:schedule', description: 'Schedule automated reports', category: 'reporting', action: 'create', resource: 'reports' },

  // Workflow Management
  { name: 'workflows:create', description: 'Create workflows', category: 'workflow_management', action: 'create', resource: 'workflows' },
  { name: 'workflows:read', description: 'View workflows', category: 'workflow_management', action: 'read', resource: 'workflows' },
  { name: 'workflows:update', description: 'Update workflows', category: 'workflow_management', action: 'update', resource: 'workflows' },
  { name: 'workflows:delete', description: 'Delete workflows', category: 'workflow_management', action: 'delete', resource: 'workflows' },
  { name: 'workflows:execute', description: 'Execute workflows', category: 'workflow_management', action: 'update', resource: 'workflows' },

  // System Administration
  { name: 'system:admin', description: 'System administration access', category: 'system_administration', action: 'create', resource: 'system', isSystemLevel: true },
  { name: 'system:audit', description: 'View audit logs', category: 'system_administration', action: 'read', resource: 'audit_logs', isSystemLevel: true },
  { name: 'system:settings', description: 'Manage system settings', category: 'system_administration', action: 'update', resource: 'settings', isSystemLevel: true },

  // API Access
  { name: 'api:access', description: 'Access API endpoints', category: 'api_management', action: 'read', resource: 'api' },
  { name: 'api:keys', description: 'Manage API keys', category: 'api_management', action: 'create', resource: 'api_keys' },
]

// Default role permissions
export const DEFAULT_ROLE_PERMISSIONS: Record<string, string[]> = {
  owner: [
    'users:create', 'users:read', 'users:update', 'users:delete', 'users:invite',
    'clients:create', 'clients:read', 'clients:update', 'clients:delete', 'clients:export',
    'documents:create', 'documents:read', 'documents:update', 'documents:delete', 'documents:download', 'documents:share',
    'financial:read', 'financial:update', 'financial:export',
    'billing:create', 'billing:read', 'billing:update', 'billing:delete',
    'reports:create', 'reports:read', 'reports:export', 'reports:schedule',
    'workflows:create', 'workflows:read', 'workflows:update', 'workflows:delete', 'workflows:execute',
    'system:admin', 'system:audit', 'system:settings',
    'api:access', 'api:keys',
  ],
  admin: [
    'users:create', 'users:read', 'users:update', 'users:invite',
    'clients:create', 'clients:read', 'clients:update', 'clients:delete', 'clients:export',
    'documents:create', 'documents:read', 'documents:update', 'documents:delete', 'documents:download', 'documents:share',
    'financial:read', 'financial:update', 'financial:export',
    'billing:create', 'billing:read', 'billing:update', 'billing:delete',
    'reports:create', 'reports:read', 'reports:export', 'reports:schedule',
    'workflows:create', 'workflows:read', 'workflows:update', 'workflows:delete', 'workflows:execute',
    'system:audit',
    'api:access',
  ],
  manager: [
    'users:read',
    'clients:create', 'clients:read', 'clients:update', 'clients:export',
    'documents:create', 'documents:read', 'documents:update', 'documents:download', 'documents:share',
    'financial:read', 'financial:update',
    'billing:create', 'billing:read', 'billing:update',
    'reports:create', 'reports:read', 'reports:export', 'reports:schedule',
    'workflows:read', 'workflows:execute',
    'api:access',
  ],
  senior_cpa: [
    'clients:read', 'clients:update',
    'documents:create', 'documents:read', 'documents:update', 'documents:download',
    'financial:read', 'financial:update',
    'billing:read', 'billing:update',
    'reports:create', 'reports:read', 'reports:export',
    'workflows:read', 'workflows:execute',
    'api:access',
  ],
  cpa: [
    'clients:read',
    'documents:create', 'documents:read', 'documents:download',
    'financial:read',
    'billing:read',
    'reports:read',
    'workflows:read',
    'api:access',
  ],
  staff: [
    'clients:read',
    'documents:create', 'documents:read', 'documents:download',
    'financial:read',
    'reports:read',
    'workflows:read',
  ],
  intern: [
    'documents:read',
    'reports:read',
  ],
}

export class PermissionService {
  /**
   * Check if a user has a specific permission
   */
  static async checkUserPermission(
    userId: string,
    organizationId: string,
    permission: string,
    resource?: string,
    context?: PermissionContext
  ): Promise<boolean> {
    try {
      // Get user with role and team member info
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamMember: {
            include: {
              permissions: {
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      })

      if (!user || user.organizationId !== organizationId) {
        return false
      }

      // Check if user account is active
      if (!user.isActive || user.deletedAt) {
        return false
      }

      // Check role-based permissions first
      const hasRolePermission = await this.checkRolePermission(user.role, permission)
      if (hasRolePermission) {
        return true
      }

      // Check individual user permissions
      const hasUserPermission = await this.checkUserSpecificPermission(userId, permission)
      if (hasUserPermission) {
        return true
      }

      // Check conditional permissions
      if (context) {
        const hasConditionalPermission = await this.checkConditionalPermission(
          userId,
          organizationId,
          permission,
          resource,
          context
        )
        if (hasConditionalPermission) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error checking user permission:', error)
      return false // Fail secure
    }
  }

  /**
   * Check role-based permission
   */
  static async checkRolePermission(role: string, permission: string): Promise<boolean> {
    try {
      const rolePermission = await prisma.rolePermission.findUnique({
        where: {
          role_permissionId: {
            role,
            permissionId: permission,
          },
        },
      })

      return rolePermission?.granted ?? false
    } catch (error) {
      console.error('Error checking role permission:', error)
      return false
    }
  }

  /**
   * Check user-specific permission
   */
  static async checkUserSpecificPermission(userId: string, permission: string): Promise<boolean> {
    try {
      const userPermission = await prisma.teamMemberPermission.findFirst({
        where: {
          teamMember: {
            userId,
          },
          permissionId: permission,
          granted: true,
        },
      })

      return !!userPermission
    } catch (error) {
      console.error('Error checking user specific permission:', error)
      return false
    }
  }

  /**
   * Check conditional permissions based on context
   */
  static async checkConditionalPermission(
    userId: string,
    organizationId: string,
    permission: string,
    resource?: string,
    context?: PermissionContext
  ): Promise<boolean> {
    try {
      // Get role permissions with conditions
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { role: true },
      })

      if (!user) return false

      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: user.role,
          permissionId: permission,
          granted: true,
          conditions: {
            not: null,
          },
        },
      })

      for (const rolePermission of rolePermissions) {
        if (await this.evaluateConditions(rolePermission.conditions as any, context, userId, organizationId)) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('Error checking conditional permission:', error)
      return false
    }
  }

  /**
   * Evaluate permission conditions
   */
  static async evaluateConditions(
    conditions: Record<string, any>,
    context?: PermissionContext,
    userId?: string,
    organizationId?: string
  ): Promise<boolean> {
    if (!conditions) return true

    // Time-based conditions
    if (conditions.timeRestrictions) {
      const now = new Date()
      const currentHour = now.getHours()
      const currentDay = now.getDay()

      if (conditions.timeRestrictions.allowedHours) {
        const [startHour, endHour] = conditions.timeRestrictions.allowedHours
        if (currentHour < startHour || currentHour > endHour) {
          return false
        }
      }

      if (conditions.timeRestrictions.allowedDays) {
        if (!conditions.timeRestrictions.allowedDays.includes(currentDay)) {
          return false
        }
      }
    }

    // Resource ownership conditions
    if (conditions.resourceOwnership && context?.input?.id) {
      const isOwner = await this.checkResourceOwnership(
        userId!,
        context.input.id,
        conditions.resourceOwnership.resourceType
      )
      if (!isOwner) return false
    }

    // Client assignment conditions
    if (conditions.clientAssignment && context?.input?.clientId) {
      const isAssigned = await this.checkClientAssignment(userId!, context.input.clientId)
      if (!isAssigned) return false
    }

    return true
  }

  /**
   * Check if user owns or is assigned to a resource
   */
  static async checkResourceOwnership(
    userId: string,
    resourceId: string,
    resourceType: string
  ): Promise<boolean> {
    try {
      switch (resourceType) {
        case 'document':
          const document = await prisma.document.findUnique({
            where: { id: resourceId },
            select: { uploadedBy: true },
          })
          return document?.uploadedBy === userId

        case 'engagement':
          const engagement = await prisma.engagement.findUnique({
            where: { id: resourceId },
            select: { assignedToId: true, createdById: true },
          })
          return engagement?.assignedToId === userId || engagement?.createdById === userId

        case 'task':
          const task = await prisma.task.findUnique({
            where: { id: resourceId },
            select: { assignedToId: true, createdById: true },
          })
          return task?.assignedToId === userId || task?.createdById === userId

        default:
          return false
      }
    } catch (error) {
      console.error('Error checking resource ownership:', error)
      return false
    }
  }

  /**
   * Check if user is assigned to a client
   */
  static async checkClientAssignment(userId: string, clientId: string): Promise<boolean> {
    try {
      // Check if user has any engagements with this client
      const engagement = await prisma.engagement.findFirst({
        where: {
          clientId,
          OR: [
            { assignedToId: userId },
            { createdById: userId },
          ],
        },
      })

      return !!engagement
    } catch (error) {
      console.error('Error checking client assignment:', error)
      return false
    }
  }

  /**
   * Get all permissions for a user
   */
  static async getUserPermissions(userId: string, organizationId: string): Promise<string[]> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamMember: {
            include: {
              permissions: {
                where: { granted: true },
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      })

      if (!user || user.organizationId !== organizationId) {
        return []
      }

      const permissions = new Set<string>()

      // Add role-based permissions
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: user.role,
          granted: true,
        },
        include: {
          permission: true,
        },
      })

      rolePermissions.forEach(rp => permissions.add(rp.permission.name))

      // Add user-specific permissions
      user.teamMember?.permissions.forEach(up => {
        permissions.add(up.permission.name)
      })

      return Array.from(permissions)
    } catch (error) {
      console.error('Error getting user permissions:', error)
      return []
    }
  }

  /**
   * Grant permission to user
   */
  static async grantUserPermission(
    userId: string,
    permissionName: string,
    grantedBy: string
  ): Promise<boolean> {
    try {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      })

      if (!permission) {
        throw new Error(`Permission ${permissionName} not found`)
      }

      const teamMember = await prisma.teamMember.findUnique({
        where: { userId },
      })

      if (!teamMember) {
        throw new Error('Team member not found')
      }

      await prisma.teamMemberPermission.upsert({
        where: {
          teamMemberId_permissionId: {
            teamMemberId: teamMember.id,
            permissionId: permission.id,
          },
        },
        update: {
          granted: true,
          grantedBy,
          grantedAt: new Date(),
          revokedBy: null,
          revokedAt: null,
        },
        create: {
          teamMemberId: teamMember.id,
          permissionId: permission.id,
          granted: true,
          grantedBy,
        },
      })

      return true
    } catch (error) {
      console.error('Error granting user permission:', error)
      return false
    }
  }

  /**
   * Revoke permission from user
   */
  static async revokeUserPermission(
    userId: string,
    permissionName: string,
    revokedBy: string
  ): Promise<boolean> {
    try {
      const permission = await prisma.permission.findUnique({
        where: { name: permissionName },
      })

      if (!permission) {
        throw new Error(`Permission ${permissionName} not found`)
      }

      const teamMember = await prisma.teamMember.findUnique({
        where: { userId },
      })

      if (!teamMember) {
        throw new Error('Team member not found')
      }

      await prisma.teamMemberPermission.updateMany({
        where: {
          teamMemberId: teamMember.id,
          permissionId: permission.id,
        },
        data: {
          granted: false,
          revokedBy,
          revokedAt: new Date(),
        },
      })

      return true
    } catch (error) {
      console.error('Error revoking user permission:', error)
      return false
    }
  }

  /**
   * Initialize default permissions and role assignments
   */
  static async initializePermissions(): Promise<void> {
    try {
      // Create core permissions
      for (const permDef of CORE_PERMISSIONS) {
        await prisma.permission.upsert({
          where: { name: permDef.name },
          update: {
            description: permDef.description,
            category: permDef.category,
            action: permDef.action,
            resource: permDef.resource,
            isSystemLevel: permDef.isSystemLevel ?? false,
          },
          create: {
            name: permDef.name,
            description: permDef.description,
            category: permDef.category,
            action: permDef.action,
            resource: permDef.resource,
            isSystemLevel: permDef.isSystemLevel ?? false,
          },
        })
      }

      // Assign default permissions to roles
      for (const [role, permissionNames] of Object.entries(DEFAULT_ROLE_PERMISSIONS)) {
        for (const permissionName of permissionNames) {
          const permission = await prisma.permission.findUnique({
            where: { name: permissionName },
          })

          if (permission) {
            await prisma.rolePermission.upsert({
              where: {
                role_permissionId: {
                  role,
                  permissionId: permission.id,
                },
              },
              update: {
                granted: true,
              },
              create: {
                role,
                permissionId: permission.id,
                granted: true,
              },
            })
          }
        }
      }

      console.log('Permission system initialized successfully')
    } catch (error) {
      console.error('Error initializing permissions:', error)
      throw error
    }
  }

  /**
   * Check multiple permissions at once
   */
  static async checkMultiplePermissions(
    userId: string,
    organizationId: string,
    permissions: string[]
  ): Promise<Record<string, boolean>> {
    const results: Record<string, boolean> = {}

    for (const permission of permissions) {
      results[permission] = await this.checkUserPermission(userId, organizationId, permission)
    }

    return results
  }

  /**
   * Get effective permissions (considering role hierarchy)
   */
  static async getEffectivePermissions(
    userId: string,
    organizationId: string
  ): Promise<{
    rolePermissions: string[]
    userPermissions: string[]
    effectivePermissions: string[]
  }> {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          teamMember: {
            include: {
              permissions: {
                where: { granted: true },
                include: {
                  permission: true,
                },
              },
            },
          },
        },
      })

      if (!user || user.organizationId !== organizationId) {
        return {
          rolePermissions: [],
          userPermissions: [],
          effectivePermissions: [],
        }
      }

      // Get role permissions
      const rolePermissions = await prisma.rolePermission.findMany({
        where: {
          role: user.role,
          granted: true,
        },
        include: {
          permission: true,
        },
      })

      const rolePerms = rolePermissions.map(rp => rp.permission.name)
      const userPerms = user.teamMember?.permissions.map(up => up.permission.name) || []

      // Combine and deduplicate
      const effectivePermissions = Array.from(new Set([...rolePerms, ...userPerms]))

      return {
        rolePermissions: rolePerms,
        userPermissions: userPerms,
        effectivePermissions,
      }
    } catch (error) {
      console.error('Error getting effective permissions:', error)
      return {
        rolePermissions: [],
        userPermissions: [],
        effectivePermissions: [],
      }
    }
  }
}

export { PermissionService as permissionService }