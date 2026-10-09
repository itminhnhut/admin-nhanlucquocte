import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { Fragment, useEffect, useMemo, useState, useRef } from 'react';
import sortBy from 'lodash/sortBy';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPlus from '../../components/Icon/IconPlus';
import { Dialog, DialogPanel, Transition } from '@headlessui/react';
import IconX from '../../components/Icon/IconX';
import { useForm, SubmitHandler } from 'react-hook-form';
import IconSearch from '../../components/Icon/IconSearch';
import http from '../../utils/http';
import Swal from 'sweetalert2';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import Quill from 'quill';
import { createSlugFromTitle } from '../../utils/slug';
import { refreshSitemap } from '../../utils/sitemap';
import { SITEMAP_REFRESH_URL } from '../../configs/env';
import { notBlank } from '../../utils/trimStrings';
import TextWithCopy from '../../components/TextWithCopy';

// Helper function to strip base64 images from HTML content
const stripBase64Images = (html: string): string => {
    if (!html) return '';
    return html.replace(/<img[^>]+src=["']data:image\/[^"']+["'][^>]*>/gi, '');
};

// Helper: lấy preview text gọn từ content HTML để hiển thị trong list
const getContentPreview = (html: string, maxChars = 220): string => {
    if (!html) return '';
    // Dùng DOMParser để convert HTML -> text thuần
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const text = doc.body.textContent || '';
    const normalized = text.replace(/\s+/g, ' ').trim();
    if (normalized.length <= maxChars) return normalized;
    return normalized.slice(0, maxChars) + '…';
};

type Program = {
    id: number;
    title: string;
    slug: string;
    content: string;
    active: boolean;
    description: string;
    createdAt?: string;
};

type ProgramFormValues = {
    title: string;
    active: boolean;
    description?: string;
    content?: string;
};

const ProgramsTables = () => {
    const dispatch = useDispatch();

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [editingProgram, setEditingProgram] = useState<Program | null>(null);
    const [contentValue, setContentValue] = useState<string>('');
    const [showPreview, setShowPreview] = useState(false);
    const [editorReady, setEditorReady] = useState(false);

    // console.log('editingProgram', editingProgram);
    const quillRef = useRef<ReactQuill>(null);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({
        columnAccessor: 'id',
        direction: 'asc',
    });
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors, isSubmitting },
    } = useForm<ProgramFormValues>({
        defaultValues: {
            title: '',
            active: true,
            description: '',
            content: '',
        },
    });

    // Khởi tạo modules khi modal mở (không dùng TOC)
    const modules = useMemo(() => {
        if (!editorReady) return {};

        return {
            toolbar: {
                container: '#toolbar-programs',
            },
            clipboard: {
                matchVisual: false,
            },
        };
    }, [editorReady]);

    // Đợi modal render xong rồi mới khởi tạo editor
    useEffect(() => {
        if (addModalOpen) {
            // Đợi một chút để DOM render xong
            const timer = setTimeout(() => {
                setEditorReady(true);
            }, 100);
            return () => clearTimeout(timer);
        } else {
            setEditorReady(false);
        }
    }, [addModalOpen]);

    // Custom image handler cho Quill
    useEffect(() => {
        if (!editorReady || !quillRef.current) return;

        const editor = quillRef.current.getEditor();
        const toolbar: any = editor.getModule('toolbar');

        const imageHandler = () => {
            const input = document.createElement('input');
            input.setAttribute('type', 'file');
            input.setAttribute('accept', 'image/*');
            input.click();

            input.onchange = async () => {
                const file = input.files?.[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                try {
                    // TODO: nếu API bạn khác path thì đổi 'admin/uploads' lại
                    const res = await http.post<{ url: string }>('admin/uploads', formData, {
                        headers: {
                            'Content-Type': 'multipart/form-data',
                        },
                    });

                    const imageUrl = (res as any)?.data?.url || (res as any)?.data?.data?.url;
                    if (!imageUrl) {
                        Swal.fire({
                            icon: 'error',
                            title: 'Lỗi',
                            text: 'Không nhận được đường dẫn ảnh từ máy chủ.',
                        });
                        return;
                    }

                    const range = editor.getSelection(true);
                    const index = range ? range.index : editor.getLength();
                    editor.insertEmbed(index, 'image', imageUrl, 'user');
                    editor.setSelection(index + 1, 0);
                } catch (error: any) {
                    console.error('Error uploading image:', error);
                    Swal.fire({
                        icon: 'error',
                        title: 'Lỗi upload ảnh',
                        text: error?.response?.data?.message || 'Không thể upload ảnh. Vui lòng thử lại.',
                    });
                }
            };
        };

        if (toolbar && toolbar.addHandler) {
            // cách “đúng” của Quill
            toolbar.addHandler('image', imageHandler);
        } else if (toolbar && toolbar.handlers) {
            // fallback nếu modules gán kiểu cũ
            toolbar.handlers.image = imageHandler;
        }

        const Delta = Quill.import('delta');
        const clipboard: any = editor.getModule('clipboard');

        if (clipboard && clipboard.addMatcher) {
            clipboard.addMatcher('IMG', (node: HTMLElement, delta: any) => {
                const src = (node as HTMLImageElement).getAttribute('src') || '';
                if (src.startsWith('data:image/')) {
                    return new Delta();
                }
                return delta;
            });
        }

        const onPaste = (e: ClipboardEvent) => {
            const clipboardData = e.clipboardData;
            if (!clipboardData) return;

            const items = clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    Swal.fire({
                        icon: 'warning',
                        title: 'Không hỗ trợ paste ảnh',
                        text: 'Vui lòng dùng nút "Chèn ảnh" trên toolbar để upload ảnh.',
                        timer: 3000,
                    });
                    break;
                }
            }
        };

        editor.root.addEventListener('paste', onPaste);

        return () => {
            if (quillRef.current) {
                const editor = quillRef.current.getEditor();
                editor.root.removeEventListener('paste', onPaste);
            }
        };
    }, [editorReady]);

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const res = await http.get<{ data: Program[]; meta?: any }>('admin/programs', {
                params: { noPaginate: true },
            });
            setPrograms(res.data ?? []);
        } catch (error) {
            console.error('Error fetching programs:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không tải được danh sách chương trình.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Danh mục chương trình đào tạo'));
        fetchPrograms();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [pageSize, search, sortStatus]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

    const filteredPrograms = useMemo(() => {
        let data = [...programs];

        if (search) {
            const keyword = search.toLowerCase();
            data = data.filter((item) => {
                return item.title.toLowerCase().includes(keyword) || item.slug.toLowerCase().includes(keyword) || (item.content || '').toLowerCase().includes(keyword);
            });
        }

        if (sortStatus.columnAccessor) {
            const sorted = sortBy(data, sortStatus.columnAccessor as keyof Program);
            if (sortStatus.direction === 'desc') {
                sorted.reverse();
            }
            data = sorted;
        }

        return data;
    }, [programs, search, sortStatus]);

    const paginatedRecords = useMemo(() => {
        const from = (page - 1) * pageSize;
        const to = from + pageSize;
        return filteredPrograms.slice(from, to);
    }, [filteredPrograms, page, pageSize]);

    const formatDate = (date: string | number | Date) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    const onSubmit: SubmitHandler<ProgramFormValues> = async (values) => {
        const title = values.title.trim();
        const slug = createSlugFromTitle(title);
        const cleanedContent = stripBase64Images(contentValue);

        const payload = {
            title,
            slug,
            description: values.description?.trim() || '',
            content: cleanedContent,
            active: values.active,
        };

        try {
            if (editingProgram) {
                await http.put(`admin/programs/${editingProgram.id}`, payload);
            } else {
                await http.post('admin/programs', payload);
            }
            refreshSitemap(SITEMAP_REFRESH_URL);

            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: editingProgram ? 'Cập nhật danh mục thành công!' : 'Thêm danh mục thành công!',
                timer: 2000,
                showConfirmButton: false,
            });

            setAddModalOpen(false);
            setEditingProgram(null);
            setContentValue('');
            reset({
                title: '',
                active: true,
                description: '',
                content: '',
            });
            fetchPrograms();
        } catch (error: any) {
            console.error('Error submitting program form:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
            });
        }
    };

    return (
        <section>
            <div>
                <div className="panel mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl">Danh sách chương trình đào tạo</h2>
                        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setEditingProgram(null);
                                        setContentValue('');
                                        reset({
                                            title: '',
                                            active: true,
                                            description: '',
                                            content: '',
                                        });
                                        setAddModalOpen(true);
                                    }}
                                >
                                    <IconPlus className="ltr:mr-2 rtl:ml-2" />
                                    Thêm mới
                                </button>
                            </div>
                            <div className="relative">
                                <input type="text" placeholder="Tìm kiếm" className="form-input py-2 ltr:pr-11 rtl:pl-11 peer" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
                                <button
                                    type="button"
                                    className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2 peer-focus:text-primary"
                                    onClick={() => {
                                        if (searchInput) {
                                            setSearchInput('');
                                            setSearch('');
                                        }
                                    }}
                                >
                                    {searchInput ? <IconX className="mx-auto" /> : <IconSearch className="mx-auto" />}
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="datatables mt-5">
                        <DataTable
                            className="whitespace-nowrap table-hover"
                            records={paginatedRecords}
                            columns={[
                                {
                                    accessor: 'title',
                                    title: 'Tiêu đề',
                                    sortable: true,
                                    render: ({ title }) => <TextWithCopy text={title} className="text-multiline-2" />,
                                },
                                {
                                    accessor: 'description',
                                    title: 'Mô tả',
                                    render: ({ description }) => <TextWithCopy text={description} className="text-multiline-2" />,
                                },
                                {
                                    accessor: 'content',
                                    title: 'Nội dung chương trình',
                                    render: ({ content }) => <div className="whitespace-normal text-xs leading-relaxed text-multiline-2">{getContentPreview(content || '')}</div>,
                                },
                                {
                                    accessor: 'active',
                                    title: 'Trạng thái',
                                    render: ({ active }) => <span className={active ? 'badge bg-success' : 'badge bg-warning'}>{active ? 'Đang hiển thị' : 'Đã ẩn'}</span>,
                                    sortable: true,
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Ngày tạo',
                                    render: ({ createdAt }) => <div>{createdAt ? formatDate(createdAt) : '-'}</div>,
                                    sortable: true,
                                },
                                {
                                    accessor: 'action',
                                    title: 'Action',
                                    titleClassName: '!text-center',
                                    render: (program: Program) => (
                                        <div className="flex items-center w-max mx-auto gap-2">
                                            <Tippy content="Edit">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingProgram(program);
                                                        setContentValue(stripBase64Images(program.content || ''));
                                                        reset({
                                                            title: program.title,
                                                            active: program.active,
                                                            description: program.description,
                                                            content: program.content,
                                                        });
                                                        setAddModalOpen(true);
                                                    }}
                                                >
                                                    <IconPencil />
                                                </button>
                                            </Tippy>
                                            <Tippy content="Delete">
                                                <button
                                                    type="button"
                                                    onClick={async () => {
                                                        const result = await Swal.fire({
                                                            title: 'Bạn có chắc muốn xóa?',
                                                            text: 'Hành động này không thể hoàn tác!',
                                                            icon: 'warning',
                                                            showCancelButton: true,
                                                            confirmButtonColor: '#3085d6',
                                                            cancelButtonColor: '#d33',
                                                            confirmButtonText: 'Xóa',
                                                            cancelButtonText: 'Hủy',
                                                        });

                                                        if (result.isConfirmed) {
                                                            try {
                                                                await http.delete(`admin/programs/${program.id}`);
                                                                refreshSitemap(SITEMAP_REFRESH_URL);

                                                                Swal.fire({
                                                                    icon: 'success',
                                                                    title: 'Đã xóa!',
                                                                    text: 'Danh mục đã được xóa thành công.',
                                                                    timer: 1500,
                                                                    showConfirmButton: false,
                                                                });

                                                                fetchPrograms();
                                                            } catch (error: any) {
                                                                Swal.fire({
                                                                    icon: 'error',
                                                                    title: 'Lỗi',
                                                                    text: error?.response?.data?.message || 'Không thể xóa. Vui lòng thử lại.',
                                                                });
                                                            }
                                                        }
                                                    }}
                                                >
                                                    <IconTrashLines />
                                                </button>
                                            </Tippy>
                                        </div>
                                    ),
                                },
                            ]}
                            totalRecords={filteredPrograms.length}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            sortStatus={sortStatus}
                            onSortStatusChange={setSortStatus}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${totalRecords} of ${totalRecords} entries`}
                            fetching={loading}
                        />
                    </div>
                </div>
            </div>

            <Transition appear show={addModalOpen} as={Fragment}>
                <Dialog as="div" open={addModalOpen} onClose={() => setAddModalOpen(false)} className="relative z-[51]">
                    <Transition.Child as={Fragment} enter="ease-out duration-300" enterFrom="opacity-0" enterTo="opacity-100" leave="ease-in duration-200" leaveFrom="opacity-100" leaveTo="opacity-0">
                        <div className="fixed inset-0 bg-[black]/60" />
                    </Transition.Child>
                    <div className="fixed inset-0 overflow-y-auto">
                        <div className="flex min-h-full items-center justify-center px-4 py-8">
                            <Transition.Child
                                as={Fragment}
                                enter="ease-out duration-300"
                                enterFrom="opacity-0 scale-95"
                                enterTo="opacity-100 scale-100"
                                leave="ease-in duration-200"
                                leaveFrom="opacity-100 scale-100"
                                leaveTo="opacity-0 scale-95"
                            >
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-4xl text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddModalOpen(false);
                                            setEditingProgram(null);
                                            setContentValue('');
                                        }}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none z-10"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {editingProgram ? 'Chỉnh sửa danh mục' : 'Thêm danh mục'}
                                    </div>
                                    <div className="p-5 max-h-[80vh] overflow-y-auto">
                                        <form onSubmit={handleSubmit(onSubmit)}>
                                            <div className="mb-5">
                                                <label htmlFor="title">Tiêu đề chương trình đào tạo</label>
                                                <textarea
                                                    id="title"
                                                    placeholder="Nhập tiêu đề"
                                                    className="form-textarea resize-none min-h-[80px]"
                                                    rows={3}
                                                    {...register('title', { required: 'Tiêu đề là bắt buộc', validate: notBlank('Tiêu đề là bắt buộc') })}
                                                />
                                                {errors.title && <p className="mt-1 text-sm text-red-500">{errors.title.message}</p>}
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="description">Mô tả ngắn</label>
                                                <textarea
                                                    id="description"
                                                    placeholder="Nhập mô tả ngắn cho chương trình"
                                                    className="form-textarea resize-none min-h-[80px]"
                                                    rows={3}
                                                    {...register('description')}
                                                />
                                            </div>

                                            <div className="mb-5">
                                                <div className="flex items-center justify-between mb-2">
                                                    <label className="font-semibold">Nội dung chi tiết</label>
                                                </div>
                                                <div>
                                                    <div id="toolbar-programs">
                                                        <span className="ql-formats">
                                                            <select className="ql-font">
                                                                <option value="sans-serif"></option>
                                                                <option value="serif"></option>
                                                                <option value="monospace"></option>
                                                            </select>
                                                        </span>

                                                        <span className="ql-formats">
                                                            <select className="ql-size">
                                                                <option value="small"></option>
                                                                <option value=""></option>
                                                                <option value="large"></option>
                                                                <option value="huge"></option>
                                                            </select>
                                                        </span>

                                                        <span className="ql-formats">
                                                            <select className="ql-header" defaultValue="">
                                                                <option value="">Normal</option>
                                                                <option value="2">H2</option>
                                                                <option value="3">H3</option>
                                                            </select>
                                                        </span>

                                                        <span className="ql-formats">
                                                            <select className="ql-align">
                                                                <option value=""></option>
                                                                <option value="center"></option>
                                                                <option value="right"></option>
                                                                <option value="justify"></option>
                                                            </select>
                                                        </span>

                                                        <span className="ql-formats">
                                                            <button className="ql-bold" />
                                                            <button className="ql-italic" />
                                                            <button className="ql-underline" />
                                                            <button className="ql-strike" />
                                                        </span>

                                                        <span className="ql-formats">
                                                            <select className="ql-color"></select>
                                                            <select className="ql-background"></select>
                                                        </span>

                                                        <span className="ql-formats">
                                                            <button className="ql-script" value="super" />
                                                            <button className="ql-script" value="sub" />
                                                        </span>

                                                        <span className="ql-formats">
                                                            <button className="ql-blockquote" />
                                                            <button className="ql-code-block" />
                                                        </span>

                                                        <span className="ql-formats">
                                                            <button className="ql-list" value="ordered" />
                                                            <button className="ql-list" value="bullet" />
                                                        </span>

                                                        <span className="ql-formats">
                                                            <button className="ql-indent" value="-1" />
                                                            <button className="ql-indent" value="+1" />
                                                        </span>

                                                        <span className="ql-formats">
                                                            <button className="ql-link" />
                                                            <button className="ql-image" />
                                                            <button className="ql-video" />
                                                        </span>

                                                        <span className="ql-formats">
                                                            <button className="ql-clean" />
                                                        </span>
                                                    </div>
                                                    {addModalOpen && editorReady && (
                                                        <ReactQuill
                                                            ref={quillRef}
                                                            theme="snow"
                                                            value={contentValue}
                                                            onChange={setContentValue}
                                                            modules={modules}
                                                            placeholder="Soạn nội dung chi tiết cho chương trình đào tạo..."
                                                            className="quill-editor"
                                                        />
                                                    )}
                                                </div>
                                                {showPreview && (
                                                    <div className="border rounded p-3 bg-white mt-3 max-h-[360px] overflow-auto text-sm">
                                                        <div dangerouslySetInnerHTML={{ __html: contentValue }} />
                                                    </div>
                                                )}
                                            </div>

                                            <div className="mb-5 flex items-center gap-2">
                                                <label htmlFor="active" className="mb-0">
                                                    Kích hoạt
                                                </label>
                                                <input id="active" type="checkbox" className="form-checkbox" {...register('active')} />
                                            </div>
                                            <div className="flex justify-end items-center mt-8">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => {
                                                        reset();
                                                        setEditingProgram(null);
                                                        setContentValue('');
                                                        setAddModalOpen(false);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={isSubmitting}>
                                                    {isSubmitting ? (editingProgram ? 'Đang cập nhật...' : 'Đang lưu...') : editingProgram ? 'Cập nhật' : 'Lưu'}
                                                </button>
                                            </div>
                                        </form>
                                    </div>
                                </DialogPanel>
                            </Transition.Child>
                        </div>
                    </div>
                </Dialog>
            </Transition>
        </section>
    );
};

export default ProgramsTables;
