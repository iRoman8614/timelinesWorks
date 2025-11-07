import React, {useState} from 'react';
import { Table, Button, Space, Tag, Typography } from 'antd';
import {EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined} from '@ant-design/icons';

const { Text } = Typography;

const ComponentsTable = ({ components, onEdit, onDelete, componentTypes = [] }) => {
    const getTypeName = (typeId) => {
        const type = componentTypes.find(t => t.id === typeId);
        return type ? type.name : 'Не указан';
    };

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

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Тип',
            dataIndex: 'type',
            key: 'type',
            render: (type) => <Tag>{getTypeName(type)}</Tag>
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'UUID',
            dataIndex: 'id',
            key: 'id',
            render: (id) => <Text code copyable>{id}</Text>
        },
        {
            title: (record) => deletingId ? 'Удалить?' : 'Действия',
            key: 'actions',
            align: 'center',
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
        <Table
            columns={columns}
            dataSource={components}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
        />
    );
};

export default ComponentsTable;