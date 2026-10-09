// Chạy: node --test tests/formatDate.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { formatDate, formatDateTime } from "../src/utils/formatDate.ts";

test("should show an ISO date from the API as dd/mm/yyyy", () => {
  assert.equal(formatDate("2024-09-25T00:00:00.000Z"), "25/09/2024");
  assert.equal(formatDate("2024-09-25"), "25/09/2024");
});

test("should read a date typed without separators", () => {
  assert.equal(formatDate("25092024"), "25/09/2024", "ddmmyyyy nhập tay");
  assert.equal(formatDate("20240925"), "25/09/2024", "yyyymmdd");
});

test("should never show 'Invalid Date' to the user", () => {
  assert.equal(formatDate("khong phai ngay"), "—");
  assert.equal(formatDate(""), "—");
  assert.equal(formatDate(null), "—");
  assert.equal(formatDate(undefined), "—");
});

test("should let the caller choose what to show when the date is missing", () => {
  assert.equal(formatDate(null, "chưa có"), "chưa có");
});

test("should add the time when asked", () => {
  const value = new Date(2024, 8, 25, 14, 5);

  assert.equal(formatDateTime(value), "25/09/2024 14:05");
});
