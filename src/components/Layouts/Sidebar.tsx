import PerfectScrollbar from 'react-perfect-scrollbar';
import { useTranslation } from 'react-i18next';
import { useDispatch, useSelector } from 'react-redux';
import { NavLink, useLocation } from 'react-router-dom';
import { toggleSidebar } from '../../store/themeConfigSlice';
import { IRootState } from '../../store';
import { useState, useEffect } from 'react';
import IconCaretsDown from '../Icon/IconCaretsDown';


import IconMenuTables from '../Icon/Menu/IconMenuTables';
import IconNotes from '../Icon/IconNotes';
import IconNotesEdit from '../Icon/IconNotesEdit';
import IconInbox from '../Icon/IconInbox';
import IconUser from '../Icon/IconUser';
import IconTag from '../Icon/IconTag';
import IconSettings from '../Icon/IconSettings';


const Sidebar = () => {
    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const semidark = useSelector((state: IRootState) => state.themeConfig.semidark);
    const location = useLocation();
    const dispatch = useDispatch();
    const { t } = useTranslation();

    // NavLink của react-router tự gắn lớp 'active', menu lại phẳng (không có menu con)
    // nên khối tìm 'ul.sub-menu' của template là code chết, đã bỏ.


    useEffect(() => {
        if (window.innerWidth < 1024 && themeConfig.sidebar) {
            dispatch(toggleSidebar());
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [location]);

    return (
        <div className={semidark ? 'dark' : ''}>
            <nav
                className={`sidebar fixed min-h-screen h-full top-0 bottom-0 w-[260px] shadow-[5px_0_25px_0_rgba(94,92,154,0.1)] z-50 transition-all duration-300 ${semidark ? 'text-white-dark' : ''}`}
            >
                <div className="bg-white dark:bg-black h-full">
                    <div className="flex justify-between items-center px-4 py-3">
                        <NavLink to="/news" className="main-logo flex items-center gap-2 shrink-0">
                            <img className="w-9 flex-none" src="/assets/images/logo-truong.png" alt="Logo Trường Trung cấp nghề Nhân Lực Quốc Tế" />
                            <span className="leading-tight dark:text-white-light">
                                <span className="block text-[15px] font-bold">Nhân Lực Quốc Tế</span>
                                <span className="block text-[11px] font-medium text-slate-500">Trang quản trị</span>
                            </span>
                        </NavLink>

                        <button
                            type="button"
                            className="collapse-icon w-8 h-8 rounded-full flex items-center hover:bg-gray-500/10 dark:hover:bg-dark-light/10 dark:text-white-light transition duration-300 rtl:rotate-180"
                            onClick={() => dispatch(toggleSidebar())}
                        >
                            <IconCaretsDown className="m-auto rotate-90" />
                        </button>
                    </div>
                    <PerfectScrollbar className="h-[calc(100vh-80px)] relative">
                        <ul className="relative font-semibold space-y-0.5 p-4 py-0">
                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span>Nội dung website</span>
                            </h2>

                            <li className="nav-item">
                                <NavLink to="/programs" className="group">
                                    <div className="flex items-center">
                                        <IconNotesEdit className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Ngành đào tạo</span>
                                    </div>
                                </NavLink>
                                <NavLink to="/news" className="group">
                                    <div className="flex items-center">
                                        <IconNotes className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Bài viết</span>
                                    </div>
                                </NavLink>
                            </li>

                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span>Tuyển sinh & học viên</span>
                            </h2>

                            <li className="nav-item">
                                <NavLink to="/consultations" className="group">
                                    <div className="flex items-center">
                                        <IconInbox className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Đơn tư vấn</span>
                                    </div>
                                </NavLink>
                                <NavLink to="/students" className="group">
                                    <div className="flex items-center">
                                        <IconUser className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Học viên</span>
                                    </div>
                                </NavLink>
                                <NavLink to="/student/attendance" className="group">
                                    <div className="flex items-center">
                                        <IconMenuTables className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Điểm danh</span>
                                    </div>
                                </NavLink>
                                <NavLink to="/degrees" className="group">
                                    <div className="flex items-center">
                                        <IconTag className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Văn bằng</span>
                                    </div>
                                </NavLink>
                            </li>

                            <h2 className="-mx-4 mb-1 flex items-center bg-white-light/30 px-7 py-3 text-[11px] font-bold uppercase tracking-wide text-slate-500 dark:bg-dark dark:bg-opacity-[0.08]">
                                <span>Hệ thống</span>
                            </h2>

                            <li className="nav-item">
                                <NavLink to="/users" className="group">
                                    <div className="flex items-center">
                                        <IconSettings className="shrink-0 group-hover:!text-primary" />
                                        <span className="text-black ltr:pl-3 rtl:pr-3 dark:text-[#506690] dark:group-hover:text-white-dark">Tài khoản quản trị</span>
                                    </div>
                                </NavLink>
                            </li>

                        </ul>
                    </PerfectScrollbar>
                </div>
            </nav>
        </div>
    );
};

export default Sidebar;
