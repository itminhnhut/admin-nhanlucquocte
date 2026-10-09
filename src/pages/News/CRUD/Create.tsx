import { apiErrorMessage } from '../../../utils/apiError';
import { useForm } from 'react-hook-form';
import http from '../../../utils/http';
import Swal from 'sweetalert2';
import { useNavigate, useParams } from 'react-router-dom';
import { useState, useEffect, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Select, { type StylesConfig } from 'react-select';
import { createSlugFromTitle } from '../../../utils/slug';
import { refreshSitemap } from '../../../utils/sitemap';
import { SITEMAP_REFRESH_URL } from '../../../configs/env';
import { notBlank, cleanPayload } from '../../../utils/cleanInput';
import ContentEditor from '../../../components/ContentEditor';
import CoverImageField from '../../../components/CoverImageField';
import { clearEditorDraft } from '../../../components/ContentEditor/plugins/DraftPlugin';

// Helper function to strip base64 images from HTML content
const stripBase64Images = (html: string): string => {
    if (!html) return '';
    // Loại bỏ toàn bộ thẻ IMG có src là data:image/... (base64)
    return html.replace(/<img[^>]+src=["']data:image\/[^"']+["'][^>]*>/gi, '');
};

type NewsFormValues = {
    title: string;
    slug: string;
    content: string;
    image: string;
    summary: string;
    isHot: boolean;
    published: boolean;
    category: string;
    programIds: number[];
};

type ProgramOption = { value: number; label: string };

// Dùng chung cho mọi ô chọn, trước đây đoạn style này bị chép lại ở từng ô
const selectStyles: StylesConfig<ProgramOption, boolean> = {
    control: (base, state) => ({
        ...base,
        minHeight: 42,
        borderColor: state.isFocused ? '#818cf8' : '#e2e8f0',
        boxShadow: state.isFocused ? '0 0 0 1px #818cf8' : 'none',
    }),
    menuPortal: (base) => ({ ...base, zIndex: 9999 }),
    menu: (base) => ({ ...base, zIndex: 9999 }),
};

const preparePreview = (html: string) => {
    if (!html) return { html: '', headings: [] as { id: string; text: string; level: number }[] };
    const documentNode = new DOMParser().parseFromString(html, 'text/html');
    const counters = new Map<string, number>();
    const headings = Array.from(documentNode.body.querySelectorAll<HTMLElement>('h1, h2, h3')).map((heading) => {
        const text = heading.textContent?.trim() || 'Tiêu đề chưa có nội dung';
        const base =
            heading.id ||
            text
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .toLowerCase()
                .trim()
                .replace(/\s+/g, '-')
                .replace(/[^a-z0-9-_]/g, '') ||
            'heading';
        const count = counters.get(base) || 0;
        counters.set(base, count + 1);
        const id = count ? `${base}-${count + 1}` : base;
        heading.id = id;
        return { id, text, level: Number(heading.tagName.slice(1)) };
    });
    return { html: documentNode.body.innerHTML, headings };
};

type PreviewData = ReturnType<typeof preparePreview>;

const PreviewDrawer = ({
    open,
    preview,
    title,
    summary,
    image,
    onClose,
}: {
    open: boolean;
    preview: PreviewData;
    title: string;
    summary: string;
    image: string;
    onClose: () => void;
}) => {
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const previousOverflow = document.body.style.overflow;
        const closeOnEscape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        document.body.style.overflow = 'hidden';
        document.addEventListener('keydown', closeOnEscape);
        return () => {
            document.body.style.overflow = previousOverflow;
            document.removeEventListener('keydown', closeOnEscape);
        };
    }, [onClose, open]);

    if (!open) return null;

    return createPortal(
        <div className="fixed inset-0 z-[1000] flex justify-end" role="dialog" aria-modal="true" aria-label="Xem trước bài viết">
            <button type="button" className="absolute inset-0 cursor-default bg-black/50" aria-label="Đóng preview" onClick={onClose} />
            <aside className="relative flex h-full w-full max-w-4xl flex-col bg-white shadow-2xl">
                <header className="flex shrink-0 items-center justify-between border-b border-slate-200 px-5 py-4 sm:px-7">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-900">Xem trước bài viết</h2>
                        <p className="mt-0.5 text-xs text-slate-500">Nội dung gần giống khi hiển thị trên trang đọc.</p>
                    </div>
                    <button type="button" className="grid h-9 w-9 place-items-center rounded-lg border border-slate-200 text-xl text-slate-500 hover:bg-slate-100" onClick={onClose}>
                        ×
                    </button>
                </header>

                <div ref={contentRef} className="flex-1 overflow-y-auto bg-slate-50 p-4 sm:p-7">
                    <article className="mx-auto max-w-3xl rounded-xl bg-white p-5 shadow-sm sm:p-8">
                        {image && <img src={image} alt={title || 'Ảnh đại diện bài viết'} className="mb-6 max-h-80 w-full rounded-xl object-cover" />}
                        <h1 className="mb-3 text-2xl font-bold leading-tight text-slate-900 sm:text-3xl">{title || 'Tiêu đề bài viết'}</h1>
                        {summary && <p className="mb-7 text-base leading-7 text-slate-500">{summary}</p>}
                        {preview.headings.length > 0 && (
                            <nav className="mb-7 rounded-lg border border-slate-200 bg-slate-50 p-4" aria-label="Mục lục bài viết">
                                <strong className="mb-2 block text-base text-slate-800">Mục lục bài viết</strong>
                                <ol className="m-0 grid list-none gap-1 p-0">
                                    {preview.headings.map((heading, index) => (
                                        <li key={heading.id} style={{ paddingLeft: `${Math.max(0, heading.level - 1) * 16}px` }}>
                                            <button
                                                type="button"
                                                className="block w-full rounded px-2 py-1 text-left text-indigo-600 hover:bg-indigo-50"
                                                onClick={() => {
                                                    const escapedId = CSS.escape(heading.id);
                                                    contentRef.current?.querySelector<HTMLElement>(`#${escapedId}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                                }}
                                            >
                                                {index + 1}. {heading.text}
                                            </button>
                                        </li>
                                    ))}
                                </ol>
                            </nav>
                        )}
                        <div className="text-base leading-7 text-slate-800" dangerouslySetInnerHTML={{ __html: preview.html }} />
                    </article>
                </div>
            </aside>
        </div>,
        document.body,
    );
};

const NewsForm = () => {
    const navigate = useNavigate();
    const { id } = useParams<{ id: string }>(); // Lấy ID từ URL
    const isEditMode = Boolean(id); // Kiểm tra chế độ Edit

    const [loading, setLoading] = useState(false);
    const [coverUploading, setCoverUploading] = useState(false);
    const [contentUploading, setContentUploading] = useState(false);
    const [fetching, setFetching] = useState(isEditMode);
    const [value2, setValue2] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [contentDirty, setContentDirty] = useState(false);
    const [editorRevision, setEditorRevision] = useState(0);
    const editorBaselineRef = useRef('');
    const [programOptions, setProgramOptions] = useState<{ value: number; label: string }[]>([]);

    // Fetch danh sách chương trình
    useEffect(() => {
        const fetchPrograms = async () => {
            try {
                const res = await http.get<{ data: { id: number; title: string }[] }>('admin/programs', {
                    params: { noPaginate: true },
                });

                const options = (res.data ?? []).map((p) => ({
                    value: p.id,
                    label: p.title,
                }));

                setProgramOptions(options);
            } catch (error) {
                console.error('Error fetching programs:', error);
            }
        };

        fetchPrograms();
    }, []);

    // Fetch dữ liệu tin tức nếu đang ở chế độ Edit
    useEffect(() => {
        if (!isEditMode || !id) return;

        const fetchNewsData = async () => {
            setFetching(true);
            try {
                const res = await http.get<{
                    data: NewsFormValues & {
                        programs?: { id: number; title: string; slug: string }[];
                    };
                }>(`/admin/posts/${id}`);
                const data = res.data;

                // Set giá trị vào form
                setValue('title', data.title || '');
                setValue('slug', data.slug || '');
                setValue('summary', data.summary || '');
                setValue('image', data.image || '');
                setValue('category', data.category || '');

                // Map programs array thành programIds
                const programIds = (data.programs || []).map((p) => p.id);
                setValue('programIds', programIds);

                setValue('isHot', data.isHot || false);
                setValue('published', data.published ?? true);
                const initialContent = stripBase64Images(data.content || '');
                editorBaselineRef.current = initialContent;
                setContentDirty(false);
                setValue2(initialContent);
                setEditorRevision((revision) => revision + 1);

                // Ô ảnh đại diện tự dựng xem trước từ giá trị trong form
            } catch (error) {
                Swal.fire({
                    icon: 'error',
                    title: 'Lỗi',
                    text: apiErrorMessage(error, 'Không thể tải dữ liệu tin tức.'),
                });
                navigate('/news');
            } finally {
                setFetching(false);
            }
        };

        fetchNewsData();
    }, [id, isEditMode]);

    const {
        register,
        handleSubmit,
        formState: { errors, isDirty },
        setValue,
        watch,
    } = useForm<NewsFormValues>({
        defaultValues: {
            title: '',
            slug: '',
            content: '',
            image: '',
            summary: '',
            isHot: false,
            published: true,
            category: '',
            programIds: [],
        },
    });

    const categoryValue = watch('category');
    const programIdsValue = watch('programIds');
    const titleValue = watch('title');
    const summaryValue = watch('summary');
    const imageValue = watch('image');
    const preview = useMemo(() => preparePreview(value2), [value2]);
    const slugPreview = useMemo(() => createSlugFromTitle((titleValue || '').trim()), [titleValue]);
    const summaryLength = (summaryValue || '').trim().length;
    const hasUnsavedChanges = isDirty || contentDirty;

    useEffect(() => {
        const warnBeforeLeaving = (event: BeforeUnloadEvent) => {
            if (!hasUnsavedChanges) return;
            event.preventDefault();
            event.returnValue = '';
        };
        window.addEventListener('beforeunload', warnBeforeLeaving);
        return () => window.removeEventListener('beforeunload', warnBeforeLeaving);
    }, [hasUnsavedChanges]);

    const handleEditorChange = (html: string) => {
        setContentDirty(html !== editorBaselineRef.current);
        setValue2(html);
    };

    const handleCancel = async () => {
        if (!hasUnsavedChanges) {
            navigate('/news');
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
        if (result.isConfirmed) navigate('/news');
    };


    const onSubmit = async (values: NewsFormValues) => {
        if (coverUploading || contentUploading) {
            Swal.fire({
                icon: 'warning',
                title: 'Đang upload ảnh, vui lòng đợi',
                text: '',
                timer: 2000,
                showConfirmButton: false,
            });
            return;
        }
        setLoading(true);

        const title = (values.title || '').trim();
        const slug = createSlugFromTitle(title);

        // Sanitize editor content to strip base64 images
        const cleanedContent = stripBase64Images(value2);

        const payload = cleanPayload({
            title,
            slug,
            content: cleanedContent,
            image: values.image,
            summary: values.summary,
            category: values.category,
            programIds: values.programIds,
            isHot: values.isHot,
            published: values.published ?? true,
        });

        try {
            if (isEditMode) {
                // Chế độ Edit: gọi PUT
                await http.put(`/admin/posts/${id}`, payload);
            } else {
                // Chế độ Create: gọi POST
                await http.post('/admin/posts', payload);
            }
            refreshSitemap(SITEMAP_REFRESH_URL);
            // Đã lưu lên server rồi thì nháp trên máy không còn cần nữa
            clearEditorDraft(`news-${id || 'new'}`);

            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: isEditMode ? 'Cập nhật tin tức thành công!' : 'Tạo tin tức thành công!',
                timer: 1500,
                showConfirmButton: false,
            });

            navigate('/news');
        } catch (error) {
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: apiErrorMessage(error, 'Có lỗi xảy ra. Vui lòng thử lại.'),
            });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <section>
                <div className="panel mt-6 mx-auto">
                    <p className="text-center">Đang tải dữ liệu...</p>
                </div>
            </section>
        );
    }

    return (
        <section>
            <div className="panel mt-6 mx-auto">
                <h2 className="text-xl mb-4">{isEditMode ? 'Chỉnh sửa tin tức' : 'Tạo tin tức'}</h2>

                <form onSubmit={handleSubmit(onSubmit)} className="grid gap-6 pb-8 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
                    {/* Cột trái: chỉ việc viết bài, không có tuỳ chọn nào xen vào */}
                    <div className="grid min-w-0 gap-5">
                        <div>
                            <label className="mb-1.5 block font-semibold text-slate-800">
                                Tiêu đề <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                className="form-input !h-auto !py-3 !text-lg"
                                placeholder="Ví dụ: Lễ khai giảng khoá 32 năm 2026"
                                {...register('title', { required: 'Tiêu đề là bắt buộc', validate: notBlank('Tiêu đề là bắt buộc') })}
                            />
                            {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                            <p className="mt-1.5 break-all text-xs text-slate-500">
                                Đường dẫn bài viết: <span className="font-medium text-slate-600">/tin-tuc/{slugPreview || '...'}</span>
                            </p>
                        </div>

                        <div>
                            <label className="mb-1.5 block font-semibold text-slate-800">Tóm tắt</label>
                            <textarea
                                className="form-input"
                                rows={3}
                                placeholder="Vài dòng giới thiệu ngắn về bài viết"
                                {...register('summary')}
                            />
                            <div className="mt-1.5 flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                                <span>Hiện ở trang danh sách và khi chia sẻ lên Facebook, Zalo.</span>
                                <span className={summaryLength > 200 ? 'font-medium text-amber-600' : ''}>{summaryLength}/200 ký tự</span>
                            </div>
                        </div>

                        <div>
                            <label className="mb-2 block font-semibold text-slate-800">Nội dung</label>
                            <ContentEditor
                                key={`news-editor-${id || 'new'}-${editorRevision}`}
                                initialHtml={value2}
                                draftKey={`news-${id || 'new'}`}
                                onChange={handleEditorChange}
                                onUploadingChange={setContentUploading}
                            />
                        </div>
                    </div>

                    {/* Cột phải: ảnh, phân loại, hiển thị */}
                    <aside className="grid content-start gap-4">
                        <CoverImageField
                            value={imageValue || ''}
                            onChange={(url) => setValue('image', url, { shouldDirty: true })}
                            onUploadingChange={setCoverUploading}
                        />

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <h3 className="font-semibold text-slate-800">Phân loại</h3>
                            <p className="mt-1 text-xs text-slate-500">Giúp người đọc tìm thấy bài viết đúng chủ đề.</p>

                            <label className="mb-1.5 mt-3 block text-sm font-medium text-slate-700">Danh mục chính</label>
                            <Select
                                classNamePrefix="react-select"
                                options={programOptions}
                                placeholder="Chọn một danh mục"
                                isClearable
                                isSearchable
                                noOptionsMessage={() => 'Không tìm thấy danh mục'}
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                                value={programOptions.find((opt) => opt.label === categoryValue) || null}
                                onChange={(option) => {
                                    const opt = option as ProgramOption | null;
                                    setValue('category', opt ? opt.label : '', { shouldDirty: true });
                                }}
                            />

                            <label className="mb-1.5 mt-4 block text-sm font-medium text-slate-700">
                                Chương trình liên quan <span className="font-normal text-slate-400">(không bắt buộc)</span>
                            </label>
                            <Select
                                classNamePrefix="react-select"
                                options={programOptions}
                                isMulti
                                isSearchable
                                closeMenuOnSelect={false}
                                hideSelectedOptions
                                placeholder="Tìm và chọn chương trình"
                                noOptionsMessage={() => 'Không còn chương trình phù hợp'}
                                menuPortalTarget={document.body}
                                styles={selectStyles}
                                value={programOptions.filter((opt) => (programIdsValue || []).includes(opt.value))}
                                onChange={(options) => {
                                    const selected = (options as ProgramOption[] | null) || [];
                                    setValue(
                                        'programIds',
                                        selected.map((opt) => opt.value),
                                        { shouldDirty: true },
                                    );
                                }}
                            />
                        </section>

                        <section className="rounded-xl border border-slate-200 bg-white p-4">
                            <h3 className="font-semibold text-slate-800">Hiển thị</h3>
                            <label className="mt-3 flex cursor-pointer items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                                <span>
                                    <span className="block font-medium text-slate-700">Xuất bản</span>
                                    <small className="text-xs text-slate-500">Bỏ chọn để lưu nháp, chưa cho người ngoài xem</small>
                                </span>
                                <input type="checkbox" className="form-checkbox mt-0.5" {...register('published')} />
                            </label>
                            <label className="mt-2 flex cursor-pointer items-start justify-between gap-3 rounded-lg bg-slate-50 px-3 py-2.5">
                                <span>
                                    <span className="block font-medium text-slate-700">Nổi bật</span>
                                    <small className="text-xs text-slate-500">Đưa bài lên đầu trang tin tức</small>
                                </span>
                                <input type="checkbox" className="form-checkbox mt-0.5" {...register('isHot')} />
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
                            <button type="button" className="btn btn-outline-primary" onClick={() => setShowPreview(true)}>
                                Xem trước
                            </button>
                            <button type="submit" className="btn btn-primary" disabled={loading || coverUploading || contentUploading}>
                                {loading ? 'Đang lưu...' : coverUploading || contentUploading ? 'Đang tải ảnh…' : 'Lưu bài viết'}
                            </button>
                        </div>
                    </div>
                </form>
                <PreviewDrawer
                    open={showPreview}
                    preview={preview}
                    title={titleValue || ''}
                    summary={summaryValue || ''}
                    image={imageValue || ''}
                    onClose={() => setShowPreview(false)}
                />
            </div>
        </section>
    );
};

export default NewsForm;
