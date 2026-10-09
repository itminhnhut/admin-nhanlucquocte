import { useEffect, useState, useRef } from 'react';
import { DataTable } from 'mantine-datatable';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '../../store/themeConfigSlice';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPlus from '../../components/Icon/IconPlus';
import IconSearch from '../../components/Icon/IconSearch';
import IconX from '../../components/Icon/IconX';
import http, { createCancelableRequest } from '../../utils/http';
import { refreshSitemap } from '../../utils/sitemap';
import { SITEMAP_REFRESH_URL } from '../../configs/env';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';
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
    const [searchInput, setSearchInput] = useState('');

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
        const handler = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

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
                    {/* @ts-ignore */}
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        records={records}
                        columns={[
                            {
                                accessor: 'title',
                                title: 'Tiêu đề',
                                render: ({ title }) => <TextWithCopy text={title} className="text-multiline-2" />,
                            },
                            {
                                accessor: 'summary',
                                title: 'Tóm tắt',
                                render: ({ summary }) => <TextWithCopy text={summary} className="text-multiline-2" />,
                            },
                            {
                                accessor: 'isHot',
                                title: 'Nổi bật',
                                render: ({ isHot }) => <span className={isHot ? 'text-red-500 font-semibold' : ''}>{isHot ? 'HOT' : 'Thường'}</span>,
                            },
                            {
                                accessor: 'published',
                                title: 'Trạng thái',
                                render: ({ published }) => <span className={published ? 'text-green-600' : 'text-gray-400'}>{published ? 'Đã xuất bản' : 'Nháp'}</span>,
                            },
                            {
                                accessor: 'createdAt',
                                title: 'Ngày tạo',
                                render: ({ createdAt }) => formatDate(createdAt),
                            },
                            {
                                accessor: 'action',
                                title: 'Action',
                                titleClassName: '!text-center',
                                render: (item: NewsItem) => (
                                    <div className="flex items-center w-max mx-auto gap-2">
                                        <Tippy content="Edit">
                                            <button type="button" onClick={() => navigate(`/news/${item.id}/edit`)}>
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
                                                            await http.delete(`admin/posts/${item.id}`);
                                                            refreshSitemap(SITEMAP_REFRESH_URL);
                                                            Swal.fire({
                                                                icon: 'success',
                                                                title: 'Đã xóa!',
                                                                timer: 1500,
                                                                showConfirmButton: false,
                                                            });
                                                            fetchNews();
                                                        } catch (error) {
                                                            Swal.fire({
                                                                icon: 'error',
                                                                title: 'Lỗi',
                                                                text: 'Không thể xóa. Vui lòng thử lại.',
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
                        totalRecords={total}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={setPage}
                        recordsPerPageOptions={PAGE_SIZES}
                        fetching={loading}
                        paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </section>
    );
};

export default NewsTables;
