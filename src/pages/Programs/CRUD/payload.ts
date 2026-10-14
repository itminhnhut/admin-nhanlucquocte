// Dựng dữ liệu gửi API cho ngành đào tạo. Tách riêng khỏi giao diện để test được
// mà không cần dựng cả trang.
import { cleanCode, cleanText } from '../../../utils/cleanInput.ts';
import { createSlugFromTitle } from '../../../utils/slug.ts';

export type ProgramFormValues = {
    title: string;
    description?: string;
    image?: string;
    active: boolean;
};

export type ProgramPayload = {
    title: string;
    slug: string;
    description: string;
    /** Chỉ có mặt khi thật sự có ảnh — API từ chối cả "" lẫn null, chỉ chấp nhận khi vắng hẳn */
    image?: string;
    content: string;
    active: boolean;
};

/**
 * Ảnh dán thẳng từ Word/màn hình nằm trong HTML dưới dạng base64, mỗi tấm vài trăm KB.
 * Lưu kiểu đó làm phình bài viết và chậm cả website, nên bỏ hẳn — người dùng phải
 * chèn ảnh bằng nút để ảnh được tải lên máy chủ.
 */
export function stripBase64Images(html: string): string {
    if (!html) return '';
    return html.replace(/<img[^>]+src=["']data:image\/[^"']+["'][^>]*>/gi, '');
}

/** Nội dung chỉ có thẻ rỗng (editor luôn để sẵn một dòng trống) coi như chưa viết gì */
export function isEmptyContent(html: string): boolean {
    if (!html) return true;
    return html.replace(/<[^>]*>/g, '').replace(/&nbsp;/g, ' ').trim() === '';
}

/**
 * @param currentSlug slug đang có của ngành khi sửa. Giữ nguyên slug cũ là bắt buộc: slug nằm trong
 *   địa chỉ trang công khai, tính lại theo tiêu đề thì đổi tiêu đề là đổi URL, mọi liên kết cũ và
 *   kết quả Google trỏ vào trang đó thành 404.
 */
export function buildProgramPayload(values: ProgramFormValues, contentHtml: string, currentSlug?: string): ProgramPayload {
    const title = cleanText(values.title);
    // API khai image là uri và KHÔNG nhận chuỗi rỗng lẫn null ("Invalid URL" / "expected string,
    // received null") — không có ảnh thì phải bỏ hẳn trường ra khỏi payload.
    const image = cleanCode(values.image ?? '');
    return {
        title,
        slug: currentSlug?.trim() || createSlugFromTitle(title),
        description: cleanText(values.description ?? ''),
        ...(image ? { image } : {}),
        content: stripBase64Images(contentHtml),
        active: values.active,
    };
}
