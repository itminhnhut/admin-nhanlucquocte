import { apiErrorMessage } from '../../utils/apiError';
import { formatDate, formatGradYear, isOddGradYear } from '../../utils/formatDate';
import 'flatpickr/dist/flatpickr.css';
import DataTable from '../../components/table/DataTable';
import { useEffect, useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

import IconSearch from '../../components/Icon/IconSearch';
import IconX from '../../components/Icon/IconX';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import StatusBadge, { type BadgeTone } from '../../components/StatusBadge';
import InfoCell from '../../components/table/InfoCell';
import TextWithCopy from '../../components/TextWithCopy';
import http from '../../utils/http';
import Swal from 'sweetalert2';

type DegreeRecord = {
    id: number;
    studentId: number;
    student?: {
        id: number;
        studentCode: string;
    },
    cccd: string;
    fullName: string;
    dob: string;
    degreeCode: string;
    major: string;
    rank: string;
    yearOfGrad: number;
    createdAt?: string;
};

/** Tham số gửi lên API khi lấy danh sách */
type QueryParams = Record<string, string | number | boolean | undefined>;

const DegreesList = () => {
    const [degrees, setDegrees] = useState<DegreeRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    /** Màu theo hạng tốt nghiệp. Giỏi trở lên xanh, khá vàng, còn lại xám. */
function rankTone(rank?: string): BadgeTone {
    const value = (rank || '').toLowerCase();
    if (value.includes('xuất sắc') || value.includes('giỏi')) return 'ok';
    if (value.includes('khá')) return 'warn';
    return 'muted';
}

const PAGE_SIZES = [10];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const fetchDegrees = async (pageValue = page, pageSizeValue = pageSize, searchValue = search) => {
        setLoading(true);
        try {
            const params: QueryParams = {
                page: pageValue,
                limit: pageSizeValue,
            };

            if (searchValue) {
                params.search = searchValue;
            }

            const res = await http.get<{ data: DegreeRecord[]; meta?: { total?: number } }>('admin/degrees', {
                params,
            });

            setDegrees(res.data ?? []);
            setTotal(res.meta?.total ?? res.data?.length ?? 0);
        } catch (error) {
            console.error('Error fetching degrees:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không tải được danh sách tốt nghiệp.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [pageSize, search]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

    useEffect(() => {
        fetchDegrees(page, pageSize, search);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, search]);


    const handleDeleteDegree = async (degree: DegreeRecord) => {
        const result = await Swal.fire({
            title: 'Xóa văn bằng?',
            text: 'Bạn có chắc chắn muốn xóa văn bằng này?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
        });

        if (!result.isConfirmed) {
            return;
        }

        try {
            await http.delete(`admin/degrees/id/${degree.id}`);
            Swal.fire({
                icon: 'success',
                title: 'Đã xóa',
                timer: 1500,
                showConfirmButton: false,
            });
            fetchDegrees(page, pageSize, search);
        } catch (error) {
            console.error('Failed to delete degree:', error);
            Swal.fire({
                icon: 'error',
                title: 'Không thể xóa',
                text: apiErrorMessage(error, 'Vui lòng thử lại.'),
            });
        }
    };

    return (
        <section>
            <div>
                <div className="panel mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl">Văn bằng</h2>
                        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
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
                            rows={degrees}
                            columns={[
                                {
                                    key: 'fullName',
                                    title: 'Học viên',
                                    sortable: true,
                                    className: 'min-w-[240px]',
                                    render: ({ fullName, student, cccd, dob }) => (
                                        <InfoCell
                                            rows={[
                                                [{ value: fullName, strong: true, copy: true }],
                                                [
                                                    { label: 'Mã SV', value: student?.studentCode, copy: true },
                                                    { label: 'CCCD', value: cccd, copy: true },
                                                    { label: 'Sinh', value: dob ? formatDate(dob) : '' },
                                                ],
                                            ]}
                                        />
                                    ),
                                },
                                {
                                    key: 'degreeCode',
                                    title: 'Văn bằng',
                                    sortable: true,
                                    className: 'min-w-[200px]',
                                    render: ({ degreeCode, major }) => (
                                        <InfoCell
                                            rows={[[{ value: degreeCode, strong: true, copy: true }], [{ label: 'Ngành', value: major || 'chưa ghi' }]]}
                                        />
                                    ),
                                },
                                { key: 'rank', title: 'Xếp loại', sortable: true, render: ({ rank }) => <StatusBadge tone={rankTone(rank)}>{rank || 'chưa xếp'}</StatusBadge> },
                                {
                                    key: 'yearOfGrad',
                                    title: 'Tốt nghiệp',
                                    sortable: true,
                                    align: 'center',
                                    render: ({ yearOfGrad }) =>
                                        isOddGradYear(yearOfGrad) ? (
                                            <span className="whitespace-nowrap text-amber-600" title="Dữ liệu không đúng dạng năm hay ngày, cần sửa lại">
                                                {String(yearOfGrad)} ⚠
                                            </span>
                                        ) : (
                                            <span className="whitespace-nowrap">{formatGradYear(yearOfGrad)}</span>
                                        ),
                                },
                                {
                                    key: 'actions',
                                    title: 'Thao tác',
                                    align: 'center',
                                    render: (record: DegreeRecord) => (
                                        <div className="flex items-center justify-center gap-2">
                                            <Tippy content="Xóa">
                                                <button type="button" className="btn btn-sm btn-danger-light !py-1.5" onClick={() => handleDeleteDegree(record)}>
                                                    <IconTrashLines className="w-4.5 h-4.5" />
                                                </button>
                                            </Tippy>
                                        </div>
                                    ),
                                },
                            ]}
                            rowKey={(row) => row.id}
                            unit="văn bằng"
                            loading={loading}
                            server={{ total: total, page, pageSize, onPageChange: setPage }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default DegreesList;
