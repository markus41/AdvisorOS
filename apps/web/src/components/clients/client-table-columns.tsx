'use client'

import { ColumnDef } from '@tanstack/react-table'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { DataTableColumnHeader } from '@/components/ui/data-table'
import { ClientWithRelations } from '@/types/client'
import { Badge } from '@/components/ui/badge'
import { formatCurrency, formatDate } from '@/lib/utils'
import {
  MoreHorizontal,
  Eye,
  Edit,
  Trash2,
  Building,
  Mail,
  Phone,
  ExternalLink
} from 'lucide-react'
import Link from 'next/link'

const statusColors = {
  active: 'bg-green-100 text-green-800',
  inactive: 'bg-gray-100 text-gray-800',
  prospect: 'bg-blue-100 text-blue-800',
}

const riskLevelColors = {
  low: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
}

export const clientTableColumns: ColumnDef<ClientWithRelations>[] = [
  {
    id: 'select',
    header: ({ table }) => (
      <Checkbox
        checked={table.getIsAllPageRowsSelected()}
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: 'businessName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Business Name" />
    ),
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-800">
              <Building className="h-4 w-4" />
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <Link
              href={`/clients/${client.id}`}
              className="font-medium text-gray-900 hover:text-blue-600"
            >
              {client.businessName}
            </Link>
            {client.legalName && client.legalName !== client.businessName && (
              <div className="text-sm text-gray-500">{client.legalName}</div>
            )}
          </div>
        </div>
      )
    },
  },
  {
    accessorKey: 'primaryContactName',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Primary Contact" />
    ),
    cell: ({ row }) => {
      const client = row.original
      return (
        <div className="space-y-1">
          <div className="font-medium">{client.primaryContactName}</div>
          <div className="flex items-center space-x-2 text-sm text-gray-500">
            <Mail className="h-3 w-3" />
            <a
              href={`mailto:${client.primaryContactEmail}`}
              className="hover:text-blue-600"
            >
              {client.primaryContactEmail}
            </a>
          </div>
          {client.primaryContactPhone && (
            <div className="flex items-center space-x-2 text-sm text-gray-500">
              <Phone className="h-3 w-3" />
              <a
                href={`tel:${client.primaryContactPhone}`}
                className="hover:text-blue-600"
              >
                {client.primaryContactPhone}
              </a>
            </div>
          )}
        </div>
      )
    },
  },
  {
    accessorKey: 'status',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Status" />
    ),
    cell: ({ row }) => {
      const status = row.getValue('status') as string
      return (
        <Badge className={statusColors[status as keyof typeof statusColors]}>
          {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'businessType',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Business Type" />
    ),
    cell: ({ row }) => {
      const businessType = row.getValue('businessType') as string
      return businessType ? (
        <span className="text-sm text-gray-900">{businessType}</span>
      ) : (
        <span className="text-sm text-gray-500">-</span>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'riskLevel',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Risk Level" />
    ),
    cell: ({ row }) => {
      const riskLevel = row.getValue('riskLevel') as string
      return (
        <Badge className={riskLevelColors[riskLevel as keyof typeof riskLevelColors]}>
          {riskLevel.charAt(0).toUpperCase() + riskLevel.slice(1)}
        </Badge>
      )
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id))
    },
  },
  {
    accessorKey: 'annualRevenue',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Annual Revenue" />
    ),
    cell: ({ row }) => {
      const revenue = row.getValue('annualRevenue') as number
      return revenue ? (
        <span className="font-medium">{formatCurrency(revenue)}</span>
      ) : (
        <span className="text-gray-500">-</span>
      )
    },
  },
  {
    accessorKey: 'quickbooksId',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="QuickBooks" />
    ),
    cell: ({ row }) => {
      const quickbooksId = row.getValue('quickbooksId')
      return (
        <div className="flex items-center">
          {quickbooksId ? (
            <Badge className="bg-green-100 text-green-800">
              Connected
            </Badge>
          ) : (
            <Badge className="bg-gray-100 text-gray-600">
              Not Connected
            </Badge>
          )}
        </div>
      )
    },
  },
  {
    id: 'summary',
    header: 'Summary',
    cell: ({ row }) => {
      const client = row.original
      const counts = client._count
      return (
        <div className="text-sm text-gray-500">
          <div>{counts?.engagements || 0} engagements</div>
          <div>{counts?.documents || 0} documents</div>
          <div>{counts?.invoices || 0} invoices</div>
        </div>
      )
    },
  },
  {
    accessorKey: 'createdAt',
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Created" />
    ),
    cell: ({ row }) => {
      const date = row.getValue('createdAt') as Date
      return (
        <div className="text-sm text-gray-500">
          {formatDate(date)}
        </div>
      )
    },
  },
  {
    id: 'actions',
    enableHiding: false,
    cell: ({ row }) => {
      const client = row.original

      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <span className="sr-only">Open menu</span>
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => navigator.clipboard.writeText(client.id)}>
              Copy client ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href={`/clients/${client.id}`} className="flex items-center">
                <Eye className="mr-2 h-4 w-4" />
                View details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={`/clients/${client.id}/edit`} className="flex items-center">
                <Edit className="mr-2 h-4 w-4" />
                Edit client
              </Link>
            </DropdownMenuItem>
            {client.website && (
              <DropdownMenuItem asChild>
                <a
                  href={client.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center"
                >
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Visit website
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-600">
              <Trash2 className="mr-2 h-4 w-4" />
              Delete client
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )
    },
  },
]