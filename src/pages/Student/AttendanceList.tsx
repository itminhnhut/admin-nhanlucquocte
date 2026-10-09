import 'flatpickr/dist/flatpickr.css';
import { DataTable, DataTableSortStatus } from 'mantine-datatable';
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
            const params: any = {
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

    const formatDate = (date: string | number | Date) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

    return (
        <section>
            <div>
                <div className="panel mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl uppercase">Danh sách điểm danh</h2>
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
                            className="whitespace-nowrap table-hover"
                            records={attendances}
                            columns={[
                                {
                                    accessor: 'student.studentCode',
                                    title: 'Mã sinh viên',
                                    render: ({ student }) => <TextWithCopy text={student?.studentCode} />,
                                },
                                {
                                    accessor: 'student',
                                    title: 'Họ và tên',
                                    render: ({ student }) => <TextWithCopy text={student?.fullName} />,
                                },
                                {
                                    accessor: 'date',
                                    title: 'Ngày học',
                                    render: ({ date }) => <div>{date ? formatDate(date) : '-'}</div>,
                                },
                                {
                                    accessor: 'subject',
                                    title: 'Môn học',
                                    render: ({ subject }) => <TextWithCopy text={subject} />,
                                },
                                {
                                    accessor: 'status',
                                    title: 'Trạng thái',
                                    render: ({ status }) => {
                                        let label = 'Không xác định';
                                        if (status === 'PRESENT') label = 'Có mặt';
                                        else if (status === 'ABSENT') label = 'Vắng mặt';
                                        else if (status === 'LATE') label = 'Đi trễ';
                                        return <TextWithCopy text={label} />;
                                    },
                                },
                                {
                                    accessor: 'note',
                                    title: 'Ghi chú',
                                },
                                {
                                    accessor: 'createdAt',
                                    title: 'Ngày tạo',
                                    render: ({ createdAt }) => <div>{createdAt ? formatDate(createdAt) : '-'}</div>,
                                },
                            ]}
                            totalRecords={total}
                            recordsPerPage={pageSize}
                            page={page}
                            onPageChange={setPage}
                            recordsPerPageOptions={PAGE_SIZES}
                            onRecordsPerPageChange={setPageSize}
                            minHeight={200}
                            paginationText={({ from, to, totalRecords }) => `Showing ${from} to ${to} of ${totalRecords} entries`}
                            fetching={loading}
                        />
                    </div>
                </div>
            </div>
        </section>
    );
};

export default AttendanceList;
