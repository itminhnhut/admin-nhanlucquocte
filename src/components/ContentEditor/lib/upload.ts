// Upload ảnh trong bài lên API (dùng chung cho nút chèn ảnh và cho hành vi dán ảnh).
import http from '../../../utils/http';

export { uploadNewsImage };

async function uploadNewsImage(file: File) {
    if (!file.type.startsWith('image/') || file.size > 10 * 1024 * 1024) {
        throw new Error('Chỉ nhận file ảnh tối đa 10 MB.');
    }
    const formData = new FormData();
    formData.append('file', file);
    const response = await http.post<{
        url?: string;
        data?: { url?: string; data?: { url?: string } };
    }>('/admin/uploads', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    const url = response.url || response.data?.url || response.data?.data?.url || '';
    if (!url) throw new Error('Upload không trả về URL hợp lệ');
    return url;
}
