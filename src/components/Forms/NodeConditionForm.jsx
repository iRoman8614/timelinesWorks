import React, { useState } from 'react';
import { Form, Select, InputNumber, Button, Space, List, Typography, Popconfirm } from 'antd';
import { EditOutlined, DeleteOutlined } from '@ant-design/icons';

const { Text } = Typography;

const NodeConditionForm = ({ onSubmit, onUpdate, onDelete, existingConditions = [] }) => {
    const [form] = Form.useForm();
    const [conditionType, setConditionType] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    const handleFinish = (values) => {
        const conditionData = {};

        if (values.type === 'MAX_MAINTENANCE') {
            conditionData.type = 'MAX_MAINTENANCE';
            conditionData.maxUnderMaintenance = values.value;
        } else if (values.type === 'REQUIRED_WORKING') {
            conditionData.type = 'REQUIRED_WORKING';
            conditionData.requiredWorking = values.value;
        }

        if (editingIndex !== null) {
            // Режим редактирования
            onUpdate(editingIndex, conditionData);
            setEditingIndex(null);
        } else {
            // Режим добавления
            onSubmit(conditionData);
        }

        form.resetFields();
        setConditionType(null);
    };

    const handleTypeChange = (value) => {
        setConditionType(value);
        form.setFieldValue('value', undefined);
    };

    const handleEdit = (condition, index) => {
        setEditingIndex(index);

        if (condition.type === 'MAX_MAINTENANCE') {
            form.setFieldsValue({
                type: 'MAX_MAINTENANCE',
                value: condition.maxUnderMaintenance
            });
            setConditionType('MAX_MAINTENANCE');
        } else if (condition.type === 'REQUIRED_WORKING') {
            form.setFieldsValue({
                type: 'REQUIRED_WORKING',
                value: condition.requiredWorking
            });
            setConditionType('REQUIRED_WORKING');
        }
    };

    const handleCancelEdit = () => {
        setEditingIndex(null);
        form.resetFields();
        setConditionType(null);
    };

    const getConditionText = (condition) => {
        if (condition.type === 'MAX_MAINTENANCE') {
            return `Максимум на ТО: ${condition.maxUnderMaintenance}`;
        } else if (condition.type === 'REQUIRED_WORKING') {
            return `Минимум работающих: ${condition.requiredWorking}`;
        }
        return 'Неизвестное условие';
    };

    return (
        <div>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleFinish}
            >
                <Form.Item
                    name="type"
                    label="Тип условия"
                    rules={[{ required: true, message: 'Выберите тип условия' }]}
                >
                    <Select
                        placeholder="Выберите тип условия"
                        onChange={handleTypeChange}
                    >
                        <Select.Option value="MAX_MAINTENANCE">
                            Максимум агрегатов на ТО
                        </Select.Option>
                        <Select.Option value="REQUIRED_WORKING">
                            Число работающих агрегатов
                        </Select.Option>
                    </Select>
                </Form.Item>

                {conditionType && (
                    <Form.Item
                        name="value"
                        label={conditionType === 'MAX_MAINTENANCE' ? 'Максимум на ТО' : 'Минимум работающих'}
                        rules={[{ required: true, message: 'Введите значение' }]}
                    >
                        <InputNumber
                            min={0}
                            placeholder="Значение"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                )}

                <Form.Item>
                    <Space>
                        <Button
                            type="primary"
                            htmlType="submit"
                            disabled={!conditionType}
                        >
                            {editingIndex !== null ? 'Обновить условие' : 'Добавить условие'}
                        </Button>
                        <Button onClick={editingIndex !== null ? handleCancelEdit : () => {
                            form.resetFields();
                            setConditionType(null);
                        }}>
                            {editingIndex !== null ? 'Отменить' : 'Очистить'}
                        </Button>
                    </Space>
                </Form.Item>
            </Form>

            {existingConditions.length > 0 && (
                <div style={{ marginTop: '24px' }}>
                    <Typography.Title level={5}>Текущие условия</Typography.Title>
                    <List
                        bordered
                        dataSource={existingConditions}
                        renderItem={(condition, index) => (
                            <List.Item
                                key={index}
                                actions={[
                                    <Button
                                        key="edit"
                                        type="text"
                                        icon={<EditOutlined />}
                                        onClick={() => handleEdit(condition, index)}
                                        disabled={editingIndex !== null && editingIndex !== index}
                                    >
                                        Редактировать
                                    </Button>,
                                    <Popconfirm
                                        key="delete"
                                        title="Удалить условие?"
                                        description="Вы уверены, что хотите удалить это условие?"
                                        onConfirm={() => onDelete(index)}
                                        okText="Да"
                                        cancelText="Нет"
                                    >
                                        <Button
                                            type="text"
                                            danger
                                            icon={<DeleteOutlined />}
                                            disabled={editingIndex !== null}
                                        >
                                            Удалить
                                        </Button>
                                    </Popconfirm>
                                ]}
                            >
                                <Text>{getConditionText(condition)}</Text>
                            </List.Item>
                        )}
                    />
                </div>
            )}

            {existingConditions.length === 0 && (
                <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px', marginTop: '16px' }}>
                    <Text type="secondary">Условия не заданы</Text>
                </div>
            )}
        </div>
    );
};

export default NodeConditionForm;