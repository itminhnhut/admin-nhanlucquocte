import axios, { type AxiosRequestConfig, type AxiosResponse } from 'axios';
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
    }) as unknown as (response: AxiosResponse) => AxiosResponse,
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
    <T = unknown>(config: AxiosRequestConfig): Promise<T>;
    get<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    delete<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    head<T = unknown>(url: string, config?: AxiosRequestConfig): Promise<T>;
    post<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    put<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
    patch<T = unknown>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T>;
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
