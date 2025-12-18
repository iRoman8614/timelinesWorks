/**
 * Построить иерархическое дерево из плоского списка элементов
 * @param {Array} items - Плоский список элементов с parentId
 * @param {string|null} parentId - ID родителя для построения поддерева
 * @returns {Array} - Иерархическое дерево
 */
export const buildTree = (items, parentId = null) => {
    return items
        .filter(item => {
            const itemParentId = item.parentId === undefined ? null : item.parentId;
            return itemParentId === parentId;
        })
        .map(item => ({
            ...item,
            children: buildTree(items, item.id),
        }))
        .sort((a, b) => {
            if (a.type === 'FOLDER' && b.type !== 'FOLDER') return -1;
            if (a.type !== 'FOLDER' && b.type === 'FOLDER') return 1;
            return a.name.localeCompare(b.name);
        });
};

/**
 * Найти элемент в дереве по ID
 * @param {Array} tree - Дерево элементов
 * @param {string} id - ID искомого элемента
 * @returns {Object|null} - Найденный элемент или null
 */
export const findInTree = (tree, id) => {
    for (const node of tree) {
        if (node.id === id) return node;
        if (node.children && node.children.length > 0) {
            const found = findInTree(node.children, id);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Получить путь к элементу в дереве
 * @param {Array} tree - Дерево элементов
 * @param {string} id - ID искомого элемента
 * @param {Array} path - Накопленный путь
 * @returns {Array|null} - Путь к элементу или null
 */
export const getPathToNode = (tree, id, path = []) => {
    for (const node of tree) {
        const currentPath = [...path, node];
        if (node.id === id) return currentPath;
        if (node.children && node.children.length > 0) {
            const found = getPathToNode(node.children, id, currentPath);
            if (found) return found;
        }
    }
    return null;
};

/**
 * Проверить, является ли элемент потомком другого элемента
 * @param {Array} tree - Дерево элементов
 * @param {string} parentId - ID предполагаемого родителя
 * @param {string} childId - ID предполагаемого потомка
 * @returns {boolean}
 */
export const isDescendant = (tree, parentId, childId) => {
    const parent = findInTree(tree, parentId);
    if (!parent) return false;
    return findInTree([parent], childId) !== null;
};

/**
 * Получить всех потомков элемента
 * @param {Object} node - Узел дерева
 * @returns {Array} - Плоский список всех потомков
 */
export const getAllDescendants = (node) => {
    if (!node.children || node.children.length === 0) return [];
    const descendants = [...node.children];
    node.children.forEach(child => {
        descendants.push(...getAllDescendants(child));
    });
    return descendants;
};

/**
 * Подсчитать количество проектов в папке (включая вложенные)
 * @param {Object} folder - Папка
 * @returns {number}
 */
export const countProjectsInFolder = (folder) => {
    if (!folder.children || folder.children.length === 0) return 0;
    let count = 0;
    folder.children.forEach(child => {
        if (child.type === 'PROJECT') {
            count++;
        } else if (child.type === 'FOLDER') {
            count += countProjectsInFolder(child);
        }
    });
    return count;
};