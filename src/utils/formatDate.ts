// Hiển thị ngày theo kiểu Việt Nam: dd/mm/yyyy.
// Trước đây 8 trang mỗi trang tự viết một hàm riêng, nên chỗ ra "25/09/2024",
// chỗ ra "25092024", chỗ ra "Invalid Date".
//
// Dữ liệu từ API có thể ở nhiều dạng: ISO ("2024-09-25T00:00:00Z"), chỉ ngày
// ("2024-09-25"), hoặc dính liền 8 số ("25092024") do nhập tay.

const EIGHT_DIGITS = /^(\d{8})$/;

function pad(value: number) {
    return String(value).padStart(2, '0');
}

/**
 * Trả về dd/mm/yyyy, hoặc dấu gạch khi không đọc được.
 * Không bao giờ trả "Invalid Date" ra màn hình cho người dùng.
 */
export function formatDate(value?: string | number | Date | null, fallback = '—'): string {
    if (value === null || value === undefined || value === '') return fallback;

    if (typeof value === 'string' && EIGHT_DIGITS.test(value.trim())) {
        const digits = value.trim();
        // 8 số dính liền có thể là ddmmyyyy hay yyyymmdd. Phân biệt bằng cách
        // xem 4 số đầu có giống một năm không, rồi kiểm tháng/ngày cho hợp lệ.
        const head = Number(digits.slice(0, 4));
        if (head >= 1900 && head <= 2100 && Number(digits.slice(4, 6)) <= 12 && Number(digits.slice(6, 8)) <= 31) {
            return `${digits.slice(6, 8)}/${digits.slice(4, 6)}/${digits.slice(0, 4)}`;
        }
        if (Number(digits.slice(0, 2)) <= 31 && Number(digits.slice(2, 4)) <= 12) {
            return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`;
        }
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return fallback;
    return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/** Ngày kèm giờ, dùng cho mốc thời gian như "Cập nhật lần cuối" */
export function formatDateTime(value?: string | number | Date | null, fallback = '—'): string {
    if (value === null || value === undefined || value === '') return fallback;
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return formatDate(value, fallback);
    return `${formatDate(date)} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Trường "năm tốt nghiệp" trong dữ liệu của trường không đồng nhất: có dòng chỉ
 * ghi năm (2026), có dòng ghi nguyên ngày dính liền (25092024), và có dòng sai
 * hẳn (1703206 — 7 số). Hàm này hiển thị đúng từng dạng và KHÔNG tự đoán với
 * dữ liệu sai, vì đoán sai còn tệ hơn hiện thô.
 */
export function formatGradYear(value?: string | number | null, fallback = '—'): string {
    if (value === null || value === undefined || value === '') return fallback;
    const text = String(value).trim();
    if (/^\d{4}$/.test(text)) return text;
    if (/^\d{8}$/.test(text)) return formatDate(text, text);
    return text;
}

/** Giá trị năm tốt nghiệp không đúng dạng năm cũng không đúng dạng ngày */
export function isOddGradYear(value?: string | number | null): boolean {
    if (value === null || value === undefined || value === '') return false;
    const text = String(value).trim();
    return !/^\d{4}$/.test(text) && !/^\d{8}$/.test(text);
}
