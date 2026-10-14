// Chạy: node --test tests/auth.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { cookieOptions, loginErrorMessage, pickAdminInfo, tokenExpiry } from "../src/utils/auth.ts";

test("should mark the cookie secure only when the page itself runs on https", () => {
  assert.equal(cookieOptions(true).secure, true);
  assert.equal(cookieOptions(false).secure, false, "localhost chạy http vẫn phải đăng nhập được");
});

test("should lock the cookie to this site and expire it with the token", () => {
  const options = cookieOptions(true);

  assert.equal(options.sameSite, "strict");
  // API cấp JWT sống 1 ngày, không có endpoint làm mới → cookie không được sống lâu hơn
  assert.equal(options.expires, 1);
  assert.equal(options.path, "/");
});

test("should keep only the three fields the header needs", () => {
  const fromApi = { id: 3, fullName: "Nguyễn Thị Hoa", username: "hoa.nt", role: "EDITOR", passwordHash: "$2b$10$abc", email: "hoa@truong.vn" };

  assert.deepEqual(pickAdminInfo(fromApi), { fullName: "Nguyễn Thị Hoa", username: "hoa.nt", role: "EDITOR" });
});

test("should drop fields of the wrong shape instead of trusting the API blindly", () => {
  assert.deepEqual(pickAdminInfo({ fullName: 123, role: "SUPERUSER" }), {});
  assert.deepEqual(pickAdminInfo(null), {});
  assert.deepEqual(pickAdminInfo("chuỗi lạ"), {});
});

test("should tell wrong password apart from a network or server failure", () => {
  assert.match(loginErrorMessage({ response: { status: 401 } }), /Sai tên đăng nhập/);
  assert.match(loginErrorMessage({ response: { status: 403 } }), /không có quyền/);
  assert.match(loginErrorMessage({ response: { status: 500 } }), /Máy chủ đang lỗi/);
  assert.match(loginErrorMessage(new Error("Network Error")), /Không kết nối được/);
});

// ── Phiên chết thì phải bị coi là chưa đăng nhập ──────────────────────────────
// API cấp JWT sống 1 ngày và không có endpoint làm mới (API_DOCS mục 1). Trước đây cookie giữ
// 7 ngày và lớp canh route chỉ kiểm "cookie có tồn tại", nên 6 ngày sau khi đăng nhập người
// dùng vẫn vào được app rồi mới bị 401 đá ra.
const jwt = (payload) => {
    const b64 = (o) => Buffer.from(JSON.stringify(o)).toString('base64url');
    return `${b64({ alg: 'HS256', typ: 'JWT' })}.${b64(payload)}.chu_ky`;
};

test('should read the expiry out of a token', () => {
    assert.equal(tokenExpiry(jwt({ exp: 1_800_000_000 })), 1_800_000_000_000);
});

test('should report no expiry for a token it cannot read', () => {
    assert.equal(tokenExpiry(undefined), null);
    assert.equal(tokenExpiry(''), null);
    assert.equal(tokenExpiry('khong-phai-jwt'), null);
    assert.equal(tokenExpiry('a.khong-phai-base64-json.c'), null);
    assert.equal(tokenExpiry(jwt({ sub: '1' })), null, 'thiếu exp');
});

test('should keep the cookie no longer than the token itself lives', () => {
    // Token sống 1 ngày; cookie giữ lâu hơn là tự tạo ra khoảng thời gian "đăng nhập giả"
    const source = readFileSync(new URL('../src/utils/auth.ts', import.meta.url), 'utf8');
    assert.match(source, /const EXPIRES_DAYS = 1;/);
});

test('should check the token expiry in the route guard, not just that a cookie exists', () => {
    const source = readFileSync(new URL('../src/router/index.tsx', import.meta.url), 'utf8');
    assert.match(source, /isSessionAlive\(\)/);
    assert.doesNotMatch(source, /Cookies\.get\(AUTH_TOKEN_KEY\)/, 'vẫn chỉ kiểm cookie tồn tại');
});
