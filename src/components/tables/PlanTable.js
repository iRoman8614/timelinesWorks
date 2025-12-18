import React from 'react';
import { Table, Button, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import InlineConfirm from '../InlineConfirm/InlineConfirm';

const PlanTable = ({ plans, onEdit, onDelete }) => {
    const handleDelete = async (id) => {
        const success = await onDelete(id);
        if (success !== false) {
            message.success('План удалён');
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
            width: '30%',
            render: (text) => text || <span style={{ color: '#8c8c8c' }}>—</span>
        },
        {
            title: 'Период',
            key: 'period',
            width: '25%',
            render: (_, record) => {
                const start = dayjs(record.startTime).format('DD.MM.YYYY');
                const end = dayjs(record.endTime).format('DD.MM.YYYY');
                return `${start} — ${end}`;
            }
        },
        {
            title: 'Действия',
            key: 'actions',
            width: '15%',
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
                        title="Удалить план?"
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
            )
        }
    ];

    return (
        <div className="plan-table">
            <h3>Планы ({plans.length})</h3>
            <Table
                columns={columns}
                dataSource={plans}
                rowKey="id"
                pagination={false}
                locale={{
                    emptyText: 'Нет планов. Создайте первый план.'
                }}
                scroll={{ y: 'calc(100vh - 500px)' }}
            />
        </div>
    );
};

export default PlanTable;