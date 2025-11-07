import React, {useState} from 'react';
import { Table, Button, Space, Typography } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    CheckOutlined,
    CloseOutlined,
    AppstoreOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const PartModelsTable = ({ partModels, onEdit, onDelete, onManageMaintenance }) => {
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
            title: 'UID',
            dataIndex: 'uid',
            key: 'uid',
            render: (uid) => <Text code>{uid}</Text>
        },
        {
            title: 'Спецификация',
            dataIndex: 'specification',
            key: 'specification'
        },
        {
            title: 'Кол-во типов ТО',
            dataIndex: 'maintenanceTypes',
            key: 'maintenanceTypes',
            render: (maintenanceTypes) => (
                <span>{maintenanceTypes?.length || 0}</span>
            )
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
            width: 280,
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
                            onClick={() => onManageMaintenance(record)}
                        >
                            Работы
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
            dataSource={partModels}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
        />
    );
};

export default PartModelsTable;