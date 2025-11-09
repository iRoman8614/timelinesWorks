import { mockProjects } from '../data/mockData';

class DataService {
    constructor() {
        this.STORAGE_KEY_PREFIX = 'project_';
        this.STRUCTURE_TREE_KEY = 'structure_tree';
        this.initializeStorage();
    }

    normalizeNodes(nodes = []) {
        return (nodes || []).map(node => {
            const normalizedChildren = this.normalizeNodes(node.children || []);

            const isAssemblyTypeString = typeof node.type === 'string'
                && node.type !== 'ASSEMBLY'
                && node.type !== 'assembly'
                && node.type !== 'NODE'
                && node.type !== 'node'
                && node.type !== 'folder'
                && node.type !== 'project';

            const inferredAssemblyTypeId = node.assemblyTypeId
                || (isAssemblyTypeString ? node.type : undefined);

            const isAssembly = node.type === 'ASSEMBLY'
                || node.type === 'assembly'
                || Boolean(inferredAssemblyTypeId);

            let normalizedType = node.type;
            if (isAssembly) {
                normalizedType = 'ASSEMBLY';
            } else if (normalizedType === 'node') {
                normalizedType = 'NODE';
            }

            return {
                ...node,
                type: normalizedType,
                assemblyTypeId: inferredAssemblyTypeId,
                children: normalizedChildren
            };
        });
    }

    normalizeAssemblyTypes(assemblyTypes = []) {
        return (assemblyTypes || []).map(assemblyType => ({
            ...assemblyType,
            components: (assemblyType.components || []).map(component => {
                const componentTypeId = component.componentTypeId || component.type;
                const { type, ...rest } = component;

                return {
                    ...rest,
                    componentTypeId
                };
            })
        }));
    }

    initializeStorage() {
        const existingTree = localStorage.getItem(this.STRUCTURE_TREE_KEY);
        // if (!existingTree) {
        //     localStorage.setItem(this.STRUCTURE_TREE_KEY, JSON.stringify(mockStructureTree));
        // }

        Object.keys(mockProjects).forEach(projectKey => {
            const projectId = mockProjects[projectKey].id;
            const existingProject = localStorage.getItem(this.STORAGE_KEY_PREFIX + projectId);
            if (!existingProject) {
                localStorage.setItem(
                    this.STORAGE_KEY_PREFIX + projectId,
                    JSON.stringify(mockProjects[projectKey])
                );
            }
        });
    }

    getStructureTree() {
        return new Promise((resolve) => {
            const tree = localStorage.getItem(this.STRUCTURE_TREE_KEY);
            resolve(tree ? JSON.parse(tree) : { rootItems: [] });
        });
    }

    saveStructureTree(tree) {
        return new Promise((resolve) => {
            localStorage.setItem(this.STRUCTURE_TREE_KEY, JSON.stringify(tree));
            resolve(tree);
        });
    }

    getProject(projectId) {
        return new Promise((resolve, reject) => {
            const project = localStorage.getItem(this.STORAGE_KEY_PREFIX + projectId);
            if (project) {
                const parsedProject = JSON.parse(project);
                console.log('project', parsedProject)
                // Миграция данных: добавление units[] в partModels, если их нет
                if (parsedProject.partModels) {
                    parsedProject.partModels = parsedProject.partModels.map(pm => ({
                        ...pm,
                        units: pm.units || []
                    }));
                }

                if (parsedProject.assemblyTypes) {
                    parsedProject.assemblyTypes = this.normalizeAssemblyTypes(parsedProject.assemblyTypes);
                }

                if (parsedProject.nodes) {
                    parsedProject.nodes = this.normalizeNodes(parsedProject.nodes);
                }

                resolve(parsedProject);
            } else {
                reject(new Error('Project not found'));
            }
        });
    }

    saveProject(projectId, projectData) {
        return new Promise((resolve) => {
            localStorage.setItem(
                this.STORAGE_KEY_PREFIX + projectId,
                JSON.stringify(projectData)
            );
            resolve(projectData);
        });
    }

    createProject(projectData) {
        return new Promise((resolve) => {
            const newProject = {
                ...projectData,
                assemblyTypes: [],
                componentTypes: [],
                partModels: [],
                nodes: [],
                timeline: {
                    assemblyStates: [],
                    unitAssignments: [],
                    maintenanceEvents: []
                }
            };
            localStorage.setItem(
                this.STORAGE_KEY_PREFIX + newProject.id,
                JSON.stringify(newProject)
            );
            resolve(newProject);
        });
    }

    deleteProject(projectId) {
        return new Promise((resolve) => {
            localStorage.removeItem(this.STORAGE_KEY_PREFIX + projectId);
            resolve();
        });
    }

    addFolder(folderData, parentKey = null) {
        return this.getStructureTree().then(tree => {
            const newFolder = {
                key: `folder-${Date.now()}`,
                type: 'folder',
                title: folderData.name,
                children: []
            };

            if (parentKey) {
                this.addItemToParent(tree.rootItems, parentKey, newFolder);
            } else {
                tree.rootItems.push(newFolder);
            }

            return this.saveStructureTree(tree);
        });
    }

    addProjectToTree(projectData, parentKey = null) {
        return this.createProject(projectData).then(project => {
            return this.getStructureTree().then(tree => {
                const projectItem = {
                    key: project.id,
                    type: 'project',
                    title: project.name,
                    description: project.description
                };

                if (parentKey) {
                    this.addItemToParent(tree.rootItems, parentKey, projectItem);
                } else {
                    tree.rootItems.push(projectItem);
                }

                return this.saveStructureTree(tree);
            });
        });
    }

    addItemToParent(items, parentKey, newItem) {
        for (let item of items) {
            if (item.key === parentKey) {
                if (!item.children) item.children = [];
                item.children.push(newItem);
                return true;
            }
            if (item.children && this.addItemToParent(item.children, parentKey, newItem)) {
                return true;
            }
        }
        return false;
    }

    deleteFromTree(itemKey) {
        return this.getStructureTree().then(tree => {
            this.removeItem(tree.rootItems, itemKey);
            return this.saveStructureTree(tree);
        });
    }

    removeItem(items, keyToRemove) {
        for (let i = 0; i < items.length; i++) {
            if (items[i].key === keyToRemove) {
                if (items[i].type === 'project') {
                    this.deleteProject(keyToRemove);
                }
                items.splice(i, 1);
                return true;
            }
            if (items[i].children && this.removeItem(items[i].children, keyToRemove)) {
                return true;
            }
        }
        return false;
    }
}

export const dataService = new DataService();