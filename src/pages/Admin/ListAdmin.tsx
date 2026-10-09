import { DataTable } from 'mantine-datatable';
import { useEffect, useState } from 'react';
import { setPageTitle } from '../../store/themeConfigSlice';
import { useDispatch } from 'react-redux';
import http from '../../utils/http';
import { AdminListResponse } from '../../types/admin';

const PAGE_SIZES = [10];
const ListAdmin = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Multi Column Table'));
    });
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(PAGE_SIZES[0]);
    const [recordsData, setRecordsData] = useState([] as any[]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            setLoading(true);
            const rs = await http.get<AdminListResponse>('admin/admins');
            console.log(rs);
            setRecordsData((rs.data as any) ?? []);
        } catch (error) {
            setRecordsData([]);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div>
            <div className="panel mt-6">
                <div className="flex md:items-center md:flex-row flex-col mb-5 gap-5">
                    <h5 className="font-semibold text-lg dark:text-white-light">Danh sách Admin</h5>
                </div>
                <div className="datatables">
                    <DataTable
                        highlightOnHover
                        className="whitespace-nowrap table-hover"
                        fetching={loading}
                        records={recordsData}
                        columns={[
                            { accessor: 'id', title: 'Id' },
                            {
                                accessor: 'fullName',
                                title: 'Full Name',
                                sortable: true,
                                render: ({ fullName, id }) => (
                                    <div className="flex items-center w-max">
                                        <img className="w-9 h-9 rounded-full ltr:mr-2 rtl:ml-2 object-cover" src={`/assets/images/profile-${id}.jpeg`} alt="" />
                                        <div>{fullName}</div>
                                    </div>
                                ),
                            },
                            { accessor: 'username', title: 'User name' },
                            { accessor: 'role', title: 'Role' },
                            { accessor: 'createdAt', title: 'Created At' },
                        ]}
                        totalRecords={recordsData?.length}
                        recordsPerPage={pageSize}
                        page={page}
                        onPageChange={(p) => setPage(p)}
                        recordsPerPageOptions={PAGE_SIZES}
                        onRecordsPerPageChange={setPageSize}
                        minHeight={200}
                        paginationText={({ from, to, totalRecords }) => `Showing  ${from} to ${to} of ${totalRecords} entries`}
                    />
                </div>
            </div>
        </div>
    );
};

export default ListAdmin;
