// Chạy: node --test tests/trimStrings.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { notBlank, trimStrings } from "../src/utils/trimStrings.ts";

test("should trim leading and trailing whitespace of every string field", () => {
  const input = { fullName: "  Nguyễn Văn A ", phone: "\t0901234567\n", note: " ghi chú " };

  const result = trimStrings(input);

  assert.deepEqual(result, { fullName: "Nguyễn Văn A", phone: "0901234567", note: "ghi chú" });
});

test("should keep non-string fields untouched and not mutate the input", () => {
  const programIds = [1, 2];
  const input = { title: " A ", isHot: true, yearOfGrad: 2026, programIds, image: undefined };

  const result = trimStrings(input);

  assert.deepEqual(result, { title: "A", isHot: true, yearOfGrad: 2026, programIds, image: undefined });
  assert.equal(input.title, " A ");
});

test("should reject a required field that contains only whitespace", () => {
  const validate = notBlank("Họ tên là bắt buộc");

  assert.equal(validate("   "), "Họ tên là bắt buộc");
  assert.equal(validate(" A "), true);
});
