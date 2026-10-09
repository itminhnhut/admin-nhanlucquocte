// Lưu và xoá phiên đăng nhập. Tách riêng khỏi trang để test được và để mọi nơi
// dùng chung một bộ tuỳ chọn cookie, không mỗi chỗ một kiểu.
import Cookies from 'js-cookie';

export const AUTH_TOKEN_KEY = 'auth_token';
export const ADMIN_INFO_KEY = 'admin_info';

/** Hết hạn sau 7 ngày, buộc đăng nhập lại thay vì giữ phiên vô thời hạn */
const EXPIRES_DAYS = 7;

export type AdminInfo = {
    fullName?: string;
    username?: string;
    role?: 'EDITOR' | 'SUPER_ADMIN';
};

/**
 * Cookie chỉ gửi qua HTTPS khi trang chạy HTTPS (localhost vẫn phải dùng được),
 * và `sameSite: strict` để trang khác không kéo theo được cookie này.
 */
export function cookieOptions(isHttps: boolean) {
    return { expires: EXPIRES_DAYS, sameSite: 'strict' as const, secure: isHttps, path: '/' };
}

/**
 * Chỉ giữ 3 trường cần cho thanh trên cùng. Trước đây nhét nguyên object admin
 * từ API vào cookie — gửi kèm mọi request và lộ thêm thứ không cần thiết.
 */
export function pickAdminInfo(admin: unknown): AdminInfo {
    if (!admin || typeof admin !== 'object') return {};
    const { fullName, username, role } = admin as Record<string, unknown>;
    return {
        ...(typeof fullName === 'string' ? { fullName } : {}),
        ...(typeof username === 'string' ? { username } : {}),
        ...(role === 'EDITOR' || role === 'SUPER_ADMIN' ? { role } : {}),
    };
}

/** Câu báo lỗi đúng với nguyên nhân: sai mật khẩu khác hẳn mất mạng hay máy chủ lỗi */
export function loginErrorMessage(error: unknown): string {
    const status = (error as { response?: { status?: number } })?.response?.status;
    if (status === 401 || status === 400) return 'Sai tên đăng nhập hoặc mật khẩu.';
    if (status === 403) return 'Tài khoản này không có quyền vào trang quản trị.';
    if (typeof status === 'number' && status >= 500) return 'Máy chủ đang lỗi. Vui lòng thử lại sau ít phút.';
    return 'Không kết nối được máy chủ. Kiểm tra lại mạng rồi thử lại.';
}

export function saveSession(token: string, admin: unknown, isHttps: boolean) {
    const options = cookieOptions(isHttps);
    Cookies.set(AUTH_TOKEN_KEY, token, options);
    Cookies.set(ADMIN_INFO_KEY, JSON.stringify(pickAdminInfo(admin)), options);
}

export function clearSession() {
    Cookies.remove(AUTH_TOKEN_KEY, { path: '/' });
    Cookies.remove(ADMIN_INFO_KEY, { path: '/' });
}

export function readAdminInfo(): AdminInfo | null {
    const raw = Cookies.get(ADMIN_INFO_KEY);
    if (!raw) return null;
    try {
        return pickAdminInfo(JSON.parse(raw));
    } catch (error) {
        console.warn('Cookie admin_info hỏng, bỏ qua:', error);
        return null;
    }
}
