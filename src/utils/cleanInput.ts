// Làm sạch dữ liệu người dùng nhập trước khi gửi API.
//
// `trim()` của JavaScript chỉ cắt khoảng trắng hai đầu. Thực tế nhân viên hay
// dán từ Excel, Word hoặc web nên dữ liệu còn dính:
//   - khoảng trắng không ngắt (U+00A0) từ Word
//   - ký tự rộng bằng 0 (U+200B, U+FEFF) từ trang web
//   - khoảng trắng kép ở giữa do gõ nhầm
//   - mã số, số điện thoại, CCCD bị gõ cách theo nhóm: "079 123 456 789"
// Những thứ này lọt xuống database sẽ làm tra cứu không ra, trùng lặp bản ghi.

/** Ký tự vô hình: rộng bằng 0, nối từ, dấu thứ tự byte */
const INVISIBLE = /[​-‍﻿⁠]/g;

/** Mọi loại khoảng trắng, kể cả khoảng trắng không ngắt và khoảng trắng Á Đông */
const ANY_SPACE = /[\s 　]+/g;

/** Chữ thường: bỏ ký tự vô hình, gộp khoảng trắng liên tiếp thành một, cắt hai đầu */
export function cleanText(value: string): string {
    return value.replace(INVISIBLE, '').replace(ANY_SPACE, ' ').trim();
}

/** Mã số, số điện thoại, CCCD, email: BỎ HẾT khoảng trắng kể cả ở giữa */
export function cleanCode(value: string): string {
    return value.replace(INVISIBLE, '').replace(ANY_SPACE, '');
}

/** Trường nào là mã số thì bỏ sạch khoảng trắng, còn lại chỉ gộp */
const CODE_FIELDS = new Set(['studentCode', 'cccd', 'phone', 'email', 'username', 'degreeNumber', 'slug', 'code', 'identityNumber']);

/**
 * Làm sạch cả object trước khi gửi API. Không sửa object gốc.
 * Trường nằm trong CODE_FIELDS được bỏ sạch khoảng trắng, trường chữ thì gộp lại.
 */
export function cleanPayload<T extends object>(payload: T): T {
    return Object.fromEntries(
        Object.entries(payload).map(([key, value]) => {
            if (typeof value !== 'string') return [key, value];
            return [key, CODE_FIELDS.has(key) ? cleanCode(value) : cleanText(value)];
        }),
    ) as T;
}

/** Dùng cho `validate` của react-hook-form: chặn ô bắt buộc chỉ toàn khoảng trắng */
export const notBlank =
    (message: string) =>
    (value: unknown): true | string =>
        typeof value === 'string' && cleanText(value) === '' ? message : true;
