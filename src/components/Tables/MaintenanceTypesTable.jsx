import React, { useState } from 'react';
import { Table, Button, Space, Tag, Typography, Tooltip } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    CheckOutlined,
    CloseOutlined,
    BranchesOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const MaintenanceTypesTable = ({ maintenanceTypes, onEdit, onDelete }) => {
    const [deletingId, setDeletingId] = useState(null);

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

    const flattenMaintenanceTypes = (typeList, level = 0, parentPath = [], parentName = null) => {
        let result = [];
        typeList.forEach((type, index) => {
            const currentPath = [...parentPath, index];
            const flatType = {
                ...type,
                key: type.id,
                level,
                path: currentPath,
                parentName: parentName
            };
            result.push(flatType);

            if (type.children && type.children.length > 0) {
                result = result.concat(
                    flattenMaintenanceTypes(type.children, level + 1, currentPath, type.name)
                );
            }
        });
        return result;
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            width: 300,
            render: (text, record) => (
                <div style={{
                    paddingLeft: record.level * 24,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8
                }}>
                    {record.level > 0 && (
                        <BranchesOutlined style={{ color: '#999', fontSize: 12 }} />
                    )}
                    <Text strong={record.level === 0}>
                        {text}
                    </Text>
                    {record.children && record.children.length > 0 && (
                        <Tag color="blue" style={{ marginLeft: 4 }}>
                            {record.children.length}
                        </Tag>
                    )}
                </div>
            )
        },
        {
            title: 'Родитель',
            dataIndex: 'parentName',
            key: 'parentName',
            width: 150,
            render: (parentName) => (
                parentName ? (
                    <Tag color="geekblue">{parentName}</Tag>
                ) : (
                    <Text type="secondary">Корневой</Text>
                )
            )
        },
        {
            title: 'Цвет',
            dataIndex: 'color',
            key: 'color',
            width: 100,
            align: 'center',
            render: (color) => (
                <Tooltip title={color}>
                    <div style={{
                        width: 40,
                        height: 24,
                        backgroundColor: color,
                        borderRadius: 4,
                        border: '1px solid #d9d9d9',
                        margin: '0 auto'
                    }} />
                </Tooltip>
            )
        },
        {
            title: 'Продолжительность',
            dataIndex: 'duration',
            key: 'duration',
            width: 140,
            render: (duration) => <Tag>{duration} дн.</Tag>
        },
        {
            title: 'Приоритет',
            dataIndex: 'priority',
            key: 'priority',
            width: 100,
            align: 'center',
            render: (priority) => (
                <Tag color={priority <= 2 ? 'red' : priority <= 5 ? 'orange' : 'green'}>
                    {priority || '-'}
                </Tag>
            )
        },
        {
            title: 'Интервал (ч)',
            dataIndex: 'interval',
            key: 'interval',
            width: 120,
            render: (interval) => (
                <Text code>{interval?.toLocaleString() || '-'}</Text>
            )
        },
        {
            title: 'Отклонение (ч)',
            dataIndex: 'deviation',
            key: 'deviation',
            width: 130,
            render: (deviation) => (
                deviation ? <Text code>±{deviation.toLocaleString()}</Text> : <Text type="secondary">-</Text>
            )
        },
        {
            title: 'Дочерние',
            dataIndex: 'children',
            key: 'childrenCount',
            width: 100,
            align: 'center',
            render: (children) => (
                <Tag color={children?.length > 0 ? 'blue' : 'default'}>
                    {children?.length || 0}
                </Tag>
            )
        },
        {
            title: deletingId ? 'Удалить?' : 'Действия',
            key: 'actions',
            align: 'center',
            width: 180,
            fixed: 'right',
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

                const hasChildren = record.children && record.children.length > 0;

                return (
                    <Space size="small">
                        <Button
                            size="small"
                            icon={<EditOutlined />}
                            onClick={() => onEdit(record)}
                            title="Редактировать"
                        />
                        <Tooltip title={hasChildren ? 'Сначала удалите дочерние типы ТО' : 'Удалить'}>
                            <Button
                                size="small"
                                danger
                                icon={<DeleteOutlined />}
                                onClick={() => handleDeleteClick(record)}
                                disabled={hasChildren}
                            />
                        </Tooltip>
                    </Space>
                );
            }
        }
    ];

    const dataSource = flattenMaintenanceTypes(maintenanceTypes);

    return (
        <Table
            columns={columns}
            dataSource={dataSource}
            pagination={false}
            size="small"
            scroll={{ x: 1500 }}
            rowClassName={(record) =>
                record.level > 0 ? 'nested-row' : 'root-row'
            }
        />
    );
};

export default MaintenanceTypesTable;
