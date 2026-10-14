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
    /** Tạo mới: chỉ có mặt khi thật sự có ảnh. Sửa: `null` để xoá ảnh đang có. */
    image?: string | null;
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
    const image = cleanCode(values.image ?? '');
    const isEdit = Boolean(currentSlug?.trim());
    return {
        title,
        slug: currentSlug?.trim() || createSlugFromTitle(title),
        description: cleanText(values.description ?? ''),
        // API nhận cả null và "" cho "không có ảnh" (đã thử PUT vào id không tồn tại: qua được
        // lớp kiểm). Khi SỬA mà người dùng bấm "Xoá ảnh" thì phải gửi null — PUT là cập nhật
        // một phần, bỏ hẳn trường thì API GIỮ ảnh cũ mà giao diện vẫn báo thành công.
        // Khi TẠO thì bỏ hẳn trường cho payload gọn.
        ...(isEdit ? { image: image || null } : image ? { image } : {}),
        content: stripBase64Images(contentHtml),
        active: values.active,
    };
}
