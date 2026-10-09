// Trang hiện khi gõ sai đường dẫn hoặc trang gặp lỗi. Trước đây chỉ có chữ
// "Error" — nhân viên gặp sẽ không biết phải làm gì tiếp.
import { Link, useRouteError } from 'react-router-dom';

function Error() {
    const error = useRouteError() as { status?: number } | null;
    const notFound = error?.status === 404 || !error;

    return (
        <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
            <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-8 text-center">
                <img src="/assets/images/logo-truong.png" alt="" className="mx-auto mb-4 w-12" />
                <h1 className="text-xl font-semibold text-slate-800">{notFound ? 'Không tìm thấy trang này' : 'Trang gặp lỗi'}</h1>
                <p className="mt-2 text-sm text-slate-600">
                    {notFound
                        ? 'Đường dẫn có thể bị gõ sai, hoặc mục này đã được chuyển sang chỗ khác.'
                        : 'Đã có lỗi xảy ra khi mở trang. Thử tải lại; nếu vẫn lỗi, báo cho người phụ trách kỹ thuật.'}
                </p>
                <div className="mt-6 flex justify-center gap-3">
                    <button type="button" className="btn btn-outline-secondary" onClick={() => window.location.reload()}>
                        Tải lại trang
                    </button>
                    <Link to="/news" className="btn btn-primary">
                        Về trang bài viết
                    </Link>
                </div>
            </div>
        </main>
    );
}

export default Error;
