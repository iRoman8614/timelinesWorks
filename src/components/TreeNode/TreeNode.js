import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import {
    FolderOutlined,
    FolderOpenOutlined,
    FileTextOutlined,
    LoadingOutlined,
    EditOutlined,
    DeleteOutlined,
    PlusOutlined,
    FileAddOutlined,
    HolderOutlined,
    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons';
import { Input, Button, Tooltip } from 'antd';
import InlineConfirm from '../InlineConfirm/InlineConfirm';
import './TreeNode.css';

const TreeNode = ({
                      node,
                      level = 0,
                      onExpand,
                      expanded,
                      onSelect,
                      selected,
                      onCreateFolder,
                      onCreateProject,
                      onRename,
                      onDelete,
                      onLoadFolder,
                      folderContent = null,
                      folderContents = {},
                  }) => {
    const navigate = useNavigate();
    const [editMode, setEditMode] = useState(false);
    const [editName, setEditName] = useState(node.name);
    const [editDescription, setEditDescription] = useState(node.description || '');
    const [loading, setLoading] = useState(false);
    const [hovered, setHovered] = useState(false);

    const isFolder = node.type === 'FOLDER';
    const isExpanded = expanded[node.id];

    let children = [];
    if (isFolder && isExpanded && folderContent) {
        children = [
            ...folderContent.folders.map(f => ({ ...f, type: 'FOLDER' })),
            ...folderContent.projects.map(p => ({ ...p, type: 'PROJECT' })),
        ].sort((a, b) => {
            if (a.type === 'FOLDER' && b.type !== 'FOLDER') return -1;
            if (a.type !== 'FOLDER' && b.type === 'FOLDER') return 1;
            return a.name.localeCompare(b.name);
        });
    }

    const { attributes, listeners, setNodeRef: setDragRef, isDragging } = useDraggable({
        id: node.id,
        data: {
            type: node.type,
            node,
        },
    });

    const { setNodeRef: setDropRef, isOver } = useDroppable({
        id: `drop-${node.id}`,
        data: {
            type: node.type,
            node,
        },
        disabled: !isFolder,
    });

    const handleToggle = async (e) => {
        e.stopPropagation();

        if (!isFolder) return;

        if (isExpanded) {
            onExpand(node.id);
        } else {
            setLoading(true);
            try {
                await onLoadFolder(node.id);
                onExpand(node.id);
            } catch (error) {
                console.error('Error loading folder:', error);
            } finally {
                setLoading(false);
            }
        }
    };

    const handleClick = (e) => {
        e.stopPropagation();

        if (node.type === 'PROJECT') {
            navigate(`/projects/${node.id}`);
        } else {
            onSelect(node);
        }
    };

    const handleSaveEdit = (e) => {
        e?.stopPropagation();

        const trimmedName = editName.trim();
        const trimmedDesc = editDescription.trim();

        if (!trimmedName) {
            return;
        }

        if (trimmedName !== node.name || trimmedDesc !== (node.description || '')) {
            onRename(node.id, node.type, trimmedName, trimmedDesc);
        }
        setEditMode(false);
    };

    const handleCancelEdit = (e) => {
        e?.stopPropagation();
        setEditName(node.name);
        setEditDescription(node.description || '');
        setEditMode(false);
    };

    const handleStartEdit = (e) => {
        e.stopPropagation();
        setEditMode(true);
        setEditName(node.name);
        setEditDescription(node.description || '');
    };

    const handleConfirmDelete = () => {
        console.log('Deleting:', node.id, node.type);
        onDelete(node.id, node.type);
    };

    const handleCreateFolder = (e) => {
        e.stopPropagation();
        onCreateFolder('folder', node.id);
    };

    const handleCreateProject = (e) => {
        e.stopPropagation();
        onCreateProject('project', node.id);
    };

    const renderIcon = () => {
        if (loading) {
            return <LoadingOutlined spin />;
        }
        if (isFolder) {
            return isExpanded ? <FolderOpenOutlined /> : <FolderOutlined />;
        }
        return <FileTextOutlined />;
    };

    return (
        <div className="tree-node-wrapper">
            <div
                ref={(el) => {
                    if (isFolder) setDropRef(el);
                }}
                className={`tree-node ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'drag-over' : ''} ${editMode ? 'editing' : ''}`}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
                onClick={editMode ? undefined : handleClick}
                onMouseEnter={() => setHovered(true)}
                onMouseLeave={() => setHovered(false)}
            >
                {!editMode && (
                    <span
                        ref={setDragRef}
                        className="tree-node-drag-handle"
                        {...attributes}
                        {...listeners}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <HolderOutlined />
                    </span>
                )}

                <div className="tree-node-content">
                    {isFolder && !editMode && (
                        <span className="tree-node-expand" onClick={handleToggle}>
                            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▸</span>
                        </span>
                    )}
                    {(!isFolder || editMode) && <span className="tree-node-expand"></span>}

                    <span className="tree-node-icon">{renderIcon()}</span>

                    {editMode ? (
                        <div className="tree-node-edit-form" onClick={(e) => e.stopPropagation()}>
                            <Input
                                size="small"
                                placeholder="Название"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                onPressEnter={handleSaveEdit}
                                autoFocus
                                className="tree-node-input-name"
                            />
                            <Input
                                size="small"
                                placeholder="Описание (опционально)"
                                value={editDescription}
                                onChange={(e) => setEditDescription(e.target.value)}
                                onPressEnter={handleSaveEdit}
                                className="tree-node-input-desc"
                            />
                            <div className="tree-node-edit-buttons">
                                <Tooltip title="Сохранить">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<CheckOutlined />}
                                        onClick={handleSaveEdit}
                                        className="tree-node-edit-save"
                                    />
                                </Tooltip>
                                <Tooltip title="Отменить">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<CloseOutlined />}
                                        onClick={handleCancelEdit}
                                        className="tree-node-edit-cancel"
                                    />
                                </Tooltip>
                            </div>
                        </div>
                    ) : (
                        <div className="tree-node-info">
                            <span className="tree-node-label">{node.name}</span>
                            {node.description && (
                                <span className="tree-node-description">{node.description}</span>
                            )}
                        </div>
                    )}
                </div>
                {!editMode && (
                    <div className={`tree-node-actions ${hovered ? 'visible' : ''}`}>
                        {isFolder && (
                            <>
                                <Tooltip title="Создать папку">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<PlusOutlined />}
                                        onClick={handleCreateFolder}
                                    />
                                </Tooltip>
                                <Tooltip title="Создать проект">
                                    <Button
                                        type="text"
                                        size="small"
                                        icon={<FileAddOutlined />}
                                        onClick={handleCreateProject}
                                    />
                                </Tooltip>
                            </>
                        )}
                        <Tooltip title="Переименовать">
                            <Button
                                type="text"
                                size="small"
                                icon={<EditOutlined />}
                                onClick={handleStartEdit}
                            />
                        </Tooltip>

                        <InlineConfirm
                            onConfirm={handleConfirmDelete}
                            confirmText="Подтвердить удаление"
                            cancelText="Отменить"
                            danger
                        >
                            <Tooltip title="Удалить">
                                <Button
                                    type="text"
                                    size="small"
                                    danger
                                    icon={<DeleteOutlined />}
                                />
                            </Tooltip>
                        </InlineConfirm>
                    </div>
                )}
            </div>

            {isFolder && isExpanded && children.length > 0 && (
                <div className="tree-node-children">
                    {children.map((child) => (
                        <TreeNode
                            key={child.id}
                            node={child}
                            level={level + 1}
                            onExpand={onExpand}
                            expanded={expanded}
                            onSelect={onSelect}
                            selected={selected === child.id}
                            onCreateFolder={onCreateFolder}
                            onCreateProject={onCreateProject}
                            onRename={onRename}
                            onDelete={onDelete}
                            onLoadFolder={onLoadFolder}
                            folderContent={child.type === 'FOLDER' ? folderContents[child.id] : null}
                            folderContents={folderContents}
                        />
                    ))}
                </div>
            )}

            {isFolder && isExpanded && children.length === 0 && folderContent && (
                <div className="tree-node-empty" style={{ paddingLeft: `${(level + 1) * 20 + 8}px` }}>
                    <span style={{ color: '#8c8c8c', fontSize: '12px' }}>Папка пуста</span>
                </div>
            )}
        </div>
    );
};

export default TreeNode;