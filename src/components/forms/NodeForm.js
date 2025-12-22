import React, { useState, useEffect } from 'react';
import { Form, Input, Button, InputNumber, Space, message } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const NodeForm = ({ onAdd, onUpdate, editingItem, onCancelEdit, onSwitchToAssembly }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!editingItem;

    useEffect(() => {
        if (editingItem) {
            const conditions = editingItem.conditions || [];
            const workingCondition = conditions.find(c => c.type === 'REQUIRED_WORKING');
            const maintenanceCondition = conditions.find(c => c.type === 'MAX_MAINTENANCE');

            form.setFieldsValue({
                name: editingItem.name,
                requiredWorking: workingCondition?.requiredWorking || 0,
                maxMaintenance: maintenanceCondition?.maxUnderMaintenance || 0
            });
        } else {
            form.resetFields();
        }
    }, [editingItem, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            // Формируем conditions
            const conditions = [];

            if (values.requiredWorking > 0) {
                conditions.push({
                    type: 'REQUIRED_WORKING',
                    requiredWorking: values.requiredWorking
                });
            }

            if (values.maxMaintenance > 0) {
                conditions.push({
                    type: 'MAX_MAINTENANCE',
                    maxUnderMaintenance: values.maxMaintenance
                });
            }

            const data = {
                name: values.name,
                conditions: conditions
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
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении узла');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancelEdit();
    };

    return (
        <div className="node-form">
            <h3>{isEditing ? 'Редактировать узел' : 'Создать узел'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                initialValues={{
                    requiredWorking: 0,
                    maxMaintenance: 0
                }}
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

                <Form.Item
                    label="Минимум работающих агрегатов"
                    name="requiredWorking"
                    tooltip="Сколько агрегатов должно работать одновременно"
                >
                    <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="0"
                    />
                </Form.Item>

                <Form.Item
                    label="Максимум на ТО одновременно"
                    name="maxMaintenance"
                    tooltip="Сколько агрегатов может быть на ТО одновременно"
                >
                    <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="0"
                    />
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