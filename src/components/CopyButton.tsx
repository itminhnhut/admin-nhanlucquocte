// Nút chép một giá trị. Tách riêng để dùng được trong ô bảng nhiều dòng mà
// không kéo theo bố cục của TextWithCopy.
import { useState } from 'react';

function CopyButton({ value, label }: { value: string; label?: string }) {
    const [copied, setCopied] = useState(false);

    const copy = async () => {
        try {
            if (navigator.clipboard?.writeText) {
                await navigator.clipboard.writeText(value);
            } else {
                // Trình duyệt cũ hoặc trang chạy http: không có clipboard API
                const textarea = document.createElement('textarea');
                textarea.value = value;
                textarea.style.cssText = 'position:fixed;opacity:0';
                document.body.appendChild(textarea);
                textarea.select();
                document.execCommand('copy');
                document.body.removeChild(textarea);
            }
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
        } catch (error) {
            console.error('Không chép được:', error);
        }
    };

    return (
        <button
            type="button"
            onClick={copy}
            title={copied ? 'Đã chép' : `Chép ${label ?? 'giá trị này'}`}
            aria-label={copied ? 'Đã chép' : `Chép ${label ?? 'giá trị này'}`}
            className={`shrink-0 rounded p-0.5 transition-colors ${copied ? 'text-emerald-600' : 'text-slate-300 hover:text-primary'}`}
        >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {copied ? <path d="m4.5 12.75 6 6 9-13.5" /> : <path d="M8 16H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6a2 2 0 0 1 2 2v2m-4 12h6a2 2 0 0 0 2-2v-6a2 2 0 0 0-2-2h-6a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2z" />}
            </svg>
        </button>
    );
}

export default CopyButton;
