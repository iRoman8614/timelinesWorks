import axiosInstance from './axiosConfig';
import { generateUUID } from '../../utils/uuidUtils';

/**
 * API для работы с планами проектов
 */
const planApi = {
    /**
     * Получить все планы проекта
     * @param {string} projectId - UUID проекта
     * @returns {Promise<Array>}
     */
    getAll: async (projectId) => {
        const response = await axiosInstance.get('/api/plans', {
            params: { projectId }
        });
        return response.data;
    },

    /**
     * Получить план по ID
     * @param {string} id - UUID плана
     * @returns {Promise<Object>}
     */
    getById: async (id) => {
        const response = await axiosInstance.get(`/api/plans/${id}`);
        return response.data;
    },

    /**
     * Создать новый план
     * @param {Object} planData - Данные плана
     * @param {string} planData.name - Название плана
     * @param {string} [planData.description] - Описание плана
     * @param {string} planData.projectId - UUID проекта
     * @param {string} planData.startTime - Дата начала (ISO format)
     * @param {string} planData.endTime - Дата окончания (ISO format)
     * @param {string} [planData.timeline] - Timeline данные (JSON string)
     * @returns {Promise<Object>}
     */
    create: async (planData) => {
        const dataWithId = {
            id: generateUUID(),
            ...planData,
        };

        const response = await axiosInstance.post('/api/plans', dataWithId);
        return response.data;
    },

    /**
     * Обновить план
     * @param {string} id - UUID плана
     * @param {Object} planData - Данные для обновления
     * @returns {Promise<Object>}
     */
    update: async (id, planData) => {
        const response = await axiosInstance.put(`/api/plans/${id}`, planData);
        return response.data;
    },

    /**
     * Удалить план
     * @param {string} id - UUID плана
     * @returns {Promise<void>}
     */
    delete: async (id) => {
        const response = await axiosInstance.delete(`/api/plans/${id}`);
        return response.data;
    },
};

export default planApi;