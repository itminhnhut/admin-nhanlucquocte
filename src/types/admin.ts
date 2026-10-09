export interface Admin {
    id: number;
    username: string;
    fullName: string;
    role: 'EDITOR' | 'SUPER_ADMIN';
    createdAt: string;
}

export interface MetaData {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
}

export interface AdminListResponse {
    data: Admin[];
    meta: MetaData;
}
