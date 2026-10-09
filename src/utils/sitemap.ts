// Báo web landing tạo lại sitemap.xml sau khi tạo/sửa/xoá bài viết hoặc danh mục.
// Endpoint khác domain và không trả CORS → gửi no-cors (request vẫn tới server, chỉ không đọc được kết quả).
// Lỗi ở đây không được làm hỏng thao tác lưu → chỉ cảnh báo.
export const refreshSitemap = async (refreshUrl: string): Promise<void> => {
    if (!refreshUrl) return;

    try {
        await fetch(refreshUrl, { mode: 'no-cors', keepalive: true });
    } catch (error) {
        console.warn('Không gọi được sitemap refresh:', error);
    }
};
