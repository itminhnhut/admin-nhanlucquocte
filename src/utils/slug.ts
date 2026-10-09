// "đ/Đ" (và "ð/Ð" trông giống hệt, hay lẫn khi copy từ Word/PDF) không tách được bằng NFD
// → đổi trước, nếu không sẽ bị xoá ("Đẹp" → "ep")
export const removeVietnameseTones = (text: string): string =>
    text
        .replace(/[đð]/g, 'd')
        .replace(/[ĐÐ]/g, 'D')
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '');

export const createSlugFromTitle = (title: string): string =>
    removeVietnameseTones(title)
        .toLowerCase()
        // Ký tự ngăn cách ("/", ".", "_", ...) thành gạch nối, không nối liền 2 từ ("sạn/nhà" → "san-nha")
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
