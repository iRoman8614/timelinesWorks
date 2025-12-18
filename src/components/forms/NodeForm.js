import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, Tag, Space, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined, SettingOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const NodeForm = ({ onAdd, onUpdate, editingItem, onCancelEdit, onSwitchToAssembly }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [constraints, setConstraints] = useState([]);
    const [constraintModalVisible, setConstraintModalVisible] = useState(false);
    const [constraintType, setConstraintType] = useState('REQUIRED_WORKING');
    const [constraintValue, setConstraintValue] = useState(1);
    const isEditing = !!editingItem;

    useEffect(() => {
        if (editingItem) {
            form.setFieldsValue({
                name: editingItem.name
            });
            setConstraints(editingItem.constraints || []);
        } else {
            form.resetFields();
            setConstraints([]);
        }
    }, [editingItem, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const data = {
                name: values.name,
                constraints: constraints
            };

            if (isEditing) {
                await onUpdate(editingItem.id, data);
                message.success('Узел обновлён');
                onCancelEdit();
            } else {
                const newNode = {
                    id: uuidv4(),
                    type: 'NODE',
                    ...data,
                    children: []
                };

                await onAdd(newNode);
                message.success('Узел добавлен');
            }
            form.resetFields();
            setConstraints([]);
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении узла');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setConstraints([]);
        onCancelEdit();
    };

    const handleAddConstraint = () => {
        const newConstraint = {
            id: uuidv4(),
            type: constraintType,
            ...(constraintType === 'REQUIRED_WORKING'
                ? { requiredWorking: constraintValue }
                : { maxUnderMaintenance: constraintValue })
        };
        setConstraints([...constraints, newConstraint]);
        setConstraintModalVisible(false);
        setConstraintValue(1);
    };

    const handleRemoveConstraint = (id) => {
        setConstraints(constraints.filter(c => c.id !== id));
    };

    const getConstraintLabel = (constraint) => {
        if (constraint.type === 'MAX_MAINTENANCE') {
            return `Максимум на ТО: ${constraint.maxUnderMaintenance}`;
        } else if (constraint.type === 'REQUIRED_WORKING') {
            return `Число работающих: ${constraint.requiredWorking}`;
        }
        return '';
    };

    return (
        <div className="node-form">
            <h3>{isEditing ? 'Редактировать узел' : 'Создать узел'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Название узла"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: Блок двигателей" />
                </Form.Item>

                <Form.Item label="Ограничения">
                    <div style={{ marginBottom: 8 }}>
                        {constraints.map(constraint => (
                            <Tag
                                key={constraint.id}
                                closable
                                onClose={() => handleRemoveConstraint(constraint.id)}
                                style={{ marginBottom: 8 }}
                            >
                                {getConstraintLabel(constraint)}
                            </Tag>
                        ))}
                    </div>

                    {!constraintModalVisible ? (
                        <Button
                            icon={<SettingOutlined />}
                            onClick={() => setConstraintModalVisible(true)}
                            size="small"
                        >
                            Добавить ограничение
                        </Button>
                    ) : (
                        <div style={{
                            padding: 12,
                            background: '#fafafa',
                            border: '1px solid #d9d9d9',
                            borderRadius: 4
                        }}>
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Select
                                    value={constraintType}
                                    onChange={setConstraintType}
                                    style={{ width: '100%' }}
                                >
                                    <Select.Option value="REQUIRED_WORKING">
                                        Число работающих агрегатов
                                    </Select.Option>
                                    <Select.Option value="MAX_MAINTENANCE">
                                        Максимум на ТО
                                    </Select.Option>
                                </Select>

                                <InputNumber
                                    value={constraintValue}
                                    onChange={setConstraintValue}
                                    min={1}
                                    style={{ width: '100%' }}
                                    placeholder="Введите значение"
                                />

                                <Space>
                                    <Button
                                        type="primary"
                                        size="small"
                                        onClick={handleAddConstraint}
                                    >
                                        Добавить
                                    </Button>
                                    <Button
                                        size="small"
                                        onClick={() => {
                                            setConstraintModalVisible(false);
                                            setConstraintValue(1);
                                        }}
                                    >
                                        Отмена
                                    </Button>
                                </Space>
                            </Space>
                        </div>
                    )}
                </Form.Item>

                <Form.Item>
                    <Space direction="vertical" style={{ width: '100%' }} size="small">
                        {isEditing ? (
                            <Space style={{ width: '100%' }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<SaveOutlined />}
                                    loading={loading}
                                    style={{ flex: 1 }}
                                >
                                    Сохранить
                                </Button>
                                <Button
                                    onClick={handleCancel}
                                    icon={<CloseOutlined />}
                                >
                                    Отмена
                                </Button>
                            </Space>
                        ) : (
                            <>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    icon={<PlusOutlined />}
                                    loading={loading}
                                    block
                                >
                                    Добавить узел
                                </Button>
                                <Button
                                    onClick={onSwitchToAssembly}
                                    block
                                >
                                    Добавить агрегат
                                </Button>
                            </>
                        )}
                    </Space>
                </Form.Item>
            </Form>
        </div>
    );
};

export default NodeForm;