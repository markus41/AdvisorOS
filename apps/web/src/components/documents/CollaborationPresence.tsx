'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Separator } from '@/components/ui/separator';
import {
  Users,
  Wifi,
  WifiOff,
  Eye,
  MessageSquare,
  Edit,
  Clock
} from 'lucide-react';
import { useCollaboration, CollaborationUser } from '@/lib/websocket/collaboration-socket';
import { formatDistanceToNow } from 'date-fns';

interface CollaborationPresenceProps {
  documentId: string;
  className?: string;
}

const USER_COLORS = [
  '#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4',
  '#feca57', '#ff9ff3', '#a8e6cf', '#f38ba8'
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .map(part => part.charAt(0).toUpperCase())
    .slice(0, 2)
    .join('');
}

function getUserColor(userId: string): string {
  // Generate consistent color based on user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return USER_COLORS[Math.abs(hash) % USER_COLORS.length];
}

export function CollaborationPresence({ documentId, className }: CollaborationPresenceProps) {
  const { data: session } = useSession();
  const { isConnected, users, cursors, socket } = useCollaboration(documentId);
  const [isJoined, setIsJoined] = useState(false);

  useEffect(() => {
    if (session?.user && documentId && !isJoined) {
      socket.joinDocument(documentId, session.user.id, session.user.name || 'Anonymous');
      setIsJoined(true);
    }

    return () => {
      if (isJoined) {
        socket.leaveDocument();
        setIsJoined(false);
      }
    };
  }, [session?.user, documentId, socket, isJoined]);

  const activeUsers = users.filter(user => user.id !== session?.user?.id);
  const userCursors = Array.from(cursors.entries()).map(([userId, cursor]) => ({
    userId,
    cursor,
    user: users.find(u => u.id === userId)
  })).filter(item => item.user && item.user.id !== session?.user?.id);

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Connection Status */}
      <div className="flex items-center gap-1">
        {isConnected ? (
          <Wifi className="h-4 w-4 text-green-500" />
        ) : (
          <WifiOff className="h-4 w-4 text-red-500" />
        )}
        <span className="text-xs text-muted-foreground">
          {isConnected ? 'Connected' : 'Disconnected'}
        </span>
      </div>

      <Separator orientation="vertical" className="h-4" />

      {/* Active Users */}
      <div className="flex items-center gap-1">
        <Users className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground">
          {activeUsers.length + 1} {activeUsers.length === 0 ? 'viewer' : 'viewers'}
        </span>
      </div>

      {/* User Avatars */}
      <div className="flex -space-x-2">
        {/* Current User */}
        <Avatar className="h-8 w-8 border-2 border-background">
          <AvatarImage src={session?.user?.image || undefined} />
          <AvatarFallback
            className="text-xs font-medium"
            style={{ backgroundColor: getUserColor(session?.user?.id || '') }}
          >
            {getInitials(session?.user?.name || 'You')}
          </AvatarFallback>
        </Avatar>

        {/* Other Users */}
        {activeUsers.slice(0, 3).map((user) => (
          <Avatar
            key={user.id}
            className="h-8 w-8 border-2 border-background"
          >
            <AvatarFallback
              className="text-xs font-medium text-white"
              style={{ backgroundColor: getUserColor(user.id) }}
            >
              {getInitials(user.name)}
            </AvatarFallback>
          </Avatar>
        ))}

        {/* More Users Indicator */}
        {activeUsers.length > 3 && (
          <Popover>
            <PopoverTrigger asChild>
              <Avatar className="h-8 w-8 border-2 border-background cursor-pointer">
                <AvatarFallback className="text-xs font-medium bg-gray-100 text-gray-600">
                  +{activeUsers.length - 3}
                </AvatarFallback>
              </Avatar>
            </PopoverTrigger>
            <PopoverContent className="w-80" align="end">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4" />
                  <span className="font-medium">Active Collaborators</span>
                </div>

                <div className="space-y-3">
                  {/* Current User */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Avatar className="h-6 w-6">
                        <AvatarImage src={session?.user?.image || undefined} />
                        <AvatarFallback
                          className="text-xs"
                          style={{ backgroundColor: getUserColor(session?.user?.id || '') }}
                        >
                          {getInitials(session?.user?.name || 'You')}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm font-medium">
                          {session?.user?.name || 'You'} (You)
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session?.user?.email}
                        </div>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      <Eye className="h-3 w-3 mr-1" />
                      Viewing
                    </Badge>
                  </div>

                  {/* Other Users */}
                  {activeUsers.map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback
                            className="text-xs text-white"
                            style={{ backgroundColor: getUserColor(user.id) }}
                          >
                            {getInitials(user.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="text-sm font-medium">{user.name}</div>
                          <div className="text-xs text-muted-foreground">
                            {user.email}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Badge variant="outline" className="text-xs">
                          {cursors.has(user.id) ? (
                            <>
                              <Edit className="h-3 w-3 mr-1" />
                              Active
                            </>
                          ) : (
                            <>
                              <Eye className="h-3 w-3 mr-1" />
                              Viewing
                            </>
                          )}
                        </Badge>
                        <div className="text-xs text-muted-foreground">
                          {formatDistanceToNow(user.lastSeen, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Connection Status */}
                <Separator />
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1">
                    {isConnected ? (
                      <>
                        <Wifi className="h-3 w-3 text-green-500" />
                        <span className="text-green-600">Real-time collaboration active</span>
                      </>
                    ) : (
                      <>
                        <WifiOff className="h-3 w-3 text-red-500" />
                        <span className="text-red-600">Connection lost - trying to reconnect</span>
                      </>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => socket.connect()}
                    disabled={isConnected}
                  >
                    Reconnect
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>

      {/* Live Cursors (would be rendered on the document) */}
      {userCursors.map(({ userId, cursor, user }) => (
        <div
          key={userId}
          className="fixed pointer-events-none z-50"
          style={{
            left: cursor.x,
            top: cursor.y,
            transform: 'translate(-2px, -2px)'
          }}
        >
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              className="drop-shadow-md"
            >
              <path
                d="M0 0L16 6L6 8L0 16L0 0Z"
                fill={getUserColor(userId)}
              />
            </svg>
            <div
              className="absolute top-4 left-2 px-2 py-1 text-xs text-white rounded whitespace-nowrap shadow-md"
              style={{ backgroundColor: getUserColor(userId) }}
            >
              {user?.name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}