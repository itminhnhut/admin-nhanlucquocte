import Flatpickr from 'react-flatpickr';
import 'flatpickr/dist/flatpickr.css';
import Select from 'react-select';
import CreatableSelect from 'react-select/creatable';
import DataTable from '../../components/table/DataTable';
import { Fragment, useEffect, useMemo, useState, FormEvent } from 'react';
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
import TextWithCopy from '../../components/TextWithCopy';
import http from '../../utils/http';
import { notBlank, trimStrings } from '../../utils/trimStrings';
import Swal from 'sweetalert2';
import { useNavigate } from 'react-router-dom';

type Student = {
    id: number;
    studentCode: string;
    fullName: string;
    cccd: string;
    dob: string;
    className: string;
    email: string;
    // phone: string;
    createdAt?: string;
    degrees?: any[];
    isDegree?: boolean;
};

type StudentFormValues = {
    studentCode: string;
    fullName: string;
    cccd: string;
    dob: string;
    className: string;
    // email: string;
    phone: string;
};

type GraduationFormValues = {
    degreeCode: string;
    major: string;
    rank: string;
    yearOfGrad: string;
};

const StudentsTables = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [addModalOpen, setAddModalOpen] = useState(false);
    const [students, setStudents] = useState<Student[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [editingStudent, setEditingStudent] = useState<Student | null>(null);

    const [graduationModalOpen, setGraduationModalOpen] = useState(false);
    const [selectedStudentForGraduation, setSelectedStudentForGraduation] = useState<Student | null>(null);
    const [graduationForm, setGraduationForm] = useState<GraduationFormValues>({
        degreeCode: '',
        major: '',
        rank: '',
        yearOfGrad: new Date().getFullYear().toString(),
    });
    const [programOptions, setProgramOptions] = useState<{ value: number; label: string }[]>([]);
    const [graduationSubmitting, setGraduationSubmitting] = useState(false);
    const [graduationMode, setGraduationMode] = useState<'create' | 'view'>('create');
    useEffect(() => {
        // Fetch program options for Graduation form
        const fetchPrograms = async () => {
            try {
                const res = await http.get<{ data: { id: number; title: string }[] }>('admin/programs?noPaginate=true');
                setProgramOptions(
                    (res.data ?? []).map((prog: any) => ({
                        value: prog.id,
                        label: prog.title,
                    })),
                );
            } catch (e) {
                // Optionally handle error
            }
        };
        fetchPrograms();
    }, []);

    const [page, setPage] = useState(1);
    const PAGE_SIZES = [30, 50, 100];
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);

    const [search, setSearch] = useState('');
    const [searchInput, setSearchInput] = useState('');

    const {
        register,
        handleSubmit,
        reset,
        getValues,
        formState: { errors, isSubmitting },
    } = useForm<StudentFormValues>({
        defaultValues: {
            studentCode: '',
            fullName: '',
            cccd: '',
            dob: '',
            className: '',
            // email: '',
            // phone: '',
        },
    });

    const fetchStudents = async (pageValue = page, pageSizeValue = pageSize, searchValue = search) => {
        setLoading(true);
        try {
            const params: any = {
                page: pageValue,
                limit: pageSizeValue,
            };

            if (searchValue) {
                params.search = searchValue;
            }

            const res = await http.get<{ data: Student[]; meta?: { total?: number } }>('admin/students', {
                params,
            });

            const students = res.data.map((student) => {
                console.log(student.fullName, student.degrees?.length > 0);
                return {
                    ...student,
                    isDegree: student.degrees?.length > 0,
                };
            });

            setStudents(students ?? []);
            setTotal(res.meta?.total ?? students?.length ?? 0);
        } catch (error) {
            console.error('Error fetching students:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: 'Không tải được danh sách sinh viên.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        dispatch(setPageTitle('Danh sách sinh viên'));
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
        setPage(1);
    }, [pageSize, search]);

    useEffect(() => {
        fetchStudents(page, pageSize, search);
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

    const onSubmit: SubmitHandler<StudentFormValues> = async (values) => {
        const payload = trimStrings({
            studentCode: values.studentCode,
            fullName: values.fullName,
            cccd: values.cccd,
            dob: values.dob,
            className: values.className,
            // email: values.email,
            // phone: values.phone,
        });

        try {
            if (editingStudent) {
                await http.put(`admin/students/${editingStudent.id}`, payload);
            } else {
                await http.post('admin/students', payload);
            }

            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: editingStudent ? 'Cập nhật sinh viên thành công!' : 'Thêm sinh viên thành công!',
                timer: 2000,
                showConfirmButton: false,
            });

            setAddModalOpen(false);
            setEditingStudent(null);
            reset({
                studentCode: '',
                fullName: '',
                cccd: '',
                dob: '',
                className: '',
                // email: '',
                // phone: '',
            });
            fetchStudents();
        } catch (error: any) {
            console.error('Error submitting student form:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error?.response?.data?.message || 'Có lỗi xảy ra. Vui lòng thử lại.',
            });
        }
    };

    const handleGraduationSubmit = async (e: FormEvent) => {
        e.preventDefault();
        if (!selectedStudentForGraduation) return;

        const payload = trimStrings({
            cccd: selectedStudentForGraduation.cccd,
            fullName: selectedStudentForGraduation.fullName,
            dob: selectedStudentForGraduation.dob,
            degreeCode: graduationForm.degreeCode,
            major: graduationForm.major,
            rank: graduationForm.rank,
            yearOfGrad: Number(graduationForm.yearOfGrad) || new Date().getFullYear(),
            studentId: selectedStudentForGraduation.id,
        });

        if (!payload.degreeCode) {
            Swal.fire({ icon: 'warning', title: 'Mã bằng là bắt buộc', timer: 2000, showConfirmButton: false });
            return;
        }

        try {
            setGraduationSubmitting(true);

            await http.post('admin/degrees', payload);

            Swal.fire({
                icon: 'success',
                title: 'Thành công',
                text: 'Đã ghi nhận thông tin tốt nghiệp.',
                timer: 2000,
                showConfirmButton: false,
            });

            await fetchStudents();

            setGraduationModalOpen(false);
            setSelectedStudentForGraduation(null);
            setGraduationForm({
                degreeCode: '',
                major: '',
                rank: '',
                yearOfGrad: new Date().getFullYear().toString(),
            });
        } catch (error: any) {
            console.error('Error creating degree:', error);
            Swal.fire({
                icon: 'error',
                title: 'Lỗi',
                text: error?.response?.data?.message || 'Không thể lưu thông tin tốt nghiệp. Vui lòng thử lại.',
            });
        } finally {
            setGraduationSubmitting(false);
        }
    };

    return (
        <section>
            <div>
                <div className="panel mt-6">
                    <div className="flex items-center justify-between flex-wrap gap-4">
                        <h2 className="text-xl">Danh sách sinh viên</h2>
                        <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    className="btn btn-primary"
                                    onClick={() => {
                                        setEditingStudent(null);
                                        reset({
                                            studentCode: '',
                                            fullName: '',
                                            cccd: '',
                                            dob: '',
                                            className: '',
                                            // email: '',
                                            // phone: '',
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
                            rows={students}
                            columns={[
                                {
                                    key: 'studentCode',
                                    title: 'Mã SV',
                                    render: ({ studentCode }) => <TextWithCopy text={studentCode} />,
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
                                    key: 'class',
                                    title: 'Lớp',
                                },
                                // {
                                //     key: 'email',
                                //     title: 'Email',
                                // },
                                {
                                    key: 'dob',
                                    title: 'Ngày sinh',
                                    render: ({ dob }) => <div>{dob ? formatDate(dob) : '-'}</div>,
                                },
                                // {
                                //     key: 'phone',
                                //     title: 'Số điện thoại',
                                // },
                                {
                                    key: 'createdAt',
                                    title: 'Ngày tạo',
                                    render: ({ createdAt }) => <div>{createdAt ? formatDate(createdAt) : '-'}</div>,
                                },
                                {
                                    key: 'action',
                                    title: 'Action',
                                    align: 'center',
                                    render: (student: Student) => (
                                        <div className="flex items-start w-max gap-2">
                                            <Tippy content="Điểm danh">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        navigate(`/students/${student.id}/attendance`);
                                                    }}
                                                    className="btn px-2 py-1 text-xs btn-info"
                                                >
                                                    ĐIỂM DANH
                                                </button>
                                            </Tippy>

                                            {!student.isDegree ? (
                                                <Tippy content="Tốt nghiệp">
                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setGraduationMode('create');
                                                            setSelectedStudentForGraduation(student);
                                                            setGraduationForm({
                                                                degreeCode: '',
                                                                major: '',
                                                                rank: '',
                                                                yearOfGrad: new Date().getFullYear().toString(),
                                                            });
                                                            setGraduationModalOpen(true);
                                                        }}
                                                        className="btn px-2 py-1 text-xs btn-warning"
                                                    >
                                                        TỐT NGHIỆP
                                                    </button>
                                                </Tippy>
                                            ) : (
                                                <Tippy content="Xem thông tin tốt nghiệp">
                                                    <button
                                                        type="button"
                                                        onClick={async () => {
                                                            try {
                                                                setGraduationMode('view');

                                                                // API trả dạng { data: [...] } nên lấy phần tử đầu tiên
                                                                const res: any = await http.get(`admin/degrees?studentId=${student.id}`);
                                                                const detailList: any[] = res.data || [];
                                                                const degree = detailList.length > 0 ? detailList[0] : null;

                                                                // Gán thông tin sinh viên (không lấy từ degree vì API trả student riêng)
                                                                setSelectedStudentForGraduation({
                                                                    ...student,
                                                                    dob: student.dob,
                                                                    fullName: student.fullName,
                                                                    cccd: student.cccd,
                                                                    studentCode: student.studentCode,
                                                                });

                                                                // Fill form tốt nghiệp
                                                                setGraduationForm({
                                                                    degreeCode: degree?.degreeCode || '',
                                                                    major: degree?.major || '',
                                                                    rank: degree?.rank || '',
                                                                    yearOfGrad: (degree?.yearOfGrad || new Date().getFullYear()).toString(),
                                                                });

                                                                setGraduationModalOpen(true);
                                                            } catch (error: any) {
                                                                Swal.fire({
                                                                    icon: 'error',
                                                                    title: 'Lỗi',
                                                                    text: error?.response?.data?.message || 'Không lấy được thông tin tốt nghiệp. Vui lòng thử lại.',
                                                                });
                                                            }
                                                        }}
                                                        className="btn px-2 py-1 text-xs btn-success"
                                                    >
                                                        XEM BẰNG
                                                    </button>
                                                </Tippy>
                                            )}

                                            <Tippy content="Chỉnh sửa">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setEditingStudent(student);
                                                        reset({
                                                            studentCode: student.studentCode,
                                                            fullName: student.fullName,
                                                            cccd: student.cccd,
                                                            // dob từ API có dạng ISO, cắt lại còn yyyy-MM-dd cho form
                                                            dob: student.dob ? String(student.dob).slice(0, 10) : '',
                                                            // BE đang trả field `class`, còn form dùng `className`
                                                            className: (student as any).className || (student as any).class || '',
                                                        });
                                                        setAddModalOpen(true);
                                                    }}
                                                >
                                                    <IconPencil />
                                                </button>
                                            </Tippy>

                                            <Tippy content="Xóa">
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
                                                                await http.delete(`admin/students/${student.id}`);
                                                                Swal.fire({
                                                                    icon: 'success',
                                                                    title: 'Đã xóa!',
                                                                    text: 'Sinh viên đã được xóa thành công.',
                                                                    timer: 1500,
                                                                    showConfirmButton: false,
                                                                });
                                                                fetchStudents();
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
                            unit="học viên"
                            loading={loading}
                            server={{ total: total, page, pageSize, onPageChange: setPage }}
                        />
                    </div>
                </div>
            </div>

            {/* Modal thêm / sửa sinh viên */}
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
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setAddModalOpen(false);
                                            setEditingStudent(null);
                                            reset();
                                        }}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">
                                        {editingStudent ? 'Chỉnh sửa sinh viên' : 'Thêm sinh viên'}
                                    </div>
                                    <div className="p-5">
                                        <form onSubmit={handleSubmit(onSubmit)}>
                                            <div className="mb-5">
                                                <label htmlFor="studentCode">
                                                    Mã sinh viên <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="studentCode"
                                                    type="text"
                                                    placeholder="Nhập mã sinh viên"
                                                    className="form-input"
                                                    {...register('studentCode', { required: 'Mã sinh viên là bắt buộc', validate: notBlank('Mã sinh viên là bắt buộc') })}
                                                />
                                                {errors.studentCode && <p className="mt-1 text-sm text-red-500">{errors.studentCode.message}</p>}
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="fullName">
                                                    Họ và tên <span className="text-red-500">*</span>
                                                </label>
                                                <input id="fullName" type="text" placeholder="Nhập họ tên" className="form-input" {...register('fullName', { required: 'Họ tên là bắt buộc', validate: notBlank('Họ tên là bắt buộc') })} />
                                                {errors.fullName && <p className="mt-1 text-sm text-red-500">{errors.fullName.message}</p>}
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="cccd">
                                                    CCCD <span className="text-red-500">*</span>
                                                </label>
                                                <input id="cccd" type="text" placeholder="Nhập số CCCD/CMND" className="form-input" {...register('cccd', { required: 'CCCD là bắt buộc', validate: notBlank('CCCD là bắt buộc') })} />
                                                {errors.cccd && <p className="mt-1 text-sm text-red-500">{errors.cccd.message}</p>}
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="dob">
                                                    Ngày sinh <span className="text-red-500">*</span>
                                                </label>
                                                <Flatpickr
                                                    id="dob"
                                                    className="form-input"
                                                    options={{ dateFormat: 'Y-m-d' }}
                                                    placeholder="Chọn ngày sinh"
                                                    {...register('dob', { required: 'Ngày sinh là bắt buộc' })}
                                                    value={getValues('dob') || ''}
                                                    onChange={(_dates, dateStr) => {
                                                        // dateStr đã theo format 'Y-m-d' đúng local, không bị lệch ngày
                                                        reset({ ...getValues(), dob: dateStr || '' });
                                                    }}
                                                />
                                                {errors.dob && <p className="mt-1 text-sm text-red-500">{errors.dob.message}</p>}
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="className">Lớp</label>
                                                <input id="className" type="text" placeholder="Nhập tên lớp" className="form-input" {...register('className')} />
                                                {errors.className && <p className="mt-1 text-sm text-red-500">{errors.className.message}</p>}
                                            </div>

                                            {/* <div className="mb-5">
                                                <label htmlFor="email">
                                                    Email <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="email"
                                                    type="email"
                                                    placeholder="Nhập email"
                                                    className="form-input"
                                                    {...register('email', {
                                                        required: 'Email là bắt buộc',
                                                        pattern: {
                                                            value: /^\S+@\S+$/i,
                                                            message: 'Email không hợp lệ',
                                                        },
                                                    })}
                                                />
                                                {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>}
                                            </div> */}

                                            {/* <div className="mb-5">
                                                <label htmlFor="phone">
                                                    Số điện thoại <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="phone"
                                                    type="text"
                                                    placeholder="Nhập số điện thoại"
                                                    className="form-input"
                                                    {...register('phone', { required: 'Số điện thoại là bắt buộc' })}
                                                />
                                                {errors.phone && <p className="mt-1 text-sm text-red-500">{errors.phone.message}</p>}
                                            </div> */}

                                            <div className="flex justify-end items-center mt-8">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => {
                                                        reset();
                                                        setEditingStudent(null);
                                                        setAddModalOpen(false);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                                <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={isSubmitting}>
                                                    {isSubmitting ? (editingStudent ? 'Đang cập nhật...' : 'Đang lưu...') : editingStudent ? 'Cập nhật' : 'Lưu'}
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

            {/* Modal Tốt nghiệp */}
            <Transition appear show={graduationModalOpen} as={Fragment}>
                <Dialog as="div" open={graduationModalOpen} onClose={() => setGraduationModalOpen(false)} className="relative z-[51]">
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
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-lg text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setGraduationModalOpen(false);
                                            setSelectedStudentForGraduation(null);
                                        }}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>

                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">Thông tin tốt nghiệp</div>

                                    <div className="p-5">
                                        <form onSubmit={handleGraduationSubmit}>
                                            <div className="mb-4 text-sm bg-slate-50 dark:bg-slate-900/40 rounded p-3">
                                                <div>
                                                    <span className="font-semibold">Họ tên:</span> {selectedStudentForGraduation?.fullName || '-'}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">CCCD:</span> {selectedStudentForGraduation?.cccd || '-'}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Ngày sinh:</span> {selectedStudentForGraduation?.dob ? formatDate(selectedStudentForGraduation.dob) : '-'}
                                                </div>
                                                <div>
                                                    <span className="font-semibold">Mã SV:</span> {selectedStudentForGraduation?.studentCode || '-'}
                                                </div>
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="degreeCode">
                                                    Mã bằng <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="degreeCode"
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Nhập mã bằng tốt nghiệp"
                                                    value={graduationForm.degreeCode}
                                                    onChange={(e) =>
                                                        setGraduationForm((prev) => ({
                                                            ...prev,
                                                            degreeCode: e.target.value,
                                                        }))
                                                    }
                                                    required
                                                    disabled={graduationMode === 'view'}
                                                />
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="major">
                                                    Ngành học <span className="text-red-500">*</span>
                                                </label>
                                                <CreatableSelect
                                                    classNamePrefix="react-select"
                                                    options={programOptions}
                                                    placeholder="Chọn / nhập ngành"
                                                    isClearable
                                                    isDisabled={graduationMode === 'view'}
                                                    value={programOptions.find((o) => o.label === graduationForm.major) || (graduationForm.major ? { value: -1, label: graduationForm.major } : null)}
                                                    onChange={(opt) => {
                                                        setGraduationForm((prev) => ({
                                                            ...prev,
                                                            major: opt ? opt.label : '',
                                                        }));
                                                    }}
                                                    onCreateOption={(inputValue) => {
                                                        const newOption = { value: -1, label: inputValue };
                                                        setProgramOptions((prev) => [...prev, newOption]);
                                                        setGraduationForm((prev) => ({
                                                            ...prev,
                                                            major: inputValue,
                                                        }));
                                                    }}
                                                />
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="rank">
                                                    Xếp loại <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="rank"
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="VD: Xuất sắc, Giỏi, Khá..."
                                                    value={graduationForm.rank}
                                                    onChange={(e) =>
                                                        setGraduationForm((prev) => ({
                                                            ...prev,
                                                            rank: e.target.value,
                                                        }))
                                                    }
                                                    required
                                                    disabled={graduationMode === 'view'}
                                                />
                                            </div>

                                            <div className="mb-5">
                                                <label htmlFor="yearOfGrad">
                                                    Năm tốt nghiệp <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="yearOfGrad"
                                                    type="number"
                                                    className="form-input"
                                                    placeholder="Nhập năm tốt nghiệp"
                                                    value={graduationForm.yearOfGrad}
                                                    onChange={(e) =>
                                                        setGraduationForm((prev) => ({
                                                            ...prev,
                                                            yearOfGrad: e.target.value,
                                                        }))
                                                    }
                                                    required
                                                    disabled={graduationMode === 'view'}
                                                />
                                            </div>

                                            <div className="flex justify-end items-center mt-8">
                                                <button
                                                    type="button"
                                                    className="btn btn-outline-danger"
                                                    onClick={() => {
                                                        setGraduationModalOpen(false);
                                                        setSelectedStudentForGraduation(null);
                                                    }}
                                                >
                                                    {graduationMode === 'view' ? 'Đóng' : 'Hủy'}
                                                </button>
                                                {graduationMode === 'create' && (
                                                    <button type="submit" className="btn btn-primary ltr:ml-4 rtl:mr-4" disabled={graduationSubmitting}>
                                                        {graduationSubmitting ? 'Đang lưu...' : 'Lưu thông tin'}
                                                    </button>
                                                )}
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

export default StudentsTables;
