import axiosInstance from './axiosConfig';

/**
 * API для работы с историей наработок через Excel
 */
const historyApi = {
    /**
     * Скачать шаблон Excel для установления наработок
     * @param {string} projectId - UUID проекта
     * @param {string} baseDate - Базовая дата для выгрузки наработок (формат: YYYY-MM-DD)
     * @param {boolean} [calculateOperatingHours=false] - Нужно выгружать наработки на дату в файл
     * @returns {Promise<Blob>}
     */
    downloadTemplate: async (projectId, baseDate, calculateOperatingHours = false) => {
        const response = await axiosInstance.get('/api/history/download-template', {
            params: {
                projectId,
                baseDate,
                calculateOperatingHours
            },
            responseType: 'blob', // Важно для скачивания файлов
        });
        return response.data;
    },

    /**
     * Загрузить заполненный Excel файл с историей проекта
     * @param {string} projectId - UUID проекта
     * @param {File} file - Excel файл
     * @returns {Promise<Object>}
     */
    uploadHistory: async (projectId, file) => {
        const formData = new FormData();
        formData.append('projectId', projectId);
        formData.append('file', file);

        const response = await axiosInstance.post('/api/history/load', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    },

    /**
     * Вспомогательная функция для скачивания файла
     * @param {Blob} blob - Blob данные
     * @param {string} filename - Имя файла для скачивания
     */
    downloadFile: (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
    },

    /**
     * Скачать шаблон и сохранить файл
     * @param {string} projectId - UUID проекта
     * @param {string} baseDate - Базовая дата (формат: YYYY-MM-DD)
     * @param {boolean} [calculateOperatingHours=false] - Выгружать наработки
     * @param {string} [filename] - Имя файла (по умолчанию: template_YYYY-MM-DD.xlsx)
     * @returns {Promise<void>}
     */
    downloadTemplateFile: async (projectId, baseDate, calculateOperatingHours = false, filename = null) => {
        const blob = await historyApi.downloadTemplate(projectId, baseDate, calculateOperatingHours);
        const defaultFilename = `template_${baseDate}.xlsx`;
        historyApi.downloadFile(blob, filename || defaultFilename);
    },
};

export default historyApi;