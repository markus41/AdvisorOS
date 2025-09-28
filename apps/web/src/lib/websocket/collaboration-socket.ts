import { io, Socket } from 'socket.io-client';

export interface CollaborationEvent {
  type: 'annotation_added' | 'annotation_updated' | 'annotation_deleted' |
        'comment_added' | 'comment_updated' | 'comment_deleted' |
        'user_joined' | 'user_left' | 'cursor_moved' | 'document_updated';
  data: any;
  userId: string;
  userName: string;
  timestamp: Date;
}

export interface CollaborationUser {
  id: string;
  name: string;
  email: string;
  color: string;
  lastSeen: Date;
  cursor?: {
    x: number;
    y: number;
    page: number;
  };
}

export class CollaborationSocket {
  private socket: Socket | null = null;
  private documentId: string | null = null;
  private userId: string | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private listeners: Map<string, Function[]> = new Map();

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    // In a real implementation, this would connect to your WebSocket server
    // For now, we'll create a mock implementation that logs events
    console.log('Initializing collaboration socket...');

    // Mock socket implementation
    this.socket = {
      connect: () => console.log('WebSocket connected'),
      disconnect: () => console.log('WebSocket disconnected'),
      emit: (event: string, data: any) => console.log('Socket emit:', event, data),
      on: (event: string, callback: Function) => {
        if (!this.listeners.has(event)) {
          this.listeners.set(event, []);
        }
        this.listeners.get(event)?.push(callback);
      },
      off: (event: string, callback?: Function) => {
        if (callback) {
          const callbacks = this.listeners.get(event) || [];
          const index = callbacks.indexOf(callback);
          if (index > -1) {
            callbacks.splice(index, 1);
          }
        } else {
          this.listeners.delete(event);
        }
      }
    } as any;

    this.setupEventHandlers();
  }

  private setupEventHandlers() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('Connected to collaboration server');
      this.reconnectAttempts = 0;
      this.emit('connection_status', { connected: true });
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Disconnected from collaboration server:', reason);
      this.emit('connection_status', { connected: false, reason });
      this.handleReconnection();
    });

    this.socket.on('collaboration_event', (event: CollaborationEvent) => {
      this.handleCollaborationEvent(event);
    });

    this.socket.on('user_joined', (user: CollaborationUser) => {
      this.emit('user_joined', user);
    });

    this.socket.on('user_left', (userId: string) => {
      this.emit('user_left', userId);
    });

    this.socket.on('users_list', (users: CollaborationUser[]) => {
      this.emit('users_list', users);
    });

    this.socket.on('cursor_update', (data: { userId: string; cursor: { x: number; y: number; page: number } }) => {
      this.emit('cursor_update', data);
    });
  }

  private handleReconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000);

      setTimeout(() => {
        console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        this.socket?.connect();
      }, delay);
    } else {
      console.error('Max reconnection attempts reached');
      this.emit('connection_error', {
        message: 'Unable to establish connection to collaboration server'
      });
    }
  }

  private handleCollaborationEvent(event: CollaborationEvent) {
    // Don't emit events from the current user to avoid loops
    if (event.userId === this.userId) return;

    switch (event.type) {
      case 'annotation_added':
        this.emit('annotation_added', event.data);
        break;
      case 'annotation_updated':
        this.emit('annotation_updated', event.data);
        break;
      case 'annotation_deleted':
        this.emit('annotation_deleted', event.data);
        break;
      case 'comment_added':
        this.emit('comment_added', event.data);
        break;
      case 'comment_updated':
        this.emit('comment_updated', event.data);
        break;
      case 'comment_deleted':
        this.emit('comment_deleted', event.data);
        break;
      case 'document_updated':
        this.emit('document_updated', event.data);
        break;
      default:
        console.warn('Unknown collaboration event type:', event.type);
    }
  }

  joinDocument(documentId: string, userId: string, userName: string) {
    this.documentId = documentId;
    this.userId = userId;

    if (this.socket) {
      this.socket.emit('join_document', {
        documentId,
        userId,
        userName
      });
    }

    console.log(`Joined document ${documentId} as ${userName}`);
  }

  leaveDocument() {
    if (this.socket && this.documentId && this.userId) {
      this.socket.emit('leave_document', {
        documentId: this.documentId,
        userId: this.userId
      });
    }

    this.documentId = null;
    this.userId = null;
    console.log('Left document collaboration');
  }

  // Annotation events
  notifyAnnotationAdded(annotation: any) {
    this.sendCollaborationEvent('annotation_added', annotation);
  }

  notifyAnnotationUpdated(annotation: any) {
    this.sendCollaborationEvent('annotation_updated', annotation);
  }

  notifyAnnotationDeleted(annotationId: string) {
    this.sendCollaborationEvent('annotation_deleted', { id: annotationId });
  }

  // Comment events
  notifyCommentAdded(comment: any) {
    this.sendCollaborationEvent('comment_added', comment);
  }

  notifyCommentUpdated(comment: any) {
    this.sendCollaborationEvent('comment_updated', comment);
  }

  notifyCommentDeleted(commentId: string) {
    this.sendCollaborationEvent('comment_deleted', { id: commentId });
  }

  // Document events
  notifyDocumentUpdated(documentData: any) {
    this.sendCollaborationEvent('document_updated', documentData);
  }

  // Cursor tracking
  updateCursor(x: number, y: number, page: number) {
    if (this.socket && this.documentId && this.userId) {
      this.socket.emit('cursor_move', {
        documentId: this.documentId,
        userId: this.userId,
        cursor: { x, y, page }
      });
    }
  }

  private sendCollaborationEvent(type: CollaborationEvent['type'], data: any) {
    if (!this.socket || !this.documentId || !this.userId) return;

    const event: CollaborationEvent = {
      type,
      data,
      userId: this.userId,
      userName: '', // Would be filled by the server
      timestamp: new Date()
    };

    this.socket.emit('collaboration_event', {
      documentId: this.documentId,
      event
    });
  }

  // Event listener management
  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)?.push(callback);
  }

  off(event: string, callback?: Function) {
    if (callback) {
      const callbacks = this.listeners.get(event) || [];
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    } else {
      this.listeners.delete(event);
    }
  }

  private emit(event: string, data: any) {
    const callbacks = this.listeners.get(event) || [];
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error('Error in collaboration event callback:', error);
      }
    });
  }

  // Connection management
  connect() {
    this.socket?.connect();
  }

  disconnect() {
    this.leaveDocument();
    this.socket?.disconnect();
  }

  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  destroy() {
    this.disconnect();
    this.listeners.clear();
    this.socket = null;
  }
}

// Export singleton instance
export const collaborationSocket = new CollaborationSocket();

// React hook for using collaboration socket
export function useCollaboration(documentId?: string) {
  const [isConnected, setIsConnected] = React.useState(false);
  const [users, setUsers] = React.useState<CollaborationUser[]>([]);
  const [cursors, setCursors] = React.useState<Map<string, { x: number; y: number; page: number }>>(new Map());

  React.useEffect(() => {
    const handleConnectionStatus = (status: { connected: boolean }) => {
      setIsConnected(status.connected);
    };

    const handleUsersList = (usersList: CollaborationUser[]) => {
      setUsers(usersList);
    };

    const handleUserJoined = (user: CollaborationUser) => {
      setUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    };

    const handleUserLeft = (userId: string) => {
      setUsers(prev => prev.filter(u => u.id !== userId));
      setCursors(prev => {
        const newCursors = new Map(prev);
        newCursors.delete(userId);
        return newCursors;
      });
    };

    const handleCursorUpdate = (data: { userId: string; cursor: { x: number; y: number; page: number } }) => {
      setCursors(prev => new Map(prev.set(data.userId, data.cursor)));
    };

    collaborationSocket.on('connection_status', handleConnectionStatus);
    collaborationSocket.on('users_list', handleUsersList);
    collaborationSocket.on('user_joined', handleUserJoined);
    collaborationSocket.on('user_left', handleUserLeft);
    collaborationSocket.on('cursor_update', handleCursorUpdate);

    return () => {
      collaborationSocket.off('connection_status', handleConnectionStatus);
      collaborationSocket.off('users_list', handleUsersList);
      collaborationSocket.off('user_joined', handleUserJoined);
      collaborationSocket.off('user_left', handleUserLeft);
      collaborationSocket.off('cursor_update', handleCursorUpdate);
    };
  }, []);

  return {
    isConnected,
    users,
    cursors,
    socket: collaborationSocket
  };
}

// You'll need to import React at the top
import React from 'react';