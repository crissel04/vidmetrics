'use client'

import { useState, useMemo } from 'react'
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  type SortingState,
  type ColumnDef,
  flexRender,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'
import { Input } from '@/components/ui/input'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import { ArrowUp, Search } from 'lucide-react'
import { cn } from '@/lib/utils'
import { formatNumber, formatDate, formatDuration } from '@/lib/utils'
import { TrendingBadge } from '@/components/insights/TrendingBadge'
import { ThumbnailPopover } from '@/components/videos/ThumbnailPopover'
import type { Video } from '@/lib/types'

interface VideoTableProps {
  videos: Video[]
  onRowClick?: (video: Video) => void
}

export function VideoTable({ videos, onRowClick }: VideoTableProps) {
  const [sorting, setSorting] = useState<SortingState>([{ id: 'publishedAt', desc: true }])
  const [globalFilter, setGlobalFilter] = useState('')
  const [timeFilter, setTimeFilter] = useState<'all' | '30d' | '90d'>('all')

  const filteredByTime = useMemo(() => {
    if (timeFilter === 'all') return videos
    const now = Date.now()
    const days = timeFilter === '30d' ? 30 : 90
    const cutoff = now - days * 24 * 60 * 60 * 1000
    return videos.filter(v => new Date(v.publishedAt).getTime() >= cutoff)
  }, [videos, timeFilter])

  const columns: ColumnDef<Video>[] = useMemo(() => [
    {
      accessorKey: 'title',
      header: 'Title',
      cell: ({ row }) => (
        <ThumbnailPopover
          thumbnailUrl={row.original.thumbnailUrl}
          title={row.original.title}
          duration={row.original.duration}
        >
          <span className="truncate max-w-[300px] block text-sm">
            {row.original.title}
          </span>
        </ThumbnailPopover>
      ),
    },
    {
      accessorKey: 'publishedAt',
      header: 'Published',
      cell: ({ row }) => (
        <span className="text-sm whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
          {formatDate(row.original.publishedAt)}
        </span>
      ),
    },
    {
      accessorKey: 'viewCount',
      header: 'Views',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums font-medium">{formatNumber(row.original.viewCount)}</span>
      ),
    },
    {
      accessorKey: 'likeCount',
      header: 'Likes',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {formatNumber(row.original.likeCount)}
        </span>
      ),
    },
    {
      accessorKey: 'commentCount',
      header: 'Comments',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {formatNumber(row.original.commentCount)}
        </span>
      ),
    },
    {
      accessorKey: 'engagementRate',
      header: 'Eng. Rate',
      cell: ({ row }) => {
        const rate = row.original.engagementRate
        let color = 'var(--text-primary)'
        if (rate > 5) color = 'var(--green-text)'
        else if (rate < 2) color = 'var(--red-text)'
        return (
          <span className="text-sm tabular-nums font-medium" style={{ color }}>
            {rate.toFixed(2)}%
          </span>
        )
      },
    },
    {
      accessorKey: 'viewsPerDay',
      header: 'Views/Day',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {formatNumber(Math.round(row.original.viewsPerDay))}
        </span>
      ),
    },
    {
      accessorKey: 'duration',
      header: 'Duration',
      cell: ({ row }) => (
        <span className="text-sm tabular-nums" style={{ color: 'var(--text-secondary)' }}>
          {formatDuration(row.original.duration)}
        </span>
      ),
    },
    {
      accessorKey: 'performanceTier',
      header: 'Tier',
      cell: ({ row }) => <TrendingBadge tier={row.original.performanceTier} />,
    },
  ], [])

  const table = useReactTable({
    data: filteredByTime,
    columns,
    state: { sorting, globalFilter },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: 20 } },
  })

  const pageCount = table.getPageCount()
  const currentPage = table.getState().pagination.pageIndex

  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] fade-in">
      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 p-4 border-b border-[var(--border-subtle)]">
        {/* Time filter */}
        <div className="flex rounded-lg overflow-hidden border border-[var(--border)]">
          {(['all', '30d', '90d'] as const).map((period) => (
            <button
              key={period}
              onClick={() => setTimeFilter(period)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium transition-colors duration-150',
                timeFilter === period
                  ? ''
                  : ''
              )}
              style={{
                background: timeFilter === period ? 'var(--accent-subtle)' : 'transparent',
                color: timeFilter === period ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
            >
              {period === 'all' ? 'All time' : period === '30d' ? 'Last 30d' : 'Last 90d'}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-muted)' }} />
          <Input
            placeholder="Search videos..."
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-9 h-8 text-sm"
            style={{ borderColor: 'var(--border)' }}
          />
        </div>
      </div>

      {/* Table */}
      <ScrollArea className="w-full">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id} className="border-[var(--border-subtle)]">
                {headerGroup.headers.map((header) => (
                  <TableHead
                    key={header.id}
                    onClick={header.column.getToggleSortingHandler()}
                    className="cursor-pointer select-none text-xs font-medium whitespace-nowrap"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    <div className="flex items-center gap-1">
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() && (
                        <ArrowUp
                          size={14}
                          className={cn(
                            'transition-transform duration-150',
                            header.column.getIsSorted() === 'desc' && 'rotate-180'
                          )}
                        />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="py-12 text-center">
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No videos published in this period
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              table.getRowModel().rows.map((row, i) => (
                <TableRow
                  key={row.id}
                  onClick={() => onRowClick?.(row.original)}
                  className="cursor-pointer border-[var(--border-subtle)]"
                  style={{
                    background: i % 2 === 0 ? 'transparent' : 'var(--border-subtle)',
                  }}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id} className="py-3">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--border-subtle)]">
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filteredByTime.length} videos
          </span>
          <Pagination>
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => table.previousPage()}
                  className={cn(!table.getCanPreviousPage() && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>
              {Array.from({ length: Math.min(pageCount, 5) }).map((_, i) => (
                <PaginationItem key={i}>
                  <PaginationLink
                    onClick={() => table.setPageIndex(i)}
                    isActive={currentPage === i}
                  >
                    {i + 1}
                  </PaginationLink>
                </PaginationItem>
              ))}
              <PaginationItem>
                <PaginationNext
                  onClick={() => table.nextPage()}
                  className={cn(!table.getCanNextPage() && 'pointer-events-none opacity-50')}
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
