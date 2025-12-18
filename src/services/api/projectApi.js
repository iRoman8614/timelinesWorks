import axiosInstance from './axiosConfig';
import { generateUUID } from '../../utils/uuidUtils';

/**
 * API для работы с проектами
 */
const projectApi = {
    /**
     * Получить список всех проектов
     * @returns {Promise<Array>}
     */
    getAll: async () => {
        const response = await axiosInstance.get('/api/projects');
        return response.data;
    },

    /**
     * Получить проект по ID
     * @param {string} id - UUID проекта
     * @returns {Promise<Object>}
     */
    getById: async (id) => {
        const response = await axiosInstance.get(`/api/projects/${id}`);
        return response.data;
    },

    /**
     * Создать новый проект
     * @param {Object} projectData - Данные проекта
     * @param {string} projectData.name - Название проекта
     * @param {string} [projectData.description] - Описание проекта
     * @param {string} [projectData.parentId] - ID родительской папки
     * @param {string} [projectData.structure] - Структура проекта (JSON string)
     * @returns {Promise<Object>}
     */
    create: async (projectData) => {
        const dataWithDefaults = {
            id: generateUUID(),
            structure: '', // Пустая структура по умолчанию
            ...projectData,
        };
        console.log('Creating project with data:', dataWithDefaults);
        const response = await axiosInstance.post('/api/projects', dataWithDefaults);
        return response.data;
    },

    /**
     * Полное обновление проекта
     * @param {string} id - UUID проекта
     * @param {Object} projectData - Данные проекта
     * @returns {Promise<Object>}
     */
    update: async (id, projectData) => {
        const response = await axiosInstance.put(`/api/projects/${id}`, {
            ...projectData,
            id,
        });
        return response.data;
    },

    /**
     * Частичное обновление проекта
     * @param {string} id - UUID проекта
     * @param {Object} projectData - Данные для обновления
     * @returns {Promise<Object>}
     */
    patch: async (id, projectData) => {
        const response = await axiosInstance.patch(`/api/projects/${id}`, projectData);
        return response.data;
    },

    /**
     * Удалить проект
     * @param {string} id - UUID проекта
     * @returns {Promise<void>}
     */
    delete: async (id) => {
        await axiosInstance.delete(`/api/projects/${id}`);
    },

    /**
     * Переместить проект в другую папку
     * @param {string} id - UUID проекта
     * @param {string|null} parentId - UUID новой родительской папки или null для корня
     * @returns {Promise<Object>}
     */
    move: async (id, parentId) => {
        const response = await axiosInstance.patch(`/api/projects/${id}`, {
            parentId,
        });
        return response.data;
    },

    /**
     * Обновить структуру проекта
     * @param {string} id - UUID проекта
     * @param {Object} structure - Структура проекта
     * @returns {Promise<Object>}
     */
    updateStructure: async (id, structure) => {
        const response = await axiosInstance.patch(`/api/projects/${id}`, {
            structure: JSON.stringify(structure),
        });
        return response.data;
    },
};

export default projectApi;