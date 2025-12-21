import React, { useState, useEffect } from 'react';
import { DndContext, DragOverlay, closestCenter, useDroppable } from '@dnd-kit/core';
import { Button, Modal, Form, Empty, Spin, Input } from 'antd';
import { FolderAddOutlined, FileAddOutlined } from '@ant-design/icons';
import { useProjects } from '../../hooks/useProjectContext';
import TreeNode from '../../components/TreeNode/TreeNode';
import './ProjectsPage.css';

const ProjectsPage = () => {
    const {
        rootItems,
        folderContents,
        loading,
        loadRootItems,
        loadFolderContent,
        createFolder,
        createProject,
        updateFolder,
        updateProject,
        deleteFolder,
        deleteProject,
        moveItem,
        openProject,
    } = useProjects();

    useEffect(() => {
        loadRootItems();
    }, []);

    const RootDropZone = ({ isActive }) => {
        const { setNodeRef, isOver } = useDroppable({
            id: 'root-drop-zone',
        });

        return (
            <div
                ref={setNodeRef}
                className={`root-drop-zone-item ${isOver ? 'root-drop-zone-item-over' : ''}`}
                style={{
                    opacity: isActive ? (isOver ? 1 : 0.6) : 0,
                    pointerEvents: isActive ? 'auto' : 'none',
                    transition: 'opacity 0.3s ease'
                }}
            >
                <div className="root-drop-zone-item-content">
                    Вынсти из папок
                </div>
            </div>
        );
    };


    const [expanded, setExpanded] = useState({});
    const [selectedId, setSelectedId] = useState(null);
    const [activeId, setActiveId] = useState(null);
    const [createModalVisible, setCreateModalVisible] = useState(false);
    const [createType, setCreateType] = useState(null); // 'folder' or 'project'
    const [createParentId, setCreateParentId] = useState(null);
    const [form] = Form.useForm();

    const handleExpand = (id) => {
        setExpanded((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleLoadFolder = async (folderId) => {
        await loadFolderContent(folderId);
    };

    const handleSelect = (node) => {
        setSelectedId(node.id);
        if (node.type === 'PROJECT') {
            openProject(node.id);
        }
    };

    const handleCreate = (type, parentId = null) => {
        setCreateType(type);
        setCreateParentId(parentId);
        setCreateModalVisible(true);
        form.resetFields();
    };

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

    const handleRename = async (id, type, newName, newDescription) => {
        try {
            const updateData = {
                name: newName,
                description: newDescription || '',
            };

            if (type === 'FOLDER') {
                await updateFolder(id, updateData);
            } else {
                await updateProject(id, updateData);
            }
        } catch (error) {
            console.error('Rename error:', error);
        }
    };

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

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) return;

        const draggedItem = active.data.current.node;
        const targetItem = over.data.current?.node;

        let newParentId;

        if (over.id === 'root-drop-zone') {
            newParentId = null;
        } else if (targetItem?.type === 'FOLDER') {
            newParentId = targetItem.id;
        } else if (targetItem?.parentId !== undefined) {
            newParentId = targetItem.parentId;
        } else {
            return;
        }

        if (draggedItem.id === newParentId) {
            console.log('Нельзя переместить папку саму в себя');
            return;
        }

        if (draggedItem.type === 'FOLDER' && newParentId) {
            const isDescendant = (folderId, targetId) => {
                const queue = [folderId];
                const visited = new Set();

                while (queue.length > 0) {
                    const currentId = queue.shift();

                    if (visited.has(currentId)) continue;
                    visited.add(currentId);

                    if (currentId === targetId) return true;

                    const content = folderContents[currentId];
                    if (content) {
                        content.forEach(item => {
                            if (item.type === 'FOLDER') {
                                queue.push(item.id);
                            }
                        });
                    }
                }
                return false;
            };

            if (isDescendant(draggedItem.id, newParentId)) {
                return;
            }
        }

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
                    <RootDropZone isActive={activeId !== null} />

                    {rootItems.length === 0 ? (
                        <Empty
                            description="Нет проектов"
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    ) : (
                        rootItems.map((node) => (
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
                                onLoadFolder={handleLoadFolder}
                                folderContent={node.type === 'FOLDER' ? folderContents[node.id] : null}
                                folderContents={folderContents}
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