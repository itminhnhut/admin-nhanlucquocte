import InfoCell from '../../components/table/InfoCell';
import StatusBadge, { type BadgeTone } from '../../components/StatusBadge';
import { formatDate } from '../../utils/formatDate';
import 'flatpickr/dist/flatpickr.css';
import DataTable from '../../components/table/DataTable';
import { useEffect, useState } from 'react';

import IconSearch from '../../components/Icon/IconSearch';
import TextWithCopy from '../../components/TextWithCopy';
import http from '../../utils/http';
import Swal from 'sweetalert2';
import IconX from '../../components/Icon/IconX';

type AttendanceRecord = {
    id: number;
    studentId: number;
    date: string;
    status: string;
    subject: string;
    note?: string;
    createdAt?: string;
    student: {
        id: number;
        studentCode: string;
        fullName: string;
    };
};

// Có mặt xanh, đi trễ vàng, vắng mặt đỏ — nhìn lướt là thấy buổi nào có vấn đề
/** Tham số gửi lên API khi lấy danh sách */
type QueryParams = Record<string, string | number | boolean | undefined>;

const ATTENDANCE_LABELS: Record<string, string> = { PRESENT: 'Có mặt', ABSENT: 'Vắng mặt', LATE: 'Đi trễ' };
const ATTENDANCE_TONES: Record<string, BadgeTone> = { PRESENT: 'ok', ABSENT: 'brand', LATE: 'warn' };

const AttendanceList = () => {
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const fetchAttendances = async (pageValue = page, pageSizeValue = pageSize, searchValue = search) => {
        setLoading(true);
        try {
            const params: QueryParams = {
                page: pageValue,
                limit: pageSizeValue,
            };

            if (searchValue) {
                params.search = searchValue;
            }

            const res = await http.get<{ data: AttendanceRecord[]; meta?: { total?: number } }>('admin/attendances', {
                params,
            });

            setAttendances(res.data ?? []);
            setTotal(res.meta?.total ?? res.data?.length ?? 0);
        } catch (error) {
            console.error('Error fetching attendance:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không tải được danh sách điểm danh.',
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
        return () => clearTimeout(handler);
    }, [searchInput]);

    useEffect(() => {
        fetchAttendances(page, pageSize, search);
    }, [page, pageSize, search]);


    return (
        <section>
            <div>
                <div className="panel mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl">Điểm danh</h2>
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
                            rows={attendances}
                            columns={[
                                {
                                    key: 'student',
                                    title: 'Học viên',
                                    className: 'min-w-[210px]',
                                    render: ({ student }) => (
                                        <InfoCell
                                            rows={[
                                                [{ value: student?.fullName, strong: true, copy: true }],
                                                [{ label: 'Mã SV', value: student?.studentCode, copy: true }],
                                            ]}
                                        />
                                    ),
                                },
                                {
                                    key: 'date',
                                    title: 'Buổi học',
                                    sortable: true,
                                    className: 'min-w-[170px]',
                                    render: ({ date, subject }) => (
                                        <InfoCell rows={[[{ value: date ? formatDate(date) : '', strong: true }], [{ label: 'Môn', value: subject || 'chưa ghi' }]]} />
                                    ),
                                },
                                {
                                    key: 'status',
                                    title: 'Trạng thái',
                                    sortable: true,
                                    render: ({ status }) => <StatusBadge tone={ATTENDANCE_TONES[status] ?? 'muted'}>{ATTENDANCE_LABELS[status] ?? 'Không xác định'}</StatusBadge>,
                                },
                                {
                                    key: 'note',
                                    title: 'Ghi chú',
                                    className: 'min-w-[160px] whitespace-normal',
                                    render: ({ note }) => <span className="text-[13px] text-slate-700">{note?.trim() || <span className="text-slate-400">—</span>}</span>,
                                },
                                                        ]}
                            rowKey={(row) => row.id}
                            unit="buổi điểm danh"
                            loading={loading}
                            server={{ total: total, page, pageSize, onPageChange: setPage }}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AttendanceList;
