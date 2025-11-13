//const API_BASE = process.env.REACT_APP_API_BASE_URL;
const API_BASE = `${process.env.REACT_APP_API_BASE_URL}/projects`;

const serializeProject = (project) => ({
    id: project.id,
    name: project.name,
    description: project.description || '',
    structure: JSON.stringify(project)
});

const deserializeProject = (dto) => {
    try {
        return JSON.parse(dto.structure);
    } catch (e) {
        console.error('Ошибка парсинга structure от сервера:', e, dto);
        throw e;
    }
};

export const serverProjectsApi = {
    async getAll() {
        const res = await fetch(API_BASE, { method: 'GET' });
        if (!res.ok) throw new Error('Failed to load projects');
        return res.json(); // [{id,name,description,structure}, ...]
    },

    async getById(id) {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'GET' });
        if (!res.ok) throw new Error('Failed to load project ' + id);
        const dto = await res.json();
        return deserializeProject(dto);
    },

    async createEmpty(name = 'Новый проект', description = '') {
        const base = {
            id: crypto.randomUUID(),
            name,
            description,
            assemblyTypes: [],
            componentTypes: [],
            partModels: [],
            nodes: [],
            timeline: {
                start: '2025-01-01',
                end: '2025-12-31',
                assemblyStates: [],
                unitAssignments: [],
                maintenanceEvents: []
            }
        };

        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serializeProject(base))
        });

        if (!res.ok) throw new Error('Failed to create project');
        const dto = await res.json();
        return deserializeProject(dto);
    },

    async save(project) {
        const res = await fetch(API_BASE, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(serializeProject(project))
        });
        if (!res.ok) throw new Error('Failed to save project');
        const dto = await res.json();
        return deserializeProject(dto);
    },

    async delete(id) {
        const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
        if (!res.ok) throw new Error('Failed to delete project');
    }
};
