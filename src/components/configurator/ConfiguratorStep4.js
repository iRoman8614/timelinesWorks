import React, { useState } from 'react';
import { Row, Col, message } from 'antd';
import { DndContext, DragOverlay, closestCenter, useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import NodeForm from '../forms/NodeForm';
import AssemblyForm from '../forms/AssemblyForm';
import NodeStructureTree from '../tables/NodeStructureTree';
import './ConfiguratorStep4.css';

const ConfiguratorStep4 = ({
                               nodes,
                               assemblyTypes,
                               onAddNode,
                               onUpdateNode,
                               onDeleteNode,
                               onAddAssembly,
                               onUpdateAssembly,
                               onDeleteAssembly,
                               onMoveItem
                           }) => {
    const [editingNode, setEditingNode] = useState(null);
    const [editingAssembly, setEditingAssembly] = useState(null);
    const [addingAssembly, setAddingAssembly] = useState(false);
    const [activeId, setActiveId] = useState(null);

    // Root Drop Zone Component
    const RootDropZone = ({ isActive }) => {
        const { setNodeRef, isOver } = useDroppable({
            id: 'node-root-drop-zone',
        });

        if (!isActive) return null;

        return (
            <tr
                ref={setNodeRef}
                className={`node-root-drop-zone-row ${isOver ? 'node-root-drop-zone-row-over' : ''}`}
                style={{
                    opacity: isOver ? 1 : 0.6,
                    transition: 'opacity 0.3s ease'
                }}
            >
                <td colSpan={4}>
                    <div className="node-root-drop-zone-content">
                        Переместить на верхний уровень
                    </div>
                </td>
            </tr>
        );
    };

    const showAssemblyForm = addingAssembly || editingAssembly !== null;

    const handleEditNode = (record) => {
        setEditingNode(record);
        setAddingAssembly(false);
        setEditingAssembly(null);
    };

    const handleCancelEditNode = () => {
        setEditingNode(null);
    };

    const handleUpdateNodeSubmit = async (id, values) => {
        await onUpdateNode(id, values);
        setEditingNode(null);
    };

    const handleSwitchToAssembly = () => {
        setAddingAssembly(true);
        setEditingNode(null);
    };

    const handleBackToNode = () => {
        setAddingAssembly(false);
        setEditingAssembly(null);
    };

    const handleEditAssembly = (record) => {
        setEditingAssembly(record);
        setAddingAssembly(false);
        setEditingNode(null);
    };

    const handleCancelEditAssembly = () => {
        setEditingAssembly(null);
    };

    const handleUpdateAssemblySubmit = async (id, values) => {
        await onUpdateAssembly(id, values);
        setEditingAssembly(null);
    };

    const handleAddAssemblySubmit = async (assembly) => {
        await onAddAssembly(assembly);
        setAddingAssembly(false);
    };

    const getAllIds = (items) => {
        const ids = [];
        const traverse = (nodes) => {
            nodes.forEach(node => {
                ids.push(node.id);
                if (node.children) {
                    traverse(node.children);
                }
            });
        };
        traverse(items);
        return ids;
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

        if (over.id === 'node-root-drop-zone') {
            newParentId = null;
        } else if (targetItem?.type === 'NODE') {
            newParentId = targetItem.id;
        } else if (targetItem) {
            newParentId = targetItem.parentId || null;
        } else {
            return;
        }

        if (draggedItem.id === newParentId) {
            message.warning('Нельзя переместить узел сам в себя');
            return;
        }

        if (draggedItem.type === 'NODE' && newParentId) {
            const isDescendant = (nodeId, targetId, items) => {
                const findNode = (id, nodes) => {
                    for (const node of nodes) {
                        if (node.id === id) return node;
                        if (node.children) {
                            const found = findNode(id, node.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const node = findNode(nodeId, items);
                if (!node || !node.children) return false;

                const queue = [...node.children];
                while (queue.length > 0) {
                    const current = queue.shift();
                    if (current.id === targetId) return true;
                    if (current.children) {
                        queue.push(...current.children);
                    }
                }
                return false;
            };

            if (isDescendant(draggedItem.id, newParentId, nodes)) {
                message.warning('Нельзя переместить узел в своих потомков');
                return;
            }
        }

        if (draggedItem.type === 'ASSEMBLY' && targetItem?.type === 'ASSEMBLY') {
            message.warning('Нельзя вкладывать агрегат в агрегат');
            return;
        }

        if (draggedItem.parentId !== newParentId) {
            onMoveItem(draggedItem.id, newParentId);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    return (
        <DndContext
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <div className="configurator-step">
                <Row gutter={24} style={{ height: '100%' }}>
                    <Col xs={24} lg={6} style={{ height: '100%' }}>
                        {showAssemblyForm ? (
                            <AssemblyForm
                                assemblyTypes={assemblyTypes}
                                onAdd={handleAddAssemblySubmit}
                                onUpdate={handleUpdateAssemblySubmit}
                                editingItem={editingAssembly}
                                onCancelEdit={handleCancelEditAssembly}
                                onBack={handleBackToNode}
                            />
                        ) : (
                            <NodeForm
                                onAdd={onAddNode}
                                onUpdate={handleUpdateNodeSubmit}
                                editingItem={editingNode}
                                onCancelEdit={handleCancelEditNode}
                                onSwitchToAssembly={handleSwitchToAssembly}
                            />
                        )}
                    </Col>

                    <Col xs={24} lg={18} style={{ height: '100%' }}>
                        <SortableContext
                            items={getAllIds(nodes)}
                            strategy={verticalListSortingStrategy}
                        >
                            <NodeStructureTree
                                nodes={nodes}
                                assemblyTypes={assemblyTypes}
                                onEditNode={handleEditNode}
                                onDeleteNode={onDeleteNode}
                                onEditAssembly={handleEditAssembly}
                                onDeleteAssembly={onDeleteAssembly}
                                RootDropZone={RootDropZone}
                                activeId={activeId}
                            />
                        </SortableContext>
                    </Col>
                </Row>

                <DragOverlay>
                    {activeId ? <div className="drag-overlay-node">Перемещение...</div> : null}
                </DragOverlay>
            </div>
        </DndContext>
    );
};

export default ConfiguratorStep4;