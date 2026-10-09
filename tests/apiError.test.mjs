// Chạy: node --test tests/apiError.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { apiErrorMessage } from "../src/utils/apiError.ts";

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
