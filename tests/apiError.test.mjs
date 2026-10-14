// Chạy: node --test tests/apiError.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { apiErrorMessage, retryAfterSeconds } from "../src/utils/apiError.ts";
import { loginErrorMessage } from "../src/utils/auth.ts";

test("should prefer the message the server sent", () => {
  const error = { response: { status: 400, data: { message: "Mã học viên đã tồn tại" } } };

  assert.equal(apiErrorMessage(error), "Mã học viên đã tồn tại");
});

test("should explain what to do when the server sends no message", () => {
  assert.match(apiErrorMessage({ response: { status: 401 } }), /đăng nhập lại/);
  assert.match(apiErrorMessage({ response: { status: 403 } }), /không có quyền/);
  assert.match(apiErrorMessage({ response: { status: 404 } }), /vừa xoá/);
  assert.match(apiErrorMessage({ response: { status: 409 } }), /đã tồn tại/);
  assert.match(apiErrorMessage({ response: { status: 503 } }), /Máy chủ đang lỗi/);
});

test("should tell a network failure apart from a server error", () => {
  assert.match(apiErrorMessage(new Error("Network Error")), /Không kết nối được máy chủ/);
});

test("should ignore an empty message from the server", () => {
  assert.match(apiErrorMessage({ response: { status: 500, data: { message: "   " } } }), /Máy chủ đang lỗi/);
});

// ── Bị chặn vì thử nhiều lần phải nói đúng là chờ, không phải "mất mạng" ──────
// API chặn theo IP mỗi phút (API_DOCS mục 6) và trả kèm header Retry-After tính bằng giây.
const chan = (seconds) => ({
    response: { status: 429, headers: seconds === null ? {} : { 'retry-after': String(seconds) } },
});

test('should tell the user how many seconds to wait when the server says so', () => {
    assert.match(apiErrorMessage(chan(42)), /chờ 42 giây/);
    assert.equal(retryAfterSeconds(chan(42)), 42);
});

test('should still say to wait when the server sends no Retry-After', () => {
    assert.match(apiErrorMessage(chan(null)), /quá nhiều lần/);
    assert.doesNotMatch(apiErrorMessage(chan(null)), /mạng/, 'không được quy cho lỗi mạng');
    assert.equal(retryAfterSeconds(chan(null)), null);
});

test('should not blame the network for a rate limit on the login form', () => {
    assert.match(loginErrorMessage(chan(30)), /chờ 30 giây/);
    assert.doesNotMatch(loginErrorMessage(chan(30)), /Kiểm tra lại mạng/);
    // Sai mật khẩu vẫn phải báo đúng là sai mật khẩu
    assert.match(loginErrorMessage({ response: { status: 401 } }), /Sai tên đăng nhập/);
});

test('should ignore a Retry-After value that makes no sense', () => {
    assert.equal(retryAfterSeconds({ response: { status: 429, headers: { 'retry-after': 'sau' } } }), null);
    assert.equal(retryAfterSeconds({ response: { status: 429, headers: { 'retry-after': '-5' } } }), null);
    assert.equal(retryAfterSeconds(undefined), null);
});
