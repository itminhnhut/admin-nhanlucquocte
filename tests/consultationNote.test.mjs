// Chạy: node --test tests/consultationNote.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import { splitConsultationNote } from "../src/utils/consultationNote.ts";

const CONSENT = "[Đồng ý Chính sách bảo vệ dữ liệu cá nhân phiên bản 2026-09-24, lúc 2026-10-08T14:16:58.480Z]";

test("should take the consent stamp out of what the visitor actually wrote", () => {
  const result = splitConsultationNote(`Em muốn hỏi học phí ngành điều dưỡng. ${CONSENT}`);

  assert.equal(result.note, "Em muốn hỏi học phí ngành điều dưỡng.");
  assert.equal(result.hasConsent, true);
  assert.equal(result.consentVersion, "2026-09-24");
  assert.equal(result.consentAt, "2026-10-08T14:16:58.480Z");
});

test("should report an empty note when the visitor wrote nothing but consented", () => {
  const result = splitConsultationNote(CONSENT);

  assert.equal(result.note, "");
  assert.equal(result.hasConsent, true);
});

test("should leave a plain note untouched", () => {
  const result = splitConsultationNote("  Gọi lại sau 17h  ");

  assert.deepEqual(result, { note: "Gọi lại sau 17h", hasConsent: false });
});

test("should cope with a missing note", () => {
  assert.deepEqual(splitConsultationNote(null), { note: "", hasConsent: false });
  assert.deepEqual(splitConsultationNote(undefined), { note: "", hasConsent: false });
});
