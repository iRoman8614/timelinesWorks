import React, { useState } from 'react';
import { Table, Button, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined, DownOutlined, RightOutlined } from '@ant-design/icons';
import InlineConfirm from '../InlineConfirm/InlineConfirm';

const ComponentTypeTable = ({ data, onUpdate, onDelete, onEdit }) => {
    const [expandedKeys, setExpandedKeys] = useState([]);

    const buildTree = (items) => {
        const map = {};
        const roots = [];

        items.forEach(item => {
            map[item.id] = { ...item, children: [] };
        });

        items.forEach(item => {
            if (item.parentId && map[item.parentId]) {
                map[item.parentId].children.push(map[item.id]);
            } else {
                roots.push(map[item.id]);
            }
        });

        return roots;
    };

    const treeData = buildTree(data);

    const handleDelete = async (id) => {
        const success = await onDelete(id);
        if (success !== false) {
            message.success('Тип компонента удалён');
        }
    };

    const handleExpand = (expanded, record) => {
        if (expanded) {
            setExpandedKeys([...expandedKeys, record.id]);
        } else {
            setExpandedKeys(expandedKeys.filter(key => key !== record.id));
        }
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            width: '30%',
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            width: '40%',
            render: (text) => text || <span style={{ color: '#bfbfbf' }}>Не указано</span>
        },
        {
            title: 'Действия',
            key: 'actions',
            width: '30%',
            render: (_, record) => (
                <Space>
                    <Button
                        icon={<EditOutlined />}
                        size="small"
                        onClick={() => onEdit(record)}
                    >
                        Изменить
                    </Button>
                    <InlineConfirm
                        onConfirm={() => handleDelete(record.id)}
                        danger
                        title={
                            record.children?.length > 0
                                ? "Удалить с дочерними элементами?"
                                : "Удалить тип компонента?"
                        }
                    >
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            size="small"
                        >
                            Удалить
                        </Button>
                    </InlineConfirm>
                </Space>
            ),
        },
    ];

    return (
        <div className="component-type-table">
            <Table
                columns={columns}
                dataSource={treeData}
                rowKey="id"
                pagination={false}
                expandable={{
                    expandedRowKeys: expandedKeys,
                    onExpand: handleExpand,
                    expandIcon: ({ expanded, onExpand, record }) =>
                        record.children?.length > 0 ? (
                            expanded ? (
                                <DownOutlined
                                    onClick={e => onExpand(record, e)}
                                    style={{ marginRight: 8, cursor: 'pointer' }}
                                />
                            ) : (
                                <RightOutlined
                                    onClick={e => onExpand(record, e)}
                                    style={{ marginRight: 8, cursor: 'pointer' }}
                                />
                            )
                        ) : (
                            <span style={{ marginRight: 8, width: 14, display: 'inline-block' }} />
                        ),
                    indentSize: 24,
                }}
                locale={{
                    emptyText: 'Нет типов компонентов. Создайте первый тип.'
                }}
                scroll={{ y: 'calc(100vh - 400px)' }}
            />
            <p>Список типов компонентов ({data.length})</p>
        </div>
    );
};

export default ComponentTypeTable;