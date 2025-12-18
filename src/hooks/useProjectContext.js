import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { message } from 'antd';
import folderApi from '../services/api/folderApi';
import projectApi from '../services/api/projectApi';

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
    const [rootItems, setRootItems] = useState([]);
    const [folderContents, setFolderContents] = useState({}); // {folderId: {folders: [], projects: []}}
    const [selectedProject, setSelectedProject] = useState(null);
    const [loading, setLoading] = useState(false);

    const loadRootItems = useCallback(async () => {
        setLoading(true);
        try {
            const [allFolders, allProjects] = await Promise.all([
                folderApi.getAll(),
                projectApi.getAll(),
            ]);

            console.log('Loaded all folders:', allFolders);
            console.log('Loaded all projects:', allProjects);

            const rootFolders = allFolders.filter(f => !f.parentId || f.parentId === null);
            const rootProjects = allProjects.filter(p => !p.parentId || p.parentId === null);

            console.log('Root folders:', rootFolders);
            console.log('Root projects:', rootProjects);

            setFolders(allFolders);
            setProjects(allProjects);

            const items = [
                ...rootFolders.map(f => ({ ...f, type: f.type || 'FOLDER' })),
                ...rootProjects.map(p => ({ ...p, type: p.type || 'PROJECT' })),
            ].sort((a, b) => {
                if (a.type === 'FOLDER' && b.type !== 'FOLDER') return -1;
                if (a.type !== 'FOLDER' && b.type === 'FOLDER') return 1;
                return a.name.localeCompare(b.name);
            });

            console.log('Root items:', items);
            setRootItems(items);
        } catch (error) {
            message.error('Ошибка загрузки данных: ' + error.message);
            console.error('Load data error:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const loadFolderContent = useCallback(async (folderId) => {
        if (folderContents[folderId]) {
            return folderContents[folderId];
        }

        try {
            const folderData = await folderApi.getById(folderId);
            console.log('Loaded folder content:', folderData);

            const content = {
                folders: (folderData.children || []).filter(c => c.type === 'FOLDER'),
                projects: (folderData.children || []).filter(c => c.type === 'PROJECT'),
            };

            setFolderContents(prev => ({
                ...prev,
                [folderId]: content,
            }));

            return content;
        } catch (error) {
            message.error('Ошибка загрузки папки: ' + error.message);
            console.error('Load folder error:', error);
            return { folders: [], projects: [] };
        }
    }, [folderContents]);

    const createFolder = useCallback(async (folderData) => {
        try {
            const newFolder = await folderApi.create(folderData);
            await loadRootItems();

            if (folderData.parentId) {
                setFolderContents(prev => {
                    const updated = { ...prev };
                    delete updated[folderData.parentId];
                    return updated;
                });
            }

            message.success('Папка создана');
            return newFolder;
        } catch (error) {
            message.error('Ошибка создания папки: ' + error.message);
            throw error;
        }
    }, [loadRootItems]);

    const updateFolder = useCallback(async (id, folderData) => {
        try {
            await folderApi.patch(id, folderData);
            await loadRootItems();

            setFolderContents({});

            message.success('Папка обновлена');
        } catch (error) {
            message.error('Ошибка обновления папки: ' + error.message);
            throw error;
        }
    }, [loadRootItems]);

    const deleteFolder = useCallback(async (id) => {
        try {
            await folderApi.delete(id);
            await loadRootItems();

            setFolderContents(prev => {
                const updated = { ...prev };
                delete updated[id];
                return updated;
            });

            message.success('Папка удалена');
        } catch (error) {
            message.error('Ошибка удаления папки: ' + error.message);
            throw error;
        }
    }, [loadRootItems]);

    const createProject = useCallback(async (projectData) => {
        try {
            const newProject = await projectApi.create(projectData);
            await loadRootItems();

            if (projectData.parentId) {
                setFolderContents(prev => {
                    const updated = { ...prev };
                    delete updated[projectData.parentId];
                    return updated;
                });
            }

            message.success('Проект создан');
            return newProject;
        } catch (error) {
            message.error('Ошибка создания проекта: ' + error.message);
            throw error;
        }
    }, [loadRootItems]);

    const updateProject = useCallback(async (id, projectData) => {
        try {
            await projectApi.patch(id, projectData);
            await loadRootItems();

            setFolderContents({});

            message.success('Проект обновлен');
        } catch (error) {
            message.error('Ошибка обновления проекта: ' + error.message);
            throw error;
        }
    }, [loadRootItems]);

    const deleteProject = useCallback(async (id) => {
        try {
            await projectApi.delete(id);
            if (selectedProject?.id === id) {
                setSelectedProject(null);
            }
            await loadRootItems();

            setFolderContents({});

            message.success('Проект удален');
        } catch (error) {
            message.error('Ошибка удаления проекта: ' + error.message);
            throw error;
        }
    }, [loadRootItems, selectedProject]);

    const moveItem = useCallback(async (itemId, itemType, newParentId) => {
        try {
            if (itemType === 'FOLDER') {
                await folderApi.move(itemId, newParentId);
            } else {
                await projectApi.move(itemId, newParentId);
            }
            await loadRootItems();

            setFolderContents({});

            message.success('Элемент перемещен');
        } catch (error) {
            message.error('Ошибка перемещения: ' + error.message);
            throw error;
        }
    }, [loadRootItems]);

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
        loadRootItems();
    }, [loadRootItems]);

    const value = {
        folders,
        projects,
        rootItems,
        folderContents,
        selectedProject,
        loading,
        loadRootItems,
        loadFolderContent,
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