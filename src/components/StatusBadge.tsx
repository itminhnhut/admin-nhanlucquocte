// Nhãn trạng thái dùng chung cho mọi bảng. Trước đây mỗi trang một kiểu: chỗ nền
// đặc, chỗ nền nhạt, chỗ màu thương hiệu — nhìn như ba phần mềm khác nhau.
// Luôn nằm trên một dòng, vì cột hẹp làm chữ xuống dòng và vỡ khối màu.
import { ReactNode } from 'react';

// Chỉ 4 sắc thái. Thêm màu nữa là bảng nhìn như rạp xiếc, mà người dùng
// cũng không nhớ nổi màu nào nghĩa là gì.
export type BadgeTone = 'ok' | 'warn' | 'muted' | 'brand';

const TONES: Record<BadgeTone, string> = {
    ok: 'bg-emerald-50 text-emerald-700 ring-emerald-200',      // xong, đang hiển thị
    warn: 'bg-amber-50 text-amber-700 ring-amber-200',          // đang chờ, đang xử lý
    muted: 'bg-slate-100 text-slate-600 ring-slate-200',        // ẩn, nháp
    brand: 'bg-primary-light text-primary ring-primary/20',     // nổi bật, quyền cao nhất
};

function StatusBadge({ tone = 'muted', children }: { tone?: BadgeTone; children: ReactNode }) {
    return <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ring-inset ${TONES[tone]}`}>{children}</span>;
}

export default StatusBadge;
