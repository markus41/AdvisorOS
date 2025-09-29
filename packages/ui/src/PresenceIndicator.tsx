import React from 'react'
import { cn } from './utils/cn'

export interface User {
  id: string
  name: string
  avatar?: string
  color?: string
  isActive?: boolean
  lastSeen?: Date
}

interface PresenceIndicatorProps {
  users: User[]
  maxVisible?: number
  size?: 'sm' | 'md' | 'lg'
  showNames?: boolean
  className?: string
}

const sizeClasses = {
  sm: 'w-6 h-6 text-xs',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
}

const getInitials = (name: string): string => {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

const getRandomColor = (userId: string): string => {
  const colors = [
    'bg-red-500',
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-indigo-500',
    'bg-orange-500',
  ]
  const index = userId.charCodeAt(0) % colors.length
  return colors[index]
}

export const PresenceIndicator: React.FC<PresenceIndicatorProps> = ({
  users,
  maxVisible = 5,
  size = 'md',
  showNames = false,
  className,
}) => {
  const activeUsers = users.filter((user) => user.isActive)
  const visibleUsers = activeUsers.slice(0, maxVisible)
  const remainingCount = Math.max(0, activeUsers.length - maxVisible)

  return (
    <div className={cn('flex items-center space-x-2', className)}>
      {/* User avatars */}
      <div className="flex -space-x-1">
        {visibleUsers.map((user) => (
          <div
            key={user.id}
            className={cn(
              'relative rounded-full border-2 border-white flex items-center justify-center font-medium text-white',
              sizeClasses[size],
              user.color || getRandomColor(user.id)
            )}
            title={user.name}
          >
            {user.avatar ? (
              <img
                src={user.avatar}
                alt={user.name}
                className="w-full h-full rounded-full object-cover"
              />
            ) : (
              getInitials(user.name)
            )}

            {/* Online indicator */}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
          </div>
        ))}

        {/* Remaining count */}
        {remainingCount > 0 && (
          <div
            className={cn(
              'relative rounded-full border-2 border-white bg-gray-500 flex items-center justify-center font-medium text-white',
              sizeClasses[size]
            )}
            title={`${remainingCount} more users`}
          >
            +{remainingCount}
          </div>
        )}
      </div>

      {/* User names */}
      {showNames && visibleUsers.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {visibleUsers.length === 1 ? (
            <span>{visibleUsers[0].name} is online</span>
          ) : visibleUsers.length === 2 ? (
            <span>
              {visibleUsers[0].name} and {visibleUsers[1].name} are online
            </span>
          ) : (
            <span>
              {visibleUsers[0].name} and {activeUsers.length - 1} others are online
            </span>
          )}
        </div>
      )}

      {/* No users online */}
      {activeUsers.length === 0 && showNames && (
        <div className="text-sm text-muted-foreground">No one is online</div>
      )}
    </div>
  )
}

// Live cursor component for real-time collaboration
interface LiveCursorProps {
  user: User
  x: number
  y: number
  visible?: boolean
}

export const LiveCursor: React.FC<LiveCursorProps> = ({
  user,
  x,
  y,
  visible = true,
}) => {
  if (!visible) return null

  return (
    <div
      className="absolute pointer-events-none z-50 transition-all duration-100"
      style={
        {
          '--cursor-x': `${x}px`,
          '--cursor-y': `${y}px`,
          left: 'var(--cursor-x)',
          top: 'var(--cursor-y)',
          transform: 'translate(-2px, -2px)',
        } as React.CSSProperties
      }
    >
      {/* Cursor */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        className="drop-shadow-md"
      >
        <path
          d="M2 2L18 8L10 10L8 18L2 2Z"
          fill={user.color || '#3B82F6'}
          stroke="white"
          strokeWidth="1"
        />
      </svg>

      {/* User label */}
      <div
        className="absolute top-5 left-2 px-2 py-1 rounded text-xs text-white font-medium whitespace-nowrap"
        style={
          {
            '--user-color': user.color || '#3B82F6',
            backgroundColor: 'var(--user-color)',
          } as React.CSSProperties
        }
      >
        {user.name}
      </div>
    </div>
  )
}

// Live selection component
interface LiveSelectionProps {
  user: User
  startX: number
  startY: number
  endX: number
  endY: number
  visible?: boolean
}

export const LiveSelection: React.FC<LiveSelectionProps> = ({
  user,
  startX,
  startY,
  endX,
  endY,
  visible = true,
}) => {
  if (!visible) return null

  const left = Math.min(startX, endX)
  const top = Math.min(startY, endY)
  const width = Math.abs(endX - startX)
  const height = Math.abs(endY - startY)

  return (
    <div
      className="absolute pointer-events-none z-40 border-2 rounded opacity-30"
      style={
        {
          '--selection-left': `${left}px`,
          '--selection-top': `${top}px`,
          '--selection-width': `${width}px`,
          '--selection-height': `${height}px`,
          '--selection-color': user.color || '#3B82F6',
          left: 'var(--selection-left)',
          top: 'var(--selection-top)',
          width: 'var(--selection-width)',
          height: 'var(--selection-height)',
          borderColor: 'var(--selection-color)',
          backgroundColor: 'var(--selection-color)',
        } as React.CSSProperties
      }
    />
  )
}