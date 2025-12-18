import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import folderApi from '../services/api/folderApi';
import projectApi from '../services/api/projectApi';
import { buildTree } from '../utils/treeUtils';

const ProjectContext = createContext(null);

export const useProjects = () => {
    const context = useContext(ProjectContext);
    if (!context) {
        throw new Error('useProjects must be used within ProjectProvider');
    }
    return context;
};

export const ProjectProvider = ({ children }) => {
    const [folders, setFolders] = useState([]);
    const [projects, setProjects] = useState([]);
    const [tree, setTree] = useState([]);
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [foldersData, projectsData] = await Promise.all([
                folderApi.getAll(),
                projectApi.getAll(),
            ]);

            console.log('Loaded folders:', foldersData);
            console.log('Loaded projects:', projectsData);

            setFolders(foldersData);
            setProjects(projectsData);

            const allItems = [
                ...foldersData.map(f => ({ ...f, type: f.type || 'FOLDER' })),
                ...projectsData.map(p => ({ ...p, type: p.type || 'PROJECT' })),
            ];

            console.log('All items for tree:', allItems);

            const treeData = buildTree(allItems);
            console.log('Built tree:', treeData);

            setTree(treeData);
        } catch (error) {
            message.error('Ошибка загрузки данных: ' + error.message);
            console.error('Load data error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const createFolder = useCallback(async (folderData) => {
        try {
            const newFolder = await folderApi.create(folderData);
            await loadData();
            message.success('Папка создана');
            return newFolder;
        } catch (error) {
            message.error('Ошибка создания папки: ' + error.message);
            throw error;
        }
    }, [loadData]);

    const updateFolder = useCallback(async (id, folderData) => {
        try {
            await folderApi.patch(id, folderData);
            await loadData();
            message.success('Папка обновлена');
        } catch (error) {
            message.error('Ошибка обновления папки: ' + error.message);
            throw error;
        }
    }, [loadData]);

    const deleteFolder = useCallback(async (id) => {
        try {
            await folderApi.delete(id);
            await loadData();
            message.success('Папка удалена');
        } catch (error) {
            message.error('Ошибка удаления папки: ' + error.message);
            throw error;
        }
    }, [loadData]);

    const createProject = useCallback(async (projectData) => {
        try {
            const newProject = await projectApi.create(projectData);
            await loadData();
            message.success('Проект создан');
            return newProject;
        } catch (error) {
            message.error('Ошибка создания проекта: ' + error.message);
            throw error;
        }
    }, [loadData]);

    const updateProject = useCallback(async (id, projectData) => {
        try {
            await projectApi.patch(id, projectData);
            await loadData();
            message.success('Проект обновлен');
        } catch (error) {
            message.error('Ошибка обновления проекта: ' + error.message);
            throw error;
        }
    }, [loadData]);

    const deleteProject = useCallback(async (id) => {
        try {
            await projectApi.delete(id);
            if (selectedProject?.id === id) {
                setSelectedProject(null);
            }
            await loadData();
            message.success('Проект удален');
        } catch (error) {
            message.error('Ошибка удаления проекта: ' + error.message);
            throw error;
        }
    }, [loadData, selectedProject]);

    const moveItem = useCallback(async (itemId, itemType, newParentId) => {
        try {
            if (itemType === 'FOLDER') {
                await folderApi.move(itemId, newParentId);
            } else {
                await projectApi.move(itemId, newParentId);
            }
            await loadData();
            message.success('Элемент перемещен');
        } catch (error) {
            message.error('Ошибка перемещения: ' + error.message);
            throw error;
        }
    }, [loadData]);

    const openProject = useCallback(async (projectId) => {
        try {
            const project = await projectApi.getById(projectId);
            setSelectedProject(project);
            return project;
        } catch (error) {
            message.error('Ошибка открытия проекта: ' + error.message);
            throw error;
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const value = {
        folders,
        projects,
        tree,
        selectedProject,
        loading,
        loadData,
        createFolder,
        updateFolder,
        deleteFolder,
        createProject,
        updateProject,
        deleteProject,
        moveItem,
        openProject,
        setSelectedProject,
    };

    return (
        <ProjectContext.Provider value={value}>
            {children}
        </ProjectContext.Provider>
    );
};