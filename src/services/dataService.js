import { mockProjects, mockStructureTree } from '../data/mockData';

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
        this.STORAGE_KEY_PREFIX = 'project_';
        this.STRUCTURE_TREE_KEY = 'structure_tree';
        this.initializeStorage();
    }

    initializeStorage() {
        const existingTree = localStorage.getItem(this.STRUCTURE_TREE_KEY);
        if (!existingTree && mockStructureTree) {
            localStorage.setItem(this.STRUCTURE_TREE_KEY, JSON.stringify(mockStructureTree));
        }

        mockProjects.forEach(project => {
            const storageKey = this.STORAGE_KEY_PREFIX + project.id;
            const existingProject = localStorage.getItem(storageKey);
            if (!existingProject) {
                localStorage.setItem(storageKey, JSON.stringify(project));
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
            const storageKey = this.STORAGE_KEY_PREFIX + projectId;
            const project = localStorage.getItem(storageKey);
            if (project) {
                const parsedProject = JSON.parse(project);
                console.log('project', parsedProject)
                // Миграция данных: добавление units[] в partModels, если их нет
                if (parsedProject.partModels) {
                    parsedProject.partModels = parsedProject.partModels.map(pm => ({
                        ...pm,
                        componentTypeId: pm.componentTypeId || null,
                        units: (pm.units || []).map(unit => ({
                            ...unit,
                            partModelId: unit.partModelId || pm.id
                        }))
                    }));
                }

                const defaultTimelineRange = getDefaultTimelineRange();
                let timelineUpdated = false;

                if (!parsedProject.timeline) {
                    parsedProject.timeline = {
                        start: defaultTimelineRange.start,
                        end: defaultTimelineRange.end,
                        assemblyStates: [],
                        unitAssignments: [],
                        maintenanceEvents: []
                    };
                    timelineUpdated = true;
                } else {
                    const { timeline } = parsedProject;
                    if (!timeline.start) {
                        timeline.start = defaultTimelineRange.start;
                        timelineUpdated = true;
                    }
                    if (!timeline.end) {
                        timeline.end = defaultTimelineRange.end;
                        timelineUpdated = true;
                    }
                    if (!Array.isArray(timeline.assemblyStates)) {
                        timeline.assemblyStates = [];
                        timelineUpdated = true;
                    }
                    if (!Array.isArray(timeline.unitAssignments)) {
                        timeline.unitAssignments = [];
                        timelineUpdated = true;
                    }
                    if (!Array.isArray(timeline.maintenanceEvents)) {
                        timeline.maintenanceEvents = [];
                        timelineUpdated = true;
                    }
                }

                if (timelineUpdated) {
                    localStorage.setItem(storageKey, JSON.stringify(parsedProject));
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
            const defaultTimelineRange = getDefaultTimelineRange();
            const providedTimeline = projectData.timeline || {};
            const timelineStart = providedTimeline.start || defaultTimelineRange.start;
            const timelineEnd = providedTimeline.end || defaultTimelineRange.end;

            const newProject = {
                ...projectData,
                assemblyTypes: [],
                componentTypes: [],
                partModels: [],
                nodes: [],
                timeline: {
                    start: timelineStart,
                    end: timelineEnd,
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