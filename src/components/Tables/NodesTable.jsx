// import React, { useState, useMemo } from 'react';
// import { Table, Button, Space, Typography } from 'antd';
// import {
//     EditOutlined,
//     DeleteOutlined,
//     SettingOutlined,
//     CheckOutlined,
//     CloseOutlined
// } from '@ant-design/icons';
//
// const { Text } = Typography;
//
// const NodesTable = ({ nodes, onEdit, onDelete, onAddChild, onManageConditions, assemblyTypes = [] }) => {
//     const [deletingId, setDeletingId] = useState(null);
//
//     const handleDeleteClick = (record) => {
//         setDeletingId(record.id);
//     };
//
//     const handleConfirmDelete = (record) => {
//         onDelete(record);
//         setDeletingId(null);
//     };
//
//     const handleCancelDelete = () => {
//         setDeletingId(null);
//     };
//
//     // Функция для преобразования дерева в плоский список
//     const buildDataSource = useMemo(() => {
//         const flatten = (nodeList, level = 0) => {
//             if (!nodeList || nodeList.length === 0) return [];
//
//             let result = [];
//
//             nodeList.forEach((node) => {
//                 result.push({
//                     ...node,
//                     key: node.id,
//                     level
//                 });
//             });
//
//             return result;
//         };
//
//         return flatten(nodes);
//     }, [nodes]);
//
//     const columns = [
//         {
//             title: 'Название',
//             dataIndex: 'name',
//             key: 'name',
//             render: (text, record) => (
//                 <Text strong={record.level === 0}>{text}</Text>
//             )
//         },
//         {
//             title: 'Описание',
//             dataIndex: 'description',
//             key: 'description',
//             ellipsis: true
//         },
//         {
//             title: 'Условия',
//             dataIndex: 'conditions',
//             key: 'conditions',
//             width: 100,
//             align: 'center',
//             render: (conditions, record) => (
//                 record.type === 'NODE' ? (
//                     <span>{conditions?.length || 0}</span>
//                 ) : null
//             )
//         },
//         {
//             title: deletingId ? 'Удалить?' : 'Действия',
//             key: 'actions',
//             width: 240,
//             render: (_, record) => {
//                 if (deletingId === record.id) {
//                     return (
//                         <Space size="small">
//                             <Button
//                                 size="small"
//                                 type="primary"
//                                 danger
//                                 icon={<CheckOutlined />}
//                                 onClick={() => handleConfirmDelete(record)}
//                             >
//                                 Да
//                             </Button>
//                             <Button
//                                 size="small"
//                                 icon={<CloseOutlined />}
//                                 onClick={handleCancelDelete}
//                             >
//                                 Нет
//                             </Button>
//                         </Space>
//                     );
//                 }
//
//                 return (
//                     <Space size="small">
//                         {/* Кнопка "Условия" только для NODE */}
//                         {record.type === 'NODE' && (
//                             <Button
//                                 size="small"
//                                 icon={<SettingOutlined />}
//                                 onClick={() => onManageConditions(record)}
//                                 title="Управление условиями"
//                             >
//                                 Условия
//                             </Button>
//                         )}
//                         <Button
//                             size="small"
//                             icon={<EditOutlined />}
//                             onClick={() => onEdit(record)}
//                         />
//                         <Button
//                             size="small"
//                             danger
//                             icon={<DeleteOutlined />}
//                             onClick={() => handleDeleteClick(record)}
//                         />
//                     </Space>
//                 );
//             }
//         }
//     ];
//
//     return (
//         <Table
//             columns={columns}
//             dataSource={buildDataSource}
//             pagination={false}
//             size="small"
//             expandable={{
//                 childrenColumnName: 'children',
//                 defaultExpandAllRows: false,
//                 indentSize: 24
//             }}
//         />
//     );
// };
//
// export default NodesTable;

import React, { useState, useMemo } from 'react';
import { Table, Button, Space, Typography, message } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    SettingOutlined,
    CheckOutlined,
    CloseOutlined,
    HolderOutlined
} from '@ant-design/icons';
import {
    DndContext,
    DragOverlay,
    closestCenter,
    PointerSensor,
    useSensor,
    useSensors
} from '@dnd-kit/core';
import {
    SortableContext,
    useSortable,
    verticalListSortingStrategy
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const { Text } = Typography;

// Компонент перетаскиваемой строки
const DraggableRow = ({ record, children, ...props }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({
        id: record.key,
        data: {
            type: record.type,
            record: record
        }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        cursor: 'move',
        opacity: isDragging ? 0.5 : 1,
        backgroundColor: isDragging ? '#f0f0f0' : 'transparent'
    };

    return (
        <tr ref={setNodeRef} style={style} {...props}>
            {React.Children.map(children, (child) => {
                if (child && child.key === 'drag-handle') {
                    return React.cloneElement(child, {
                        children: (
                            <div {...attributes} {...listeners} style={{ cursor: 'grab', padding: '0 8px' }}>
                                <HolderOutlined />
                            </div>
                        )
                    });
                }
                return child;
            })}
        </tr>
    );
};

const NodesTable = ({ nodes, onEdit, onDelete, onAddChild, onManageConditions, onNodesReorder, assemblyTypes = [] }) => {
    const [deletingId, setDeletingId] = useState(null);
    const [activeId, setActiveId] = useState(null);

    // Настройка сенсоров для перетаскивания
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8 // Минимальное расстояние для начала перетаскивания
            }
        })
    );

    const handleDeleteClick = (record) => {
        setDeletingId(record.id);
    };

    const handleConfirmDelete = (record) => {
        onDelete(record);
        setDeletingId(null);
    };

    const handleCancelDelete = () => {
        setDeletingId(null);
    };

    // Функция для построения плоского списка всех элементов (для SortableContext)
    const getAllIds = useMemo(() => {
        const collectIds = (nodeList) => {
            if (!nodeList || nodeList.length === 0) return [];
            let ids = [];
            nodeList.forEach(node => {
                ids.push(node.id);
                if (node.children && node.children.length > 0) {
                    ids = ids.concat(collectIds(node.children));
                }
            });
            return ids;
        };
        return collectIds(nodes);
    }, [nodes]);

    // Функция для преобразования дерева в плоский список
    const buildDataSource = useMemo(() => {
        const flatten = (nodeList, level = 0) => {
            if (!nodeList || nodeList.length === 0) return [];

            let result = [];

            nodeList.forEach((node) => {
                result.push({
                    ...node,
                    key: node.id,
                    level
                });
            });

            return result;
        };

        return flatten(nodes);
    }, [nodes]);

    // Функция поиска узла по ID
    const findNodeById = (nodeList, id) => {
        for (const node of nodeList) {
            if (node.id === id) return node;
            if (node.children) {
                const found = findNodeById(node.children, id);
                if (found) return found;
            }
        }
        return null;
    };

    // Функция удаления узла из дерева
    const removeNodeById = (nodeList, id) => {
        return nodeList.filter(node => {
            if (node.id === id) return false;
            if (node.children) {
                node.children = removeNodeById(node.children, id);
            }
            return true;
        });
    };

    // Функция добавления узла в дерево
    const addNodeToParent = (nodeList, parentId, nodeToAdd, position = 'end') => {
        return nodeList.map(node => {
            if (node.id === parentId) {
                // Нашли родителя - добавляем дочерний элемент
                const newChildren = node.children ? [...node.children] : [];
                if (position === 'end') {
                    newChildren.push(nodeToAdd);
                } else {
                    newChildren.unshift(nodeToAdd);
                }
                return { ...node, children: newChildren };
            }
            if (node.children) {
                return { ...node, children: addNodeToParent(node.children, parentId, nodeToAdd, position) };
            }
            return node;
        });
    };

    // Функция для вставки узла после определенного элемента
    const insertNodeAfter = (nodeList, targetId, nodeToAdd) => {
        const newList = [];
        for (const node of nodeList) {
            newList.push(node);
            if (node.id === targetId) {
                newList.push(nodeToAdd);
            }
            if (node.children) {
                node.children = insertNodeAfter(node.children, targetId, nodeToAdd);
            }
        }
        return newList;
    };

    const handleDragStart = (event) => {
        setActiveId(event.active.id);
    };

    const handleDragEnd = (event) => {
        const { active, over } = event;
        setActiveId(null);

        if (!over || active.id === over.id) {
            return;
        }

        const draggedNode = findNodeById(nodes, active.id);
        const targetNode = findNodeById(nodes, over.id);

        if (!draggedNode || !targetNode) {
            return;
        }

        // Проверка: нельзя перетащить родителя в своего потомка
        const isDescendant = (parent, childId) => {
            if (parent.id === childId) return true;
            if (parent.children) {
                return parent.children.some(child => isDescendant(child, childId));
            }
            return false;
        };

        if (isDescendant(draggedNode, targetNode.id)) {
            message.warning('Нельзя переместить узел в его дочерний элемент');
            return;
        }

        // Правила перемещения:
        // 1. ASSEMBLY может быть перемещен только в NODE
        // 2. NODE может быть перемещен в NODE или на верхний уровень

        let newNodes = [...nodes];

        // Удаляем перетаскиваемый узел из текущего положения
        newNodes = removeNodeById(newNodes, draggedNode.id);

        if (draggedNode.type === 'ASSEMBLY') {
            // ASSEMBLY можно добавить только в NODE
            if (targetNode.type === 'NODE') {
                newNodes = addNodeToParent(newNodes, targetNode.id, draggedNode);
                message.success(`Агрегат "${draggedNode.name}" перемещен в узел "${targetNode.name}"`);
            } else {
                // Если целевой элемент - ASSEMBLY, пробуем добавить в тот же NODE
                message.warning('Агрегат можно перемещать только в узлы');
                // Возвращаем обратно
                newNodes = insertNodeAfter(nodes, draggedNode.id, draggedNode);
                return;
            }
        } else if (draggedNode.type === 'NODE') {
            // NODE можно переместить в другой NODE или рядом с ним
            if (targetNode.type === 'NODE') {
                // Если перетаскиваем на NODE, то вкладываем в него
                newNodes = addNodeToParent(newNodes, targetNode.id, draggedNode, 'end');
                message.success(`Узел "${draggedNode.name}" вложен в узел "${targetNode.name}"`);
            } else {
                // Если на ASSEMBLY - размещаем рядом с ним (это означает - в том же родителе)
                newNodes = insertNodeAfter(newNodes, targetNode.id, draggedNode);
                message.success(`Узел "${draggedNode.name}" перемещен`);
            }
        }

        // Вызываем callback для обновления состояния в родительском компоненте
        if (onNodesReorder) {
            onNodesReorder(newNodes);
        }
    };

    const handleDragCancel = () => {
        setActiveId(null);
    };

    const columns = [
        {
            key: 'drag-handle',
            width: 50,
            render: () => null // Содержимое добавляется в DraggableRow
        },
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <Text strong={record.level === 0}>{text}</Text>
            )
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Условия',
            dataIndex: 'conditions',
            key: 'conditions',
            width: 100,
            align: 'center',
            render: (conditions, record) => (
                record.type === 'NODE' ? (
                    <span>{conditions?.length || 0}</span>
                ) : null
            )
        },
        {
            title: deletingId ? 'Удалить?' : 'Действия',
            key: 'actions',
            width: 240,
            render: (_, record) => {
                if (deletingId === record.id) {
                    return (
                        <Space size="small">
                            <Button
                                size="small"
                                type="primary"
                                danger
                                icon={<CheckOutlined />}
                                onClick={() => handleConfirmDelete(record)}
                            >
                                Да
                            </Button>
                            <Button
                                size="small"
                                icon={<CloseOutlined />}
                                onClick={handleCancelDelete}
                            >
                                Нет
                            </Button>
                        </Space>
                    );
                }

                return (
                    <Space size="small">
                        {/* Кнопка "Условия" только для NODE */}
                        {record.type === 'NODE' && (
                            <Button
                                size="small"
                                icon={<SettingOutlined />}
                                onClick={() => onManageConditions(record)}
                                title="Управление условиями"
                            >
                                Условия
                            </Button>
                        )}
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                        />
                        <Button
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => handleDeleteClick(record)}
                        />
                    </Space>
                );
            }
        }
    ];

    return (
        <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            onDragCancel={handleDragCancel}
        >
            <SortableContext items={getAllIds} strategy={verticalListSortingStrategy}>
                <Table
                    columns={columns}
                    dataSource={buildDataSource}
                    pagination={false}
                    size="small"
                    expandable={{
                        childrenColumnName: 'children',
                        defaultExpandAllRows: false,
                        indentSize: 24
                    }}
                    components={{
                        body: {
                            row: (props) => <DraggableRow {...props} record={props['data-row-key'] ? buildDataSource.find(item => item.key === props['data-row-key']) : {}} />
                        }
                    }}
                    onRow={(record) => ({
                        'data-row-key': record.key
                    })}
                />
            </SortableContext>
            <DragOverlay>
                {activeId ? (
                    <div style={{
                        padding: '8px 16px',
                        backgroundColor: '#fff',
                        border: '2px dashed #1890ff',
                        borderRadius: '4px',
                        cursor: 'grabbing'
                    }}>
                        <Text strong>
                            {findNodeById(nodes, activeId)?.name}
                        </Text>
                    </div>
                ) : null}
            </DragOverlay>
        </DndContext>
    );
};

export default NodesTable;