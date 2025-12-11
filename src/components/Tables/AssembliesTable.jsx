import React, { useState } from 'react';
import { Table, Button, Space, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AssembliesTable = ({ assemblies, onEdit, onDelete, assemblyTypes = [] }) => {
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

    const getTypeName = (typeId) => {
        const type = assemblyTypes.find(t => t.id === typeId);
        return type ? type.name : 'Не указан';
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
            render: (type) => <Tag color="blue">{getTypeName(type)}</Tag>
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: deletingId ? 'Удалить?' : 'Действия',
            key: 'actions',
            width: 150,
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
        <Table
            columns={columns}
            dataSource={assemblies}
            rowKey="id"
            pagination={false}
            size="small"
        />
    );
};

export default AssembliesTable;
