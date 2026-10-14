// Lấy câu thông báo lỗi từ phản hồi API. Trước đây mỗi chỗ tự viết
// cách lấy câu lỗi riêng và phải khai catch với kiểu any.
// Gom lại một chỗ để câu chữ thống nhất và không cần dùng kiểu any.

type ApiErrorShape = {
    response?: {
        status?: number;
        data?: { message?: string; error?: string };
        headers?: Record<string, unknown>;
    };
    message?: string;
};

/**
 * API chặn theo IP mỗi phút (API_DOCS mục 6: đăng nhập 10, tra cứu công khai 30, gửi tư vấn 10)
 * và trả kèm header `Retry-After` tính bằng giây. Nói rõ phải chờ bao lâu, vì "thử lại sau"
 * khiến người dùng bấm liên tục và càng bị chặn lâu hơn.
 */
export function retryAfterSeconds(error: unknown): number | null {
    const raw = (error as ApiErrorShape)?.response?.headers?.['retry-after'];
    const seconds = Number(Array.isArray(raw) ? raw[0] : raw);
    return Number.isFinite(seconds) && seconds > 0 ? Math.ceil(seconds) : null;
}

/** Câu chờ, có số giây nếu máy chủ nói, không thì nói chung chung */
export function rateLimitMessage(error: unknown): string {
    const seconds = retryAfterSeconds(error);
    return seconds
        ? `Bạn thử quá nhiều lần. Vui lòng chờ ${seconds} giây rồi thử lại.`
        : 'Bạn thử quá nhiều lần. Vui lòng chờ khoảng một phút rồi thử lại.';
}

/**
 * Ưu tiên câu do máy chủ trả về. Không có thì đoán theo mã lỗi, vì "Có lỗi xảy ra"
 * không giúp người dùng biết nên làm gì tiếp.
 */
export function apiErrorMessage(error: unknown, fallback = 'Có lỗi xảy ra. Vui lòng thử lại.'): string {
    const typed = error as ApiErrorShape;
    const fromServer = typed?.response?.data?.message || typed?.response?.data?.error;
    if (typeof fromServer === 'string' && fromServer.trim()) return fromServer;

    const status = typed?.response?.status;
    if (status === 429) return rateLimitMessage(error);
    if (status === 400) return 'Dữ liệu gửi lên chưa hợp lệ. Kiểm tra lại các ô đã nhập.';
    if (status === 401) return 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.';
    if (status === 403) return 'Tài khoản của bạn không có quyền làm việc này.';
    if (status === 404) return 'Không tìm thấy dữ liệu. Có thể ai đó vừa xoá nó.';
    if (status === 409) return 'Dữ liệu này đã tồn tại. Kiểm tra lại mã số hoặc tên.';
    if (typeof status === 'number' && status >= 500) return 'Máy chủ đang lỗi. Vui lòng thử lại sau ít phút.';
    if (status === undefined) return 'Không kết nối được máy chủ. Kiểm tra lại mạng rồi thử lại.';
    return fallback;
}
