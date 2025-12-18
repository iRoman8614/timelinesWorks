import axios from 'axios';
import { handleHttpStatus } from '../../utils/toast';

const axiosInstance = axios.create({
    baseURL: process.env.REACT_APP_API_BASE_URL,
    timeout: 30000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor
axiosInstance.interceptors.request.use(
    (config) => {
        // Можно добавить токен авторизации если понадобится
        // const token = localStorage.getItem('token');
        // if (token) {
        //     config.headers.Authorization = `Bearer ${token}`;
        // }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

axiosInstance.interceptors.response.use(
    (response) => {
        // Автоматическое уведомление об успехе для методов изменения данных
        // Проверяем: есть ли флаг для отключения автоуведомлений
        if (response.config.showSuccessToast !== false) {
            const method = response.config.method?.toLowerCase();
            if (['post', 'put', 'patch', 'delete'].includes(method)) {
                const successMessage = response.config.successMessage;

                if (successMessage) {
                    handleHttpStatus(response.status, successMessage);
                }
                // Если successMessage не указан, можно не показывать или показать стандартное
                // handleHttpStatus(response.status); // Раскомментировать для автоуведомлений
            }
        }

        return response;
    },
    (error) => {
        if (error.response) {
            console.error('API Error:', error.response.status, error.response.data);
            if (error.config?.showErrorToast !== false) {
                const errorMessage = error.config?.errorMessage;
                handleHttpStatus(error.response.status, errorMessage, error.response.data);
            }
        } else if (error.request) {
            console.error('Network Error:', error.request);

            if (error.config?.showErrorToast !== false) {
                handleHttpStatus(0, 'Ошибка сети. Проверьте подключение');
            }
        } else {
            console.error('Error:', error.message);

            if (error.config?.showErrorToast !== false) {
                handleHttpStatus(0, 'Ошибка запроса: ' + error.message);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;