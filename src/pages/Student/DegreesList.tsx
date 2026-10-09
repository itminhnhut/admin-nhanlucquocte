import 'flatpickr/dist/flatpickr.css';
import DataTable from '../../components/table/DataTable';
import { useEffect, useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';

import IconSearch from '../../components/Icon/IconSearch';
import IconX from '../../components/Icon/IconX';
import IconTrashLines from '../../components/Icon/IconTrashLines';
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

const DegreesList = () => {
    const [degrees, setDegrees] = useState<DegreeRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const PAGE_SIZES = [10];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const fetchDegrees = async (pageValue = page, pageSizeValue = pageSize, searchValue = search) => {
        setLoading(true);
        try {
            const params: any = {
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

    const formatDate = (date: string | number | Date) => {
        if (date) {
            const dt = new Date(date);
            const month = dt.getMonth() + 1 < 10 ? '0' + (dt.getMonth() + 1) : dt.getMonth() + 1;
            const day = dt.getDate() < 10 ? '0' + dt.getDate() : dt.getDate();
            return day + '/' + month + '/' + dt.getFullYear();
        }
        return '';
    };

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
        } catch (error: any) {
            console.error('Failed to delete degree:', error);
            Swal.fire({
                icon: 'error',
                title: 'Không thể xóa',
                text: error?.response?.data?.message || 'Vui lòng thử lại.',
            });
        }
    };

    return (
        <section>
            <div>
                <div className="panel mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl uppercase">Danh sách tốt nghiệp</h2>
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
                                    key: 'studentId',
                                    title: 'Mã sinh viên',
                                    render: ({ student, studentId }) => <TextWithCopy text={studentId !== undefined && studentId !== null ? String(student.studentCode) : ''} />,
                                },
                                {
                                    key: 'fullName',
                                    title: 'Họ và tên',
                                    render: ({ fullName }) => <TextWithCopy text={fullName} />,
                                },
                                {
                                    key: 'cccd',
                                    title: 'CCCD',
                                    render: ({ cccd }) => <TextWithCopy text={cccd} />,
                                },
                                {
                                    key: 'dob',
                                    title: 'Ngày sinh',
                                    render: ({ dob }) => <div>{dob ? formatDate(dob) : '-'}</div>,
                                },
                                {
                                    key: 'degreeCode',
                                    title: 'Mã văn bằng',
                                    render: ({ degreeCode }) => <TextWithCopy text={degreeCode} />,
                                },
                                {
                                    key: 'major',
                                    title: 'Ngành học',
                                },
                                {
                                    key: 'rank',
                                    title: 'Xếp loại',
                                },
                                {
                                    key: 'yearOfGrad',
                                    title: 'Năm tốt nghiệp',
                                },
                                {
                                    key: 'createdAt',
                                    title: 'Ngày tạo',
                                    render: ({ createdAt }) => <div>{createdAt ? formatDate(createdAt) : '-'}</div>,
                                },
                                {
                                    key: 'actions',
                                    title: 'Action',
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
