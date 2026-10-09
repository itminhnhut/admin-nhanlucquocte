// Danh sách ngành đào tạo. Thêm/sửa đã chuyển sang trang riêng (CRUD/Create.tsx),
// trước đây là modal nên soạn bài dài rất chật và bấm ra ngoài là mất sạch.
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import sortBy from 'lodash/sortBy';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
import { useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import IconPencil from '../../components/Icon/IconPencil';
import IconPlus from '../../components/Icon/IconPlus';
import IconSearch from '../../components/Icon/IconSearch';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconX from '../../components/Icon/IconX';
import TextWithCopy from '../../components/TextWithCopy';
import { SITEMAP_REFRESH_URL } from '../../configs/env';
import { setPageTitle } from '../../store/themeConfigSlice';
import http from '../../utils/http';
import { refreshSitemap } from '../../utils/sitemap';

type Program = {
    id: number;
    title: string;
    slug: string;
    content: string;
    active: boolean;
    description: string;
    image?: string;
    createdAt?: string;
};

const PAGE_SIZES = [30, 50, 100];

/** Rút gọn nội dung HTML thành vài chữ để xem lướt trong bảng */
function contentPreview(html: string) {
    const text = html
        .replace(/<[^>]*>/g, ' ')
        .replace(/&nbsp;/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    return text.length > 120 ? `${text.slice(0, 120)}…` : text || '—';
}

function formatDate(date: string | number | Date) {
    if (!date) return '-';
    const value = new Date(date);
    const month = String(value.getMonth() + 1).padStart(2, '0');
    const day = String(value.getDate()).padStart(2, '0');
    return `${day}/${month}/${value.getFullYear()}`;
}

function ProgramsTables() {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [programs, setPrograms] = useState<Program[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [sortStatus, setSortStatus] = useState<DataTableSortStatus>({ columnAccessor: 'id', direction: 'asc' });
    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const fetchPrograms = async () => {
        setLoading(true);
        try {
            const response = await http.get<{ data: Program[] }>('admin/programs', { params: { noPaginate: true } });
            setPrograms(response.data ?? []);
        } catch (error) {
            console.error('Lỗi tải danh sách ngành:', error);
            Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không tải được danh sách ngành đào tạo.' });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Ngành đào tạo'));
        fetchPrograms();
    }, []);

    useEffect(() => {
        setPage(1);
    }, [pageSize, search, sortStatus]);

    useEffect(() => {
        const timer = setTimeout(() => setSearch(searchInput.trim()), 400);
        return () => clearTimeout(timer);
    }, [searchInput]);

    const filteredPrograms = useMemo(() => {
        let data = [...programs];
        if (search) {
            const keyword = search.toLowerCase();
            data = data.filter((item) => item.title.toLowerCase().includes(keyword) || item.slug.toLowerCase().includes(keyword) || (item.content || '').toLowerCase().includes(keyword));
        }
        if (sortStatus.columnAccessor) {
            const sorted = sortBy(data, sortStatus.columnAccessor as keyof Program);
            if (sortStatus.direction === 'desc') sorted.reverse();
            data = sorted;
        }
        return data;
    }, [programs, search, sortStatus]);

    const paginatedRecords = useMemo(() => {
        const from = (page - 1) * pageSize;
        return filteredPrograms.slice(from, from + pageSize);
    }, [filteredPrograms, page, pageSize]);

    const removeProgram = async (program: Program) => {
        const result = await Swal.fire({
            title: 'Xoá ngành này?',
            text: `"${program.title}" sẽ bị xoá khỏi website. Không thể hoàn tác.`,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonText: 'Xoá',
            cancelButtonText: 'Hủy',
            confirmButtonColor: '#e7515a',
            reverseButtons: true,
        });
        if (!result.isConfirmed) return;
        try {
            await http.delete(`admin/programs/${program.id}`);
            refreshSitemap(SITEMAP_REFRESH_URL);
            Swal.fire({ icon: 'success', title: 'Đã xoá', timer: 1500, showConfirmButton: false });
            fetchPrograms();
        } catch (error) {
            const message = (error as { response?: { data?: { message?: string } } })?.response?.data?.message;
            Swal.fire({ icon: 'error', title: 'Lỗi', text: message || 'Không thể xoá. Vui lòng thử lại.' });
        }
    };

    return (
        <section>
            <div className="panel mt-6">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <h2 className="text-xl">Ngành đào tạo</h2>
                    <div className="flex w-full flex-col gap-4 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
                        <button type="button" className="btn btn-primary" data-testid="them-nganh" onClick={() => navigate('/programs/create')}>
                            <IconPlus className="ltr:mr-2 rtl:ml-2" />
                            Thêm ngành
                        </button>
                        <div className="relative">
                            <input type="text" placeholder="Tìm theo tên ngành" className="form-input peer py-2 ltr:pr-11 rtl:pl-11" value={searchInput} onChange={(event) => setSearchInput(event.target.value)} />
                            <button
                                type="button"
                                className="absolute top-1/2 -translate-y-1/2 peer-focus:text-primary ltr:right-[11px] rtl:left-[11px]"
                                onClick={() => {
                                    setSearchInput('');
                                    setSearch('');
                                }}
                            >
                                {searchInput ? <IconX className="mx-auto" /> : <IconSearch className="mx-auto" />}
                            </button>
                        </div>
                    </div>
                </div>

                <div className="datatables mt-5">
                    <DataTable
                        className="table-hover whitespace-nowrap"
                        records={paginatedRecords}
                        columns={[
                            { accessor: 'title', title: 'Tên ngành', sortable: true, render: ({ title }) => <TextWithCopy text={title} className="text-multiline-2" /> },
                            { accessor: 'description', title: 'Mô tả ngắn', render: ({ description }) => <TextWithCopy text={description} className="text-multiline-2" /> },
                            {
                                accessor: 'image',
                                title: 'Ảnh',
                                render: ({ image, title }) =>
                                    image ? <img src={image} alt={title} className="h-10 w-16 rounded object-cover" /> : <span className="text-xs text-slate-400">chưa có</span>,
                            },
                            { accessor: 'content', title: 'Nội dung', render: ({ content }) => <div className="text-multiline-2 whitespace-normal text-xs leading-relaxed">{contentPreview(content || '')}</div> },
                            {
                                accessor: 'active',
                                title: 'Trạng thái',
                                sortable: true,
                                render: ({ active }) => <span className={active ? 'badge bg-success' : 'badge bg-warning'}>{active ? 'Đang hiển thị' : 'Đã ẩn'}</span>,
                            },
                            { accessor: 'createdAt', title: 'Ngày tạo', sortable: true, render: ({ createdAt }) => <div>{formatDate(createdAt ?? '')}</div> },
                            {
                                accessor: 'action',
                                title: 'Thao tác',
                                titleClassName: '!text-center',
                                render: (program: Program) => (
                                    <div className="mx-auto flex w-max items-center gap-2">
                                        <Tippy content="Sửa">
                                            <button type="button" data-testid={`sua-${program.id}`} onClick={() => navigate(`/programs/${program.id}/edit`)}>
                                                <IconPencil />
                                            </button>
                                        </Tippy>
                                        <Tippy content="Xoá">
                                            <button type="button" onClick={() => removeProgram(program)}>
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
                        paginationText={({ from, to, totalRecords }) => `Hiện ${from}–${to} trong ${totalRecords} ngành`}
                        fetching={loading}
                    />
                </div>
            </div>
        </section>
    );
}

export default ProgramsTables;
