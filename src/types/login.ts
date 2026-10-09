export type LoginResponse = {
    accessToken: string;
    // Hình dạng do API quyết định; pickAdminInfo() lọc lấy 3 trường cần dùng
    admin?: unknown;
};

export type LoginFormValues = {
    userName: string;
    password: string;
};
