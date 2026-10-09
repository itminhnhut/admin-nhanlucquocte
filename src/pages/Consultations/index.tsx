import DataTable from '../../components/table/DataTable';
import { Fragment, useCallback, useEffect, useMemo, useState } from 'react';
import Tippy from '@tippyjs/react';
import 'tippy.js/dist/tippy.css';
import { Dialog, DialogPanel, Transition } from '@headlessui/react';
import { Controller, SubmitHandler, useForm } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import IconPlus from '../../components/Icon/IconPlus';
import IconEye from '../../components/Icon/IconEye';
import IconTrashLines from '../../components/Icon/IconTrashLines';
import IconX from '../../components/Icon/IconX';
import IconSearch from '../../components/Icon/IconSearch';
import { setPageTitle } from '../../store/themeConfigSlice';
import http from '../../utils/http';
import { notBlank, trimStrings } from '../../utils/trimStrings';
import Select, { InputActionMeta } from 'react-select';
import TextWithCopy from '../../components/TextWithCopy';

type ConsultationStatus = 'PENDING' | 'PROCESSING' | 'PROCESSED';

type Consultation = {
    id: number;
    fullName: string;
    phone: string;
    email?: string;
    location?: string;
    currentLevel?: string;
    note?: string;
    status: ConsultationStatus;
    programId?: number;
    program?: {
        id: number;
        title: string;
    };
    createdAt?: string;
    updatedAt?: string;
};

type ConsultationFormValues = {
    fullName: string;
    phone: string;
    email?: string;
    location?: string;
    currentLevel?: string;
    note?: string;
    status: ConsultationStatus;
    programId?: string;
};

const PAGE_SIZES = [10, 20, 50];

const STATUS_OPTIONS: { value: ConsultationStatus; label: string }[] = [
    { value: 'PENDING', label: 'Chờ xử lý' },
    { value: 'PROCESSING', label: 'Đang xử lý' },
    { value: 'PROCESSED', label: 'Đã xử lý' },
];

const STATUS_STYLES: Record<ConsultationStatus, string> = {
    PENDING: 'badge bg-warning/20 text-warning',
    PROCESSING: 'badge bg-info/20 text-info',
    PROCESSED: 'badge bg-success/20 text-success',
};

const ConsultationsPage = () => {
    const dispatch = useDispatch();

    const [consultations, setConsultations] = useState<Consultation[]>([]);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [total, setTotal] = useState(0);
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [programFilter, setProgramFilter] = useState<string>('');
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [detailModalOpen, setDetailModalOpen] = useState(false);
    const [selectedConsultation, setSelectedConsultation] = useState<Consultation | null>(null);
    const [programOptions, setProgramOptions] = useState<{ value: string; label: string }[]>([]);
    const [programLoading, setProgramLoading] = useState(false);
    const [searchInput, setSearchInput] = useState('');

    const {
        register: registerCreate,
        control: createControl,
        handleSubmit: handleCreateSubmit,
        reset: resetCreateForm,
        formState: { errors: createErrors, isSubmitting: creating },
    } = useForm<ConsultationFormValues>({
        defaultValues: {
            fullName: '',
            phone: '',
            email: '',
            location: '',
            currentLevel: '',
            note: '',
            status: 'PENDING',
            programId: '',
        },
    });

    const {
        register: registerUpdate,
        control: updateControl,
        handleSubmit: handleUpdateSubmit,
        reset: resetUpdateForm,
        formState: { errors: updateErrors, isSubmitting: updating },
    } = useForm<ConsultationFormValues>({
        defaultValues: {
            fullName: '',
            phone: '',
            email: '',
            location: '',
            currentLevel: '',
            note: '',
            status: 'PENDING',
            programId: '',
        },
    });

    useEffect(() => {
        dispatch(setPageTitle('Quản lý đăng ký tư vấn'));
    }, [dispatch]);

    const loadProgramOptions = useCallback(async (searchValue = '') => {
        setProgramLoading(true);
        try {
            const res = await http.get<{ data: { id: number; title: string }[] }>('admin/programs', {
                params: {
                    limit: 10,
                    ...(searchValue ? { search: searchValue } : {}),
                },
            });

            const mapped = (res.data ?? []).map((program) => ({
                value: String(program.id),
                label: program.title,
            }));

            setProgramOptions((prev) => {
                const merged = new Map<string, { value: string; label: string }>();
                [...prev, ...mapped].forEach((option) => {
                    merged.set(option.value, option);
                });
                return Array.from(merged.values());
            });
        } catch (error) {
            console.error('Failed to fetch programs', error);
        } finally {
            setProgramLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProgramOptions();
    }, [loadProgramOptions]);

    const ensureProgramOption = useCallback((program?: { id?: number; title?: string }) => {
        if (!program?.id) {
            return;
        }

        const optionValue = String(program.id);
        setProgramOptions((prev) => {
            if (prev.some((option) => option.value === optionValue)) {
                return prev;
            }

            return [
                ...prev,
                {
                    value: optionValue,
                    label: program.title || `Chương trình #${program.id}`,
                },
            ];
        });
    }, []);

    const handleProgramInputChange = useCallback(
        (value: string, actionMeta: InputActionMeta) => {
            if (actionMeta.action === 'input-change') {
                loadProgramOptions(value);
            }
        },
        [loadProgramOptions],
    );

    const fetchConsultations = async (pageValue = page, pageSizeValue = pageSize, searchValue = search) => {
        setLoading(true);
        try {
            const params: Record<string, string | number> = {
                page: pageValue,
                limit: pageSizeValue,
            };

            if (searchValue) {
                params.search = searchValue;
            }

            if (statusFilter !== 'ALL') {
                params.status = statusFilter;
            }

            if (programFilter) {
                params.programId = Number(programFilter);
            }

            const res = await http.get<{ data: Consultation[]; meta?: { total?: number } }>('admin/consultations', {
                params,
            });

            setConsultations(res.data ?? []);
            setTotal(res.meta?.total ?? res.data?.length ?? 0);
        } catch (error) {
            console.error('Failed to fetch consultations', error);
            Swal.fire({
                icon: 'error',
                title: 'Có lỗi xảy ra',
                text: 'Không thể tải danh sách đăng ký tư vấn. Vui lòng thử lại.',
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        setPage(1);
    }, [pageSize, statusFilter, programFilter, search]);

    useEffect(() => {
        const handler = setTimeout(() => {
            setSearch(searchInput.trim());
        }, 400);

        return () => {
            clearTimeout(handler);
        };
    }, [searchInput]);

    useEffect(() => {
        fetchConsultations(page, pageSize, search);
    }, [page, pageSize, statusFilter, programFilter, search]);

    const formatDate = (value?: string) => {
        if (!value) return '-';
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return '-';
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        return `${day}/${month}/${date.getFullYear()}`;
    };

    const openCreateModal = () => {
        resetCreateForm({
            fullName: '',
            phone: '',
            email: '',
            location: '',
            currentLevel: '',
            note: '',
            status: 'PENDING',
            programId: '',
        });
        setAddModalOpen(true);
    };

    const openDetailModal = (consultation: Consultation) => {
        setSelectedConsultation(consultation);
        resetUpdateForm({
            fullName: consultation.fullName || '',
            phone: consultation.phone || '',
            email: consultation.email || '',
            location: consultation.location || '',
            currentLevel: consultation.currentLevel || '',
            note: consultation.note || '',
            status: consultation.status || 'PENDING',
            programId: consultation.programId ? String(consultation.programId) : '',
        });
        ensureProgramOption({
            id: consultation.program?.id ?? consultation.programId,
            title: consultation.program?.title,
        });
        setDetailModalOpen(true);
    };

    const closeDetailModal = () => {
        setDetailModalOpen(false);
        setSelectedConsultation(null);
        resetUpdateForm();
    };

    const createConsultation: SubmitHandler<ConsultationFormValues> = async (rawValues) => {
        const values = trimStrings(rawValues);
        const payload: Record<string, string | number | undefined> = {
            fullName: values.fullName,
            phone: values.phone,
            status: values.status,
        };

        if (values.email) payload.email = values.email;
        if (values.location) payload.location = values.location;
        if (values.currentLevel) payload.currentLevel = values.currentLevel;
        if (values.note) payload.note = values.note;
        if (values.programId) payload.programId = Number(values.programId);

        try {
            await http.post('admin/consultations', payload);
            Swal.fire({
                icon: 'success',
                title: 'Tạo thành công',
                timer: 1500,
                showConfirmButton: false,
            });
            setAddModalOpen(false);
            resetCreateForm();
            fetchConsultations();
        } catch (error: any) {
            console.error('Failed to create consultation', error);
            Swal.fire({
                icon: 'error',
                title: 'Không thể tạo mới',
                text: error?.response?.data?.message || 'Vui lòng thử lại.',
            });
        }
    };

    const updateConsultation: SubmitHandler<ConsultationFormValues> = async (rawValues) => {
        if (!selectedConsultation) return;
        const values = trimStrings(rawValues);

        const payload: Record<string, string | number | undefined> = {
            fullName: values.fullName,
            phone: values.phone,
            status: values.status,
        };

        if (values.email) payload.email = values.email;
        if (values.location) payload.location = values.location;
        if (values.currentLevel) payload.currentLevel = values.currentLevel;
        if (values.note) payload.note = values.note;
        if (values.programId) payload.programId = Number(values.programId);

        try {
            await http.put(`admin/consultations/${selectedConsultation.id}`, payload);
            Swal.fire({
                icon: 'success',
                title: 'Cập nhật thành công',
                timer: 1500,
                showConfirmButton: false,
            });
            closeDetailModal();
            fetchConsultations();
        } catch (error: any) {
            console.error('Failed to update consultation', error);
            Swal.fire({
                icon: 'error',
                title: 'Không thể cập nhật',
                text: error?.response?.data?.message || 'Vui lòng thử lại.',
            });
        }
    };

    const handleDelete = async (consultation: Consultation) => {
        const result = await Swal.fire({
            title: 'Xóa form?',
            text: 'Bạn chắc chắn muốn xóa?',
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#d33',
            cancelButtonColor: '#3085d6',
            confirmButtonText: 'Xóa',
            cancelButtonText: 'Hủy',
        });

        if (!result.isConfirmed) return;

        try {
            await http.delete(`admin/consultations/${consultation.id}`);
            Swal.fire({
                icon: 'success',
                title: 'Đã xóa',
                timer: 1200,
                showConfirmButton: false,
            });
            fetchConsultations();
        } catch (error: any) {
            console.error('Failed to delete consultation', error);
            Swal.fire({
                icon: 'error',
                title: 'Không thể xóa',
                text: error?.response?.data?.message || 'Vui lòng thử lại.',
            });
        }
    };

    const statusFilterOptions = useMemo(() => ['ALL', ...STATUS_OPTIONS.map((status) => status.value)], []);

    return (
        <section>
            <div className="panel mt-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    <div>
                        <h2 className="text-xl font-semibold">Đăng ký tư vấn tuyển sinh</h2>
                        <p className="text-sm text-white-dark">Quản lý các form tư vấn từ portal client và tạo thủ công.</p>
                    </div>
                    <div className="flex sm:flex-row flex-col sm:items-center sm:gap-3 gap-4 w-full sm:w-auto">
                        <button type="button" className="btn btn-primary w-full sm:w-auto" onClick={openCreateModal}>
                            <IconPlus className="ltr:mr-2 rtl:ml-2" />
                            Tạo form
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

                <div className="grid sm:grid-cols-3 gap-4 mt-5">
                    <div>
                        <label className="text-sm font-medium mb-1 block" htmlFor="status-filter">
                            Trạng thái
                        </label>
                        <select id="status-filter" className="form-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                            {statusFilterOptions.map((option) => (
                                <option key={option} value={option}>
                                    {option === 'ALL' ? 'Tất cả' : STATUS_OPTIONS.find((status) => status.value === option)?.label || option}
                                </option>
                            ))}
                        </select>
                    </div>
                    {/* Program filter tạm ẩn */}
                </div>

                <div className="datatables mt-5">
                    <DataTable
                            rows={consultations}
                            columns={[
                            {
                                key: 'fullName',
                                title: 'Họ tên',
                                render: ({ fullName }) => <TextWithCopy text={fullName} className="text-multiline-2" />,
                            },
                            {
                                key: 'phone',
                                title: 'Điện thoại',
                                render: ({ phone }) => <TextWithCopy text={phone} className="text-multiline-2" />,
                            },
                            {
                                key: 'email',
                                title: 'Email',
                                render: ({ email }) => <TextWithCopy text={email} className="text-multiline-2" />,
                            },
                            {
                                key: 'status',
                                title: 'Trạng thái',
                                render: ({ status }) => (
                                    <span className={STATUS_STYLES[status] || 'badge bg-primary/20 text-primary'}>{STATUS_OPTIONS.find((option) => option.value === status)?.label || status}</span>
                                ),
                            },
                            {
                                key: 'createdAt',
                                title: 'Ngày tạo',
                                render: ({ createdAt }) => <div>{formatDate(createdAt)}</div>,
                            },
                            {
                                key: 'actions',
                                title: 'Action',
                                    align: 'center',
                                render: (record: Consultation) => (
                                    <div className="flex items-center w-max mx-auto gap-2">
                                        <Tippy content="Chi tiết">
                                            <button type="button" onClick={() => openDetailModal(record)} className="btn btn-sm btn-info-light !py-1.5">
                                                <IconEye className="w-4.5 h-4.5" />
                                            </button>
                                        </Tippy>
                                        <Tippy content="Xóa">
                                            <button type="button" onClick={() => handleDelete(record)} className="btn btn-sm btn-danger-light !py-1.5">
                                                <IconTrashLines className="w-4.5 h-4.5" />
                                            </button>
                                        </Tippy>
                                    </div>
                                ),
                            },
                        ]}
                            rowKey={(row) => row.id}
                            unit="đơn tư vấn"
                            loading={loading}
                            server={{ total: total, page, pageSize, onPageChange: setPage }}
                        />
                </div>
            </div>

            {/* Modal tạo form tư vấn */}
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
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-2xl text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={() => setAddModalOpen(false)}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">Tạo form tư vấn</div>
                                    <div className="p-5">
                                        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleCreateSubmit(createConsultation)}>
                                            <div className="md:col-span-1">
                                                <label className="block mb-1 font-medium" htmlFor="fullName-create">
                                                    Họ tên <span className="text-red-500">*</span>
                                                </label>
                                                <input id="fullName-create" type="text" className="form-input" placeholder="Nhập họ tên" {...registerCreate('fullName', { required: 'Bắt buộc', validate: notBlank('Bắt buộc') })} />
                                                {createErrors.fullName && <p className="text-sm text-red-500 mt-1">{createErrors.fullName.message}</p>}
                                            </div>
                                            <div className="md:col-span-1">
                                                <label className="block mb-1 font-medium" htmlFor="phone-create">
                                                    Điện thoại <span className="text-red-500">*</span>
                                                </label>
                                                <input id="phone-create" type="text" className="form-input" placeholder="Nhập số điện thoại" {...registerCreate('phone', { required: 'Bắt buộc', validate: notBlank('Bắt buộc') })} />
                                                {createErrors.phone && <p className="text-sm text-red-500 mt-1">{createErrors.phone.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="email-create">
                                                    Email
                                                </label>
                                                <input id="email-create" type="email" className="form-input" placeholder="Nhập email" {...registerCreate('email')} />
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="location-create">
                                                    Khu vực
                                                </label>
                                                <input id="location-create" type="text" className="form-input" placeholder="Nhập khu vực" {...registerCreate('location')} />
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="currentLevel-create">
                                                    Trình độ hiện tại
                                                </label>
                                                <input id="currentLevel-create" type="text" className="form-input" placeholder="Nhập trình độ" {...registerCreate('currentLevel')} />
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="program-create">
                                                    Chương trình quan tâm
                                                </label>
                                                <Controller
                                                    name="programId"
                                                    control={createControl}
                                                    render={({ field }) => (
                                                        <Select
                                                            inputId="program-create"
                                                            classNamePrefix="react-select"
                                                            isClearable
                                                            isSearchable
                                                            placeholder="Tìm kiếm chương trình"
                                                            options={programOptions}
                                                            value={programOptions.find((option) => option.value === field.value) || null}
                                                            onChange={(option) => field.onChange(option?.value ?? '')}
                                                            onBlur={field.onBlur}
                                                            onInputChange={handleProgramInputChange}
                                                            isLoading={programLoading}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="status-create">
                                                    Trạng thái
                                                </label>
                                                <select id="status-create" className="form-select" {...registerCreate('status')}>
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <option key={status.value} value={status.value}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block mb-1 font-medium" htmlFor="note-create">
                                                    Ghi chú
                                                </label>
                                                <textarea id="note-create" rows={3} className="form-textarea" placeholder="Nhập ghi chú" {...registerCreate('note')} />
                                            </div>
                                            <div className="md:col-span-2">
                                                <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={creating}>
                                                    {creating ? 'Đang lưu...' : 'Lưu'}
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

            {/* Modal chi tiết tư vấn */}
            <Transition appear show={detailModalOpen} as={Fragment}>
                <Dialog as="div" open={detailModalOpen} onClose={closeDetailModal} className="relative z-[51]">
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
                                <DialogPanel className="panel border-0 p-0 rounded-lg overflow-hidden w-full max-w-2xl text-black dark:text-white-dark">
                                    <button
                                        type="button"
                                        onClick={closeDetailModal}
                                        className="absolute top-4 ltr:right-4 rtl:left-4 text-gray-400 hover:text-gray-800 dark:hover:text-gray-600 outline-none"
                                    >
                                        <IconX />
                                    </button>
                                    <div className="text-lg font-medium bg-[#fbfbfb] dark:bg-[#121c2c] ltr:pl-5 rtl:pr-5 py-3 ltr:pr-[50px] rtl:pl-[50px]">Chi tiết tư vấn</div>
                                    <div className="p-5">
                                        <form className="grid grid-cols-1 md:grid-cols-2 gap-4" onSubmit={handleUpdateSubmit(updateConsultation)}>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="fullName-update">
                                                    Họ và tên <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="fullName-update"
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Nhập họ tên"
                                                    {...registerUpdate('fullName', {
                                                        required: 'Bắt buộc',
                                                        validate: notBlank('Bắt buộc'),
                                                    })}
                                                />
                                                {updateErrors.fullName && <p className="text-sm text-red-500 mt-1">{updateErrors.fullName.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="phone-update">
                                                    SĐT <span className="text-red-500">*</span>
                                                </label>
                                                <input
                                                    id="phone-update"
                                                    type="text"
                                                    className="form-input"
                                                    placeholder="Nhập số điện thoại"
                                                    {...registerUpdate('phone', {
                                                        required: 'Bắt buộc',
                                                        validate: notBlank('Bắt buộc'),
                                                    })}
                                                />
                                                {updateErrors.phone && <p className="text-sm text-red-500 mt-1">{updateErrors.phone.message}</p>}
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="email-update">
                                                    Email
                                                </label>
                                                <input id="email-update" type="email" className="form-input" placeholder="Nhập email" {...registerUpdate('email')} />
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="location-update">
                                                    Khu vực
                                                </label>
                                                <input id="location-update" type="text" className="form-input" placeholder="Nhập khu vực" {...registerUpdate('location')} />
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="currentLevel-update">
                                                    Trình độ
                                                </label>
                                                <input id="currentLevel-update" type="text" className="form-input" placeholder="Nhập trình độ" {...registerUpdate('currentLevel')} />
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="program-update">
                                                    Chương trình
                                                </label>
                                                <Controller
                                                    control={updateControl}
                                                    name="programId"
                                                    render={({ field }) => (
                                                        <Select
                                                            inputId="program-update"
                                                            classNamePrefix="react-select"
                                                            isClearable
                                                            isSearchable
                                                            placeholder="Tìm kiếm chương trình"
                                                            options={programOptions}
                                                            value={programOptions.find((option) => option.value === field.value) || null}
                                                            onChange={(option) => field.onChange(option?.value ?? '')}
                                                            onBlur={field.onBlur}
                                                            onInputChange={handleProgramInputChange}
                                                            isLoading={programLoading}
                                                        />
                                                    )}
                                                />
                                            </div>
                                            <div>
                                                <label className="block mb-1 font-medium" htmlFor="status-update">
                                                    Trạng thái
                                                </label>
                                                <select id="status-update" className="form-select" {...registerUpdate('status')}>
                                                    {STATUS_OPTIONS.map((status) => (
                                                        <option key={status.value} value={status.value}>
                                                            {status.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block mb-1 font-medium" htmlFor="note-update">
                                                    Ghi chú
                                                </label>
                                                <textarea id="note-update" rows={3} className="form-textarea" placeholder="Nhập ghi chú" {...registerUpdate('note')} />
                                            </div>
                                            <div className="md:col-span-2 flex flex-wrap gap-4 items-center">
                                                <div className="text-sm text-white-dark">
                                                    Ngày tạo: <span className="font-semibold text-white">{formatDate(selectedConsultation?.createdAt)}</span>
                                                </div>
                                                <div className="text-sm text-white-dark">
                                                    Ngày cập nhật: <span className="font-semibold text-white">{formatDate(selectedConsultation?.updatedAt)}</span>
                                                </div>
                                                <div className="ml-auto">
                                                    <button type="submit" className="btn btn-primary w-full md:w-auto" disabled={updating}>
                                                        {updating ? 'Đang cập nhật...' : 'Cập nhật'}
                                                    </button>
                                                </div>
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

export default ConsultationsPage;
