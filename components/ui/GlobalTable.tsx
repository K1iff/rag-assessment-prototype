import React from 'react';

export interface ColumnDef<T> {
  header: React.ReactNode;
  accessorKey?: keyof T;
  cell?: (item: T) => React.ReactNode;
  className?: string;
  headerClassName?: string;
}

interface GlobalTableProps<T> {
  data: T[];
  columns: ColumnDef<T>[];
  enableCheckboxes?: boolean;
  selectedIds?: string[];
  onSelectionChange?: (id: string) => void;
  onSelectAll?: () => void;
  keyExtractor: (item: T, index: number) => string;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: React.ReactNode;
  emptyTitle?: string;
  rowClassName?: (item: T, isSelected: boolean) => string;
  renderExpandedRow?: (item: T) => React.ReactNode;
  onRowClick?: (item: T) => void;
}

export function GlobalTable<T>({
  data,
  columns,
  enableCheckboxes = false,
  selectedIds = [],
  onSelectionChange,
  onSelectAll,
  keyExtractor,
  isLoading = false,
  loadingMessage = "Loading...",
  emptyMessage = "No items found.",
  emptyTitle = "No data",
  rowClassName,
  renderExpandedRow,
  onRowClick,
}: GlobalTableProps<T>) {
  const isAllSelected = data.length > 0 && selectedIds.length === data.length;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse whitespace-nowrap md:whitespace-normal">
        <thead>
          <tr className="bg-white border-b border-slate-200">
            {enableCheckboxes && (
              <th className="p-4 w-12 text-center">
                <input
                  type="checkbox"
                  checked={isAllSelected}
                  onChange={onSelectAll}
                  className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
              </th>
            )}
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`p-4 text-xs font-bold uppercase tracking-wider text-slate-500 ${col.headerClassName || ''}`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {isLoading ? (
            <tr>
              <td colSpan={columns.length + (enableCheckboxes ? 1 : 0)} className="p-12 text-center text-slate-500 font-bold">
                {loadingMessage}
              </td>
            </tr>
          ) : data.length === 0 ? (
            <tr>
              <td colSpan={columns.length + (enableCheckboxes ? 1 : 0)} className="p-12 text-center bg-white border border-slate-200 rounded-xl">
                <div className="flex flex-col items-center justify-center space-y-3">
                  <div className="w-12 h-12 bg-slate-50 rounded-full flex items-center justify-center border border-slate-100">
                    <svg className="w-6 h-6 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                    </svg>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-bold text-slate-700">{emptyTitle}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1 max-w-sm">{emptyMessage}</p>
                  </div>
                </div>
              </td>
            </tr>
          ) : (
            data.map((item, index) => {
              const id = keyExtractor(item, index);
              const isSelected = selectedIds.includes(id);
              const customRowClass = rowClassName ? rowClassName(item, isSelected) : `transition-colors ${isSelected ? "bg-blue-50/50" : "hover:bg-slate-50"}`;

              return (
                <React.Fragment key={id}>
                  <tr className={customRowClass} onClick={() => onRowClick && onRowClick(item)}>
                    {enableCheckboxes && (
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => onSelectionChange && onSelectionChange(id)}
                          className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                        />
                      </td>
                    )}
                    {columns.map((col, idx) => (
                      <td key={idx} className={`p-4 ${col.className || ''}`}>
                        {col.cell ? col.cell(item) : String((item as any)[col.accessorKey as string] ?? '')}
                      </td>
                    ))}
                  </tr>
                  {renderExpandedRow && renderExpandedRow(item)}
                </React.Fragment>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

interface GlobalPaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  filteredItemsCount: number;
}

export function GlobalPagination({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  onPageChange,
  filteredItemsCount
}: GlobalPaginationProps) {
  return (
    <div className="bg-slate-50 p-4 border-t border-slate-200 flex flex-col md:flex-row justify-between items-center gap-4 text-sm font-bold text-slate-500">
      <span>
        Showing {filteredItemsCount > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0} to{" "}
        {Math.min(currentPage * itemsPerPage, filteredItemsCount)} of {filteredItemsCount} items
        {filteredItemsCount !== totalItems && ` (filtered from ${totalItems})`}
      </span>
      <div className="flex gap-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1 || totalPages === 0}
          className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-100 shadow-sm disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-white"
        >
          Previous
        </button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`hidden md:block px-3 py-1 border border-slate-300 rounded shadow-sm ${
              currentPage === page ? "bg-blue-600 text-white border-blue-600" : "bg-white hover:bg-slate-100 text-slate-600"
            }`}
          >
            {page}
          </button>
        ))}
        <span className="md:hidden px-3 py-1 bg-white border border-slate-200 rounded font-bold text-slate-700">
          {currentPage} / {totalPages || 1}
        </span>
        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages || totalPages === 0}
          className="px-3 py-1 border border-slate-300 rounded bg-white text-slate-600 hover:bg-slate-100 shadow-sm disabled:text-slate-400 disabled:cursor-not-allowed disabled:hover:bg-white"
        >
          Next
        </button>
      </div>
    </div>
  );
}
