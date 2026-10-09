import { lazy } from 'react';

const Error = lazy(() => import('../components/Error'));

const LoginCover = lazy(() => import('../pages/Authentication/LoginCover'));

const ListAdmin = lazy(() => import('../pages/Admin/ListAdmin'));

const ProgramsTables = lazy(() => import('../pages/Programs'));
const ProgramForm = lazy(() => import('../pages/Programs/CRUD/Create'));

const NewsTables = lazy(() => import('../pages/News'));
const NewsForm = lazy(() => import('../pages/News/CRUD/Create'));
const ConsultationsPage = lazy(() => import('../pages/Consultations'));

const StudentsTables = lazy(() => import('../pages/Student'));
const StudentsAttendance = lazy(() => import('../pages/Student/Attendance'));
const AttendanceList = lazy(() => import('../pages/Student/AttendanceList'));

const DegreesList = lazy(() => import('../pages/Student/DegreesList'));
const routes = [
    // dashboard
    {
        path: '/',
        element: <StudentsTables />,
    },
    //
    {
        path: '/users',
        element: <ListAdmin />,
    },
    {
        path: '/students',
        element: <StudentsTables />,
    },
    {
        path: '/students/:id/attendance',
        element: <StudentsAttendance />,
    },

    {
        path: '/student/attendance',
        element: <AttendanceList />,
    },


    {
        path: '/degrees',
        element: <DegreesList />,
    },

    {
        path: '/programs',
        element: <ProgramsTables />,
    },

    {
        path: '/programs/create',
        element: <ProgramForm />,
    },
    {
        path: '/programs/:id/edit',
        element: <ProgramForm />,
    },
    {
        path: '/news',
        element: <NewsTables />,
    },

    {
        path: '/news/create',
        element: <NewsForm />,
    },
    {
        path: '/news/:id/edit',
        element: <NewsForm />,
    },
    {
        path: '/consultations',
        element: <ConsultationsPage />,
    },
    {
        path: '/auth/cover-login',
        element: <LoginCover />,
        layout: 'blank',
    },

    {
        path: '*',
        element: <Error />,
        layout: 'blank',
    },
];

export { routes };
