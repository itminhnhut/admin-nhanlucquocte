// Chạy: node --test tests/programPayload.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { buildProgramPayload, isEmptyContent, stripBase64Images } from "../src/pages/Programs/CRUD/payload.ts";

test("should build the payload with a slug generated from the Vietnamese title", () => {
  const values = { title: "  Chuyên ngành Điều dưỡng hệ Trung cấp ", description: " Khai giảng 16/03 ", image: " /img/a.webp ", active: true };

  const payload = buildProgramPayload(values, "<p>Nội dung</p>");

  assert.deepEqual(payload, {
    title: "Chuyên ngành Điều dưỡng hệ Trung cấp",
    slug: "chuyen-nganh-dieu-duong-he-trung-cap",
    description: "Khai giảng 16/03",
    image: "/img/a.webp",
    content: "<p>Nội dung</p>",
    active: true,
  });
});

test("should default description and image to empty strings when not filled", () => {
  const payload = buildProgramPayload({ title: "Dược sĩ", active: false }, "");

  assert.equal(payload.description, "");
  assert.equal(payload.image, "");
  assert.equal(payload.active, false);
});

test("should drop base64 images pasted into the content", () => {
  const html = '<p>Trước</p><img src="data:image/png;base64,AAAA" alt="dán"><p>Sau</p>';

  assert.equal(stripBase64Images(html), "<p>Trước</p><p>Sau</p>");
});

test("should keep images that were uploaded to the server", () => {
  const html = '<p>A</p><img src="https://api.example.com/upload/a.webp"><p>B</p>';

  assert.equal(stripBase64Images(html), html);
});

test("should treat content with only empty tags as not written yet", () => {
  assert.equal(isEmptyContent(""), true);
  assert.equal(isEmptyContent("<p><br></p>"), true);
  assert.equal(isEmptyContent("<p>&nbsp;</p>"), true);
  assert.equal(isEmptyContent("<p>Có chữ</p>"), false);
});
