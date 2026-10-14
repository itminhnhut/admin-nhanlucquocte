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

test("should show the wait message even though the server sends its own English one", () => {
    // Mọi lỗi của API đều kèm `message` (API_DOCS mục 1). Của 429 là tiếng Anh:
    //   {"message":"Too many requests, please try again later","errorCode":"UNKNOWN_ERROR"}
    // Nhánh lấy message của server chạy trước thì người dùng không bao giờ thấy câu hướng dẫn.
    const thatMessage = {
        response: {
            status: 429,
            data: { message: "Too many requests, please try again later", errorCode: "UNKNOWN_ERROR" },
            headers: { "retry-after": "48" },
        },
    };
    assert.match(apiErrorMessage(thatMessage), /chờ 48 giây/);
    assert.doesNotMatch(apiErrorMessage(thatMessage), /Too many requests/);
});

test("should still say to wait when the browser cannot read Retry-After", () => {
    // Retry-After không nằm trong danh sách header CORS cho đọc sẵn, và API chưa khai
    // Access-Control-Expose-Headers → trang admin ở tên miền khác KHÔNG thấy header này.
    // Nên câu mặc định (không số giây) là câu người dùng thực sự nhìn thấy.
    const khongDocDuoc = {
        response: { status: 429, data: { message: "Too many requests, please try again later" }, headers: {} },
    };
    const msg = apiErrorMessage(khongDocDuoc);
    assert.match(msg, /quá nhiều lần/);
    assert.match(msg, /một phút/);
    assert.doesNotMatch(msg, /mạng/, "không được quy cho lỗi mạng");
});

test("should still prefer the server message for errors that are not rate limits", () => {
    const cu = { response: { status: 400, data: { message: "Slug đã tồn tại" } } };
    assert.equal(apiErrorMessage(cu), "Slug đã tồn tại");
});
