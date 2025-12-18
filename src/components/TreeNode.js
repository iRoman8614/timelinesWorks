import React, { useState } from 'react';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { FolderOutlined, FolderOpenOutlined, FileTextOutlined, MoreOutlined } from '@ant-design/icons';
import { Dropdown, Modal, Input, Form } from 'antd';
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
                  }) => {
    const [editMode, setEditMode] = useState(false);
    const [newName, setNewName] = useState(node.name);
    const isFolder = node.type === 'FOLDER';
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expanded[node.id];

    // Drag & Drop
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

    const handleToggle = (e) => {
        e.stopPropagation();
        if (isFolder && hasChildren) {
            onExpand(node.id);
        }
    };

    const handleSelect = () => {
        onSelect(node);
    };

    const handleRename = () => {
        if (newName.trim() && newName !== node.name) {
            onRename(node.id, node.type, newName.trim());
        }
        setEditMode(false);
    };

    const handleDelete = () => {
        Modal.confirm({
            title: `Удалить ${isFolder ? 'папку' : 'проект'} "${node.name}"?`,
            content: isFolder
                ? 'Все содержимое папки также будет удалено.'
                : 'Это действие нельзя отменить.',
            okText: 'Удалить',
            okType: 'danger',
            cancelText: 'Отмена',
            onOk: () => onDelete(node.id, node.type),
        });
    };

    const menuItems = [
        isFolder && {
            key: 'create-folder',
            label: 'Создать папку',
            onClick: () => onCreateFolder(node.id),
        },
        isFolder && {
            key: 'create-project',
            label: 'Создать проект',
            onClick: () => onCreateProject(node.id),
        },
        { type: 'divider' },
        {
            key: 'rename',
            label: 'Переименовать',
            onClick: () => {
                setEditMode(true);
                setNewName(node.name);
            },
        },
        { type: 'divider' },
        {
            key: 'delete',
            label: 'Удалить',
            danger: true,
            onClick: handleDelete,
        },
    ].filter(Boolean);

    const renderIcon = () => {
        if (isFolder) {
            return isExpanded ? <FolderOpenOutlined /> : <FolderOutlined />;
        }
        return <FileTextOutlined />;
    };

    return (
        <div className="tree-node-wrapper">
            <div
                ref={(node) => {
                    setDragRef(node);
                    if (isFolder) setDropRef(node);
                }}
                className={`tree-node ${selected ? 'selected' : ''} ${isDragging ? 'dragging' : ''} ${isOver ? 'drag-over' : ''}`}
                style={{ paddingLeft: `${level * 20 + 8}px` }}
                onClick={handleSelect}
                {...attributes}
                {...listeners}
            >
                <div className="tree-node-content">
                    <span className="tree-node-expand" onClick={handleToggle}>
                        {isFolder && hasChildren && (
                            <span className={`expand-icon ${isExpanded ? 'expanded' : ''}`}>▸</span>
                        )}
                    </span>

                    <span className="tree-node-icon">{renderIcon()}</span>

                    {editMode ? (
                        <Input
                            size="small"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            onPressEnter={handleRename}
                            onBlur={handleRename}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className="tree-node-input"
                        />
                    ) : (
                        <span className="tree-node-label">{node.name}</span>
                    )}

                    {node.type === 'PROJECT' && node.historyUpdatedAt && (
                        <span className="tree-node-date">{node.historyUpdatedAt}</span>
                    )}
                </div>

                <Dropdown
                    menu={{ items: menuItems }}
                    trigger={['click']}
                    onClick={(e) => e.stopPropagation()}
                >
                    <span className="tree-node-actions">
                        <MoreOutlined />
                    </span>
                </Dropdown>
            </div>

            {isFolder && isExpanded && hasChildren && (
                <div className="tree-node-children">
                    {node.children.map((child) => (
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
                        />
                    ))}
                </div>
            )}
        </div>
    );
};

export default TreeNode;