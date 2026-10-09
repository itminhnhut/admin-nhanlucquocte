import { formatDate } from '../../utils/formatDate';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useDispatch } from 'react-redux';
import Swal from 'sweetalert2';
import SearchInput from '../../components/SearchInput';
import StatusBadge from '../../components/StatusBadge';
import DataTable, { type Column } from '../../components/table/DataTable';
import { setPageTitle } from '../../store/themeConfigSlice';
import { Admin, AdminListResponse } from '../../types/admin';
import http from '../../utils/http';

const ROLE_LABEL: Record<string, string> = { EDITOR: 'Biên tập', SUPER_ADMIN: 'Quản trị' };

/** Chữ cái đầu của tên, thay cho ảnh đại diện (template cũ lấy ảnh mẫu theo id, luôn 404) */
function initialsOf(fullName: string, username: string) {
    const words = (fullName || username || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    return (words.length === 1 ? words[0].slice(0, 2) : words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}


function ListAdmin() {
    const dispatch = useDispatch();
    const [admins, setAdmins] = useState<Admin[]>([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState('');
    const handleSearch = useCallback((keyword: string) => setSearch(keyword), []);

    useEffect(() => {
        dispatch(setPageTitle('Tài khoản quản trị'));
    }, [dispatch]);

    useEffect(() => {
        const load = async () => {
            setLoading(true);
            try {
                const response = await http.get<AdminListResponse>('admin/admins');
                setAdmins(response.data ?? []);
            } catch (error) {
                console.error('Lỗi tải danh sách tài khoản:', error);
                Swal.fire({ icon: 'error', title: 'Lỗi', text: 'Không tải được danh sách tài khoản quản trị.' });
                setAdmins([]);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const filtered = useMemo(() => {
        if (!search) return admins;
        const keyword = search.toLowerCase();
        return admins.filter((item) => item.fullName?.toLowerCase().includes(keyword) || item.username?.toLowerCase().includes(keyword));
    }, [admins, search]);

    const columns: Column<Admin>[] = [
        {
            key: 'fullName',
            title: 'Họ tên',
            sortable: true,
            render: ({ fullName, username }) => (
                <div className="flex w-max items-center gap-2">
                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{initialsOf(fullName, username)}</span>
                    <span>{fullName || '—'}</span>
                </div>
            ),
        },
        { key: 'username', title: 'Tên đăng nhập', sortable: true },
        { key: 'role', title: 'Quyền', sortable: true, render: ({ role }) => <StatusBadge tone={role === 'SUPER_ADMIN' ? 'brand' : 'muted'}>{ROLE_LABEL[role] || role}</StatusBadge> },
        { key: 'createdAt', title: 'Ngày tạo', sortable: true, render: ({ createdAt }) => <>{formatDate(createdAt)}</> },
    ];

    return (
        <section>
            <div className="panel mt-6">
                <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <h2 className="text-xl">Tài khoản quản trị</h2>
                    <SearchInput onSearch={handleSearch} placeholder="Tìm theo tên hoặc tài khoản" />
                </div>
                <DataTable rows={filtered} columns={columns} rowKey={(row) => row.id} unit="tài khoản" loading={loading} initialSort={{ key: 'fullName', direction: 'asc' }} pageSizes={[10, 25, 50]} />
            </div>
        </section>
    );
}

export default ListAdmin;
