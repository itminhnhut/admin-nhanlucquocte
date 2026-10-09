import axios, { type AxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';
import { AUTH_TOKEN_KEY, clearSession } from './auth';
import { API_URL } from '../configs/env';

export interface ApiResponse<T> {
    code?: number;
    message?: string;
    data: T;
}

const axiosInstance = axios.create({
    baseURL: API_URL,
    timeout: 10000,
});

axiosInstance.interceptors.request.use(
    (config) => {
        const token = Cookies.get(AUTH_TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
    ((response) => {
        return response.data;
    }) as any,
    (error) => {
        if (error.response?.status === 401) {
            clearSession();

            window.location.href = '/auth/cover-login';
        }

        if (error.response?.status === 403) {
            console.warn('Forbidden: You do not have permission');
        }

        return Promise.reject(error);
    },
);

interface HttpInstance {
    <T = any>(config: AxiosRequestConfig): Promise<T>;
    get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    head<T = any>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
    patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T>;
}

const http = axiosInstance as HttpInstance;

export const createCancelableRequest = () => {
    const controller = new AbortController();

    const request = <T = any>(config: AxiosRequestConfig): Promise<T> => {
        return http({
            ...config,
            signal: controller.signal,
        });
    };

    return {
        request,
        cancel: () => controller.abort(),
    };
};

export default http;
