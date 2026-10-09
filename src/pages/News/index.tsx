import { useCallback, useEffect, useRef, useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPlus from '../../components/Icon/IconPlus';
import http, { createCancelableRequest } from '../../utils/http';
import { refreshSitemap } from '../../utils/sitemap';
import { SITEMAP_REFRESH_URL } from '../../configs/env';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
import SearchInput from '../../components/SearchInput';
import DataTable, { type Column } from '../../components/table/DataTable';
import TextWithCopy from '../../components/TextWithCopy';

type NewsItem = {
    id: number;
    title: string;
    slug: string;
    image?: string;
    summary?: string;
    isHot: boolean;
    published: boolean;
    createdAt?: string;
};

const NewsTables = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [records, setRecords] = useState<NewsItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10, 25, 50, 100];
    const [pageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');

    const cancelableRef = useRef<ReturnType<typeof createCancelableRequest> | null>(null);

    const fetchNews = async (pageValue = page, searchValue = search) => {
        // Hủy request cũ (nếu có) trước khi tạo request mới
        if (cancelableRef.current) {
            cancelableRef.current.cancel();
        }

        const cancelable = createCancelableRequest();
        cancelableRef.current = cancelable;

        setLoading(true);
        try {
            const res = await cancelable.request<{ data: NewsItem[]; meta: { total: number } }>({
                url: 'admin/posts',
                method: 'get',
                params: {
                    page: pageValue,
                    limit: pageSize,
                    ...(searchValue ? { search: searchValue } : {}),
                },
            });

            setRecords(res.data ?? []);
            setTotal(res.meta?.total ?? 0);
        } catch (error: any) {
            // Nếu là lỗi do bị cancel thì bỏ qua
            if (error?.name === 'CanceledError' || error?.message === 'canceled' || error?.code === 'ERR_CANCELED') {
                return;
            }
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không tải được danh sách tin tức.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Danh sách tin tức'));
    }, [dispatch]);

    useEffect(() => {
        // mỗi khi page hoặc search đổi thì gọi API 1 lần
        fetchNews(page, search);

        return () => {
            // cleanup: hủy request nếu dependency (page/search) đổi hoặc component unmount
            if (cancelableRef.current) {
                cancelableRef.current.cancel();
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, search]);

    useEffect(() => {
        setPage(1);
    }, [search]);

    const formatDate = (date?: string) => {
        if (!date) return '-';
        const dt = new Date(date);
        const d = dt.getDate().toString().padStart(2, '0');
        const m = (dt.getMonth() + 1).toString().padStart(2, '0');
        const y = dt.getFullYear();
        return `${d}/${m}/${y}`;
    };

    const handleSearch = useCallback((keyword: string) => setSearch(keyword), []);

    const removePost = async (item: NewsItem) => {
        const result = await Swal.fire({
            title: 'Xoá bài viết này?',
            text: `"${item.title}" sẽ bị xoá khỏi website. Không thể hoàn tác.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xoá',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#e7515a',
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        try {
            await http.delete(`admin/posts/${item.id}`);
            refreshSitemap(SITEMAP_REFRESH_URL);
            Swal.fire({ icon: 'success', title: 'Đã xoá', timer: 1500, showConfirmButton: false });
            fetchNews();
        } catch (error) {
            console.error('Lỗi xoá bài viết:', error);
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không thể xoá. Vui lòng thử lại.' });
        }
    };

    const columns: Column<NewsItem>[] = [
        { key: 'title', title: 'Tiêu đề', render: ({ title }) => <TextWithCopy text={title} className="text-multiline-2" /> },
        { key: 'summary', title: 'Tóm tắt', render: ({ summary }) => <TextWithCopy text={summary ?? ''} className="text-multiline-2" /> },
        { key: 'isHot', title: 'Nổi bật', render: ({ isHot }) => <span className={isHot ? 'font-semibold text-primary' : 'text-slate-400'}>{isHot ? 'Nổi bật' : 'Thường'}</span> },
        { key: 'published', title: 'Trạng thái', render: ({ published }) => <span className={published ? 'badge bg-success' : 'badge bg-warning'}>{published ? 'Đã xuất bản' : 'Nháp'}</span> },
        { key: 'createdAt', title: 'Ngày tạo', render: ({ createdAt }) => <>{formatDate(createdAt)}</> },
        {
            key: 'action',
            title: 'Thao tác',
            align: 'center',
            render: (item) => (
                <div className="mx-auto flex w-max items-center gap-2">
                    <Tippy content="Sửa">
                        <button type="button" onClick={() => navigate(`/news/${item.id}/edit`)}>
                            <IconPencil />
                        </button>
                    </Tippy>
                    <Tippy content="Xoá">
                        <button type="button" onClick={() => removePost(item)}>
                            <IconTrashLines />
                        </button>
                    </Tippy>
                </div>
            ),
        },
    ];

    return (
        <section>
            <div className="panel mt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <h2 className="text-xl">Danh sách tin tức</h2>
                    <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                        <button type="button" className="btn btn-primary" onClick={() => navigate('/news/create')}>
                            <IconPlus className="ltr:mr-2 rtl:ml-2" />
                            Thêm mới
                        </button>

                        <SearchInput onSearch={handleSearch} placeholder="Tìm theo tiêu đề" />
                    </div>
                </div>

                <div className="mt-5">
                    <DataTable
                        rows={records}
                        columns={columns}
                        rowKey={(row) => row.id}
                        unit="bài viết"
                        loading={loading}
                        server={{ total, page, pageSize, onPageChange: setPage }}
                    />
                </div>
            </div>
        </section>
    );
};

export default NewsTables;
