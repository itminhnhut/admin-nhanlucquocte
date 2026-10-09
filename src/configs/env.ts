/**
 * Runtime Environment Configuration
 *
 * Để thay đổi env mà KHÔNG cần rebuild image trong EasyPanel,
 * ta đọc window.__ENV__ được inject từ /env-config.js khi container khởi động.
 *
 * Thứ tự ưu tiên:
 *   1. window.__ENV__  (runtime inject - EasyPanel env vars)
 *   2. import.meta.env (fallback - build-time local dev)
 */

declare global {
  interface Window {
    __ENV__?: Record<string, string>;
  }
}

function getEnv(key: string, defaultValue = ""): string {
  // 1. Runtime env (inject bởi Docker script)
  if (typeof window !== "undefined" && window.__ENV__?.[key]) {
    return window.__ENV__[key];
  }
  // 2. Build-time env (local dev)
  // @ts-ignore
  const viteEnv = import.meta.env?.[key];
  if (viteEnv) return viteEnv;

  return defaultValue;
}

/** Base URL của API Backend */
// Để trống chủ ý: chưa có backend của trường. Thiếu env → request lỗi rõ ràng,
// KHÔNG được mặc định trỏ sang API của trường khác (sẽ sửa dữ liệu thật của họ).
export const API_URL = getEnv("VITE_API_URL");

/** Public URL của Admin App */
export const APP_URL = getEnv("VITE_APP_URL", "https://admin.trungcapnhanlucquocte.vn");

/** Link báo web landing tạo lại sitemap.xml (để trống → không gọi) */
export const SITEMAP_REFRESH_URL = getEnv("VITE_SITEMAP_REFRESH_URL");

export const runtimeEnv = {
  API_URL,
  APP_URL,
  SITEMAP_REFRESH_URL,
} as const;

export default runtimeEnv;
