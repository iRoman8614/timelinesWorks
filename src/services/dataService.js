// DataService больше не использует localStorage
// Все данные работают через state и API запросы

const getDefaultTimelineRange = () => {
    const now = new Date();
    const year = now.getFullYear();
    return {
        start: `${year}-01-01`,
        end: `${year}-12-31`
    };
};

class DataService {
    constructor() {
    }


    getStructureTree() {
        return Promise.resolve({ rootItems: [] });
    }

    saveStructureTree(tree) {
        return Promise.resolve(tree);
    }

    getProject(projectId) {
        return Promise.reject(new Error('Use API service instead of dataService'));
    }

    saveProject(projectId, projectData) {
        return Promise.reject(new Error('Use API service instead of dataService'));
    }

    createProject(projectData) {
        return Promise.reject(new Error('Use API service instead of dataService'));
    }

    deleteProject(projectId) {
        return Promise.reject(new Error('Use API service instead of dataService'));
    }

    addFolder(folderData, parentKey = null) {
        return Promise.reject(new Error('Folder functionality removed'));
    }

    addProjectToTree(projectData, parentKey = null) {
        return Promise.reject(new Error('Use API service instead'));
    }

    addItemToParent(items, parentKey, newItem) {
        return false;
    }

    deleteFromTree(itemKey) {
        return Promise.reject(new Error('Use API service instead'));
    }

    removeItem(items, keyToRemove) {
        return false;
    }
}

export const dataService = new DataService();