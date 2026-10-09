// Bảng trượt từ phải. Dùng cho form ngắn: vẫn thấy danh sách phía sau, không
// nhảy trang, và ba điều quan trọng với người không quen máy tính:
//  1. Đang sửa dở mà bấm ra ngoài thì HỎI LẠI, không đóng im lặng
//  2. Nút Lưu dính đáy, luôn nhìn thấy, không phải cuộn đi tìm
//  3. Một cột, nhãn nằm trên ô nhập
import { ReactNode, useEffect } from 'react';
import { createPortal } from 'react-dom';
import Swal from 'sweetalert2';

type DrawerProps = {
    open: boolean;
    title: string;
    description?: string;
    /** Có thay đổi chưa lưu → đóng phải hỏi lại */
    dirty?: boolean;
    saving?: boolean;
    saveLabel?: string;
    onClose: () => void;
    onSave?: () => void;
    children: ReactNode;
};

async function confirmDiscard() {
    const result = await Swal.fire({
        icon: 'warning',
        title: 'Bỏ các thay đổi?',
        text: 'Thông tin chưa lưu sẽ bị mất.',
        showCancelButton: true,
        confirmButtonText: 'Bỏ thay đổi',
        cancelButtonText: 'Tiếp tục sửa',
        confirmButtonColor: '#e7515a',
        reverseButtons: true,
    });
    return result.isConfirmed;
}

function Drawer({ open, title, description, dirty = false, saving = false, saveLabel = 'Lưu', onClose, onSave, children }: DrawerProps) {
    const requestClose = async () => {
        if (dirty && !(await confirmDiscard())) return;
        onClose();
    };

    useEffect(() => {
        if (!open) return;
        const onKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') void requestClose();
        };
        document.addEventListener('keydown', onKeyDown);
        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.removeEventListener('keydown', onKeyDown);
            document.body.style.overflow = previousOverflow;
        };
    });

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex justify-end" role="dialog" aria-modal="true" aria-label={title}>
            <button type="button" aria-label="Đóng" className="absolute inset-0 bg-slate-900/40" onClick={requestClose} />

            <aside className="relative flex h-full w-full max-w-[460px] flex-col bg-white shadow-2xl" data-testid="drawer">
                <header className="flex items-start justify-between gap-3 border-b border-slate-200 px-5 py-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
                        {description && <p className="mt-0.5 text-xs text-slate-500">{description}</p>}
                    </div>
                    <button type="button" aria-label="Đóng" className="rounded-full p-1.5 text-slate-500 hover:bg-slate-100" onClick={requestClose}>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                            <path d="M6 6l12 12M18 6 6 18" />
                        </svg>
                    </button>
                </header>

                {/* Một cột, cuộn riêng phần nội dung để nút Lưu luôn dính đáy */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <div className="grid gap-4">{children}</div>
                </div>

                <footer className="flex items-center justify-between gap-3 border-t border-slate-200 px-5 py-3">
                    <span className={`text-xs font-medium ${dirty ? 'text-amber-600' : 'text-slate-400'}`}>{dirty ? '● Có thay đổi chưa lưu' : ''}</span>
                    <div className="flex gap-2">
                        <button type="button" className="btn btn-outline-secondary" onClick={requestClose}>
                            Đóng
                        </button>
                        {onSave && (
                            <button type="button" className="btn btn-primary" disabled={saving} onClick={onSave} data-testid="drawer-save">
                                {saving ? 'Đang lưu…' : saveLabel}
                            </button>
                        )}
                    </div>
                </footer>
            </aside>
        </div>,
        document.body,
    );
}

export default Drawer;
