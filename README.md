# Quản trị Trường Trung cấp nghề Nhân Lực Quốc Tế

Trang quản trị nội dung (ngành đào tạo, tin tức, đơn tư vấn) cho website
[trungcapnhanlucquocte.vn](https://trungcapnhanlucquocte.vn).

Vite + React + TypeScript, Redux Toolkit, Tailwind + Mantine. Nền giao diện dùng template Vristo.

## Chạy local

```bash
npm install
npm run dev        # dev server
npm run build      # build ra dist/ (có chạy tsc)
npm run preview    # xem bản build (port 4173)
```

## Cấu hình

Copy `.env.example` thành `.env` rồi điền:

| Biến | Ý nghĩa |
|---|---|
| `VITE_API_URL` | Base URL API backend. **Chưa có backend của trường nên đang để trống.** |
| `VITE_APP_URL` | URL công khai của trang quản trị |
| `VITE_SITEMAP_REFRESH_URL` | Link gọi website tạo lại `sitemap.xml` sau khi đăng bài. Key lấy từ `SITEMAP_KEY` đặt trên EasyPanel của website. Để trống → không gọi. |

Khi deploy bằng Docker/EasyPanel, env được inject lúc container khởi động qua
[docker/env.sh](docker/env.sh) (ghi `window.__ENV__`), nên **đổi env không cần build lại image**.
Code đọc env qua [src/configs/env.ts](src/configs/env.ts).

> `VITE_API_URL` không có giá trị mặc định là có chủ ý: thiếu env thì request lỗi rõ ràng,
> thay vì âm thầm trỏ sang API của trường khác và sửa dữ liệu thật của họ.

## Deploy bằng PM2

```bash
npm run build
npm run start:pm2            # pm2 start ecosystem.frontend.config.cjs --env production
pm2 logs admin-nhanlucquocte-frontend
pm2 restart admin-nhanlucquocte-frontend
pm2 save
```

[ecosystem.frontend.config.cjs](ecosystem.frontend.config.cjs) chạy `vite preview` ở port **4001**.
Nếu chạy chung máy với trang quản trị Việt Úc (cũng dùng 4001) thì phải đổi port một bên.
