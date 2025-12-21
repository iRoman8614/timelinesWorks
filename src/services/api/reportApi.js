import axiosInstance from './axiosConfig';

const reportApi = {
    /**
     * Генерация месячного отчета
     * @param {Object} params - параметры запроса
     * @param {string} params.projectId - ID проекта
     * @param {string} params.planId - ID плана
     * @param {string} params.startDate - Дата начала (YYYY-MM-DD)
     * @param {string} params.endDate - Дата окончания (YYYY-MM-DD)
     * @param {Object} body - тело запроса
     * @param {string[]} body.assemblies - массив ID агрегатов
     * @param {string[]} body.components - массив ID компонентов
     * @param {Array<{maintenanceTypeId: string, hexColor: string}>} body.maintenances - типы ТО с цветами
     */
    generateMonthly: async (params, body) => {
        const queryParams = new URLSearchParams({
            reportType: 'MONTHLY',
            projectId: params.projectId,
            startDate: params.startDate,
            endDate: params.endDate
        });

        if (params.planId) {
            queryParams.append('planId', params.planId);
        }

        const response = await axiosInstance.post(
            `/api/reports/generate?${queryParams.toString()}`,
            body,
            {
                responseType: 'blob'
            }
        );

        return response.data;
    },

    /**
     * Генерация годового отчета
     * @param {Object} params - параметры запроса
     * @param {string} params.projectId - ID проекта
     * @param {string} params.planId - ID плана
     * @param {number} params.year - Год отчета
     * @param {Object} body - тело запроса
     * @param {string[]} body.assemblies - массив ID агрегатов
     * @param {Array<{maintenanceTypeId: string, hexColor: string}>} body.maintenances - типы ТО с цветами
     */
    generateAnnual: async (params, body) => {
        const queryParams = new URLSearchParams({
            reportType: 'ANNUAL',
            projectId: params.projectId,
            startDate: `${params.year}-01-01`,
            endDate: `${params.year}-12-31`
        });

        if (params.planId) {
            queryParams.append('planId', params.planId);
        }

        const response = await axiosInstance.post(
            `/api/reports/generate?${queryParams.toString()}`,
            body,
            {
                responseType: 'blob'
            }
        );

        return response.data;
    },

    /**
     * Скачать файл отчета
     * @param {Blob} blob - данные файла
     * @param {string} filename - имя файла
     */
    downloadFile: (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.URL.revokeObjectURL(url);
    }
};

export default reportApi;