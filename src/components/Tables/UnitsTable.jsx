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
            dataIndex: 'partModel',
            key: 'partModel',
            render: (partModel) => <Tag color="green">{getPartModelName(partModel)}</Tag>
        },
        {
            title: 'Серийный номер',
            dataIndex: 'serialNumber',
            key: 'serialNumber',
            render: (serialNumber) => <Text code>{serialNumber}</Text>
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