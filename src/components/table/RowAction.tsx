// Nút thao tác trong bảng. Chỉ dùng một gam màu thương hiệu cộng đỏ cho việc xoá,
// thay vì mỗi nút một màu như template cũ (xanh dương, vàng, xanh lá cùng lúc).
import { ReactNode } from 'react';

type RowActionProps = {
    /** 'chip' = nút có chữ · 'icon' = nút chỉ có biểu tượng · 'danger' = việc xoá */
    variant?: 'chip' | 'icon' | 'danger';
    title: string;
    onClick: () => void;
    children: ReactNode;
    disabled?: boolean;
    testId?: string;
};

const STYLES = {
    chip: 'bg-primary-light text-primary hover:bg-primary hover:text-white px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap',
    icon: 'text-slate-500 hover:text-primary p-1.5 rounded-md hover:bg-primary-light',
    danger: 'text-danger hover:text-white hover:bg-danger p-1.5 rounded-md',
} as const;

function RowAction({ variant = 'icon', title, onClick, children, disabled = false, testId }: RowActionProps) {
    return (
        <button type="button" title={title} aria-label={title} disabled={disabled} data-testid={testId} onClick={onClick} className={`transition-colors disabled:opacity-40 ${STYLES[variant]}`}>
            {children}
        </button>
    );
}

export default RowAction;
