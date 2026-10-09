// Cắt khoảng trắng đầu/cuối mọi field string trong payload trước khi gửi API (không mutate object gốc)
export const trimStrings = <T extends object>(payload: T): T =>
    Object.fromEntries(Object.entries(payload).map(([key, value]) => [key, typeof value === 'string' ? value.trim() : value])) as T;

// Dùng cho `validate` của react-hook-form: chặn field bắt buộc chỉ gồm khoảng trắng
export const notBlank =
    (message: string) =>
    (value: unknown): true | string =>
        typeof value === 'string' && value.trim() === '' ? message : true;
