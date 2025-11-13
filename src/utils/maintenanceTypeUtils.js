/**
 * Утилиты для работы с иерархией типов ТО (MaintenanceType)
 */

/**
 * Добавляет новый тип ТО в иерархию
 * @param {Array} maintenanceTypes - массив корневых типов ТО
 * @param {Object} newType - новый тип ТО для добавления
 * @returns {Array} обновленный массив типов ТО
 */
export const addMaintenanceType = (maintenanceTypes, newType) => {
    if (!newType.parentId) {
        // Если нет родителя - добавляем в корень
        return [...maintenanceTypes, newType];
    }

    // Рекурсивно ищем родителя и добавляем к нему ребенка
    const addToParent = (types) => {
        return types.map(type => {
            if (type.id === newType.parentId) {
                return {
                    ...type,
                    children: [...(type.children || []), newType]
                };
            }
            if (type.children && type.children.length > 0) {
                return {
                    ...type,
                    children: addToParent(type.children)
                };
            }
            return type;
        });
    };

    return addToParent(maintenanceTypes);
};

/**
 * Удаляет тип ТО из иерархии
 * @param {Array} maintenanceTypes - массив типов ТО
 * @param {string} typeId - ID типа для удаления
 * @returns {Array} обновленный массив типов ТО
 */
export const removeMaintenanceType = (maintenanceTypes, typeId) => {
    const removeFromTree = (types) => {
        return types
            .filter(type => type.id !== typeId)
            .map(type => {
                if (type.children && type.children.length > 0) {
                    return {
                        ...type,
                        children: removeFromTree(type.children)
                    };
                }
                return type;
            });
    };

    return removeFromTree(maintenanceTypes);
};

/**
 * Находит тип ТО по ID в иерархии
 * @param {Array} maintenanceTypes - массив типов ТО
 * @param {string} typeId - ID искомого типа
 * @returns {Object|null} найденный тип ТО или null
 */
export const findMaintenanceType = (maintenanceTypes, typeId) => {
    for (const type of maintenanceTypes) {
        if (type.id === typeId) {
            return type;
        }
        if (type.children && type.children.length > 0) {
            const found = findMaintenanceType(type.children, typeId);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Проверяет, имеет ли тип ТО дочерние элементы
 * @param {Array} maintenanceTypes - массив типов ТО
 * @param {string} typeId - ID проверяемого типа
 * @returns {boolean} true если есть дочерние элементы
 */
export const hasChildren = (maintenanceTypes, typeId) => {
    const type = findMaintenanceType(maintenanceTypes, typeId);
    return type && type.children && type.children.length > 0;
};

/**
 * Получает путь от корня до указанного типа ТО
 * @param {Array} maintenanceTypes - массив типов ТО
 * @param {string} typeId - ID типа
 * @returns {Array} массив типов ТО от корня до целевого
 */
export const getPathToType = (maintenanceTypes, typeId, currentPath = []) => {
    for (const type of maintenanceTypes) {
        const newPath = [...currentPath, type];

        if (type.id === typeId) {
            return newPath;
        }

        if (type.children && type.children.length > 0) {
            const found = getPathToType(type.children, typeId, newPath);
            if (found.length > 0) return found;
        }
    }
    return [];
};

/**
 * Обновляет тип ТО в иерархии
 * @param {Array} maintenanceTypes - массив типов ТО
 * @param {string} typeId - ID типа для обновления
 * @param {Object} updates - объект с обновлениями
 * @returns {Array} обновленный массив типов ТО
 */
export const updateMaintenanceType = (maintenanceTypes, typeId, updates) => {
    return maintenanceTypes.map(type => {
        if (type.id === typeId) {
            return { ...type, ...updates };
        }
        if (type.children && type.children.length > 0) {
            return {
                ...type,
                children: updateMaintenanceType(type.children, typeId, updates)
            };
        }
        return type;
    });
};

/**
 * Получает все типы ТО в виде плоского массива
 * @param {Array} maintenanceTypes - массив типов ТО
 * @returns {Array} плоский массив всех типов ТО
 */
export const flattenMaintenanceTypes = (maintenanceTypes) => {
    const result = [];

    const traverse = (types, level = 0) => {
        types.forEach(type => {
            result.push({ ...type, level });
            if (type.children && type.children.length > 0) {
                traverse(type.children, level + 1);
            }
        });
    };

    traverse(maintenanceTypes);
    return result;
};

/**
 * Валидирует данные типа ТО
 * @param {Object} typeData - данные типа ТО
 * @returns {Object} { valid: boolean, errors: Array }
 */
export const validateMaintenanceType = (typeData) => {
    const errors = [];

    if (!typeData.name || typeData.name.trim() === '') {
        errors.push('Название типа ТО обязательно');
    }

    if (!typeData.duration || typeData.duration < 1) {
        errors.push('Продолжительность должна быть больше 0');
    }

    if (!typeData.interval || typeData.interval < 0) {
        errors.push('Интервал наработки должен быть неотрицательным');
    }

    if (typeData.deviation !== undefined && typeData.deviation < 0) {
        errors.push('Отклонение должно быть неотрицательным');
    }

    return {
        valid: errors.length === 0,
        errors
    };
};