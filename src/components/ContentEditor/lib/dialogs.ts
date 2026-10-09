// Hộp thoại nhập liệu cho editor. Thay window.prompt của trình duyệt (không nhãn, không
// hướng dẫn, không báo lỗi rõ) bằng hộp thoại có tiêu đề, gợi ý và kiểm tra dữ liệu.
import Swal from 'sweetalert2';
import { isSafeHttpUrl } from './html';

type AskOptions = {
    title: string;
    /** Dòng hướng dẫn hiện dưới tiêu đề */
    help?: string;
    initial?: string;
    placeholder?: string;
};

const BUTTONS = {
    confirmButtonText: 'Xong',
    cancelButtonText: 'Huỷ',
    showCancelButton: true,
    reverseButtons: true,
    confirmButtonColor: '#4361ee',
} as const;

/** Nhập một đoạn chữ ngắn. Trả về null nếu người dùng bấm Huỷ. */
export async function askText({ title, help, initial = '', placeholder }: AskOptions) {
    const result = await Swal.fire({
        ...BUTTONS,
        title,
        text: help,
        input: 'text',
        inputValue: initial,
        inputPlaceholder: placeholder,
        inputAttributes: { autocapitalize: 'off', autocomplete: 'off' },
    });
    return result.isConfirmed ? String(result.value ?? '').trim() : null;
}

/** Nhập một URL http/https. Sai định dạng thì báo ngay trong hộp thoại, không đóng. */
export async function askUrl({ title, help, initial = '', placeholder = 'https://' }: AskOptions) {
    const result = await Swal.fire({
        ...BUTTONS,
        title,
        text: help,
        input: 'url',
        inputValue: initial,
        inputPlaceholder: placeholder,
        inputAttributes: { autocapitalize: 'off', autocomplete: 'off' },
        inputValidator: (value) => {
            const url = String(value ?? '').trim();
            if (!url) return 'Bạn chưa nhập đường dẫn.';
            if (!isSafeHttpUrl(url)) return 'Đường dẫn phải bắt đầu bằng http:// hoặc https://';
            return null;
        },
    });
    return result.isConfirmed ? String(result.value ?? '').trim() : null;
}
