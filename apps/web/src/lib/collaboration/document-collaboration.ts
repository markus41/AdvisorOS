import { prisma } from '../../server/db';
import { EventEmitter } from 'events';

export interface DocumentAnnotation {
  id: string;
  documentId: string;
  type: 'highlight' | 'note' | 'rectangle' | 'arrow' | 'text' | 'drawing' | 'stamp';
  page: number;
  coordinates: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  content?: string;
  color: string;
  style: {
    lineWidth?: number;
    fontSize?: number;
    fontFamily?: string;
    opacity?: number;
    borderStyle?: 'solid' | 'dashed' | 'dotted';
  };
  metadata: {
    tool: string;
    version: string;
    deviceType: 'mouse' | 'touch' | 'pen';
  };
  isPrivate: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  replies: DocumentAnnotationReply[];
  tags: string[];
  status: 'active' | 'resolved' | 'archived';
  priority: 'low' | 'normal' | 'high' | 'urgent';
}

export interface DocumentAnnotationReply {
  id: string;
  annotationId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  mentions: string[]; // User IDs mentioned in reply
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
}

export interface DocumentComment {
  id: string;
  documentId: string;
  content: string;
  isPrivate: boolean;
  mentions: string[];
  attachments: Array<{
    id: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  taskAssigned?: {
    taskId: string;
    assignedTo: string;
    dueDate?: Date;
    priority: 'low' | 'normal' | 'high' | 'urgent';
  };
  status: 'open' | 'resolved' | 'archived';
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  replies: DocumentCommentReply[];
  reactions: Array<{
    userId: string;
    type: 'like' | 'dislike' | 'heart' | 'laugh' | 'confused' | 'thumbs_up' | 'thumbs_down';
    createdAt: Date;
  }>;
}

export interface DocumentCommentReply {
  id: string;
  commentId: string;
  content: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  mentions: string[];
  reactions: Array<{
    userId: string;
    type: string;
    createdAt: Date;
  }>;
}

export interface DocumentVersion {
  id: string;
  documentId: string;
  version: number;
  fileName: string;
  fileUrl: string;
  fileSize: number;
  checksum: string;
  changes: DocumentChange[];
  isLatestVersion: boolean;
  createdBy: string;
  createdAt: Date;
  comments: string; // Version description/notes
  parentVersionId?: string;
  mergeInfo?: {
    mergedFrom: string[];
    mergedBy: string;
    mergedAt: Date;
    conflictResolution: Array<{
      field: string;
      chosenValue: any;
      rejectedValues: any[];
      reason: string;
    }>;
  };
}

export interface DocumentChange {
  id: string;
  type: 'content' | 'metadata' | 'annotation' | 'comment' | 'permission' | 'structure';
  operation: 'create' | 'update' | 'delete' | 'move' | 'copy';
  field: string;
  oldValue?: any;
  newValue?: any;
  page?: number;
  location?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  timestamp: Date;
  userId: string;
  description: string;
}

export interface DocumentShare {
  id: string;
  documentId: string;
  shareType: 'link' | 'email' | 'user' | 'client' | 'organization';
  sharedWith?: string; // Email, user ID, or client ID
  accessLevel: 'view' | 'comment' | 'edit' | 'admin';
  permissions: {
    canDownload: boolean;
    canPrint: boolean;
    canCopy: boolean;
    canShare: boolean;
    canAnnotate: boolean;
    canComment: boolean;
  };
  restrictions: {
    expiresAt?: Date;
    maxViews?: number;
    ipWhitelist?: string[];
    passwordProtected: boolean;
    password?: string;
    watermark?: string;
  };
  analytics: {
    viewCount: number;
    lastViewedAt?: Date;
    downloadCount: number;
    printCount: number;
    uniqueViewers: string[];
    viewHistory: Array<{
      userId?: string;
      ipAddress: string;
      userAgent: string;
      timestamp: Date;
      action: 'view' | 'download' | 'print' | 'comment' | 'annotate';
    }>;
  };
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CollaborationSession {
  id: string;
  documentId: string;
  participants: Array<{
    userId: string;
    role: 'owner' | 'editor' | 'viewer';
    joinedAt: Date;
    lastActivity: Date;
    cursor?: {
      page: number;
      x: number;
      y: number;
    };
    selection?: {
      page: number;
      startX: number;
      startY: number;
      endX: number;
      endY: number;
    };
    isActive: boolean;
  }>;
  activeAnnotations: string[]; // Annotation IDs being edited
  locks: Array<{
    type: 'page' | 'annotation' | 'section';
    resourceId: string;
    lockedBy: string;
    lockedAt: Date;
    expiresAt: Date;
  }>;
  settings: {
    allowConcurrentEditing: boolean;
    autoSave: boolean;
    autoSaveInterval: number; // seconds
    showCursors: boolean;
    showSelections: boolean;
    conflictResolution: 'manual' | 'auto' | 'last_writer_wins';
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface DocumentApprovalWorkflow {
  id: string;
  documentId: string;
  workflowType: 'sequential' | 'parallel' | 'conditional';
  steps: Array<{
    id: string;
    name: string;
    assignedTo: string[];
    role?: string;
    order: number;
    status: 'pending' | 'approved' | 'rejected' | 'skipped';
    requiredApprovals: number;
    currentApprovals: number;
    deadline?: Date;
    conditions?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
    notifications: {
      onAssign: boolean;
      onDeadline: boolean;
      onComplete: boolean;
    };
  }>;
  currentStep: number;
  overallStatus: 'pending' | 'in_progress' | 'approved' | 'rejected' | 'cancelled';
  approvals: Array<{
    stepId: string;
    userId: string;
    action: 'approve' | 'reject' | 'request_changes';
    comment?: string;
    timestamp: Date;
    signature?: {
      type: 'electronic' | 'digital' | 'wet';
      data: string;
      certificate?: string;
    };
  }>;
  settings: {
    allowParallelApproval: boolean;
    requireAllApprovers: boolean;
    autoAdvance: boolean;
    escalationEnabled: boolean;
    escalationDelay: number; // hours
    escalationTo: string[];
  };
  createdBy: string;
  createdAt: Date;
  completedAt?: Date;
}

export interface DocumentReviewQueue {
  id: string;
  name: string;
  description?: string;
  organizationId: string;
  filters: {
    documentTypes: string[];
    categories: string[];
    tags: string[];
    clientIds: string[];
    uploadedByIds: string[];
    dateRange?: {
      from: Date;
      to: Date;
    };
    qualityThreshold?: number;
    confidenceThreshold?: number;
  };
  assignmentRules: Array<{
    condition: string;
    assignTo: string;
    priority: number;
  }>;
  slaSettings: {
    targetReviewTime: number; // hours
    escalationTime: number; // hours
    escalationTo: string[];
  };
  isActive: boolean;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

class DocumentCollaborationService extends EventEmitter {
  private activeSessions = new Map<string, CollaborationSession>();
  private documentLocks = new Map<string, Map<string, any>>();

  constructor() {
    super();
    this.initializeService();
  }

  /**
   * Create annotation on document
   */
  async createAnnotation(
    documentId: string,
    annotation: Omit<DocumentAnnotation, 'id' | 'createdAt' | 'updatedAt' | 'replies'>,
    userId: string,
    organizationId: string
  ): Promise<DocumentAnnotation> {
    try {
      // Validate document access
      await this.validateDocumentAccess(documentId, userId, 'comment');

      // Check for active collaboration session
      const session = this.activeSessions.get(documentId);
      if (session) {
        // Check for conflicts
        await this.checkAnnotationConflicts(annotation, session);
      }

      // Create annotation
      const newAnnotation = await prisma.documentAnnotation.create({
        data: {
          documentId,
          type: annotation.type,
          page: annotation.page,
          coordinates: annotation.coordinates,
          content: annotation.content,
          color: annotation.color,
          style: annotation.style,
          isPrivate: annotation.isPrivate,
          createdBy: userId,
          createdAt: new Date(),
          updatedAt: new Date()
        },
        include: {
          creator: {
            select: { name: true, email: true }
          },
          replies: {
            include: {
              creator: {
                select: { name: true, email: true }
              }
            }
          }
        }
      });

      const annotationResult: DocumentAnnotation = {
        id: newAnnotation.id,
        documentId: newAnnotation.documentId,
        type: newAnnotation.type as DocumentAnnotation['type'],
        page: newAnnotation.page,
        coordinates: newAnnotation.coordinates as DocumentAnnotation['coordinates'],
        content: newAnnotation.content || undefined,
        color: newAnnotation.color,
        style: newAnnotation.style as DocumentAnnotation['style'],
        metadata: {
          tool: 'web_interface',
          version: '1.0',
          deviceType: 'mouse'
        },
        isPrivate: newAnnotation.isPrivate,
        createdBy: newAnnotation.createdBy,
        createdAt: newAnnotation.createdAt,
        updatedAt: newAnnotation.updatedAt,
        replies: [],
        tags: [],
        status: 'active',
        priority: 'normal'
      };

      // Record change
      await this.recordDocumentChange(documentId, {
        type: 'annotation',
        operation: 'create',
        field: 'annotations',
        newValue: annotationResult,
        page: annotation.page,
        location: annotation.coordinates,
        timestamp: new Date(),
        userId,
        description: `Created ${annotation.type} annotation`
      });

      // Emit real-time event
      this.emit('annotation_created', {
        documentId,
        annotation: annotationResult,
        userId
      });

      // Send notifications to collaborators
      await this.notifyCollaborators(documentId, 'annotation_created', {
        annotation: annotationResult,
        creator: userId
      });

      return annotationResult;

    } catch (error) {
      console.error('Failed to create annotation:', error);
      throw new Error(`Annotation creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create comment on document
   */
  async createComment(
    documentId: string,
    comment: Omit<DocumentComment, 'id' | 'createdAt' | 'updatedAt' | 'replies' | 'reactions'>,
    userId: string,
    organizationId: string
  ): Promise<DocumentComment> {
    try {
      // Validate document access
      await this.validateDocumentAccess(documentId, userId, 'comment');

      // Create comment
      const newComment = await prisma.documentComment.create({
        data: {
          documentId,
          content: comment.content,
          isPrivate: comment.isPrivate,
          mentions: comment.mentions,
          attachments: comment.attachments,
          status: comment.status,
          createdBy: userId
        },
        include: {
          creator: {
            select: { name: true, email: true }
          }
        }
      });

      const commentResult: DocumentComment = {
        id: newComment.id,
        documentId: newComment.documentId,
        content: newComment.content,
        isPrivate: newComment.isPrivate,
        mentions: newComment.mentions,
        attachments: [],
        taskAssigned: comment.taskAssigned,
        status: newComment.status as DocumentComment['status'],
        createdBy: newComment.createdBy,
        createdAt: newComment.createdAt,
        updatedAt: newComment.updatedAt,
        replies: [],
        reactions: []
      };

      // Create task if assigned
      if (comment.taskAssigned) {
        await this.createTaskFromComment(commentResult, comment.taskAssigned, userId);
      }

      // Send mentions notifications
      if (comment.mentions.length > 0) {
        await this.sendMentionNotifications(comment.mentions, commentResult, userId);
      }

      // Record change
      await this.recordDocumentChange(documentId, {
        type: 'comment',
        operation: 'create',
        field: 'comments',
        newValue: commentResult,
        timestamp: new Date(),
        userId,
        description: 'Created comment'
      });

      // Emit real-time event
      this.emit('comment_created', {
        documentId,
        comment: commentResult,
        userId
      });

      return commentResult;

    } catch (error) {
      console.error('Failed to create comment:', error);
      throw new Error(`Comment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create new document version
   */
  async createDocumentVersion(
    documentId: string,
    fileBuffer: Buffer,
    fileName: string,
    changes: DocumentChange[],
    versionComments: string,
    userId: string
  ): Promise<DocumentVersion> {
    try {
      // Validate document access
      await this.validateDocumentAccess(documentId, userId, 'edit');

      // Get current document
      const currentDocument = await prisma.document.findUnique({
        where: { id: documentId },
        include: { documentVersions: { orderBy: { version: 'desc' } } }
      });

      if (!currentDocument) {
        throw new Error('Document not found');
      }

      // Calculate next version number
      const nextVersion = (currentDocument.documentVersions[0]?.version || 0) + 1;

      // Upload new version to storage
      const uploadResult = await this.uploadVersionToStorage(fileBuffer, fileName, documentId, nextVersion);

      // Mark current version as not latest
      await prisma.document.updateMany({
        where: {
          OR: [
            { id: documentId },
            { parentDocumentId: documentId }
          ],
          isLatestVersion: true
        },
        data: { isLatestVersion: false }
      });

      // Create new document version
      const newVersion = await prisma.document.create({
        data: {
          fileName,
          fileUrl: uploadResult.url,
          fileType: this.getFileExtension(fileName),
          mimeType: uploadResult.mimeType,
          fileSize: BigInt(fileBuffer.length),
          category: currentDocument.category,
          subcategory: currentDocument.subcategory,
          year: currentDocument.year,
          quarter: currentDocument.quarter,
          tags: currentDocument.tags,
          description: currentDocument.description,
          clientId: currentDocument.clientId,
          organizationId: currentDocument.organizationId,
          uploadedBy: userId,
          checksum: uploadResult.checksum,
          isConfidential: currentDocument.isConfidential,
          version: nextVersion,
          isLatestVersion: true,
          parentDocumentId: documentId,
          metadata: {
            ...currentDocument.metadata,
            versionComments,
            previousVersion: currentDocument.version,
            changes: changes.length
          }
        }
      });

      const versionResult: DocumentVersion = {
        id: newVersion.id,
        documentId,
        version: nextVersion,
        fileName: newVersion.fileName,
        fileUrl: newVersion.fileUrl,
        fileSize: Number(newVersion.fileSize),
        checksum: newVersion.checksum!,
        changes,
        isLatestVersion: true,
        createdBy: userId,
        createdAt: newVersion.createdAt,
        comments: versionComments,
        parentVersionId: documentId
      };

      // Record version creation change
      await this.recordDocumentChange(documentId, {
        type: 'content',
        operation: 'update',
        field: 'document_version',
        oldValue: currentDocument.version,
        newValue: nextVersion,
        timestamp: new Date(),
        userId,
        description: `Created version ${nextVersion}: ${versionComments}`
      });

      // Emit version created event
      this.emit('version_created', {
        documentId,
        version: versionResult,
        userId
      });

      return versionResult;

    } catch (error) {
      console.error('Failed to create document version:', error);
      throw new Error(`Version creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Share document with users, clients, or via link
   */
  async shareDocument(
    documentId: string,
    shareConfig: Omit<DocumentShare, 'id' | 'analytics' | 'createdAt' | 'updatedAt' | 'createdBy'>,
    userId: string,
    organizationId: string
  ): Promise<DocumentShare> {
    try {
      // Validate document access
      await this.validateDocumentAccess(documentId, userId, 'admin');

      // Create share record
      const share = await prisma.documentShare.create({
        data: {
          documentId,
          shareType: shareConfig.shareType,
          sharedWith: shareConfig.sharedWith,
          accessLevel: shareConfig.accessLevel,
          downloadAllowed: shareConfig.permissions.canDownload,
          passwordProtected: shareConfig.restrictions.passwordProtected,
          password: shareConfig.restrictions.password,
          expiresAt: shareConfig.restrictions.expiresAt,
          isActive: shareConfig.isActive,
          createdBy: userId
        }
      });

      const shareResult: DocumentShare = {
        id: share.id,
        documentId: share.documentId,
        shareType: share.shareType as DocumentShare['shareType'],
        sharedWith: share.sharedWith || undefined,
        accessLevel: share.accessLevel as DocumentShare['accessLevel'],
        permissions: shareConfig.permissions,
        restrictions: shareConfig.restrictions,
        analytics: {
          viewCount: 0,
          downloadCount: 0,
          printCount: 0,
          uniqueViewers: [],
          viewHistory: []
        },
        isActive: share.isActive,
        createdBy: share.createdBy,
        createdAt: share.createdAt,
        updatedAt: share.updatedAt
      };

      // Send share notifications
      if (shareConfig.shareType === 'email' && shareConfig.sharedWith) {
        await this.sendShareNotification(shareResult, shareConfig.sharedWith, userId);
      }

      // Record change
      await this.recordDocumentChange(documentId, {
        type: 'permission',
        operation: 'create',
        field: 'shares',
        newValue: shareResult,
        timestamp: new Date(),
        userId,
        description: `Shared document with ${shareConfig.shareType}: ${shareConfig.sharedWith || 'link'}`
      });

      return shareResult;

    } catch (error) {
      console.error('Failed to share document:', error);
      throw new Error(`Document sharing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Start collaboration session
   */
  async startCollaborationSession(
    documentId: string,
    userId: string,
    settings: CollaborationSession['settings']
  ): Promise<CollaborationSession> {
    try {
      // Validate document access
      await this.validateDocumentAccess(documentId, userId, 'edit');

      const session: CollaborationSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId,
        participants: [{
          userId,
          role: 'owner',
          joinedAt: new Date(),
          lastActivity: new Date(),
          isActive: true
        }],
        activeAnnotations: [],
        locks: [],
        settings,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      this.activeSessions.set(documentId, session);

      // Emit session started event
      this.emit('collaboration_session_started', {
        sessionId: session.id,
        documentId,
        userId
      });

      return session;

    } catch (error) {
      console.error('Failed to start collaboration session:', error);
      throw new Error(`Collaboration session start failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Join collaboration session
   */
  async joinCollaborationSession(
    documentId: string,
    userId: string,
    role: 'editor' | 'viewer' = 'viewer'
  ): Promise<CollaborationSession> {
    try {
      // Validate document access
      const requiredPermission = role === 'editor' ? 'edit' : 'view';
      await this.validateDocumentAccess(documentId, userId, requiredPermission);

      const session = this.activeSessions.get(documentId);
      if (!session) {
        throw new Error('No active collaboration session found');
      }

      // Check if user is already in session
      const existingParticipant = session.participants.find(p => p.userId === userId);
      if (existingParticipant) {
        existingParticipant.isActive = true;
        existingParticipant.lastActivity = new Date();
      } else {
        session.participants.push({
          userId,
          role,
          joinedAt: new Date(),
          lastActivity: new Date(),
          isActive: true
        });
      }

      session.updatedAt = new Date();

      // Emit participant joined event
      this.emit('participant_joined', {
        sessionId: session.id,
        documentId,
        userId,
        role
      });

      return session;

    } catch (error) {
      console.error('Failed to join collaboration session:', error);
      throw new Error(`Joining collaboration session failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Create approval workflow for document
   */
  async createApprovalWorkflow(
    documentId: string,
    workflow: Omit<DocumentApprovalWorkflow, 'id' | 'createdAt' | 'completedAt' | 'createdBy'>,
    userId: string
  ): Promise<DocumentApprovalWorkflow> {
    try {
      // Validate document access
      await this.validateDocumentAccess(documentId, userId, 'admin');

      const approvalWorkflow: DocumentApprovalWorkflow = {
        id: `workflow_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        documentId,
        workflowType: workflow.workflowType,
        steps: workflow.steps,
        currentStep: 0,
        overallStatus: 'pending',
        approvals: [],
        settings: workflow.settings,
        createdBy: userId,
        createdAt: new Date()
      };

      // Save to database (implementation would depend on schema)
      // For now, just return the workflow object

      // Start the workflow
      await this.startApprovalWorkflow(approvalWorkflow);

      return approvalWorkflow;

    } catch (error) {
      console.error('Failed to create approval workflow:', error);
      throw new Error(`Approval workflow creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get document change history
   */
  async getDocumentHistory(
    documentId: string,
    userId: string,
    options: {
      limit?: number;
      offset?: number;
      changeType?: string;
      dateFrom?: Date;
      dateTo?: Date;
    } = {}
  ): Promise<{
    changes: DocumentChange[];
    total: number;
    hasMore: boolean;
  }> {
    try {
      // Validate document access
      await this.validateDocumentAccess(documentId, userId, 'view');

      // Get changes from audit log
      const auditLogs = await prisma.auditLog.findMany({
        where: {
          entityType: 'document',
          entityId: documentId,
          ...(options.changeType && { action: options.changeType }),
          ...(options.dateFrom && { createdAt: { gte: options.dateFrom } }),
          ...(options.dateTo && { createdAt: { lte: options.dateTo } })
        },
        orderBy: { createdAt: 'desc' },
        take: options.limit || 50,
        skip: options.offset || 0,
        include: {
          user: {
            select: { name: true, email: true }
          }
        }
      });

      const total = await prisma.auditLog.count({
        where: {
          entityType: 'document',
          entityId: documentId,
          ...(options.changeType && { action: options.changeType }),
          ...(options.dateFrom && { createdAt: { gte: options.dateFrom } }),
          ...(options.dateTo && { createdAt: { lte: options.dateTo } })
        }
      });

      const changes: DocumentChange[] = auditLogs.map(log => ({
        id: log.id,
        type: this.mapAuditActionToChangeType(log.action),
        operation: this.mapAuditActionToOperation(log.action),
        field: log.metadata?.field || 'unknown',
        oldValue: log.oldValues,
        newValue: log.newValues,
        timestamp: log.createdAt,
        userId: log.userId || 'system',
        description: this.generateChangeDescription(log)
      }));

      return {
        changes,
        total,
        hasMore: (options.offset || 0) + changes.length < total
      };

    } catch (error) {
      console.error('Failed to get document history:', error);
      throw new Error(`History retrieval failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Private methods

  private async initializeService(): Promise<void> {
    // Initialize collaboration service
    console.log('Document collaboration service initialized');

    // Clean up inactive sessions periodically
    setInterval(() => {
      this.cleanupInactiveSessions();
    }, 300000); // 5 minutes
  }

  private async validateDocumentAccess(
    documentId: string,
    userId: string,
    requiredPermission: 'view' | 'comment' | 'edit' | 'admin'
  ): Promise<void> {
    const document = await prisma.document.findFirst({
      where: {
        id: documentId,
        deletedAt: null
      },
      include: {
        organization: {
          include: {
            users: {
              where: { id: userId }
            }
          }
        }
      }
    });

    if (!document) {
      throw new Error('Document not found');
    }

    if (document.organization.users.length === 0) {
      throw new Error('Access denied');
    }

    // Additional permission checks would go here
    // For now, assume user has access if they're in the organization
  }

  private async checkAnnotationConflicts(
    annotation: Partial<DocumentAnnotation>,
    session: CollaborationSession
  ): Promise<void> {
    // Check if another user is annotating in the same area
    const conflicts = session.locks.filter(lock =>
      lock.type === 'annotation' &&
      this.isAreaOverlapping(annotation.coordinates!, {
        x: 0, y: 0, width: 100, height: 100 // Would get from lock data
      })
    );

    if (conflicts.length > 0) {
      throw new Error('Another user is editing in this area');
    }
  }

  private isAreaOverlapping(area1: any, area2: any): boolean {
    return !(area1.x + area1.width < area2.x ||
             area2.x + area2.width < area1.x ||
             area1.y + area1.height < area2.y ||
             area2.y + area2.height < area1.y);
  }

  private async recordDocumentChange(documentId: string, change: Omit<DocumentChange, 'id'>): Promise<void> {
    const changeId = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await prisma.auditLog.create({
      data: {
        action: change.operation,
        entityType: 'document',
        entityId: documentId,
        oldValues: change.oldValue,
        newValues: change.newValue,
        metadata: {
          changeType: change.type,
          field: change.field,
          description: change.description,
          page: change.page,
          location: change.location
        },
        userId: change.userId,
        organizationId: 'temp' // Would be resolved from document
      }
    });
  }

  private async notifyCollaborators(
    documentId: string,
    eventType: string,
    data: any
  ): Promise<void> {
    const session = this.activeSessions.get(documentId);
    if (!session) return;

    // Send notifications to active participants
    for (const participant of session.participants.filter(p => p.isActive)) {
      this.emit('collaboration_notification', {
        userId: participant.userId,
        documentId,
        eventType,
        data
      });
    }
  }

  private async createTaskFromComment(
    comment: DocumentComment,
    taskConfig: NonNullable<DocumentComment['taskAssigned']>,
    createdBy: string
  ): Promise<void> {
    await prisma.task.create({
      data: {
        title: `Review: ${comment.content.substring(0, 50)}...`,
        description: comment.content,
        status: 'pending',
        priority: taskConfig.priority,
        taskType: 'document_review',
        assignedToId: taskConfig.assignedTo,
        createdById: createdBy,
        organizationId: 'temp', // Would be resolved
        dueDate: taskConfig.dueDate,
        customFields: {
          documentId: comment.documentId,
          commentId: comment.id
        }
      }
    });
  }

  private async sendMentionNotifications(
    mentions: string[],
    comment: DocumentComment,
    mentionedBy: string
  ): Promise<void> {
    // Send notifications to mentioned users
    for (const userId of mentions) {
      this.emit('user_mentioned', {
        userId,
        comment,
        mentionedBy,
        documentId: comment.documentId
      });
    }
  }

  private async uploadVersionToStorage(
    fileBuffer: Buffer,
    fileName: string,
    documentId: string,
    version: number
  ): Promise<{
    url: string;
    mimeType: string;
    checksum: string;
  }> {
    // This would upload to Azure Storage
    // For now, return mock data
    return {
      url: `https://storage.example.com/documents/${documentId}/v${version}/${fileName}`,
      mimeType: this.getMimeType(fileName),
      checksum: 'mock_checksum'
    };
  }

  private getFileExtension(fileName: string): string {
    return fileName.split('.').pop()?.toLowerCase() || '';
  }

  private getMimeType(fileName: string): string {
    const ext = this.getFileExtension(fileName);
    const mimeTypes: Record<string, string> = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'xls': 'application/vnd.ms-excel',
      'xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }

  private async sendShareNotification(
    share: DocumentShare,
    email: string,
    sharedBy: string
  ): Promise<void> {
    // Send email notification
    this.emit('share_notification', {
      email,
      share,
      sharedBy
    });
  }

  private async startApprovalWorkflow(workflow: DocumentApprovalWorkflow): Promise<void> {
    if (workflow.steps.length === 0) return;

    const firstStep = workflow.steps[0];
    workflow.overallStatus = 'in_progress';

    // Notify first step assignees
    for (const assigneeId of firstStep.assignedTo) {
      this.emit('approval_assigned', {
        userId: assigneeId,
        workflow,
        step: firstStep
      });
    }
  }

  private cleanupInactiveSessions(): void {
    const now = new Date();
    const inactiveThreshold = 30 * 60 * 1000; // 30 minutes

    for (const [documentId, session] of this.activeSessions.entries()) {
      const activeParticipants = session.participants.filter(p =>
        p.isActive && (now.getTime() - p.lastActivity.getTime()) < inactiveThreshold
      );

      if (activeParticipants.length === 0) {
        this.activeSessions.delete(documentId);
        this.emit('collaboration_session_ended', {
          sessionId: session.id,
          documentId
        });
      } else {
        session.participants = activeParticipants;
      }
    }
  }

  private mapAuditActionToChangeType(action: string): DocumentChange['type'] {
    const mapping: Record<string, DocumentChange['type']> = {
      'create': 'content',
      'update': 'content',
      'delete': 'content',
      'annotate': 'annotation',
      'comment': 'comment',
      'share': 'permission'
    };
    return mapping[action] || 'content';
  }

  private mapAuditActionToOperation(action: string): DocumentChange['operation'] {
    const mapping: Record<string, DocumentChange['operation']> = {
      'create': 'create',
      'update': 'update',
      'delete': 'delete',
      'annotate': 'create',
      'comment': 'create',
      'share': 'create'
    };
    return mapping[action] || 'update';
  }

  private generateChangeDescription(auditLog: any): string {
    const action = auditLog.action;
    const entityType = auditLog.entityType;
    const metadata = auditLog.metadata || {};

    if (metadata.description) {
      return metadata.description;
    }

    return `${action} ${entityType}`;
  }
}

// Export singleton instance
export const documentCollaborationService = new DocumentCollaborationService();

// Export types
export type {
  DocumentAnnotation,
  DocumentAnnotationReply,
  DocumentComment,
  DocumentCommentReply,
  DocumentVersion,
  DocumentChange,
  DocumentShare,
  CollaborationSession,
  DocumentApprovalWorkflow,
  DocumentReviewQueue
};