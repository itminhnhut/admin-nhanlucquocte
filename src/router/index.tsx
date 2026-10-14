import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import { routes } from './routes';
import { isSessionAlive } from '../utils/auth';

const AuthRoute = ({ children }: { children: JSX.Element }) => {
    const location = useLocation();
    // Kiểm hạn của token, không chỉ kiểm cookie có tồn tại: cookie sống lâu hơn token thì
    // người dùng được cho vào app rồi mới bị 401 đá ra, trông như không đăng nhập được.
    const isAuthenticated = isSessionAlive();

    if (!isAuthenticated) {
        return <Navigate to="/auth/cover-login" replace state={{ from: location }} />;
    }

    return children;
};

const finalRoutes = routes.map((route) => {
    if (route.layout === 'blank') {
        return route;
    }

    return {
        ...route,
        element: (
            <AuthRoute>
                <DefaultLayout>{route.element}</DefaultLayout>
            </AuthRoute>
        ),
    };
});

const router = createBrowserRouter(finalRoutes);

export default router;
