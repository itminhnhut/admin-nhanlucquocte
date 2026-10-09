// Sắp xếp và phân trang cho bảng. Tách khỏi giao diện để test được, và để 8 trang
// dùng chung một cách tính thay vì mỗi trang tự viết lại.

export type SortDirection = 'asc' | 'desc';
export type SortState = { key: string; direction: SortDirection };

// `interface` trong TypeScript không thoả Record<string, unknown> (thiếu index
// signature), nên nhận `object` rồi tự ép kiểu ở một chỗ duy nhất.
function valueOf(row: object, key: string): unknown {
    return (row as Record<string, unknown>)[key];
}

/** So sánh có hiểu tiếng Việt, số và ngày; giá trị rỗng luôn bị đẩy xuống cuối */
function compare(a: unknown, b: unknown): number {
    const aEmpty = a === null || a === undefined || a === '';
    const bEmpty = b === null || b === undefined || b === '';
    if (aEmpty && bEmpty) return 0;
    if (aEmpty) return 1;
    if (bEmpty) return -1;
    if (typeof a === 'number' && typeof b === 'number') return a - b;
    if (typeof a === 'boolean' && typeof b === 'boolean') return Number(a) - Number(b);
    return String(a).localeCompare(String(b), 'vi', { numeric: true, sensitivity: 'base' });
}

export function sortRows<T extends object>(rows: readonly T[], sort: SortState | null): T[] {
    if (!sort) return [...rows];
    const sorted = [...rows].sort((a, b) => compare(valueOf(a, sort.key), valueOf(b, sort.key)));
    return sort.direction === 'desc' ? sorted.reverse() : sorted;
}

export function pageCount(total: number, pageSize: number): number {
    if (pageSize <= 0) return 1;
    return Math.max(1, Math.ceil(total / pageSize));
}

/** Trang vượt quá số trang hiện có (vd sau khi lọc) thì kéo về trang cuối */
export function clampPage(page: number, total: number, pageSize: number): number {
    return Math.min(Math.max(1, page), pageCount(total, pageSize));
}

export function paginate<T>(rows: readonly T[], page: number, pageSize: number): T[] {
    const safePage = clampPage(page, rows.length, pageSize);
    const from = (safePage - 1) * pageSize;
    return rows.slice(from, from + pageSize);
}

/** Câu "Hiện 1–30 trong 86 ngành" dưới chân bảng */
export function rangeLabel(page: number, pageSize: number, total: number, unit: string): string {
    if (total === 0) return `Không có ${unit} nào`;
    const safePage = clampPage(page, total, pageSize);
    const from = (safePage - 1) * pageSize + 1;
    const to = Math.min(safePage * pageSize, total);
    return `Hiện ${from}–${to} trong ${total} ${unit}`;
}
