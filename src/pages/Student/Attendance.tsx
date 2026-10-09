import { formatDate } from '../../utils/formatDate';
import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import DataTable from '../../components/table/DataTable';
import { Fragment, useEffect, useMemo, useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import IconPencil from '../../components/Icon/IconPencil';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconPlus from '../../components/Icon/IconPlus';
import IconX from '../../components/Icon/IconX';
import { useForm, SubmitHandler, Controller } from 'react-hook-form';
import IconSearch from '../../components/Icon/IconSearch';
import Drawer from '../../components/Drawer';
import StatusBadge, { type BadgeTone } from '../../components/StatusBadge';
import http from '../../utils/http';
import { notBlank, cleanPayload } from '../../utils/cleanInput';
import Swal from 'sweetalert2';
import { Link, useParams } from 'react-router-dom';

type AttendanceRecord = {
    id: number;
    studentId: number;
    date: string;
    status: string;
    subject: string;
    note?: string;
    createdAt?: string;
};

type AttendanceFormValues = {
    date: string;
    status: string;
    subject: string;
    note: string;
};

const Attendance = () => {
    const dispatch = useDispatch();
    const { id: studentIdParam } = useParams<{ id: string }>();

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [attendances, setAttendances] = useState<AttendanceRecord[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [editingAttendance, setEditingAttendance] = useState<AttendanceRecord | null>(null);
    const [studentInfo, setStudentInfo] = useState<{
        fullName: string;
        studentCode?: string;
        className?: string;
        email?: string;
        phone?: string;
        cccd?: string;
    } | null>(null);

    console.log(editingAttendance);
    // Fetch student info
    useEffect(() => {
        if (!studentIdParam) return;
        const fetchStudentInfo = async () => {
            try {
                const res = await http.get('admin/students/' + studentIdParam);
                setStudentInfo(res?.data || null);
            } catch (error) {
                setStudentInfo(null);
            }
        };
        fetchStudentInfo();
    }, [studentIdParam]);

    const [page, setPage] = useState(1);
    // Có mặt xanh, đi trễ vàng, vắng mặt đỏ — nhìn lướt là biết buổi nào có vấn đề
const ATTENDANCE_LABELS: Record<string, string> = { PRESENT: 'Có mặt', ABSENT: 'Vắng mặt', LATE: 'Đi trễ' };
const ATTENDANCE_TONES: Record<string, BadgeTone> = { PRESENT: 'ok', ABSENT: 'brand', LATE: 'warn' };

const PAGE_SIZES = [10];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [search, setSearch] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        getValues,
        control,
        formState: { errors, isSubmitting, isDirty },
    } = useForm<AttendanceFormValues>({
        defaultValues: {
            date: '',
            status: 'PRESENT',
            subject: '',
            note: '',
        },
    });

    const fetchAttendances = async (pageValue = page, pageSizeValue = pageSize, searchValue = search) => {
        if (!studentIdParam) return;
        setLoading(true);
        try {
            const params: any = {
                page: pageValue,
                limit: pageSizeValue,
                studentId: studentIdParam,
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
        dispatch(setPageTitle('Điểm danh sinh viên'));
    }, [dispatch]);

    useEffect(() => {
        setPage(1);
    }, [pageSize, search]);

    useEffect(() => {
        fetchAttendances(page, pageSize, search);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, search]);


    const onSubmit: SubmitHandler<AttendanceFormValues> = async (values) => {
        const studentId = Number(studentIdParam);
        const payload = cleanPayload({
            studentId,
            date: values.date,
            status: values.status,
            subject: values.subject,
            note: values.note,
        });

        try {
            if (editingAttendance) {
                await http.put(`admin/attendances/${editingAttendance.id}`, payload);
            } else {
                await http.post('admin/attendances', payload);
            }

            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: editingAttendance ? 'Cập nhật điểm danh thành công!' : 'Thêm điểm danh thành công!',
                timer: 2000,
                showConfirmButton: false,
            });

            setAddModalOpen(false);
            setEditingAttendance(null);
            reset({
                date: '',
                status: 'PRESENT',
                subject: '',
                note: '',
            });
            fetchAttendances();
        } catch (error: any) {
            console.error('Error submitting attendance form:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
            });
        }
    };

    return (
        <section>
            <ul className="flex space-x-2 rtl:space-x-reverse">
                <li>
                    <Link to="/students" className="text-primary hover:underline">
                        Danh sách sinh viên
                    </Link>
                </li>
                <li className="before:content-['/'] ltr:before:mr-2 rtl:before:ml-2">
                    <span>{studentInfo?.fullName || 'Điểm danh'}</span>
                </li>
            </ul>

            {studentInfo && (
                <div className="mt-4">
                    <div className="overflow-x-auto rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#111827] shadow-sm">
                        <table className="min-w-[480px] text-sm text-gray-700 dark:text-gray-300">
                            <tbody>
                                <tr className="border-b border-gray-100 dark:border-gray-700">
                                    <td className="px-4 py-2 font-semibold w-40">Sinh viên</td>
                                    <td className="px-4 py-2">
                                        {studentInfo.fullName}
                                        {studentInfo.studentCode ? ` (${studentInfo.studentCode})` : ''}
                                    </td>
                                </tr>
                                {studentInfo.cccd && (
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <td className="px-4 py-2 font-semibold">CCCD</td>
                                        <td className="px-4 py-2">{studentInfo.cccd}</td>
                                    </tr>
                                )}
                                {studentInfo.className && (
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <td className="px-4 py-2 font-semibold">Lớp</td>
                                        <td className="px-4 py-2">{studentInfo.className}</td>
                                    </tr>
                                )}
                                {studentInfo.email && (
                                    <tr className="border-b border-gray-100 dark:border-gray-700">
                                        <td className="px-4 py-2 font-semibold">Email</td>
                                        <td className="px-4 py-2">{studentInfo.email}</td>
                                    </tr>
                                )}
                                {studentInfo.phone && (
                                    <tr>
                                        <td className="px-4 py-2 font-semibold">SĐT</td>
                                        <td className="px-4 py-2">{studentInfo.phone}</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
            <div>
                <div className="panel mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl">Điểm danh</h2>
                        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    data-testid="them-diem-danh" className="btn btn-primary"
                                    onClick={() => {
                                        setEditingAttendance(null);
                                        reset({
                                            date: '',
                                            status: 'PRESENT',
                                            subject: '',
                                            note: '',
                                        });
                                        setAddModalOpen(true);
                                    }}
                                >
                                    <IconPlus className="ltr:mr-2 rtl:ml-2" />
                                    Thêm mới
                                </button>
                            </div>
                            <div className="relative">
                                <input type="text" placeholder="Tìm kiếm" className="form-input py-2 ltr:pr-11 rtl:pl-11 peer" value={search} onChange={(e) => setSearch(e.target.value)} />
                                <button type="button" className="absolute ltr:right-[11px] rtl:left-[11px] top-1/2 -translate-y-1/2 peer-focus:text-primary">
                                    <IconSearch className="mx-auto" />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="datatables mt-5">
                        <DataTable
                            rows={attendances}
                            columns={[
                                {
                                    key: 'date',
                                    title: 'Ngày học',
                                    render: ({ date }) => <div>{date ? formatDate(date) : '-'}</div>,
                                },
                                {
                                    key: 'subject',
                                    title: 'Môn học',
                                },
                                {
                                    key: 'status',
                                    title: 'Trạng thái',
                                    render: ({ status }) => <StatusBadge tone={ATTENDANCE_TONES[status] ?? 'muted'}>{ATTENDANCE_LABELS[status] ?? 'Không xác định'}</StatusBadge>,
                                },
                                {
                                    key: 'note',
                                    title: 'Ghi chú',
                                },
                                {
                                    key: 'createdAt',
                                    title: 'Ngày tạo',
                                    render: ({ createdAt }) => <div>{createdAt ? formatDate(createdAt) : '-'}</div>,
                                },
                                {
                                    key: 'action',
                                    title: 'Action',
                                    align: 'center',
                                    render: (attendance: AttendanceRecord) => (
                                        <div className="flex items-center w-max mx-auto gap-2">
                                            <Tippy content="Edit">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingAttendance(attendance);
                                                        reset({
                                                            date: attendance.date ? attendance.date.split('T')[0] : '',
                                                            status: attendance.status,
                                                            subject: attendance.subject,
                                                            note: attendance.note || '',
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
                                                                await http.delete(`admin/attendances/${attendance.id}`);

                                                                Swal.fire({
                                                                    icon: 'success',
                                                                    title: 'Đã xóa!',
                                                                    text: 'Bản ghi điểm danh đã được xóa thành công.',
                                                                    timer: 1500,
                                                                    showConfirmButton: false,
                                                                });

                                                                fetchAttendances();
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
                            rowKey={(row) => row.id}
                            unit="buổi điểm danh"
                            loading={loading}
                            server={{ total: total, page, pageSize, onPageChange: setPage }}
                        />
                    </div>
                </div>
            </div>

            <Drawer
                open={addModalOpen}
                title="Buổi điểm danh"
                dirty={isDirty}
                saving={isSubmitting}
                saveLabel="Lưu điểm danh"
                onClose={() => setAddModalOpen(false)}
                onSave={handleSubmit(onSubmit)}
            >

                                            <div className="mb-5">
                                                <label htmlFor="date">
                                                    Ngày điểm danh <span className="text-red-500">*</span>
                                                </label>
                                                <Controller
                                                    name="date"
                                                    control={control}
                                                    rules={{ required: 'Ngày điểm danh là bắt buộc' }}
                                                    render={({ field }) => (
                                                        <Flatpickr
                                                            id="date"
                                                            className="form-input"
                                                            options={{ dateFormat: 'Y-m-d' }}
                                                            placeholder="Chọn ngày điểm danh"
                                                            value={field.value || ''}
                                                            onChange={(dates) => {
                                                                const d = dates[0];
                                                                if (!d) {
                                                                    field.onChange('');
                                                                    return;
                                                                }
                                                                const year = d.getFullYear();
                                                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                                                const day = String(d.getDate()).padStart(2, '0');
                                                                field.onChange(`${year}-${month}-${day}`);
                                                            }}
                                                        />
                                                    )}
                                                />
                                                {errors.date && <p className="mt-1 text-sm text-red-500">{errors.date.message}</p>}
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="status">
                                                    Trạng thái <span className="text-red-500">*</span>
                                                </label>
                                                <select id="status" className="form-input" {...register('status', { required: 'Trạng thái là bắt buộc' })}>
                                                    <option value="PRESENT">Có mặt</option>
                                                    <option value="ABSENT">Vắng mặt</option>
                                                    <option value="LATE">Đi trễ</option>
                                                </select>
                                                {errors.status && <p className="mt-1 text-sm text-red-500">{errors.status.message}</p>}
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="subject">
                                                    Môn học <span className="text-red-500">*</span>
                                                </label>
                                                <input id="subject" type="text" placeholder="Nhập tên môn học" className="form-input" {...register('subject', { required: 'Môn học là bắt buộc', validate: notBlank('Môn học là bắt buộc') })} />
                                                {errors.subject && <p className="mt-1 text-sm text-red-500">{errors.subject.message}</p>}
                                            </div>
                                            <div className="mb-5">
                                                <label htmlFor="note">Ghi chú</label>
                                                <input id="note" type="text" placeholder="Nhập ghi chú" className="form-input" {...register('note')} />
                                                {errors.note && <p className="mt-1 text-sm text-red-500">{errors.note.message}</p>}
                                            </div>

                                            <div className="flex justify-end items-center mt-8">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => {
                                                        reset({
                                                            date: '',
                                                            status: 'PRESENT',
                                                            subject: '',
                                                            note: '',
                                                        });
                                                        setEditingAttendance(null);
                                                        setAddModalOpen(false);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            </div>
            </Drawer>
        </section>
    );
};

export default Attendance;
