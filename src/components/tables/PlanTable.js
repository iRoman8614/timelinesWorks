import React from 'react';
import { Table, Button, Space, message } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { useNavigate, useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import InlineConfirm from '../InlineConfirm/InlineConfirm';

const PlanTable = ({ plans, onEdit, onDelete, onSelect }) => {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const activePlanId = searchParams.get('planId');

    const handleDelete = async (id) => {
        const success = await onDelete(id);
        if (success !== false) {
            message.success('План удалён');
        }
    };

    const handleRowClick = (record, event) => {
        const target = event.target;
        const isActionButton = target.closest('.ant-btn') || target.closest('.ant-popover');

        if (!isActionButton) {
            navigate(`?planId=${record.id}`, { replace: true });
            if (onSelect) {
                onSelect(record);
            }
        }
    };

    const columns = [
        {
            title: 'Название',
            dataIndex: 'name',
            key: 'name',
            width: '25%',
        },
        {
            title: 'Описание',
            dataIndex: 'description',
            key: 'description',
            width: '20%',
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
                onRow={(record) => ({
                    onClick: (event) => handleRowClick(record, event),
                    style: { cursor: 'pointer' }
                })}
                rowClassName={(record) =>
                    record.id === activePlanId ? 'active-plan-row' : ''
                }
            />
        </div>
    );
};

export default PlanTable;