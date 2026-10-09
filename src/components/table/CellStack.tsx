// Một ô bảng chứa 2 dòng: dòng chính in đậm, dòng phụ nhỏ và xám.
// Dùng để gộp nhiều cột liên quan thành một, cho bảng đỡ dàn ngang.
import { ReactNode } from 'react';

function CellStack({ main, sub, muted = '—' }: { main: ReactNode; sub?: ReactNode; muted?: string }) {
    return (
        <div className="min-w-0">
            <div className="font-medium text-slate-800">{main || muted}</div>
            {sub ? <div className="mt-0.5 text-xs text-slate-500">{sub}</div> : null}
        </div>
    );
}

export default CellStack;
