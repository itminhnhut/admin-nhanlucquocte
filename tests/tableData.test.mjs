// Chạy: node --test tests/tableData.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { clampPage, pageCount, paginate, rangeLabel, sortRows } from "../src/components/table/tableData.ts";

const rows = [
  { id: 3, title: "Điều dưỡng", active: true },
  { id: 1, title: "Ẩm thực", active: false },
  { id: 2, title: "dược sĩ", active: true },
];

test("should sort Vietnamese titles in dictionary order, ignoring case and accents", () => {
  const sorted = sortRows(rows, { key: "title", direction: "asc" }).map((r) => r.title);

  assert.deepEqual(sorted, ["Ẩm thực", "dược sĩ", "Điều dưỡng"]);
});

test("should sort numbers as numbers, not as text", () => {
  const many = [{ id: 10 }, { id: 9 }, { id: 100 }];

  assert.deepEqual(sortRows(many, { key: "id", direction: "asc" }).map((r) => r.id), [9, 10, 100]);
});

test("should push empty values to the end whichever direction is picked", () => {
  const withGaps = [{ note: "b" }, { note: "" }, { note: "a" }, { note: null }];

  assert.deepEqual(sortRows(withGaps, { key: "note", direction: "asc" }).map((r) => r.note), ["a", "b", "", null]);
});

test("should not mutate the array it was given", () => {
  const original = [...rows];

  sortRows(rows, { key: "id", direction: "desc" });

  assert.deepEqual(rows, original);
});

test("should cut the list into pages", () => {
  const list = [1, 2, 3, 4, 5, 6, 7];

  assert.deepEqual(paginate(list, 1, 3), [1, 2, 3]);
  assert.deepEqual(paginate(list, 3, 3), [7]);
  assert.equal(pageCount(7, 3), 3);
});

test("should fall back to the last page when the current page no longer exists", () => {
  assert.equal(clampPage(9, 7, 3), 3, "lọc xong còn ít dòng thì không được để trang trắng");
  assert.deepEqual(paginate([1, 2, 3, 4], 99, 2), [3, 4]);
  assert.equal(clampPage(0, 7, 3), 1);
});

test("should describe the visible range in Vietnamese", () => {
  assert.equal(rangeLabel(1, 30, 86, "ngành"), "Hiện 1–30 trong 86 ngành");
  assert.equal(rangeLabel(3, 30, 86, "ngành"), "Hiện 61–86 trong 86 ngành");
  assert.equal(rangeLabel(1, 30, 0, "ngành"), "Không có ngành nào");
});
