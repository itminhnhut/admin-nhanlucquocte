// Danh sách ngành đào tạo. Thêm/sửa đã chuyển sang trang riêng (CRUD/Create.tsx),
// trước đây là modal nên soạn bài dài rất chật và bấm ra ngoài là mất sạch.
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import Swal from 'sweetalert2';
import IconPencil from '../../components/Icon/IconPencil';
import IconPlus from '../../components/Icon/IconPlus';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import SearchInput from '../../components/SearchInput';
import DataTable, { type Column } from '../../components/table/DataTable';
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
    const [search, setSearch] = useState('');
    const handleSearch = useCallback((keyword: string) => setSearch(keyword), []);

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

    const filteredPrograms = useMemo(() => {
        if (!search) return programs;
        const keyword = search.toLowerCase();
        return programs.filter((item) => item.title.toLowerCase().includes(keyword) || item.slug.toLowerCase().includes(keyword) || (item.content || '').toLowerCase().includes(keyword));
    }, [programs, search]);

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

    const columns: Column<Program>[] = [
        { key: 'title', title: 'Tên ngành', sortable: true, render: ({ title }) => <TextWithCopy text={title} className="text-multiline-2" /> },
        { key: 'description', title: 'Mô tả ngắn', render: ({ description }) => <TextWithCopy text={description} className="text-multiline-2" /> },
        {
            key: 'image',
            title: 'Ảnh',
            render: ({ image, title }) => (image ? <img src={image} alt={title} className="h-10 w-16 rounded object-cover" /> : <span className="text-xs text-slate-400">chưa có</span>),
        },
        { key: 'content', title: 'Nội dung', className: 'max-w-[320px] whitespace-normal', render: ({ content }) => <div className="text-xs leading-relaxed">{contentPreview(content || '')}</div> },
        {
            key: 'active',
            title: 'Trạng thái',
            sortable: true,
            render: ({ active }) => <span className={active ? 'badge bg-success' : 'badge bg-warning'}>{active ? 'Đang hiển thị' : 'Đã ẩn'}</span>,
        },
        { key: 'createdAt', title: 'Ngày tạo', sortable: true, render: ({ createdAt }) => <>{formatDate(createdAt ?? '')}</> },
        {
            key: 'action',
            title: 'Thao tác',
            align: 'center',
            render: (program) => (
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
    ];

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
                        <SearchInput onSearch={handleSearch} placeholder="Tìm theo tên ngành" />
                    </div>
                </div>

                <div className="mt-5">
                    <DataTable rows={filteredPrograms} columns={columns} rowKey={(row) => row.id} unit="ngành" loading={loading} initialSort={{ key: 'id', direction: 'asc' }} />
                </div>
            </div>
        </section>
    );
}

export default ProgramsTables;
