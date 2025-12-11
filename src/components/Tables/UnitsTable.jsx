import React, { useState } from 'react';
import { Table, Button, Space, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

const { Text } = Typography;

const UnitsTable = ({ units, onEdit, onDelete, partModels = [] }) => {
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

    const getPartModelName = (partModelId) => {
        const model = partModels.find(m => m.id === partModelId);
        return model ? model.name : 'Не указана';
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            render: (text) => <Text strong>{text}</Text>
        },
        {
            title: 'Модель детали',
            dataIndex: 'partModelId',
            key: 'partModelId',
            render: (partModelId) => <Tag color="green">{getPartModelName(partModelId)}</Tag>
        },
        {
            title: 'Серийный номер',
            dataIndex: 'serialNumber',
            key: 'serialNumber',
            render: (serialNumber) => <Text code>{serialNumber}</Text>
        },
        {
            title: 'Дата производства',
            dataIndex: 'manufactureDate',
            key: 'manufactureDate',
            render: (date) => date ? <Text>{date}</Text> : <Text type="secondary">-</Text>
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text) => text || <Text type="secondary">-</Text>
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
            dataSource={units}
            rowKey="id"
            pagination={false}
            size="small"
        />
    );
};

export default UnitsTable;
