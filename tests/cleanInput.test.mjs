// Chạy: node --test tests/cleanInput.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { cleanCode, cleanPayload, cleanText, notBlank } from "../src/utils/cleanInput.ts";

test("should strip the invisible characters that come from pasting", () => {
  assert.equal(cleanCode("HV001​"), "HV001", "ký tự rộng bằng 0 từ web");
  assert.equal(cleanCode("HV001﻿"), "HV001", "dấu thứ tự byte");
  assert.equal(cleanCode("HV001 "), "HV001", "khoảng trắng không ngắt từ Word");
});

test("should remove every space inside a code, not just at the ends", () => {
  assert.equal(cleanCode(" 079 123 456 789 "), "079123456789", "CCCD dán từ bảng");
  assert.equal(cleanCode("0901 234 567"), "0901234567", "điện thoại gõ cách nhóm");
  assert.equal(cleanCode(" hoa.nt@truong.vn "), "hoa.nt@truong.vn");
});

test("should collapse repeated spaces inside a name but keep single ones", () => {
  assert.equal(cleanText("Nguyễn  Văn   An"), "Nguyễn Văn An");
  assert.equal(cleanText("  Lễ khai giảng  khoá 32 \n"), "Lễ khai giảng khoá 32");
});

test("should clean codes and text differently in the same payload", () => {
  const typed = { fullName: "Nguyễn  Văn An ", studentCode: " HV 001 ", phone: "0901 234 567", note: "  ghi chú  dài ", yearOfGrad: 2026, active: true };

  assert.deepEqual(cleanPayload(typed), {
    fullName: "Nguyễn Văn An",
    studentCode: "HV001",
    phone: "0901234567",
    note: "ghi chú dài",
    yearOfGrad: 2026,
    active: true,
  });
});

test("should not touch values that are not text", () => {
  const programIds = [1, 2];
  const payload = { programIds, isHot: false, image: undefined, count: 0 };

  assert.deepEqual(cleanPayload(payload), { programIds, isHot: false, image: undefined, count: 0 });
});

test("should reject a required field that holds only invisible characters", () => {
  assert.equal(notBlank("Bắt buộc")("   "), "Bắt buộc");
  assert.equal(notBlank("Bắt buộc")("​ "), "Bắt buộc");
  assert.equal(notBlank("Bắt buộc")("A"), true);
});
