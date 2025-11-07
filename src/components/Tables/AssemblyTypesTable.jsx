import React, { useState } from 'react';
import { Table, Button, Space, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, AppstoreOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AssemblyTypesTable = ({ assemblyTypes, onEdit, onDelete, onManageComponents }) => {
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
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Кол-во компонентов',
            dataIndex: 'components',
            key: 'components',
            width: 200,
            align: 'center',
            render: (components) => (
                <span>{components?.length || 0}</span>
            )
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
                        <Button
                            size="small"
                            icon={<AppstoreOutlined />}
                            onClick={() => onManageComponents(record)}
                        >
                            Компоненты
                        </Button>
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
            dataSource={assemblyTypes}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
        />
    );
};

export default AssemblyTypesTable;