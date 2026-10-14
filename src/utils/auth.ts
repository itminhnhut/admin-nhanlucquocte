// Lưu và xoá phiên đăng nhập. Tách riêng khỏi trang để test được và để mọi nơi
// dùng chung một bộ tuỳ chọn cookie, không mỗi chỗ một kiểu.
import Cookies from 'js-cookie';
import { rateLimitMessage } from './apiError.ts';

export const AUTH_TOKEN_KEY = 'auth_token';
export const ADMIN_INFO_KEY = 'admin_info';

/**
 * Khớp đúng tuổi của token: API cấp JWT sống 1 ngày và KHÔNG có endpoint làm mới
 * (API_DOCS mục 1). Để cookie 7 ngày thì 6 ngày sau đó người dùng vẫn được cho vào app,
 * rồi request đầu tiên trả 401 và bị đá về trang đăng nhập — trông như "không đăng nhập được".
 */
const EXPIRES_DAYS = 1;

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
    // API chặn 10 lần đăng nhập mỗi phút. Trước đây 429 rơi xuống nhánh cuối và báo
    // "không kết nối được máy chủ" — người dùng đi tìm lỗi mạng thay vì chờ một phút.
    if (status === 429) return rateLimitMessage(error);
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

/** Đọc token đang lưu (chưa kiểm còn sống hay không) */
export function readToken(): string | undefined {
    return Cookies.get(AUTH_TOKEN_KEY);
}

/**
 * Hạn của JWT, đọc từ phần payload. Trả null khi token không đọc được.
 * Chỉ để biết token đã chết hay chưa — KHÔNG phải xác thực; chữ ký vẫn do máy chủ kiểm.
 */
export function tokenExpiry(token: string | undefined): number | null {
    if (!token) return null;
    const payload = token.split('.')[1];
    if (!payload) return null;
    try {
        const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
        return typeof json?.exp === 'number' ? json.exp * 1000 : null;
    } catch {
        return null;
    }
}

/**
 * Phiên còn dùng được không. Chỉ xem cookie có tồn tại là chưa đủ: cookie cũ 7 ngày còn nằm
 * trong máy người dùng vẫn qua được cửa đó, vào app rồi mới bị 401 đá ra.
 * Token đã chết → xoá luôn cho sạch, để lần sau vào thẳng trang đăng nhập.
 */
export function isSessionAlive(now: number = Date.now()): boolean {
    const token = readToken();
    if (!token) return false;
    const expiry = tokenExpiry(token);
    if (expiry === null) return true; // không đọc được hạn → để máy chủ phán xử
    if (expiry > now) return true;
    clearSession();
    return false;
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
