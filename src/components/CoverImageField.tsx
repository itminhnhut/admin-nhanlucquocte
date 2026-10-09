// Ô chọn ảnh đại diện / ảnh bìa. Dùng chung cho Tin tức và Ngành đào tạo.
// Tự tải ảnh lên máy chủ rồi trả URL ra ngoài qua onChange.
import { useEffect, useState } from 'react';
import ImageUploading, { ImageListType } from 'react-images-uploading';
import Swal from 'sweetalert2';
import http from '../utils/http';

const MAX_SIZE = 10 * 1024 * 1024;

type CoverImageFieldProps = {
    /** URL ảnh đang có (rỗng = chưa chọn) */
    value: string;
    onChange: (url: string) => void;
    onUploadingChange?: (uploading: boolean) => void;
    title?: string;
    hint?: string;
};

function CoverImageField({ value, onChange, onUploadingChange, title = 'Ảnh đại diện', hint = 'Ảnh ngang, nên từ 1200×630 trở lên để hiện đẹp khi chia sẻ.' }: CoverImageFieldProps) {
    const [images, setImages] = useState<ImageListType>([]);
    const [uploading, setUploading] = useState(false);

    // Mở bài có sẵn: dựng ô xem trước từ URL đã lưu
    useEffect(() => {
        setImages(value ? [{ dataURL: value }] : []);
    }, [value]);

    const setBusy = (busy: boolean) => {
        setUploading(busy);
        onUploadingChange?.(busy);
    };

    const handlePick = async (imageList: ImageListType) => {
        setImages(imageList);
        const file = imageList[0]?.file;
        if (!file) {
            onChange('');
            return;
        }
        if (!file.type.startsWith('image/') || file.size > MAX_SIZE) {
            Swal.fire({ icon: 'warning', title: 'Ảnh không hợp lệ', text: 'Chỉ nhận file ảnh tối đa 10 MB.' });
            setImages([]);
            onChange('');
            return;
        }

        const formData = new FormData();
        formData.append('file', file);
        setBusy(true);
        try {
            const response = await http.post<{ url?: string; data?: { url?: string } }>('/admin/uploads', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });
            const url = response.url || response.data?.url || '';
            if (!url) throw new Error('Upload không trả về URL hợp lệ');
            onChange(url);
        } catch (error) {
            console.error('Lỗi upload ảnh bìa:', error);
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Upload ảnh thất bại. Vui lòng thử lại.' });
            setImages([]);
            onChange('');
        } finally {
            setBusy(false);
        }
    };

    return (
        <section className="rounded-xl border border-slate-200 bg-white p-4" data-testid="cover-image">
            <h3 className="font-semibold text-slate-800">{title}</h3>
            <p className="mt-1 text-xs text-slate-500">{hint}</p>
            <ImageUploading value={images} onChange={handlePick} maxNumber={1}>
                {({ imageList, onImageUpload }) => (
                    <div className="mt-3">
                        {imageList[0]?.dataURL ? (
                            <button type="button" title="Bấm để thay ảnh khác" className="block w-full overflow-hidden rounded-lg border border-slate-200" onClick={onImageUpload}>
                                <img src={imageList[0].dataURL} alt={title} className="max-h-44 w-full object-cover" />
                            </button>
                        ) : (
                            <button
                                type="button"
                                disabled={uploading}
                                className="flex w-full flex-col items-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 px-4 py-7 text-slate-500 hover:border-primary hover:text-primary disabled:opacity-60"
                                onClick={onImageUpload}
                            >
                                <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
                                    <path d="M3 5h18v14H3zM3 16l5-5 4 4 3-3 6 6" />
                                </svg>
                                <span className="text-sm font-medium">{uploading ? 'Đang tải ảnh…' : 'Chọn ảnh từ máy'}</span>
                            </button>
                        )}
                        {imageList[0]?.dataURL && (
                            <div className="mt-2 flex gap-2">
                                <button type="button" className="btn btn-sm btn-outline-primary flex-1" disabled={uploading} onClick={onImageUpload}>
                                    {uploading ? 'Đang tải…' : 'Thay ảnh'}
                                </button>
                                <button
                                    type="button"
                                    className="btn btn-sm btn-outline-danger flex-1"
                                    onClick={() => {
                                        setImages([]);
                                        onChange('');
                                    }}
                                >
                                    Xoá ảnh
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </ImageUploading>
        </section>
    );
}

export default CoverImageField;
