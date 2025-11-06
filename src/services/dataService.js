import { mockStructureTree, mockProjects } from '../data/mockData';

// Сервис для работы с данными
// В будущем здесь будут API вызовы

export const dataService = {
    // Получить дерево проектов
    getStructureTree: () => {
        return Promise.resolve(mockStructureTree);
    },

    // Получить данные проекта по ID
    getProject: (projectId) => {
        const project = mockProjects[projectId];
        if (!project) {
            return Promise.reject(new Error(`Project ${projectId} not found`));
        }
        return Promise.resolve(project);
    },

    // Получить все проекты
    getAllProjects: () => {
        return Promise.resolve(mockProjects);
    }
};