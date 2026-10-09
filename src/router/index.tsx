import { createBrowserRouter, Navigate, useLocation } from 'react-router-dom';
import DefaultLayout from '../components/Layouts/DefaultLayout';
import { routes } from './routes';
import Cookies from 'js-cookie';

const AuthRoute = ({ children }: { children: JSX.Element }) => {
    const location = useLocation();
    const isAuthenticated = !!Cookies.get('auth_token');

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
