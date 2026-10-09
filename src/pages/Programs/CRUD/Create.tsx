// Trang tạo / sửa ngành đào tạo. Trước đây là modal, soạn bài dài trong khe hẹp
// và bấm ra ngoài là mất sạch. Giờ là trang riêng, cùng bố cục với trang tin tức.
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate, useParams } from 'react-router-dom';
import Swal from 'sweetalert2';
import ContentEditor from '../../../components/ContentEditor';
import { clearEditorDraft } from '../../../components/ContentEditor/plugins/DraftPlugin';
import CoverImageField from '../../../components/CoverImageField';
import { SITEMAP_REFRESH_URL } from '../../../configs/env';
import { setPageTitle } from '../../../store/themeConfigSlice';
import http from '../../../utils/http';
import { refreshSitemap } from '../../../utils/sitemap';
import { createSlugFromTitle } from '../../../utils/slug';
import { notBlank } from '../../../utils/trimStrings';
import { buildProgramPayload, isEmptyContent, stripBase64Images, type ProgramFormValues } from './payload';

type Program = ProgramFormValues & { id: number; slug: string; content?: string };

function ProgramForm() {
    const { id } = useParams<{ id: string }>();
    const isEditMode = Boolean(id);
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [contentHtml, setContentHtml] = useState('');
    const [contentBaseline, setContentBaseline] = useState('');
    const [editorKey, setEditorKey] = useState(0);
    const [fetching, setFetching] = useState(isEditMode);
    const [saving, setSaving] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const [contentUploading, setContentUploading] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        formState: { errors, isDirty },
    } = useForm<ProgramFormValues>({
        defaultValues: { title: '', description: '', image: '', active: true },
    });

    const titleValue = watch('title');
    const imageValue = watch('image') ?? '';
    const contentDirty = contentHtml !== contentBaseline;
    const hasUnsavedChanges = isDirty || contentDirty;

    useEffect(() => {
        dispatch(setPageTitle(isEditMode ? 'Sửa ngành đào tạo' : 'Thêm ngành đào tạo'));
    }, [dispatch, isEditMode]);

    // API chưa có đường lấy một ngành theo id, nên lấy cả danh sách rồi tìm.
    // Danh mục chỉ vài chục dòng nên không đáng ngại.
    useEffect(() => {
        if (!isEditMode || !id) return;
        let cancelled = false;
        const load = async () => {
            setFetching(true);
            try {
                const response = await http.get<{ data: Program[] }>('admin/programs', { params: { noPaginate: true } });
                const program = (response.data ?? []).find((item) => String(item.id) === String(id));
                if (cancelled) return;
                if (!program) {
                    Swal.fire({ icon: 'error', title: 'Không tìm thấy', text: 'Ngành này không còn trong danh sách.' });
                    navigate('/programs');
                    return;
                }
                setValue('title', program.title ?? '');
                setValue('description', program.description ?? '');
                setValue('image', program.image ?? '');
                setValue('active', program.active ?? true);
                const html = stripBase64Images(program.content ?? '');
                setContentHtml(html);
                setContentBaseline(html);
                setEditorKey((key) => key + 1);
            } catch (error) {
                if (cancelled) return;
                console.error('Lỗi tải ngành đào tạo:', error);
                Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không tải được dữ liệu ngành.' });
                navigate('/programs');
            } finally {
                if (!cancelled) setFetching(false);
            }
        };
        load();
        return () => {
            cancelled = true;
        };
    }, [id, isEditMode, navigate, setValue]);

    useEffect(() => {
        const warn = (event: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warn);
        return () => window.removeEventListener('beforeunload', warn);
    }, [hasUnsavedChanges]);

    const handleCancel = async () => {
        if (!hasUnsavedChanges) {
            navigate('/programs');
            return;
        }
        const result = await Swal.fire({
            icon: 'warning',
            title: 'Bỏ các thay đổi?',
            text: 'Nội dung chưa lưu sẽ bị mất.',
            showCancelButton: true,
            confirmButtonText: 'Bỏ thay đổi',
            cancelButtonText: 'Tiếp tục chỉnh sửa',
            confirmButtonColor: '#e7515a',
        });
        if (result.isConfirmed) navigate('/programs');
    };

    const onSubmit = async (values: ProgramFormValues) => {
        if (isEmptyContent(contentHtml)) {
            Swal.fire({ icon: 'warning', title: 'Chưa có nội dung', text: 'Hãy viết phần giới thiệu ngành trước khi lưu.' });
            return;
        }
        setSaving(true);
        try {
            const payload = buildProgramPayload(values, contentHtml);
            if (isEditMode) await http.put(`admin/programs/${id}`, payload);
            else await http.post('admin/programs', payload);
            refreshSitemap(SITEMAP_REFRESH_URL);
            clearEditorDraft(`program-${id || 'new'}`);
            Swal.fire({ icon: 'success', title: 'Thành công', text: isEditMode ? 'Đã cập nhật ngành.' : 'Đã thêm ngành mới.', timer: 1500, showConfirmButton: false });
            navigate('/programs');
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Lỗi', text: message || 'Có lỗi xảy ra. Vui lòng thử lại.' });
        } finally {
            setSaving(false);
        }
    };

    if (fetching) {
        return (
            <section>
                <div className="panel mt-6">
                    <p className="text-center">Đang tải dữ liệu...</p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <div className="panel mt-6">
                <h2 className="mb-4 text-xl">{isEditMode ? 'Sửa ngành đào tạo' : 'Thêm ngành đào tạo'}</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 pb-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    <div className="grid min-w-0 gap-5">
                        <div>
                            <label className="mb-1.5 block font-semibold text-slate-800">
                                Tên ngành <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input !h-auto !py-3 !text-lg"
                                placeholder="Ví dụ: Chuyên ngành Điều dưỡng hệ Trung cấp"
                                {...register('title', { required: 'Tên ngành là bắt buộc', validate: notBlank('Tên ngành là bắt buộc') })}
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                            <p className="mt-1.5 break-all text-xs text-slate-500">
                                Đường dẫn trên website: <span className="font-medium text-slate-600" data-testid="slug-preview">/nganh-dao-tao/{createSlugFromTitle((titleValue || '').trim()) || '...'}</span>
                            </p>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-semibold text-slate-800">Mô tả ngắn</label>
                            <textarea className="form-input" rows={3} placeholder="Ví dụ: Khai giảng ngày 16/03/2026" {...register('description')} />
                            <p className="mt-1.5 text-xs text-slate-500">Hiện dưới tên ngành ở trang danh sách ngành của website.</p>
                        </div>

                        <div>
                            <label className="mb-2 block font-semibold text-slate-800">Nội dung giới thiệu ngành</label>
                            <ContentEditor
                                key={`program-editor-${id || 'new'}-${editorKey}`}
                                initialHtml={contentHtml}
                                draftKey={`program-${id || 'new'}`}
                                onChange={setContentHtml}
                                onUploadingChange={setContentUploading}
                            />
                        </div>
                    </div>

                    <aside className="grid content-start gap-4">
                        <CoverImageField
                            value={imageValue}
                            onChange={(url) => setValue('image', url, { shouldDirty: true })}
                            onUploadingChange={setCoverUploading}
                            title="Ảnh ngành"
                            hint="Hiện ở đầu trang ngành và khi chia sẻ lên Facebook, Zalo."
                        />

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <h3 className="font-semibold text-slate-800">Hiển thị</h3>
                            <label className="mt-3 flex cursor-pointer items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                                <span>
                                    <span className="block font-medium text-slate-700">Đang tuyển sinh</span>
                                    <small className="text-xs text-slate-500">Bỏ chọn để ẩn ngành này khỏi website</small>
                                </span>
                                <input type="checkbox" className="form-checkbox mt-0.5" {...register('active')} />
                            </label>
                        </section>
                    </aside>

                    <div className="sticky bottom-0 z-30 -mx-5 mt-2 flex flex-col gap-3 border-t border-slate-200 bg-white/95 px-5 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between lg:col-span-2">
                        <span className={`text-xs font-medium ${hasUnsavedChanges ? 'text-amber-600' : 'text-emerald-600'}`}>
                            {hasUnsavedChanges ? '● Có thay đổi chưa lưu' : '✓ Không có thay đổi mới'}
                        </span>
                        <div className="flex justify-end gap-3">
                            <button type="button" className="btn btn-outline-secondary" onClick={handleCancel}>
                                Hủy
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={saving || coverUploading || contentUploading}>
                                {saving ? 'Đang lưu...' : coverUploading || contentUploading ? 'Đang tải ảnh…' : 'Lưu ngành'}
                            </button>
                        </div>
                    </div>
                </form>
            </div>
        </section>
    );
}

export default ProgramForm;
