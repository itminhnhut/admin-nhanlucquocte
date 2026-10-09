import { useEffect, useState } from 'react';
import { useForm, SubmitHandler } from 'react-hook-form';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { setPageTitle } from '../../store/themeConfigSlice';

import IconLockDots from '../../components/Icon/IconLockDots';
import IconUser from '../../components/Icon/IconUser';

import { loginErrorMessage, saveSession } from '../../utils/auth';
import http from '../../utils/http';
import { LoginFormValues, LoginResponse } from '../../types/login';

const LoginCover = () => {
    const dispatch = useDispatch();
    useEffect(() => {
        dispatch(setPageTitle('Login Cover'));
    }, [dispatch]);

    const navigate = useNavigate();
    const [loginError, setLoginError] = useState<string | null>(null);
    const [showPassword, setShowPassword] = useState(false);

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>({
        defaultValues: {
            userName: '',
            password: '',
        },
    });

    const submitForm: SubmitHandler<LoginFormValues> = async (values) => {
        try {
            const rs = await http.post<LoginResponse>('admin/auth/login', {
                username: values.userName.trim(),
                password: values.password,
            });
            if (!rs?.accessToken) throw new Error('API không trả về token');
            saveSession(rs.accessToken, rs.admin, window.location.protocol === 'https:');
            navigate('/news', { replace: true });
        } catch (error) {
            // Báo đúng nguyên nhân: sai mật khẩu khác hẳn mất mạng hay máy chủ lỗi
            console.error('Đăng nhập thất bại:', error);
            setLoginError(loginErrorMessage(error));
        }
    };

    return (
        <div>
            <div className="absolute inset-0">
                <img src="/assets/images/auth/bg-gradient.png" alt="image" className="h-full w-full object-cover" />
            </div>
            <div className="relative flex min-h-screen items-center justify-center bg-[url(/assets/images/auth/map.png)] bg-cover bg-center bg-no-repeat px-6 py-10 dark:bg-[#060818] sm:px-16">
                <img src="/assets/images/auth/coming-soon-object1.png" alt="image" className="absolute left-0 top-1/2 h-full max-h-[893px] -translate-y-1/2" />
                <img src="/assets/images/auth/coming-soon-object2.png" alt="image" className="absolute left-24 top-0 h-40 md:left-[30%]" />
                <img src="/assets/images/auth/coming-soon-object3.png" alt="image" className="absolute right-0 top-0 h-[300px]" />
                <img src="/assets/images/auth/polygon-object.svg" alt="image" className="absolute bottom-0 end-[28%]" />
                <div className="relative flex w-full max-w-[1502px] flex-col justify-between overflow-hidden rounded-md bg-white/60 backdrop-blur-lg dark:bg-black/50 lg:min-h-[758px] lg:flex-row lg:gap-10 xl:gap-0">
                    <div className="relative hidden w-full items-center justify-center bg-[linear-gradient(225deg,rgba(239,18,98,1)_0%,rgba(67,97,238,1)_100%)] p-5 lg:inline-flex lg:max-w-[835px] xl:-ms-28 ltr:xl:skew-x-[14deg] rtl:xl:skew-x-[-14deg]">
                        <div className="absolute inset-y-0 w-8 from-primary/10 via-transparent to-transparent ltr:-right-10 ltr:bg-gradient-to-r rtl:-left-10 rtl:bg-gradient-to-l xl:w-16 ltr:xl:-right-20 rtl:xl:-left-20"></div>
                        <div className="ltr:xl:-skew-x-[14deg] rtl:xl:skew-x-[14deg]">
                            <div className="mt-24 hidden w-full max-w-[430px] lg:block">
                                <img src="/assets/images/auth/login.svg" alt="Cover Image" className="w-full" />
                            </div>
                        </div>
                    </div>
                    <div className="relative flex w-full flex-col items-center justify-center gap-6 px-4 pb-16 pt-6 sm:px-6 lg:max-w-[667px]">
                        <div className="w-full max-w-[440px] lg:mt-16">
                            <div className="mb-10">
                                <h1 className="text-3xl font-extrabold uppercase !leading-snug text-primary md:text-4xl">Đăng nhập</h1>
                                <p className="text-base font-bold leading-normal text-white-dark">Nhập tên đăng nhập và mật khẩu của bạn để đăng nhập</p>
                            </div>
                            <form className="space-y-5 dark:text-white" onSubmit={handleSubmit(submitForm)}>
                                <div>
                                    <label htmlFor="UserName">Tài khoản</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="UserName"
                                            type="text"
                                            placeholder="Nhập tài khoản"
                                            className="form-input ps-10 placeholder:text-white-dark"
                                            {...register('userName', {
                                                required: 'User Name is required',
                                            })}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconUser fill={true} />
                                        </span>
                                    </div>
                                    {errors.userName && <p className="mt-1 text-sm text-red-500">{errors.userName.message}</p>}
                                </div>
                                <div>
                                    <label htmlFor="Password">Mật khẩu</label>
                                    <div className="relative text-white-dark">
                                        <input
                                            id="Password"
                                            type={showPassword ? 'text' : 'password'}
                                            placeholder="Nhập mật khẩu"
                                            className="form-input ps-10 pe-10 placeholder:text-white-dark"
                                            {...register('password', {
                                                required: 'Password is required',
                                            })}
                                        />
                                        <span className="absolute start-4 top-1/2 -translate-y-1/2">
                                            <IconLockDots fill={true} />
                                        </span>
                                        <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute end-3 top-1/2 -translate-y-1/2 text-white-dark">
                                            {showPassword ? '🙈' : '👁️'}
                                        </button>
                                    </div>
                                    {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>}
                                </div>
                                {loginError && <p className="text-sm text-red-500">{loginError}</p>}
                                <button type="submit" className="btn btn-gradient !mt-6 w-full border-0 uppercase shadow-[0_10px_20px_-10px_rgba(67,97,238,0.44)]" disabled={isSubmitting}>
                                    {isSubmitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
                                </button>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginCover;
