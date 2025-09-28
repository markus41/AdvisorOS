import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ColumnDef } from '@tanstack/react-table'
import { DataTable } from '@/components/ui/data-table'

// Mock UI components
jest.mock('@/components/ui/button', () => ({
  Button: React.forwardRef<HTMLButtonElement, any>(({ children, className, variant, ...props }, ref) => (
    <button ref={ref} className={className} data-variant={variant} {...props}>
      {children}
    </button>
  )),
}))

jest.mock('@/components/ui/checkbox', () => ({
  Checkbox: React.forwardRef<HTMLInputElement, any>(({ ...props }, ref) => (
    <input ref={ref} type="checkbox" {...props} />
  )),
}))

jest.mock('@/components/ui/input', () => ({
  Input: React.forwardRef<HTMLInputElement, any>(({ ...props }, ref) => (
    <input ref={ref} {...props} />
  )),
}))

jest.mock('@/components/ui/dropdown-menu', () => ({
  DropdownMenu: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuTrigger: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuCheckboxItem: ({ children, checked, onCheckedChange }: any) => (
    <div>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onCheckedChange?.(e.target.checked)}
      />
      {children}
    </div>
  ),
  DropdownMenuItem: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuLabel: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}))

jest.mock('@/components/ui/table', () => ({
  Table: ({ children, ...props }: any) => <table {...props}>{children}</table>,
  TableHeader: ({ children, ...props }: any) => <thead {...props}>{children}</thead>,
  TableBody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  TableRow: ({ children, ...props }: any) => <tr {...props}>{children}</tr>,
  TableHead: ({ children, ...props }: any) => <th {...props}>{children}</th>,
  TableCell: ({ children, ...props }: any) => <td {...props}>{children}</td>,
}))

// Test data
interface TestData {
  id: string
  name: string
  email: string
  status: 'active' | 'inactive'
  role: string
}

const mockData: TestData[] = [
  { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', role: 'admin' },
  { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', role: 'user' },
  { id: '3', name: 'Bob Johnson', email: 'bob@example.com', status: 'active', role: 'user' },
]

const mockColumns: ColumnDef<TestData>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <input
        type="checkbox"
        checked={table.getIsAllPageRowsSelected()}
        onChange={(e) => table.toggleAllPageRowsSelected(e.target.checked)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <input
        type="checkbox"
        checked={row.getIsSelected()}
        onChange={(e) => row.toggleSelected(e.target.checked)}
        aria-label={`Select row ${row.index + 1}`}
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'name',
    header: ({ column }) => (
      <button onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}>
        Name
      </button>
    ),
  },
  {
    accessorKey: 'email',
    header: 'Email',
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <span className={status === 'active' ? 'text-green-600' : 'text-red-600'}>
          {status}
        </span>
      )
    },
  },
  {
    accessorKey: 'role',
    header: 'Role',
  },
]

describe('DataTable', () => {
  const defaultProps = {
    columns: mockColumns,
    data: mockData,
  }

  it('should render table with data', () => {
    render(<DataTable {...defaultProps} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getByText('jane@example.com')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('should render search input when searchKey is provided', () => {
    render(
      <DataTable
        {...defaultProps}
        searchKey="name"
        searchPlaceholder="Search users..."
      />
    )

    const searchInput = screen.getByPlaceholderText('Search users...')
    expect(searchInput).toBeInTheDocument()
  })

  it('should filter data based on search input', async () => {
    const user = userEvent.setup()
    render(<DataTable {...defaultProps} searchKey="name" />)

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'John')

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
    expect(screen.queryByText('Bob Johnson')).not.toBeInTheDocument()
  })

  it('should clear search filter', async () => {
    const user = userEvent.setup()
    render(<DataTable {...defaultProps} searchKey="name" />)

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'John')

    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()

    await user.clear(searchInput)

    expect(screen.getByText('Jane Smith')).toBeInTheDocument()
    expect(screen.getByText('Bob Johnson')).toBeInTheDocument()
  })

  it('should handle sorting', async () => {
    const user = userEvent.setup()
    render(<DataTable {...defaultProps} />)

    const nameHeader = screen.getByRole('button', { name: /name/i })
    await user.click(nameHeader)

    // After sorting, check if rows are in different order
    const rows = screen.getAllByRole('row')
    // First row is header, so data rows start from index 1
    expect(rows[1]).toHaveTextContent('Bob Johnson') // First alphabetically
  })

  it('should handle row selection', async () => {
    const user = userEvent.setup()
    const onRowSelectionChange = jest.fn()

    render(<DataTable {...defaultProps} onRowSelectionChange={onRowSelectionChange} />)

    const firstRowCheckbox = screen.getByLabelText('Select row 1')
    await user.click(firstRowCheckbox)

    await waitFor(() => {
      expect(onRowSelectionChange).toHaveBeenCalledWith([
        { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', role: 'admin' }
      ])
    })
  })

  it('should handle select all rows', async () => {
    const user = userEvent.setup()
    const onRowSelectionChange = jest.fn()

    render(<DataTable {...defaultProps} onRowSelectionChange={onRowSelectionChange} />)

    const selectAllCheckbox = screen.getByLabelText('Select all')
    await user.click(selectAllCheckbox)

    await waitFor(() => {
      expect(onRowSelectionChange).toHaveBeenCalledWith(mockData)
    })
  })

  it('should render column visibility dropdown', () => {
    render(<DataTable {...defaultProps} />)

    const columnsButton = screen.getByRole('button', { name: /columns/i })
    expect(columnsButton).toBeInTheDocument()
  })

  it('should handle pagination', () => {
    const largeData = Array.from({ length: 50 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: 'active' as const,
      role: 'user',
    }))

    render(<DataTable columns={mockColumns} data={largeData} />)

    // Should show pagination controls (assuming default page size)
    expect(screen.getByText('User 1')).toBeInTheDocument()
    // Check if pagination is working by looking for users beyond the first page
    expect(screen.queryByText('User 50')).not.toBeInTheDocument()
  })

  it('should render custom cell content', () => {
    render(<DataTable {...defaultProps} />)

    // Check if custom status cell rendering works
    const activeStatuses = screen.getAllByText('active')
    const inactiveStatuses = screen.getAllByText('inactive')

    expect(activeStatuses.length).toBeGreaterThan(0)
    expect(inactiveStatuses.length).toBeGreaterThan(0)

    // Check CSS classes are applied (mock implementation shows text content)
    activeStatuses.forEach(status => {
      expect(status).toHaveClass('text-green-600')
    })
    inactiveStatuses.forEach(status => {
      expect(status).toHaveClass('text-red-600')
    })
  })

  it('should handle empty data', () => {
    render(<DataTable columns={mockColumns} data={[]} />)

    expect(screen.getByRole('table')).toBeInTheDocument()
    expect(screen.queryByText('John Doe')).not.toBeInTheDocument()
  })

  it('should handle multiple filters', async () => {
    const user = userEvent.setup()

    // Create data that can be filtered by multiple criteria
    const complexData = [
      { id: '1', name: 'John Admin', email: 'john@admin.com', status: 'active' as const, role: 'admin' },
      { id: '2', name: 'John User', email: 'john@user.com', status: 'inactive' as const, role: 'user' },
      { id: '3', name: 'Jane Admin', email: 'jane@admin.com', status: 'active' as const, role: 'admin' },
    ]

    render(<DataTable columns={mockColumns} data={complexData} searchKey="name" />)

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'John')

    expect(screen.getByText('John Admin')).toBeInTheDocument()
    expect(screen.getByText('John User')).toBeInTheDocument()
    expect(screen.queryByText('Jane Admin')).not.toBeInTheDocument()
  })

  it('should preserve selection state during filtering', async () => {
    const user = userEvent.setup()
    const onRowSelectionChange = jest.fn()

    render(<DataTable {...defaultProps} searchKey="name" onRowSelectionChange={onRowSelectionChange} />)

    // Select first row
    const firstRowCheckbox = screen.getByLabelText('Select row 1')
    await user.click(firstRowCheckbox)

    // Filter data
    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'John')

    // Clear filter
    await user.clear(searchInput)

    // Check if selection is preserved
    await waitFor(() => {
      expect(onRowSelectionChange).toHaveBeenLastCalledWith([
        { id: '1', name: 'John Doe', email: 'john@example.com', status: 'active', role: 'admin' }
      ])
    })
  })

  it('should handle case-insensitive search', async () => {
    const user = userEvent.setup()
    render(<DataTable {...defaultProps} searchKey="name" />)

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, 'JOHN')

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.queryByText('Jane Smith')).not.toBeInTheDocument()
  })

  it('should handle special characters in search', async () => {
    const user = userEvent.setup()
    const dataWithSpecialChars = [
      { id: '1', name: 'John O\'Connor', email: 'john@test.com', status: 'active' as const, role: 'user' },
      { id: '2', name: 'Mary-Jane', email: 'mary@test.com', status: 'active' as const, role: 'user' },
    ]

    render(<DataTable columns={mockColumns} data={dataWithSpecialChars} searchKey="name" />)

    const searchInput = screen.getByPlaceholderText('Search...')
    await user.type(searchInput, "O'Connor")

    expect(screen.getByText('John O\'Connor')).toBeInTheDocument()
    expect(screen.queryByText('Mary-Jane')).not.toBeInTheDocument()
  })

  it('should handle rapid state changes', async () => {
    const user = userEvent.setup()
    const onRowSelectionChange = jest.fn()

    render(<DataTable {...defaultProps} onRowSelectionChange={onRowSelectionChange} />)

    // Rapidly select and deselect rows
    const firstCheckbox = screen.getByLabelText('Select row 1')
    const secondCheckbox = screen.getByLabelText('Select row 2')

    await user.click(firstCheckbox)
    await user.click(secondCheckbox)
    await user.click(firstCheckbox) // Deselect

    await waitFor(() => {
      expect(onRowSelectionChange).toHaveBeenLastCalledWith([
        { id: '2', name: 'Jane Smith', email: 'jane@example.com', status: 'inactive', role: 'user' }
      ])
    })
  })

  it('should handle columns without sorting', () => {
    const columnsWithoutSort: ColumnDef<TestData>[] = [
      {
        accessorKey: 'name',
        header: 'Name',
        enableSorting: false,
      },
      {
        accessorKey: 'email',
        header: 'Email',
      },
    ]

    render(<DataTable columns={columnsWithoutSort} data={mockData} />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Email')).toBeInTheDocument()
  })

  it('should handle dynamic data updates', () => {
    const { rerender } = render(<DataTable {...defaultProps} />)

    expect(screen.getByText('John Doe')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(4) // 3 data rows + 1 header

    const newData = [
      ...mockData,
      { id: '4', name: 'Alice Brown', email: 'alice@example.com', status: 'active' as const, role: 'user' },
    ]

    rerender(<DataTable columns={mockColumns} data={newData} />)

    expect(screen.getByText('Alice Brown')).toBeInTheDocument()
    expect(screen.getAllByRole('row')).toHaveLength(5) // 4 data rows + 1 header
  })

  it('should maintain performance with large datasets', () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      id: `${i + 1}`,
      name: `User ${i + 1}`,
      email: `user${i + 1}@example.com`,
      status: i % 2 === 0 ? 'active' as const : 'inactive' as const,
      role: i % 3 === 0 ? 'admin' : 'user',
    }))

    const startTime = performance.now()
    render(<DataTable columns={mockColumns} data={largeDataset} />)
    const endTime = performance.now()

    expect(endTime - startTime).toBeLessThan(1000) // Should render in under 1 second
    expect(screen.getByRole('table')).toBeInTheDocument()
  })
})