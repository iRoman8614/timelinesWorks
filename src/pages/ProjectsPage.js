import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core';
import { Button, Input, Modal, Form, Empty, Spin } from 'antd';
import { PlusOutlined, FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import { useProjects } from '../hooks/useProjectContext';
import TreeNode from '../components/TreeNode';
import { isDescendant } from '../utils/treeUtils';
import './ProjectsPage.css';

const ProjectsPage = () => {
    const {
        tree,
        loading,
        createFolder,
        createProject,
        updateFolder,
        updateProject,
        deleteFolder,
        deleteProject,
        moveItem,
        openProject,
    } = useProjects();

    // Логирование для отладки
    useEffect(() => {
        console.log('ProjectsPage - tree updated:', tree);
        console.log('ProjectsPage - tree length:', tree.length);
    }, [tree]);

    const [expanded, setExpanded] = useState({});
    const [selectedId, setSelectedId] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [createType, setCreateType] = useState(null); // 'folder' or 'project'
    const [createParentId, setCreateParentId] = useState(null);
    const [form] = Form.useForm();

    // Раскрытие/скрытие папки
    const handleExpand = (id) => {
        setExpanded((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    // Выбор элемента
    const handleSelect = (node) => {
        setSelectedId(node.id);
        if (node.type === 'PROJECT') {
            openProject(node.id);
        }
    };

    // Открытие модального окна создания
    const handleCreate = (type, parentId = null) => {
        setCreateType(type);
        setCreateParentId(parentId);
        setCreateModalVisible(true);
        form.resetFields();
    };

    // Создание элемента
    const handleCreateSubmit = async () => {
        try {
            const values = await form.validateFields();
            const data = {
                name: values.name,
                description: values.description || '',
                parentId: createParentId,
            };

            if (createType === 'folder') {
                await createFolder(data);
            } else {
                await createProject(data);
            }

            setCreateModalVisible(false);
            form.resetFields();
        } catch (error) {
            console.error('Create error:', error);
        }
    };

    // Переименование
    const handleRename = async (id, type, newName) => {
        try {
            if (type === 'FOLDER') {
                await updateFolder(id, { name: newName });
            } else {
                await updateProject(id, { name: newName });
            }
        } catch (error) {
            console.error('Rename error:', error);
        }
    };

    // Удаление
    const handleDelete = async (id, type) => {
        try {
            if (type === 'FOLDER') {
                await deleteFolder(id);
            } else {
                await deleteProject(id);
            }
        } catch (error) {
            console.error('Delete error:', error);
        }
    };

    // Drag & Drop
    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const draggedItem = active.data.current.node;
        const targetItem = over.data.current?.node;

        // Нельзя перемещать в самого себя или в свои потомки
        if (draggedItem.type === 'FOLDER' && targetItem) {
            // Проверяем всё дерево, чтобы найти элементы
            const allItems = [...tree];
            const flattenTree = (nodes) => {
                let result = [];
                nodes.forEach(node => {
                    result.push(node);
                    if (node.children) {
                        result = result.concat(flattenTree(node.children));
                    }
                });
                return result;
            };
            const flatTree = flattenTree(allItems);

            if (isDescendant(flatTree, draggedItem.id, targetItem.id)) {
                return;
            }
        }

        // Перемещаем элемент
        const newParentId = targetItem?.type === 'FOLDER' ? targetItem.id : targetItem?.parentId || null;

        if (draggedItem.parentId !== newParentId) {
            moveItem(draggedItem.id, draggedItem.type, newParentId);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    if (loading) {
        return (
            <div className="projects-page-loading">
                <Spin size="large" tip="Загрузка проектов..." />
            </div>
        );
    }

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="projects-page">
                <div className="projects-header">
                    <h2>Проекты</h2>
                    <div className="projects-actions">
                        <Button
                            type="primary"
                            icon={<FolderAddOutlined />}
                            onClick={() => handleCreate('folder')}
                        >
                            Создать папку
                        </Button>
                        <Button
                            icon={<FileAddOutlined />}
                            onClick={() => handleCreate('project')}
                        >
                            Создать проект
                        </Button>
                    </div>
                </div>

                <div className="projects-tree">
                    {tree.length === 0 ? (
                        <Empty
                            description="Нет проектов"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        tree.map((node) => (
                            <TreeNode
                                key={node.id}
                                node={node}
                                level={0}
                                onExpand={handleExpand}
                                expanded={expanded}
                                onSelect={handleSelect}
                                selected={selectedId}
                                onCreateFolder={handleCreate}
                                onCreateProject={handleCreate}
                                onRename={handleRename}
                                onDelete={handleDelete}
                            />
                        ))
                    )}
                </div>

                <Modal
                    title={createType === 'folder' ? 'Создать папку' : 'Создать проект'}
                    open={createModalVisible}
                    onOk={handleCreateSubmit}
                    onCancel={() => setCreateModalVisible(false)}
                    okText="Создать"
                    cancelText="Отмена"
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="name"
                            label="Название"
                            rules={[{ required: true, message: 'Введите название' }]}
                        >
                            <Input placeholder="Введите название" />
                        </Form.Item>
                        <Form.Item
                            name="description"
                            label="Описание"
                        >
                            <Input.TextArea
                                placeholder="Введите описание (опционально)"
                                rows={3}
                            />
                        </Form.Item>
                    </Form>
                </Modal>

                <DragOverlay>
                    {activeId ? <div className="drag-overlay">Перемещение...</div> : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default ProjectsPage;