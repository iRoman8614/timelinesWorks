import axiosInstance from './axiosConfig';

/**
 * API для работы с наработками оборудования
 */
const operatingHoursApi = {
    /**
     * Получить наработки на заданную дату
     * @param {string} projectId - UUID проекта
     * @param {string} [planId] - UUID плана (опционально)
     * @param {string} [dateTime] - Дата и время в формате ISO (например: 2025-12-31T00:00:00)
     * @returns {Promise<Object|Array>}
     */
    getOperatingHours: async (projectId, planId = null, dateTime = null) => {
        const params = {
            projectId
        };

        if (planId) {
            params.planId = planId;
        }

        if (dateTime) {
            params.dateTime = dateTime;
        }

        const response = await axiosInstance.get('/api/operating-hours', {
            params
        });
        return response.data;
    },

    /**
     * Получить наработки для проекта на текущую дату
     * @param {string} projectId - UUID проекта
     * @returns {Promise<Object|Array>}
     */
    getCurrentOperatingHours: async (projectId) => {
        const now = new Date().toISOString();
        return operatingHoursApi.getOperatingHours(projectId, null, now);
    },

    /**
     * Получить наработки для конкретного плана
     * @param {string} projectId - UUID проекта
     * @param {string} planId - UUID плана
     * @param {string} [dateTime] - Дата и время (по умолчанию - текущее время)
     * @returns {Promise<Object|Array>}
     */
    getOperatingHoursForPlan: async (projectId, planId, dateTime = null) => {
        const targetDateTime = dateTime || new Date().toISOString();
        return operatingHoursApi.getOperatingHours(projectId, planId, targetDateTime);
    },

    /**
     * Получить наработки на конкретную дату (без времени)
     * @param {string} projectId - UUID проекта
     * @param {Date|string} date - Дата (Date объект или строка YYYY-MM-DD)
     * @returns {Promise<Object|Array>}
     */
    getOperatingHoursByDate: async (projectId, date) => {
        let dateTime;

        if (date instanceof Date) {
            dateTime = date.toISOString();
        } else {
            dateTime = `${date}T00:00:00`;
        }

        return operatingHoursApi.getOperatingHours(projectId, null, dateTime);
    },
};

export default operatingHoursApi;