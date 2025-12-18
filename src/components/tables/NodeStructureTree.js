import React, { useState } from 'react';
import { Table, Button, Space, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import InlineConfirm from '../InlineConfirm/InlineConfirm';

const DraggableRow = ({ node, children, ...props }) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
        setActivatorNodeRef,
    } = useSortable({
        id: node.id,
        data: { node }
    });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        ...props.style,
    };

    const childrenArray = React.Children.toArray(children);
    const modifiedChildren = childrenArray.map((child, index) => {
        if (index === 0) {
            return React.cloneElement(child, {
                children: (
                    <span
                        ref={setActivatorNodeRef}
                        {...attributes}
                        {...listeners}
                        style={{
                            cursor: 'grab',
                            fontSize: '16px',
                            color: '#8c8c8c',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            height: '100%'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        ⋮⋮
                    </span>
                )
            });
        }
        return child;
    });

    return (
        <tr
            ref={setNodeRef}
            style={style}
            {...props}
        >
            {modifiedChildren}
        </tr>
    );
};

const NodeStructureTree = ({
                               nodes,
                               assemblyTypes,
                               onEditNode,
                               onDeleteNode,
                               onEditAssembly,
                               onDeleteAssembly,
                               RootDropZone,
                               activeId
                           }) => {
    const [expandedKeys, setExpandedKeys] = useState([]);

    const handleDeleteNode = async (id) => {
        const success = await onDeleteNode(id);
        if (success !== false) {
            message.success('Узел удалён');
        }
    };

    const handleDeleteAssembly = async (id) => {
        const success = await onDeleteAssembly(id);
        if (success !== false) {
            message.success('Агрегат удалён');
        }
    };

    const handleExpand = (expanded, record) => {
        if (expanded) {
            setExpandedKeys([...expandedKeys, record.id]);
        } else {
            setExpandedKeys(expandedKeys.filter(key => key !== record.id));
        }
    };

    const getAssemblyTypeName = (assemblyTypeId) => {
        const assemblyType = assemblyTypes.find(at => at.id === assemblyTypeId);
        return assemblyType ? assemblyType.name : 'Неизвестный тип';
    };

    const getConstraintLabel = (constraint) => {
        if (constraint.type === 'MAX_MAINTENANCE') {
            return `Максимум на ТО: ${constraint.maxUnderMaintenance}`;
        } else if (constraint.type === 'REQUIRED_WORKING') {
            return `Число работающих: ${constraint.requiredWorking}`;
        }
        return '';
    };

    const findNodeById = (id, items) => {
        for (const item of items) {
            if (item.id === id) return item;
            if (item.children) {
                const found = findNodeById(id, item.children);
                if (found) return found;
            }
        }
        return null;
    };

    const findNodeInTree = (id, items) => {
        return findNodeById(id, items);
    };

    const columns = [
        {
            title: '',
            key: 'drag',
            width: '5%',
            render: () => null,
        },
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            render: (text, record) => {
                const getLevel = (node, nodes, level = 0) => {
                    if (!node.parentId) return level;
                    const parent = findNodeInTree(node.parentId, nodes);
                    if (!parent) return level;
                    return getLevel(parent, nodes, level + 1);
                };

                const level = getLevel(record, nodes);
                const indent = level * 24;

                const content = record.type === 'ASSEMBLY' ? (
                    <span>
                        {text} <span style={{ color: '#8c8c8c' }}>({getAssemblyTypeName(record.assemblyTypeId)})</span>
                    </span>
                ) : text;

                return (
                    <div style={{ paddingLeft: `${indent}px` }}>
                        {content}
                    </div>
                );
            }
        },
        {
            title: 'Ограничения',
            dataIndex: 'constraints',
            key: 'constraints',
            width: '35%',
            render: (constraints, record) => {
                if (record.type === 'NODE' && constraints && constraints.length > 0) {
                    return (
                        <Space wrap>
                            {constraints.map(constraint => (
                                <Tag key={constraint.id} color="blue">
                                    {getConstraintLabel(constraint)}
                                </Tag>
                            ))}
                        </Space>
                    );
                }
                return null;
            }
        },
        {
            title: 'Действия',
            key: 'actions',
            width: '30%',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => {
                            if (record.type === 'NODE') {
                                onEditNode(record);
                            } else {
                                onEditAssembly(record);
                            }
                        }}
                    >
                        Изменить
                    </Button>
                    <InlineConfirm
                        onConfirm={() => {
                            if (record.type === 'NODE') {
                                handleDeleteNode(record.id);
                            } else {
                                handleDeleteAssembly(record.id);
                            }
                        }}
                        title={
                            record.type === 'NODE' && record.children?.length > 0
                                ? "Удалить узел с содержимым?"
                                : record.type === 'NODE'
                                    ? "Удалить узел?"
                                    : "Удалить агрегат?"
                        }
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        >
                            Удалить
                        </Button>
                    </InlineConfirm>
                </Space>
            )
        }
    ];

    return (
        <div className="node-structure-tree">
            <Table
                columns={columns}
                dataSource={nodes}
                rowKey="id"
                pagination={false}
                components={{
                    body: {
                        wrapper: (props) => (
                            <tbody {...props}>
                            {RootDropZone && <RootDropZone isActive={activeId !== null} />}
                            {props.children}
                            </tbody>
                        ),
                        row: (props) => {
                            const rowKey = props['data-row-key'];
                            const node = rowKey ? findNodeById(rowKey, nodes) : {};
                            return <DraggableRow {...props} node={node || {}} />;
                        }
                    }
                }}
                expandable={{
                    expandedRowKeys: expandedKeys,
                    onExpand: handleExpand,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        record.type === 'NODE' && record.children?.length > 0 ? (
                            expanded ? (
                                <DownOutlined
                                    onClick={e => onExpand(record, e)}
                                    style={{ marginRight: 8, cursor: 'pointer' }}
                                />
                            ) : (
                                <RightOutlined
                                    onClick={e => onExpand(record, e)}
                                    style={{ marginRight: 8, cursor: 'pointer' }}
                                />
                            )
                        ) : (
                            <span style={{ marginRight: 8, width: 14, display: 'inline-block' }} />
                        ),
                    indentSize: 0,
                    childrenColumnName: 'children'
                }}
                locale={{
                    emptyText: 'Нет узлов. Создайте первый узел.'
                }}
                scroll={{ y: 'calc(100vh - 400px)' }}
            />
            <p>Структура узлов ({nodes.length})</p>
        </div>
    );
};

export default NodeStructureTree;