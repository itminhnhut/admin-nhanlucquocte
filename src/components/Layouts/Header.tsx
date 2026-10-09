import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { IRootState } from '../../store';
import { toggleSidebar } from '../../store/themeConfigSlice';
import Dropdown from '../Dropdown';
import IconMenu from '../Icon/IconMenu';


import IconLogout from '../Icon/IconLogout';

import { clearSession, readAdminInfo, type AdminInfo } from '../../utils/auth';
import http from '../../utils/http';

const ROLE_LABEL: Record<string, string> = { EDITOR: 'Biên tập', SUPER_ADMIN: 'Quản trị' };

/** Chữ cái đầu của tên, dùng thay ảnh đại diện */
function initialsOf(info: AdminInfo | null) {
    const words = (info?.fullName || info?.username || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return '?';
    return (words.length === 1 ? words[0].slice(0, 2) : words[words.length - 2][0] + words[words.length - 1][0]).toUpperCase();
}

const Header = () => {
    const location = useLocation();
    const navigate = useNavigate();

    useEffect(() => {
        const selector = document.querySelector('ul.horizontal-menu a[href="' + window.location.pathname + '"]');
        if (selector) {
            selector.classList.add('active');
            const all: any = document.querySelectorAll('ul.horizontal-menu .nav-link.active');
            for (let i = 0; i < all.length; i++) {
                all[0]?.classList.remove('active');
            }
            const ul: any = selector.closest('ul.sub-menu');
            if (ul) {
                let ele: any = ul.closest('li.menu').querySelectorAll('.nav-link');
                if (ele) {
                    ele = ele[0];
                    setTimeout(() => {
                        ele?.classList.add('active');
                    });
                }
            }
        }
    }, [location]);

    const isRtl = useSelector((state: IRootState) => state.themeConfig.rtlClass) === 'rtl' ? true : false;

    const themeConfig = useSelector((state: IRootState) => state.themeConfig);
    const dispatch = useDispatch();

    const adminInfo = readAdminInfo();

    return (
        <header className={`z-40 ${themeConfig.semidark && themeConfig.menu === 'horizontal' ? 'dark' : ''}`}>
            <div className="shadow-sm">
                <div className="relative bg-white flex w-full items-center px-5 py-2.5 dark:bg-black">
                    <div className="horizontal-logo flex lg:hidden justify-between items-center ltr:mr-2 rtl:ml-2">
                        <Link to="/news" className="main-logo flex shrink-0 items-center gap-2">
                            <img className="inline w-8" src="/assets/images/logo-truong.png" alt="Logo Trường Trung cấp nghề Nhân Lực Quốc Tế" />
                            <span className="hidden text-[15px] font-bold md:inline">Nhân Lực Quốc Tế</span>
                        </Link>
                        <button
                            type="button"
                            className="collapse-icon flex-none dark:text-[#d0d2d6] hover:text-primary dark:hover:text-primary flex lg:hidden ltr:ml-2 rtl:mr-2 p-2 rounded-full bg-white-light/40 dark:bg-dark/40 hover:bg-white-light/90 dark:hover:bg-dark/60"
                            onClick={() => {
                                dispatch(toggleSidebar());
                            }}
                        >
                            <IconMenu className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="sm:flex-1 ltr:sm:ml-0 ltr:ml-auto sm:rtl:mr-0 rtl:mr-auto flex items-center space-x-1.5 lg:space-x-2 rtl:space-x-reverse dark:text-[#d0d2d6]">
                        <div className="sm:ltr:mr-auto sm:rtl:ml-auto"></div>
                        <div className="dropdown shrink-0 flex">
                            <Dropdown
                                offset={[0, 8]}
                                placement={`${isRtl ? 'bottom-start' : 'bottom-end'}`}
                                btnClassName="relative group block"
                                button={
                                    <span className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-sm font-bold text-white">
                                        {initialsOf(adminInfo)}
                                    </span>
                                }
                            >
                                <ul className="text-dark dark:text-white-dark !py-0 w-[230px] font-semibold dark:text-white-light/90">
                                    <li>
                                        <div className="flex items-center px-4 py-4">
                                            <span className="flex h-10 w-10 items-center justify-center rounded-md bg-primary text-sm font-bold text-white">{initialsOf(adminInfo)}</span>
                                            <div className="ltr:pl-4 rtl:pr-4 truncate">
                                                <h4 className="text-base">
                                                    {adminInfo?.fullName}
                                                    {adminInfo?.role && <span className="rounded bg-primary-light px-1.5 text-xs text-primary ltr:ml-2 rtl:ml-2">{ROLE_LABEL[adminInfo.role] || adminInfo.role}</span>}
                                                </h4>
                                                <button type="button" className="text-black/60 hover:text-primary dark:text-dark-light/60 dark:hover:text-white">
                                                    {adminInfo?.username}
                                                </button>
                                            </div>
                                        </div>
                                    </li>

                                    <li className="border-t border-white-light dark:border-white-light/10">
                                        <button
                                            type="button"
                                            className="flex w-full items-center text-danger px-4 !py-3"
                                            onClick={() => {
                                                clearSession();
                                                navigate('/auth/cover-login', { replace: true });
                                            }}
                                        >
                                            <IconLogout className="w-4.5 h-4.5 ltr:mr-2 rtl:ml-2 rotate-90 shrink-0" />
                                            Đăng xuất
                                        </button>
                                    </li>
                                </ul>
                            </Dropdown>
                        </div>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;
