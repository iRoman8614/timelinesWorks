import React, { useState } from 'react';
import { Table, Button, Space, Tag, message } from 'antd';
import { DeleteOutlined, EditOutlined, PlusOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import InlineConfirm from '../InlineConfirm/InlineConfirm';
import dayjs from 'dayjs';

const PartModelTable = ({
                            data,
                            componentTypes,
                            onEdit,
                            onDelete,
                            onAddMaintenance,
                            onEditMaintenance,
                            onDeleteMaintenance,
                            onAddUnit,
                            onEditUnit,
                            onDeleteUnit
                        }) => {
    const [expandedKeys, setExpandedKeys] = useState([]);

    const handleDelete = async (id) => {
        const success = await onDelete(id);
        if (success !== false) {
            message.success('Модель детали удалена');
        }
    };

    const handleDeleteMaintenance = async (partModelId, maintenanceId) => {
        const success = await onDeleteMaintenance(partModelId, maintenanceId);
        if (success !== false) {
            message.success('Работа ТО удалена');
        }
    };

    const handleDeleteUnit = async (partModelId, unitId) => {
        const success = await onDeleteUnit(partModelId, unitId);
        if (success !== false) {
            message.success('Деталь удалена со склада');
        }
    };

    const handleExpand = (expanded, record) => {
        if (expanded) {
            setExpandedKeys([...expandedKeys, record.key]);
        } else {
            setExpandedKeys(expandedKeys.filter(key => key !== record.key));
        }
    };

    const getComponentTypeName = (componentTypeId) => {
        const componentType = componentTypes.find(ct => ct.id === componentTypeId);
        return componentType ? componentType.name : 'Неизвестный тип';
    };

    const buildMaintenanceTree = (maintenanceTypes) => {
        const map = {};
        const roots = [];

        maintenanceTypes.forEach(mt => {
            map[mt.id] = { ...mt, children: [] };
        });

        maintenanceTypes.forEach(mt => {
            if (mt.parentId && map[mt.parentId]) {
                map[mt.parentId].children.push(map[mt.id]);
            } else {
                roots.push(map[mt.id]);
            }
        });

        return roots;
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
            render: (text, record) => {
                if (record.isMaintenanceHeader) {
                    return <strong style={{ color: '#1890ff' }}>Работы ТО</strong>;
                }
                if (record.isUnitHeader) {
                    return <strong style={{ color: '#52c41a' }}>Склад</strong>;
                }
                if (record.isPartModel) {
                    return <span>{text} <span style={{ color: '#8c8c8c' }}>({record.internalUID || 'N/A'})</span></span>;
                }
                return text;
            }
        },
        {
            title: 'Тип компонента',
            dataIndex: 'componentTypeId',
            key: 'componentTypeId',
            width: '15%',
            render: (typeId, record) => {
                if (record.isMaintenanceHeader || record.isUnitHeader) {
                    return null;
                }
                if (record.isPartModel) {
                    return getComponentTypeName(typeId);
                }
                if (record.isMaintenance) {
                    return <Tag color={record.color}>{record.color}</Tag>;
                }
                if (record.isUnit) {
                    return record.serialNumber || <span style={{ color: '#bfbfbf' }}>Нет S/N</span>;
                }
                return null;
            }
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            width: '30%',
            render: (text, record) => {
                if (record.isMaintenanceHeader || record.isUnitHeader) {
                    return null;
                }
                if (record.isMaintenance) {
                    return (
                        <span style={{ fontSize: '12px' }}>
                            Длит: {record.duration}д | Интервал: {record.interval}ч | Откл: {record.deviation}ч
                        </span>
                    );
                }
                if (record.isUnit) {
                    return record.manufactureDate
                        ? `Пр-во: ${dayjs(record.manufactureDate).format('DD.MM.YYYY')}`
                        : text || <span style={{ color: '#bfbfbf' }}>Не указано</span>;
                }
                return text || <span style={{ color: '#bfbfbf' }}>Не указано</span>;
            }
        },
        {
            title: 'Действия',
            key: 'actions',
            width: '30%',
            render: (_, record) => {
                if (record.isMaintenanceHeader) {
                    return (
                        <Button
                            icon={<PlusOutlined />}
                            size="small"
                            onClick={() => onAddMaintenance(record.partModelId)}
                        >
                            Добавить
                        </Button>
                    );
                }
                if (record.isUnitHeader) {
                    return (
                        <Button
                            icon={<PlusOutlined />}
                            size="small"
                            onClick={() => onAddUnit(record.partModelId)}
                        >
                            Добавить
                        </Button>
                    );
                }
                if (record.isPartModel) {
                    return (
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => onEdit(record)}
                            >
                                Изменить
                            </Button>
                            <InlineConfirm
                                onConfirm={() => handleDelete(record.id)}
                                title="Удалить модель детали?"
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
                }
                if (record.isMaintenance) {
                    return (
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => onEditMaintenance(record.partModelId, record)}
                            >
                                Изменить
                            </Button>
                            <InlineConfirm
                                onConfirm={() => handleDeleteMaintenance(record.partModelId, record.id)}
                                title="Удалить работу ТО?"
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
                }
                if (record.isUnit) {
                    return (
                        <Space>
                            <Button
                                icon={<EditOutlined />}
                                size="small"
                                onClick={() => onEditUnit(record.partModelId, record)}
                            >
                                Изменить
                            </Button>
                            <InlineConfirm
                                onConfirm={() => handleDeleteUnit(record.partModelId, record.id)}
                                title="Удалить деталь со склада?"
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
                }
                return null;
            }
        }
    ];

    const tableData = data.map(partModel => {
        const maintenanceTree = buildMaintenanceTree(partModel.maintenanceTypes || []);
        const markMaintenanceChildren = (items) => {
            return items.map(item => ({
                ...item,
                key: `${partModel.id}-mt-${item.id}`,
                isMaintenance: true,
                partModelId: partModel.id,
                children: item.children?.length > 0 ? markMaintenanceChildren(item.children) : undefined
            }));
        };

        return {
            ...partModel,
            key: partModel.id,
            isPartModel: true,
            children: [
                {
                    key: `${partModel.id}-maintenance-header`,
                    name: 'Работы ТО',
                    isMaintenanceHeader: true,
                    partModelId: partModel.id,
                    children: markMaintenanceChildren(maintenanceTree)
                },
                {
                    key: `${partModel.id}-unit-header`,
                    name: 'Склад',
                    isUnitHeader: true,
                    partModelId: partModel.id,
                    children: (partModel.units || []).map(unit => ({
                        ...unit,
                        key: `${partModel.id}-unit-${unit.id}`,
                        isUnit: true,
                        partModelId: partModel.id
                    }))
                }
            ]
        };
    });

    return (
        <div className="part-model-table">
            <Table
                columns={columns}
                dataSource={tableData}
                pagination={false}
                expandable={{
                    expandedRowKeys: expandedKeys,
                    onExpand: handleExpand,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        (record.children?.length > 0 && !record.isMaintenance && !record.isUnit) ? (
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
                    emptyText: 'Нет моделей деталей. Создайте первую модель.'
                }}
                scroll={{ y: 'calc(100vh - 400px)' }}
            />
            <p>Список моделей деталей ({data.length})</p>
        </div>
    );
};

export default PartModelTable;