import React, { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {2
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, ArrowUpDown, ChevronLeft, ChevronRight } from 'lucide-react';

export default function DataTable({ 
  data = [], 
  columns = [], 
  searchable = true,
  searchPlaceholder = "Pesquisar...",
  sortable = true,
  pageSize = 10,
  onRowClick
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [currentPage, setCurrentPage] = useState(1);

  // Filter data
  const filteredData = searchable && searchQuery
    ? data.filter(row => 
        columns.some(col => {
          const value = col.accessor ? col.accessor(row) : row[col.key];
          return value?.toString().toLowerCase().includes(searchQuery.toLowerCase());
        })
      )
    : data;

  // Sort data
  const sortedData = sortable && sortColumn
    ? [...filteredData].sort((a, b) => {
        const aVal = sortColumn.accessor ? sortColumn.accessor(a) : a[sortColumn.key];
        const bVal = sortColumn.accessor ? sortColumn.accessor(b) : b[sortColumn.key];
        
        if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      })
    : filteredData;

  // Paginate
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const paginatedData = sortedData.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handleSort = (column) => {
    if (!sortable) return;
    
    if (sortColumn?.key === column.key) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  return (
    <div className="space-y-4">
      {/* Search */}
      {searchable && (
        <div className="flex items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
            <Input
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
              className="pl-10"
            />
          </div>
          <div className="text-sm text-stone-500">
            {sortedData.length} resultado{sortedData.length !== 1 ? 's' : ''}
          </div>
        </div>
      )}

      {/* Table */}
      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-stone-50">
              {columns.map((col) => (
                <TableHead 
                  key={col.key}
                  className={sortable && col.sortable !== false ? 'cursor-pointer hover:bg-stone-100' : ''}
                  onClick={() => col.sortable !== false && handleSort(col)}
                >
                  <div className="flex items-center gap-2">
                    {col.label}
                    {sortable && col.sortable !== false && (
                      <ArrowUpDown className={`w-4 h-4 ${
                        sortColumn?.key === col.key ? 'text-[#B8956A]' : 'text-stone-400'
                      }`} />
                    )}
                  </div>
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center py-8 text-stone-500">
                  Nenhum resultado encontrado
                </TableCell>
              </TableRow>
            ) : (
              paginatedData.map((row, idx) => (
                <TableRow 
                  key={row.id || idx}
                  className={onRowClick ? 'cursor-pointer hover:bg-stone-50' : ''}
                  onClick={() => onRowClick?.(row)}
                >
                  {columns.map((col) => (
                    <TableCell key={col.key}>
                      {col.render 
                        ? col.render(row) 
                        : col.accessor 
                          ? col.accessor(row) 
                          : row[col.key]
                      }
                    </TableCell>
                  ))}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-stone-500">
            Página {currentPage} de {totalPages}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}