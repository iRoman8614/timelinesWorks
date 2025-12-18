import React, { useState } from 'react';
import { Table, Button, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import InlineConfirm from '../InlineConfirm/InlineConfirm';

const AssemblyTypeTable = ({
                               data,
                               componentTypes,
                               onEdit,
                               onDelete,
                               onAddComponent,
                               onEditComponent,
                               onDeleteComponent
                           }) => {
    const [expandedKeys, setExpandedKeys] = useState([]);

    const handleDelete = async (id) => {
        const success = await onDelete(id);
        if (success !== false) {
            message.success('Тип агрегата удалён');
        }
    };

    const handleDeleteComponent = async (assemblyTypeId, componentId) => {
        const success = await onDeleteComponent(assemblyTypeId, componentId);
        if (success !== false) {
            message.success('Компонент удалён');
        }
    };

    const handleExpand = (expanded, record) => {
        if (expanded) {
            setExpandedKeys([...expandedKeys, record.id]);
        } else {
            setExpandedKeys(expandedKeys.filter(key => key !== record.id));
        }
    };

    const getComponentTypeName = (componentTypeId) => {
        const componentType = componentTypes.find(ct => ct.id === componentTypeId);
        return componentType ? componentType.name : 'Неизвестный тип';
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            render: (text, record) => {
                if (record.isComponent) {
                    const typeName = getComponentTypeName(record.componentTypeId);
                    return <span>{text} <span style={{ color: '#8c8c8c' }}>({typeName})</span></span>;
                }
                return text;
            }
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            width: '30%',
            render: (text) => text || <span style={{ color: '#bfbfbf' }}>Не указано</span>
        },
        {
            title: 'Действия',
            key: 'actions',
            width: '40%',
            render: (_, record) => {
                if (record.isComponent) {
                    return (
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => onEditComponent(record.assemblyTypeId, record)}
                            >
                                Изменить
                            </Button>
                            <InlineConfirm
                                onConfirm={() => handleDeleteComponent(record.assemblyTypeId, record.id)}
                                title="Удалить компонент?"
                                danger
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
                    );
                } else {
                    return (
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => onEdit(record)}
                            >
                                Изменить
                            </Button>
                            <Button
                                icon={<PlusOutlined />}
                                size="small"
                                onClick={() => onAddComponent(record.id)}
                            >
                                Компонент
                            </Button>
                            <InlineConfirm
                                onConfirm={() => handleDelete(record.id)}
                                danger
                                title={
                                    record.components?.length > 0
                                        ? "Удалить агрегат с компонентами?"
                                        : "Удалить тип агрегата?"
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
                    );
                }
            }
        }
    ];

    const tableData = data.map(assemblyType => ({
        ...assemblyType,
        children: assemblyType.components?.map(component => ({
            ...component,
            isComponent: true,
            assemblyTypeId: assemblyType.id
        }))
    }));

    return (
        <div className="assembly-type-table">
            <Table
                columns={columns}
                dataSource={tableData}
                rowKey="id"
                pagination={false}
                expandable={{
                    expandedRowKeys: expandedKeys,
                    onExpand: handleExpand,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        !record.isComponent && record.components?.length > 0 ? (
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
                    indentSize: 24,
                    childrenColumnName: 'children'
                }}
                locale={{
                    emptyText: 'Нет типов агрегатов. Создайте первый тип.'
                }}
                scroll={{ y: 'calc(100vh - 400px)' }}
            />
            <p>Список типов агрегатов ({data.length})</p>
        </div>
    );
};

export default AssemblyTypeTable;