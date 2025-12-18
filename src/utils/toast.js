import { message } from 'antd';

/**
 * Утилита для отображения toast уведомлений
 */

// Длительность показа уведомлений (в секундах)
const DURATION = {
    SUCCESS: 3,
    ERROR: 5,
    WARNING: 4,
    INFO: 3,
};

/**
 * Показать успешное уведомление
 * @param {string} content - Текст сообщения
 * @param {number} duration - Длительность в секундах
 */
export const showSuccess = (content = 'Успешно', duration = DURATION.SUCCESS) => {
    message.success(content, duration);
};

/**
 * Показать уведомление об ошибке
 * @param {string} content - Текст сообщения
 * @param {number} duration - Длительность в секундах
 */
export const showError = (content = 'Ошибка', duration = DURATION.ERROR) => {
    message.error(content, duration);
};

/**
 * Показать предупреждение
 * @param {string} content - Текст сообщения
 * @param {number} duration - Длительность в секундах
 */
export const showWarning = (content, duration = DURATION.WARNING) => {
    message.warning(content, duration);
};

/**
 * Показать информационное сообщение
 * @param {string} content - Текст сообщения
 * @param {number} duration - Длительность в секундах
 */
export const showInfo = (content, duration = DURATION.INFO) => {
    message.info(content, duration);
};

/**
 * Показать загрузку
 * @param {string} content - Текст сообщения
 * @param {number} duration - Длительность (0 = пока не закроем вручную)
 */
export const showLoading = (content = 'Загрузка...', duration = 0) => {
    return message.loading(content, duration);
};

/**
 * Обработать HTTP статус код и показать соответствующее уведомление
 * @param {number} status - HTTP статус код
 * @param {string} customMessage - Кастомное сообщение (опционально)
 * @param {Object} errorData - Данные ошибки от сервера
 */
export const handleHttpStatus = (status, customMessage = null, errorData = null) => {
    if (status >= 200 && status < 300) {
        showSuccess(customMessage || 'Операция выполнена успешно');
    } else if (status >= 400 && status < 500) {
        let errorMessage = customMessage;

        if (!errorMessage && errorData) {
            errorMessage = errorData.message || errorData.error || errorData.detail;
        }

        if (!errorMessage) {
            switch (status) {
                case 400:
                    errorMessage = 'Некорректный запрос';
                    break;
                case 401:
                    errorMessage = 'Необходима авторизация';
                    break;
                case 403:
                    errorMessage = 'Доступ запрещён';
                    break;
                case 404:
                    errorMessage = 'Ресурс не найден';
                    break;
                case 409:
                    errorMessage = 'Конфликт данных';
                    break;
                default:
                    errorMessage = 'Ошибка запроса';
            }
        }

        showError(errorMessage);
    } else if (status >= 500) {
        const errorMessage = customMessage || 'Ошибка сервера. Попробуйте позже';
        showError(errorMessage);
    }
};

/**
 * Обработать специфичные ошибки (например, связанные данные)
 * @param {Error} error - Объект ошибки
 * @param {Object} customMessages - Кастомные сообщения для разных типов ошибок
 */
export const handleApiError = (error, customMessages = {}) => {
    if (!error.response) {
        showError('Ошибка сети. Проверьте подключение');
        return;
    }

    const { status, data } = error.response;

    if (data && data.message) {
        const message = data.message.toLowerCase();

        if (message.includes('используется') || message.includes('связан') ||
            message.includes('referenced') || message.includes('constraint')) {
            showError(
                customMessages.constraint ||
                'Невозможно удалить. Элемент используется в других структурах'
            );
            return;
        }

        if (message.includes('duplicate') || message.includes('уже существует')) {
            showError(
                customMessages.duplicate ||
                'Элемент с таким именем уже существует'
            );
            return;
        }

        if (message.includes('validation') || message.includes('invalid')) {
            showError(
                customMessages.validation ||
                'Проверьте правильность введённых данных'
            );
            return;
        }
    }

    handleHttpStatus(status, customMessages.default, data);
};

/**
 * Показать уведомление о связанных данных
 * @param {string} itemType - Тип элемента (компонент, узел и т.д.)
 * @param {string} usedIn - Где используется
 */
export const showConstraintError = (itemType = 'Элемент', usedIn = 'других структурах') => {
    showError(`${itemType} используется в ${usedIn} и не может быть удалён`);
};

/**
 * Destroy все активные уведомления
 */
export const destroyAll = () => {
    message.destroy();
};

export default {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    handleHttpStatus,
    handleApiError,
    showConstraintError,
    destroyAll,
};