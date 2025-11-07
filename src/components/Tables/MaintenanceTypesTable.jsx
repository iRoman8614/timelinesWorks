import React, {useState} from 'react';
import { Table, Button, Space, Tag, Typography } from 'antd';
import {
    DeleteOutlined,
    CheckOutlined,
    CloseOutlined
} from '@ant-design/icons';

const { Text } = Typography;

const MaintenanceTypesTable = ({ maintenanceTypes, onDelete }) => {
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

    const flattenMaintenanceTypes = (typeList, level = 0, parentPath = []) => {
        let result = [];
        typeList.forEach((type, index) => {
            const currentPath = [...parentPath, index];
            const flatType = {
                ...type,
                key: type.id,
                level,
                path: currentPath
            };
            result.push(flatType);

            if (type.children && type.children.length > 0) {
                result = result.concat(flattenMaintenanceTypes(type.children, level + 1, currentPath));
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
                <div style={{ paddingLeft: record.level * 24 }}>
                    <Text strong={record.level === 0}>{text}</Text>
                </div>
            )
        },
        {
            title: 'Продолжительность',
            dataIndex: 'duration',
            key: 'duration',
            render: (duration) => <Tag>{duration} дн.</Tag>
        },
        {
            title: 'Приоритет',
            dataIndex: 'priority',
            key: 'priority',
            render: (priority) => (
                <span>
                    {priority}
                </span>
            )
        },
        {
            title: 'Интервал',
            dataIndex: 'interval',
            key: 'interval'
        },
        {
            title: 'Отклонение',
            dataIndex: 'deviation',
            key: 'deviation'
        },
        {
            title: 'Дочерние',
            dataIndex: 'children',
            key: 'children',
            render: (children) => (
                <span>{children?.length || 0}</span>
            )
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
            align: 'center',
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
            dataSource={flattenMaintenanceTypes(maintenanceTypes)}
            pagination={false}
            size="small"
        />
    );
};

export default MaintenanceTypesTable;