// Website tự nối một dấu vết đồng ý chính sách vào cuối ghi chú khi khách bấm gửi:
//   [Đồng ý Chính sách bảo vệ dữ liệu cá nhân phiên bản 2026-09-24, lúc 2026-10-08T14:16:58.480Z]
// Đó là bằng chứng pháp lý theo Luật Bảo vệ dữ liệu cá nhân, phải giữ lại,
// nhưng KHÔNG phải nội dung khách viết nên không được lẫn vào ô ghi chú.
const CONSENT = /\[Đồng ý Chính sách bảo vệ dữ liệu cá nhân phiên bản\s*([^,\]]+),\s*lúc\s*([^\]]+)\]/;

export type SplitNote = {
    /** Phần khách thật sự viết */
    note: string;
    /** Có dấu vết đồng ý hay không */
    hasConsent: boolean;
    consentVersion?: string;
    consentAt?: string;
};

export function splitConsultationNote(raw?: string | null): SplitNote {
    const text = (raw ?? '').trim();
    const match = CONSENT.exec(text);
    if (!match) return { note: text, hasConsent: false };
    return {
        note: text.replace(CONSENT, '').replace(/\s{2,}/g, ' ').trim(),
        hasConsent: true,
        consentVersion: match[1].trim(),
        consentAt: match[2].trim(),
    };
}
