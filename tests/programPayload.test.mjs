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

test("should leave the image out entirely when none was chosen", () => {
  // API khai image là uri và từ chối CẢ chuỗi rỗng lẫn null:
  //   "image": ""   → 400 {"message":"Invalid URL"}
  //   "image": null → 400 {"message":"Invalid input: expected string, received null"}
  //   bỏ hẳn trường → 201, lưu thành null
  // Gửi "" như trước là không tạo được ngành nào thiếu ảnh.
  const payload = buildProgramPayload({ title: "Dược sĩ", active: false }, "");

  assert.ok(!("image" in payload), "không được gửi image khi chưa chọn ảnh");
  assert.equal(payload.description, "");
  assert.equal(payload.active, false);
});

test("should keep the existing slug when editing, so public links do not break", () => {
  // slug nằm trong URL công khai. Tính lại theo tiêu đề thì sửa tiêu đề là đổi URL, mọi liên kết
  // cũ và kết quả Google trỏ vào trang đó thành 404.
  const edited = buildProgramPayload({ title: "Dược sĩ hệ trung cấp", active: true }, "<p>x</p>", "duoc-si");
  assert.equal(edited.slug, "duoc-si");

  // Thêm mới thì vẫn tự sinh slug từ tiêu đề
  const created = buildProgramPayload({ title: "Dược sĩ", active: true }, "<p>x</p>");
  assert.equal(created.slug, "duoc-si");
});

test("should send the image when one was chosen", () => {
  const payload = buildProgramPayload(
    { title: "Dược sĩ", active: true, image: " https://cdn.truong.vn/a.png " },
    "<p>x</p>"
  );
  assert.equal(payload.image, "https://cdn.truong.vn/a.png");
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

// ── Xoá ảnh bìa phải thật sự xoá ─────────────────────────────────────────────
// API nhận cả null và "" cho "không có ảnh" (thử PUT vào id không tồn tại: qua lớp kiểm).
// PUT là cập nhật một phần, nên bỏ hẳn trường `image` khi sửa = API GIỮ ảnh cũ, mà giao diện
// vẫn báo "Cập nhật thành công" — người dùng bấm "Xoá ảnh" mãi không được.
test("should send image null when an existing cover is cleared", () => {
    const payload = buildProgramPayload({ title: "Điều dưỡng", image: "", active: true }, "<p>x</p>", "dieu-duong-he-trung-cap");

    assert.ok("image" in payload, "sửa mà bỏ hẳn trường image thì API giữ ảnh cũ");
    assert.equal(payload.image, null);
    assert.equal(payload.slug, "dieu-duong-he-trung-cap", "slug phải giữ nguyên khi sửa");
});

test("should keep the cover when editing without touching it", () => {
    const url = "https://truongdaynghe-rustfs.x2ldh2.easypanel.host/cdn/uploads/a.jpg";
    const payload = buildProgramPayload({ title: "Điều dưỡng", image: url, active: true }, "<p>x</p>", "dieu-duong-he-trung-cap");

    assert.equal(payload.image, url);
});

test("should omit image entirely when creating without a cover", () => {
    const payload = buildProgramPayload({ title: "Ngành mới", image: "", active: true }, "<p>x</p>");

    assert.ok(!("image" in payload), "tạo mới không có ảnh thì payload nên gọn, không gửi null");
    assert.equal(payload.slug, "nganh-moi");
});
