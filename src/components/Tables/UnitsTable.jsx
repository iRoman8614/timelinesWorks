import React from 'react';
import { Table, Button, Space, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const UnitsTable = ({ units, onEdit, onDelete, partModels = [] }) => {
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
            title: 'UUID',
            dataIndex: 'id',
            key: 'id',
            width: 280,
            render: (id) => <Text code copyable>{id}</Text>
        },
        {
            title: 'Действия',
            key: 'actions',
            width: 150,
            render: (_, record) => (
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
                        onClick={() => onDelete(record)}
                    />
                </Space>
            )
        }
    ];

    return (
        <Table
            columns={columns}
            dataSource={units}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
        />
    );
};

export default UnitsTable;