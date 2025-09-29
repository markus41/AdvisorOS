import React from 'react'
import { cn } from './utils/cn'

// Container component with responsive breakpoints
interface ContainerProps {
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full'
  className?: string
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  className,
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  }

  return (
    <div className={cn('mx-auto px-4 sm:px-6 lg:px-8', sizeClasses[size], className)}>
      {children}
    </div>
  )
}

// Responsive grid system
interface GridProps {
  children: React.ReactNode
  cols?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
    xl?: number
    '2xl'?: number
  }
  gap?: number | string
  className?: string
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = { default: 1, md: 2, lg: 3 },
  gap = 4,
  className,
}) => {
  const getGridClasses = () => {
    const classes = ['grid']

    // Default columns
    if (cols.default) {
      classes.push(`grid-cols-${cols.default}`)
    }

    // Responsive columns
    if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`)
    if (cols.md) classes.push(`md:grid-cols-${cols.md}`)
    if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`)
    if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`)
    if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`)

    // Gap
    if (typeof gap === 'number') {
      classes.push(`gap-${gap}`)
    } else {
      classes.push(gap)
    }

    return classes.join(' ')
  }

  return (
    <div className={cn(getGridClasses(), className)}>
      {children}
    </div>
  )
}

// Flex utilities
interface FlexProps {
  children: React.ReactNode
  direction?: 'row' | 'col' | 'row-reverse' | 'col-reverse'
  justify?: 'start' | 'end' | 'center' | 'between' | 'around' | 'evenly'
  align?: 'start' | 'end' | 'center' | 'baseline' | 'stretch'
  wrap?: boolean
  gap?: number
  className?: string
}

export const Flex: React.FC<FlexProps> = ({
  children,
  direction = 'row',
  justify = 'start',
  align = 'start',
  wrap = false,
  gap = 0,
  className,
}) => {
  const flexClasses = cn(
    'flex',
    `flex-${direction}`,
    `justify-${justify}`,
    `items-${align}`,
    wrap && 'flex-wrap',
    gap > 0 && `gap-${gap}`,
    className
  )

  return <div className={flexClasses}>{children}</div>
}

// Stack component for vertical layouts
interface StackProps {
  children: React.ReactNode
  spacing?: number
  className?: string
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 4,
  className,
}) => {
  return (
    <div className={cn('flex flex-col', `space-y-${spacing}`, className)}>
      {children}
    </div>
  )
}

// Horizontal stack
export const HStack: React.FC<StackProps> = ({
  children,
  spacing = 4,
  className,
}) => {
  return (
    <div className={cn('flex flex-row items-center', `space-x-${spacing}`, className)}>
      {children}
    </div>
  )
}

// Card layouts
interface CardGridProps {
  children: React.ReactNode
  minCardWidth?: string
  gap?: number
  className?: string
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  minCardWidth = '300px',
  gap = 6,
  className,
}) => {
  return (
    <div
      className={cn('grid', `gap-${gap}`, className)}
      style={{
        gridTemplateColumns: `repeat(auto-fill, minmax(${minCardWidth}, 1fr))`,
      }}
    >
      {children}
    </div>
  )
}

// Masonry layout
interface MasonryProps {
  children: React.ReactNode
  columns?: {
    default?: number
    sm?: number
    md?: number
    lg?: number
  }
  gap?: number
  className?: string
}

export const Masonry: React.FC<MasonryProps> = ({
  children,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 4,
  className,
}) => {
  const getColumnClasses = () => {
    const classes = ['columns-1']

    if (columns.sm) classes.push(`sm:columns-${columns.sm}`)
    if (columns.md) classes.push(`md:columns-${columns.md}`)
    if (columns.lg) classes.push(`lg:columns-${columns.lg}`)

    return classes.join(' ')
  }

  return (
    <div className={cn(getColumnClasses(), `gap-${gap}`, className)}>
      {children}
    </div>
  )
}

// Responsive visibility utilities
interface ShowProps {
  children: React.ReactNode
  above?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  below?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  only?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
}

export const Show: React.FC<ShowProps> = ({ children, above, below, only }) => {
  let classes = ''

  if (above) {
    classes = `hidden ${above}:block`
  } else if (below) {
    const breakpoints = { sm: 'sm', md: 'md', lg: 'lg', xl: 'xl', '2xl': '2xl' }
    classes = `block ${breakpoints[below]}:hidden`
  } else if (only) {
    switch (only) {
      case 'sm':
        classes = 'hidden sm:block md:hidden'
        break
      case 'md':
        classes = 'hidden md:block lg:hidden'
        break
      case 'lg':
        classes = 'hidden lg:block xl:hidden'
        break
      case 'xl':
        classes = 'hidden xl:block 2xl:hidden'
        break
      case '2xl':
        classes = 'hidden 2xl:block'
        break
    }
  }

  return <div className={classes}>{children}</div>
}

// Hide component (opposite of Show)
export const Hide: React.FC<ShowProps> = ({ children, above, below, only }) => {
  let classes = ''

  if (above) {
    classes = `block ${above}:hidden`
  } else if (below) {
    const breakpoints = { sm: 'sm', md: 'md', lg: 'lg', xl: 'xl', '2xl': '2xl' }
    classes = `hidden ${breakpoints[below]}:block`
  } else if (only) {
    switch (only) {
      case 'sm':
        classes = 'block sm:hidden md:block'
        break
      case 'md':
        classes = 'block md:hidden lg:block'
        break
      case 'lg':
        classes = 'block lg:hidden xl:block'
        break
      case 'xl':
        classes = 'block xl:hidden 2xl:block'
        break
      case '2xl':
        classes = 'block 2xl:hidden'
        break
    }
  }

  return <div className={classes}>{children}</div>
}

// Aspect ratio container
interface AspectRatioProps {
  children: React.ReactNode
  ratio?: string | number
  className?: string
}

export const AspectRatio: React.FC<AspectRatioProps> = ({
  children,
  ratio = '16/9',
  className,
}) => {
  const aspectRatioClass = typeof ratio === 'string'
    ? `aspect-[${ratio}]`
    : `aspect-[${ratio}/1]`

  return (
    <div className={cn('relative w-full', aspectRatioClass, className)}>
      {children}
    </div>
  )
}

// Center component
interface CenterProps {
  children: React.ReactNode
  className?: string
}

export const Center: React.FC<CenterProps> = ({ children, className }) => {
  return (
    <div className={cn('flex items-center justify-center', className)}>
      {children}
    </div>
  )
}

// Spacer component
interface SpacerProps {
  size?: number | string
  direction?: 'horizontal' | 'vertical'
  className?: string
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 4,
  direction = 'vertical',
  className,
}) => {
  const sizeClass = typeof size === 'number' ? size : size

  if (direction === 'horizontal') {
    return <div className={cn(`w-${sizeClass}`, className)} />
  }

  return <div className={cn(`h-${sizeClass}`, className)} />
}

// Responsive breakpoint hook
export const useBreakpoint = () => {
  const [breakpoint, setBreakpoint] = React.useState<string>('xs')

  React.useEffect(() => {
    const updateBreakpoint = () => {
      const width = window.innerWidth
      if (width >= 1536) setBreakpoint('2xl')
      else if (width >= 1280) setBreakpoint('xl')
      else if (width >= 1024) setBreakpoint('lg')
      else if (width >= 768) setBreakpoint('md')
      else if (width >= 640) setBreakpoint('sm')
      else setBreakpoint('xs')
    }

    updateBreakpoint()
    window.addEventListener('resize', updateBreakpoint)
    return () => window.removeEventListener('resize', updateBreakpoint)
  }, [])

  return {
    breakpoint,
    isXs: breakpoint === 'xs',
    isSm: breakpoint === 'sm',
    isMd: breakpoint === 'md',
    isLg: breakpoint === 'lg',
    isXl: breakpoint === 'xl',
    is2Xl: breakpoint === '2xl',
    isMobile: ['xs', 'sm'].includes(breakpoint),
    isTablet: breakpoint === 'md',
    isDesktop: ['lg', 'xl', '2xl'].includes(breakpoint),
  }
}