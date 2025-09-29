import { useState, useEffect, useMemo, useCallback, RefObject } from 'react'

interface VirtualScrollOptions {
  itemHeight: number | ((index: number) => number)
  containerHeight: number
  overscan?: number
  scrollingDelay?: number
  getItemId?: (index: number, item: any) => string | number
}

interface VirtualScrollResult<T> {
  virtualItems: Array<{
    index: number
    start: number
    end: number
    item: T
    key: string | number
  }>
  totalHeight: number
  scrollToIndex: (index: number, align?: 'start' | 'center' | 'end') => void
  scrollToTop: () => void
  scrollToBottom: () => void
  isScrolling: boolean
}

export function useVirtualScroll<T>(
  items: T[],
  containerRef: RefObject<HTMLElement>,
  options: VirtualScrollOptions
): VirtualScrollResult<T> {
  const {
    itemHeight,
    containerHeight,
    overscan = 5,
    scrollingDelay = 150,
    getItemId = (index) => index
  } = options

  const [scrollTop, setScrollTop] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)

  // Calculate item positions
  const itemPositions = useMemo(() => {
    const positions: number[] = []
    let accumulatedHeight = 0

    for (let i = 0; i < items.length; i++) {
      positions[i] = accumulatedHeight
      const height = typeof itemHeight === 'function' ? itemHeight(i) : itemHeight
      accumulatedHeight += height
    }

    return positions
  }, [items.length, itemHeight])

  const totalHeight = useMemo(() => {
    if (items.length === 0) return 0

    const lastIndex = items.length - 1
    const lastItemHeight = typeof itemHeight === 'function' ? itemHeight(lastIndex) : itemHeight
    return itemPositions[lastIndex] + lastItemHeight
  }, [itemPositions, items.length, itemHeight])

  // Find visible range
  const visibleRange = useMemo(() => {
    if (items.length === 0) {
      return { start: 0, end: 0 }
    }

    const viewportStart = scrollTop
    const viewportEnd = scrollTop + containerHeight

    // Binary search for start index
    let start = 0
    let end = items.length - 1

    while (start <= end) {
      const mid = Math.floor((start + end) / 2)
      const itemStart = itemPositions[mid]
      const itemEnd = itemStart + (typeof itemHeight === 'function' ? itemHeight(mid) : itemHeight)

      if (itemEnd <= viewportStart) {
        start = mid + 1
      } else if (itemStart >= viewportEnd) {
        end = mid - 1
      } else {
        // Found an intersecting item, search for the actual start
        while (mid > 0 && itemPositions[mid - 1] + (typeof itemHeight === 'function' ? itemHeight(mid - 1) : itemHeight) > viewportStart) {
          start = mid - 1
          break
        }
        start = mid
        break
      }
    }

    // Find end index
    let endIndex = start
    while (endIndex < items.length && itemPositions[endIndex] < viewportEnd) {
      endIndex++
    }

    return {
      start: Math.max(0, start - overscan),
      end: Math.min(items.length - 1, endIndex + overscan)
    }
  }, [scrollTop, containerHeight, items.length, itemPositions, itemHeight, overscan])

  // Create virtual items
  const virtualItems = useMemo(() => {
    const result = []

    for (let i = visibleRange.start; i <= visibleRange.end; i++) {
      if (i >= 0 && i < items.length) {
        const start = itemPositions[i]
        const height = typeof itemHeight === 'function' ? itemHeight(i) : itemHeight

        result.push({
          index: i,
          start,
          end: start + height,
          item: items[i],
          key: getItemId(i, items[i])
        })
      }
    }

    return result
  }, [visibleRange, items, itemPositions, itemHeight, getItemId])

  // Scroll event handler
  const handleScroll = useCallback(() => {
    if (!containerRef.current) return

    const newScrollTop = containerRef.current.scrollTop
    setScrollTop(newScrollTop)

    if (!isScrolling) {
      setIsScrolling(true)
    }

    // Debounce scrolling state
    const timer = setTimeout(() => {
      setIsScrolling(false)
    }, scrollingDelay)

    return () => clearTimeout(timer)
  }, [containerRef, isScrolling, scrollingDelay])

  // Scroll to specific index
  const scrollToIndex = useCallback((index: number, align: 'start' | 'center' | 'end' = 'start') => {
    if (!containerRef.current || index < 0 || index >= items.length) return

    const itemStart = itemPositions[index]
    const itemHeight = typeof options.itemHeight === 'function' ? options.itemHeight(index) : options.itemHeight

    let scrollTop: number

    switch (align) {
      case 'start':
        scrollTop = itemStart
        break
      case 'center':
        scrollTop = itemStart - (containerHeight - itemHeight) / 2
        break
      case 'end':
        scrollTop = itemStart - (containerHeight - itemHeight)
        break
    }

    containerRef.current.scrollTop = Math.max(0, Math.min(scrollTop, totalHeight - containerHeight))
  }, [containerRef, items.length, itemPositions, options.itemHeight, containerHeight, totalHeight])

  const scrollToTop = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = 0
    }
  }, [containerRef])

  const scrollToBottom = useCallback(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = totalHeight - containerHeight
    }
  }, [containerRef, totalHeight, containerHeight])

  // Attach scroll listener
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const cleanup = handleScroll()
    container.addEventListener('scroll', handleScroll, { passive: true })

    return () => {
      container.removeEventListener('scroll', handleScroll)
      if (cleanup) cleanup()
    }
  }, [handleScroll, containerRef])

  return {
    virtualItems,
    totalHeight,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    isScrolling
  }
}

// React component for virtual scrolling
interface VirtualScrollerProps<T> {
  items: T[]
  height: number
  itemHeight: number | ((index: number) => number)
  renderItem: (item: T, index: number) => React.ReactNode
  className?: string
  overscan?: number
  getItemId?: (index: number, item: T) => string | number
  onScroll?: (scrollTop: number) => void
  renderEmpty?: () => React.ReactNode
  renderLoading?: () => React.ReactNode
  isLoading?: boolean
}

export function VirtualScroller<T>({
  items,
  height,
  itemHeight,
  renderItem,
  className = '',
  overscan = 5,
  getItemId,
  onScroll,
  renderEmpty,
  renderLoading,
  isLoading = false
}: VirtualScrollerProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)

  const {
    virtualItems,
    totalHeight,
    scrollToIndex,
    scrollToTop,
    scrollToBottom,
    isScrolling
  } = useVirtualScroll(items, containerRef, {
    itemHeight,
    containerHeight: height,
    overscan,
    getItemId
  })

  useEffect(() => {
    if (onScroll && containerRef.current) {
      onScroll(containerRef.current.scrollTop)
    }
  }, [virtualItems, onScroll])

  if (isLoading && renderLoading) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        {renderLoading()}
      </div>
    )
  }

  if (items.length === 0 && renderEmpty) {
    return (
      <div className={`relative ${className}`} style={{ height }}>
        {renderEmpty()}
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height }}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {virtualItems.map(({ index, start, item, key }) => (
          <div
            key={key}
            style={{
              position: 'absolute',
              top: start,
              left: 0,
              right: 0,
              height: typeof itemHeight === 'function' ? itemHeight(index) : itemHeight
            }}
          >
            {renderItem(item, index)}
          </div>
        ))}
      </div>

      {/* Scroll indicators */}
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white px-2 py-1 rounded text-xs">
          Scrolling...
        </div>
      )}
    </div>
  )
}

// Virtual table component for large datasets
interface VirtualTableProps<T> {
  data: T[]
  columns: Array<{
    key: string
    title: string
    width?: number | string
    render?: (value: any, row: T, index: number) => React.ReactNode
  }>
  height: number
  rowHeight?: number
  headerHeight?: number
  className?: string
  onRowClick?: (row: T, index: number) => void
  selectedRows?: Set<string | number>
  getRowId?: (row: T, index: number) => string | number
  isLoading?: boolean
  emptyMessage?: string
}

export function VirtualTable<T extends Record<string, any>>({
  data,
  columns,
  height,
  rowHeight = 48,
  headerHeight = 40,
  className = '',
  onRowClick,
  selectedRows = new Set(),
  getRowId = (_, index) => index,
  isLoading = false,
  emptyMessage = 'No data available'
}: VirtualTableProps<T>) {
  const tableBodyRef = useRef<HTMLDivElement>(null)
  const scrollBarWidth = 17 // Approximate scrollbar width

  const {
    virtualItems,
    totalHeight,
    scrollToIndex,
    isScrolling
  } = useVirtualScroll(data, tableBodyRef, {
    itemHeight: rowHeight,
    containerHeight: height - headerHeight,
    overscan: 10,
    getItemId: getRowId
  })

  const renderHeader = () => (
    <div
      className="flex bg-gray-50 border-b border-gray-200 sticky top-0 z-10"
      style={{ height: headerHeight, paddingRight: scrollBarWidth }}
    >
      {columns.map((column, index) => (
        <div
          key={column.key}
          className="flex items-center px-4 py-2 font-medium text-gray-900 border-r border-gray-200 last:border-r-0"
          style={{ width: column.width || `${100 / columns.length}%` }}
        >
          {column.title}
        </div>
      ))}
    </div>
  )

  const renderRow = (row: T, index: number) => {
    const rowId = getRowId(row, index)
    const isSelected = selectedRows.has(rowId)

    return (
      <div
        className={`flex border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
          isSelected ? 'bg-blue-50' : ''
        }`}
        onClick={() => onRowClick?.(row, index)}
      >
        {columns.map((column) => (
          <div
            key={column.key}
            className="flex items-center px-4 py-2 border-r border-gray-100 last:border-r-0 text-sm"
            style={{ width: column.width || `${100 / columns.length}%` }}
          >
            {column.render
              ? column.render(row[column.key], row, index)
              : row[column.key]
            }
          </div>
        ))}
      </div>
    )
  }

  const renderEmpty = () => (
    <div className="flex items-center justify-center h-32 text-gray-500">
      {emptyMessage}
    </div>
  )

  const renderLoading = () => (
    <div className="flex items-center justify-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      <span className="ml-2 text-gray-600">Loading...</span>
    </div>
  )

  return (
    <div className={`border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {renderHeader()}

      <VirtualScroller
        items={data}
        height={height - headerHeight}
        itemHeight={rowHeight}
        renderItem={renderRow}
        getItemId={getRowId}
        renderEmpty={renderEmpty}
        renderLoading={renderLoading}
        isLoading={isLoading}
        className="bg-white"
      />

      {/* Loading overlay */}
      {isScrolling && (
        <div className="absolute top-2 right-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-xs z-20">
          Loading...
        </div>
      )}
    </div>
  )
}

// Hook for infinite scrolling with virtual scrolling
export function useInfiniteVirtualScroll<T>(
  initialItems: T[],
  loadMore: () => Promise<T[]>,
  options: {
    threshold?: number
    hasMore: boolean
    isLoading: boolean
  }
) {
  const [items, setItems] = useState<T[]>(initialItems)
  const { threshold = 0.8, hasMore, isLoading } = options

  const handleScroll = useCallback(async (scrollTop: number, containerHeight: number, totalHeight: number) => {
    const scrollPercentage = (scrollTop + containerHeight) / totalHeight

    if (scrollPercentage >= threshold && hasMore && !isLoading) {
      try {
        const newItems = await loadMore()
        setItems(prev => [...prev, ...newItems])
      } catch (error) {
        console.error('Failed to load more items:', error)
      }
    }
  }, [threshold, hasMore, isLoading, loadMore])

  return {
    items,
    handleScroll,
    setItems
  }
}

export type { VirtualScrollOptions, VirtualScrollResult }