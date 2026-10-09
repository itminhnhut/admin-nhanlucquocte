// Một ô bảng gom nhiều thông tin của cùng một đối tượng.
// `rows` là danh sách HÀNG, mỗi hàng chứa một hoặc nhiều mục — nhờ vậy gộp được
// "Mã SV · CCCD · Ngày sinh" vào cùng một hàng thay vì mỗi thứ một dòng.
// Mỗi mục vẫn có nút chép riêng, không chép dính vào nhau.
import { Fragment } from 'react';
import CopyButton from '../CopyButton';

export type InfoItem = {
    /** Nhãn ngắn đứng trước giá trị, ví dụ "CCCD" */
    label?: string;
    value?: string;
    /** Hàng đầu của đối tượng: in đậm, cỡ chữ thường */
    strong?: boolean;
    copy?: boolean;
};

function Item({ item }: { item: InfoItem }) {
    return (
        <span className="inline-flex min-w-0 items-center gap-1">
            {item.label && <span className="shrink-0 text-slate-400">{item.label}</span>}
            <span className={item.strong ? '' : 'font-medium text-slate-700'}>{item.value}</span>
            {item.copy && <CopyButton value={item.value ?? ''} label={item.label ?? 'giá trị'} />}
        </span>
    );
}

function InfoCell({ rows }: { rows: readonly (readonly InfoItem[])[] }) {
    const visible = rows.map((row) => row.filter((item) => item.value)).filter((row) => row.length > 0);
    if (visible.length === 0) return <span className="text-slate-400">—</span>;

    return (
        <div className="grid min-w-0 gap-y-1">
            {visible.map((row, rowIndex) => (
                <div
                    key={row.map((item) => `${item.label ?? ''}:${item.value}`).join('|')}
                    className={`flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 ${rowIndex === 0 && row[0]?.strong ? 'font-semibold text-slate-800' : 'text-[13px]'}`}
                >
                    {row.map((item, index) => (
                        <Fragment key={`${item.label ?? ''}:${item.value}`}>
                            {index > 0 && <span className="text-slate-300">·</span>}
                            <Item item={item} />
                        </Fragment>
                    ))}
                </div>
            ))}
        </div>
    );
}

export default InfoCell;
