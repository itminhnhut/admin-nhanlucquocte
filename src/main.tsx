import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';

// Perfect Scrollbar
import 'react-perfect-scrollbar/dist/css/styles.css';

// Tailwind css
import './tailwind.css';

// i18n (needs to be bundled)
import './i18n';

import 'react-quill/dist/quill.snow.css';

// Router
import { RouterProvider } from 'react-router-dom';
import router from './router/index';

// Redux
import { Provider } from 'react-redux';
import store from './store/index';
import './components/Quill/index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
    <Suspense>
        <Provider store={store}>
            <RouterProvider router={router} />
        </Provider>
    </Suspense>,
);
