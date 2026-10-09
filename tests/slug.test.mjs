// Chạy: node --test tests/slug.test.mjs (Node ≥ 22.6 tự bỏ type khi import file .ts)
import test from "node:test";
import assert from "node:assert/strict";
import { createSlugFromTitle } from "../src/utils/slug.ts";

test("should keep the letter đ/Đ as d in slugs", () => {
  assert.equal(createSlugFromTitle("TUYỂN SINH NGÀNH CHĂM SÓC SẮC ĐẸP"), "tuyen-sinh-nganh-cham-soc-sac-dep");
  assert.equal(createSlugFromTitle("TUYỂN SINH NGÀNH ĐIỀU DƯỠNG"), "tuyen-sinh-nganh-dieu-duong");
  assert.equal(createSlugFromTitle("Đào tạo đầu bếp"), "dao-tao-dau-bep");
});

test("should strip Vietnamese accents and special characters", () => {
  assert.equal(createSlugFromTitle("  Kế toán  doanh nghiệp (2026)! "), "ke-toan-doanh-nghiep-2026");
});

test("should treat look-alike Ð (eth) as d", () => {
  assert.equal(createSlugFromTitle("Ðiều dưỡng"), "dieu-duong");
  assert.equal(createSlugFromTitle("ðiều dưỡng"), "dieu-duong");
});

test("should separate words joined by punctuation instead of merging them", () => {
  assert.equal(createSlugFromTitle("Quản trị khách sạn/nhà hàng"), "quan-tri-khach-san-nha-hang");
  assert.equal(createSlugFromTitle("Tin học văn phòng 2.0"), "tin-hoc-van-phong-2-0");
  assert.equal(createSlugFromTitle("Kế toán_tài chính"), "ke-toan-tai-chinh");
});

test("should not leave leading or trailing hyphens", () => {
  assert.equal(createSlugFromTitle("Kế toán !"), "ke-toan");
  assert.equal(createSlugFromTitle("Điều dưỡng - "), "dieu-duong");
  assert.equal(createSlugFromTitle("- Du lịch -"), "du-lich");
});
