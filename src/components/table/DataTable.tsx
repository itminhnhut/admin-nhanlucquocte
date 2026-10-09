// Bảng dùng chung cho mọi trang danh sách: tự lo sắp xếp, phân trang, trạng thái
// đang tải và lúc chưa có dữ liệu. Trước đây mỗi trang tự giữ state riêng nên
// cùng một việc viết lại 8 lần.
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { clampPage, pageCount, paginate, rangeLabel, sortRows, type SortState } from './tableData';

export type Column<T> = {
    /** Tên trường trong dữ liệu, cũng là khoá để sắp xếp */
    key: string;
    title: string;
    sortable?: boolean;
    align?: 'left' | 'center' | 'right';
    className?: string;
    render?: (row: T) => ReactNode;
};

type DataTableProps<T extends object> = {
    rows: readonly T[];
    columns: readonly Column<T>[];
    rowKey: (row: T) => string | number;
    /** Danh từ dùng trong câu "Hiện 1–30 trong 86 ngành" */
    unit?: string;
    loading?: boolean;
    emptyText?: string;
    initialSort?: SortState;
    pageSizes?: readonly number[];
    /**
     * Khi API trả từng trang (không trả hết một lần): truyền tổng số dòng và tự
     * giữ số trang ở ngoài. Lúc đó `rows` chính là dữ liệu của trang hiện tại.
     */
    server?: {
        total: number;
        page: number;
        onPageChange: (page: number) => void;
        pageSize: number;
        onPageSizeChange?: (pageSize: number) => void;
    };
};

const DEFAULT_PAGE_SIZES = [30, 50, 100];

function SortIcon({ state }: { state: 'none' | 'asc' | 'desc' }) {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className="shrink-0">
            <path d="m7 10 5-5 5 5" opacity={state === 'desc' ? 0.25 : 1} />
            <path d="m7 14 5 5 5-5" opacity={state === 'asc' ? 0.25 : 1} />
        </svg>
    );
}

function DataTable<T extends object>({ rows, columns, rowKey, unit = 'dòng', loading = false, emptyText, initialSort, pageSizes = DEFAULT_PAGE_SIZES, server }: DataTableProps<T>) {
    const [sort, setSort] = useState<SortState | null>(initialSort ?? null);
    const [localPage, setLocalPage] = useState(1);
    const [localPageSize, setLocalPageSize] = useState(pageSizes[0]);

    const page = server ? server.page : localPage;
    const pageSize = server ? server.pageSize : localPageSize;
    const total = server ? server.total : rows.length;
    const setPage = (next: number) => (server ? server.onPageChange(next) : setLocalPage(next));
    const setPageSize = (next: number) => (server ? server.onPageSizeChange?.(next) : setLocalPageSize(next));

    // Lọc xong còn ít dòng thì kéo về trang cuối, không để người dùng nhìn trang trắng
    useEffect(() => {
        if (server) return;
        setLocalPage((current) => clampPage(current, rows.length, localPageSize));
    }, [rows.length, localPageSize, server]);

    const sorted = useMemo(() => sortRows(rows, sort), [rows, sort]);
    // Máy chủ đã cắt trang sẵn thì hiện nguyên dữ liệu nhận được
    const visible = useMemo(() => (server ? sorted : paginate(sorted, localPage, localPageSize)), [server, sorted, localPage, localPageSize]);
    const totalPages = pageCount(total, pageSize);

    const toggleSort = (key: string) =>
        setSort((current) => (current?.key === key ? { key, direction: current.direction === 'asc' ? 'desc' : 'asc' } : { key, direction: 'asc' }));

    return (
        <div className="datatables">
            <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full border-collapse text-sm" data-testid="data-table">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-left">
                            {columns.map((column) => (
                                <th key={column.key} scope="col" className={`whitespace-nowrap px-3 py-2.5 font-semibold text-slate-600 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''}`}>
                                    {column.sortable ? (
                                        <button type="button" className="inline-flex items-center gap-1.5 hover:text-primary" onClick={() => toggleSort(column.key)}>
                                            {column.title}
                                            <SortIcon state={sort?.key === column.key ? sort.direction : 'none'} />
                                        </button>
                                    ) : (
                                        column.title
                                    )}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {loading && (
                            <tr>
                                <td colSpan={columns.length} className="px-3 py-10 text-center text-slate-500">
                                    Đang tải dữ liệu…
                                </td>
                            </tr>
                        )}
                        {!loading && visible.length === 0 && (
                            <tr>
                                <td colSpan={columns.length} className="px-3 py-10 text-center text-slate-500">
                                    {emptyText ?? `Chưa có ${unit} nào`}
                                </td>
                            </tr>
                        )}
                        {!loading &&
                            visible.map((row) => (
                                <tr key={rowKey(row)} className="border-b border-slate-100 last:border-0 hover:bg-slate-50">
                                    {columns.map((column) => (
                                        <td key={column.key} className={`px-3 py-2.5 align-top text-slate-700 ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : ''} ${column.className ?? ''}`}>
                                            {column.render ? column.render(row) : String((row as Record<string, unknown>)[column.key] ?? '')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                    </tbody>
                </table>
            </div>

            <div className="mt-3 flex flex-col gap-3 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between">
                <span data-testid="table-range">{rangeLabel(page, pageSize, total, unit)}</span>
                <div className="flex items-center gap-3">
                    <label className={`flex items-center gap-2 ${server && !server.onPageSizeChange ? 'hidden' : ''}`}>
                        <span className="whitespace-nowrap">Mỗi trang</span>
                        <select className="form-select !w-auto !py-1.5" value={pageSize} onChange={(event) => setPageSize(Number(event.target.value))}>
                            {pageSizes.map((size) => (
                                <option key={size} value={size}>
                                    {size}
                                </option>
                            ))}
                        </select>
                    </label>
                    <div className="flex items-center gap-1">
                        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                            Trước
                        </button>
                        <span className="whitespace-nowrap px-2">
                            {clampPage(page, total, pageSize)}/{totalPages}
                        </span>
                        <button type="button" className="btn btn-sm btn-outline-secondary" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>
                            Sau
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default DataTable;
