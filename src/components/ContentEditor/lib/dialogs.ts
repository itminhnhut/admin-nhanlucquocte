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

/** Hỏi kích thước bảng. Trả về null nếu bấm Huỷ. */
export async function askTableSize() {
    const result = await Swal.fire({
        ...BUTTONS,
        title: 'Chèn bảng',
        html:
            '<div style="display:flex;gap:12px;justify-content:center;margin-top:8px">' +
            '<label style="font-size:14px">Số dòng<br><input id="rows" type="number" min="1" max="30" value="3" class="swal2-input" style="width:90px;margin:6px 0 0"></label>' +
            '<label style="font-size:14px">Số cột<br><input id="cols" type="number" min="1" max="10" value="3" class="swal2-input" style="width:90px;margin:6px 0 0"></label>' +
            '</div>',
        focusConfirm: false,
        preConfirm: () => {
            const rows = Number((document.getElementById('rows') as HTMLInputElement)?.value);
            const columns = Number((document.getElementById('cols') as HTMLInputElement)?.value);
            if (!Number.isFinite(rows) || rows < 1 || rows > 30) return Swal.showValidationMessage('Số dòng từ 1 đến 30');
            if (!Number.isFinite(columns) || columns < 1 || columns > 10) return Swal.showValidationMessage('Số cột từ 1 đến 10');
            return { rows: String(rows), columns: String(columns) };
        },
    });
    return result.isConfirmed ? (result.value as { rows: string; columns: string }) : null;
}
