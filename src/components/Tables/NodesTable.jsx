import React, {useState} from 'react';
import { Table, Button, Space, Typography } from 'antd';
import {
    EditOutlined,
    DeleteOutlined,
    SettingOutlined,
    PlusCircleOutlined,
    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const NodesTable = ({ nodes, onEdit, onDelete, onAddChild, onManageConditions, assemblyTypes = [] }) => {
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

    const flattenNodes = (nodeList, level = 0) => {
        let result = [];
        nodeList.forEach((node) => {
            result.push({
                ...node,
                type: node.children ? 'NODE' : 'ASSEMBLY',
                key: node.id,
                level
            });

            if (node.children && node.children.length > 0) {
                result = result.concat(flattenNodes(node.children, level + 1));
            }
        });
        return result;
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <div style={{ display: 'flex', alignItems: 'center', paddingLeft: record.level * 24 }}>
                    {record.type === 'NODE' && record.level < 3 && (
                        <PlusCircleOutlined
                            style={{
                                marginRight: 8,
                                color: '#52c41a',
                                cursor: 'pointer',
                                fontSize: '16px'
                            }}
                            onClick={() => onAddChild(record)}
                        />
                    )}
                    <Text strong={record.level === 0}>{text}</Text>
                </div>
            )
        },
        // {
        //     title: 'Тип',
        //     dataIndex: 'type',
        //     key: 'type',
        //     width: 250,
        //     render: (type, record) => (
        //         type === 'NODE' ? (
        //             <Tag color="blue">Узел</Tag>
        //         ) : (
        //             <Tag color="green">{getAssemblyTypeName(record.assemblyTypeId)}</Tag>
        //         )
        //     )
        // },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            ellipsis: true
        },
        {
            title: 'Условия',
            dataIndex: 'conditions',
            key: 'conditions',
            width: 100,
            align: 'center',
            render: (conditions, record) => (
                record.type === 'NODE' ? (
                        <span>{conditions?.length || 0}</span>
                ) : null
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
                            icon={<SettingOutlined />}
                            onClick={() => onManageConditions(record)}
                            title="Управление условиями"
                        >
                            Условия
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
            dataSource={flattenNodes(nodes)}
            pagination={false}
            size="small"
        />
    );
};

export default NodesTable;