import React from 'react';
import { Table, Button, Space, Tag, Typography } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const AssembliesTable = ({ assemblies, onEdit, onDelete, assemblyTypes = [] }) => {
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
            dataSource={assemblies}
            rowKey="id"
            pagination={{ pageSize: 10 }}
            size="small"
        />
    );
};

export default AssembliesTable;