import axiosInstance from './axiosConfig';

/**
 * API для работы с папками
 */
const folderApi = {
    /**
     * Получить список всех папок
     * @returns {Promise<Array>}
     */
    getAll: async () => {
        const response = await axiosInstance.get('/api/folders');
        return response.data;
    },

    /**
     * Получить папку по ID
     * @param {string} id - UUID папки
     * @returns {Promise<Object>}
     */
    getById: async (id) => {
        const response = await axiosInstance.get(`/api/folders/${id}`);
        return response.data;
    },

    /**
     * Создать новую папку
     * @param {Object} folderData - Данные папки
     * @param {string} folderData.name - Название папки
     * @param {string} [folderData.description] - Описание папки
     * @param {string} [folderData.parentId] - ID родительской папки
     * @returns {Promise<Object>}
     */
    create: async (folderData) => {
        const response = await axiosInstance.post('/api/folders', folderData);
        return response.data;
    },

    /**
     * Полное обновление папки
     * @param {string} id - UUID папки
     * @param {Object} folderData - Данные папки
     * @returns {Promise<Object>}
     */
    update: async (id, folderData) => {
        const response = await axiosInstance.put(`/api/folders/${id}`, {
            ...folderData,
            id,
        });
        return response.data;
    },

    /**
     * Частичное обновление папки
     * @param {string} id - UUID папки
     * @param {Object} folderData - Данные для обновления
     * @returns {Promise<Object>}
     */
    patch: async (id, folderData) => {
        const response = await axiosInstance.patch(`/api/folders/${id}`, folderData);
        return response.data;
    },

    /**
     * Удалить папку
     * @param {string} id - UUID папки
     * @returns {Promise<void>}
     */
    delete: async (id) => {
        await axiosInstance.delete(`/api/folders/${id}`);
    },

    /**
     * Переместить папку в другую родительскую папку
     * @param {string} id - UUID папки
     * @param {string|null} parentId - UUID новой родительской папки или null для корня
     * @returns {Promise<Object>}
     */
    move: async (id, parentId) => {
        const response = await axiosInstance.patch(`/api/folders/${id}`, {
            parentId,
        });
        return response.data;
    },
};

export default folderApi;