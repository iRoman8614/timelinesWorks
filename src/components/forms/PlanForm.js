import React, { useState, useEffect } from 'react';
import { Form, Input, DatePicker, Button, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const { TextArea } = Input;
const { RangePicker } = DatePicker;

const PlanForm = ({ projectId, onAdd, onUpdate, editingItem, onCancelEdit }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!editingItem;

    useEffect(() => {
        if (editingItem) {
            form.setFieldsValue({
                name: editingItem.name,
                description: editingItem.description,
                dateRange: [
                    dayjs(editingItem.startTime),
                    dayjs(editingItem.endTime)
                ]
            });
        } else {
            form.resetFields();
        }
    }, [editingItem, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const [startTime, endTime] = values.dateRange;

            const data = {
                name: values.name,
                description: values.description || '',
                projectId: projectId,
                startTime: startTime.toISOString(),
                endTime: endTime.toISOString(),
                timeline: '{}'  // Пустой JSON по умолчанию
            };

            if (isEditing) {
                // POST с тем же ID (перезапись)
                const updatedPlan = {
                    id: editingItem.id,
                    ...data
                };
                await onUpdate(updatedPlan);
                message.success('План обновлён');
                onCancelEdit();
            } else {
                const newPlan = {
                    id: uuidv4(),
                    ...data
                };
                await onAdd(newPlan);
                message.success('План добавлен');
            }

            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении плана');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancelEdit();
    };

    return (
        <div className="plan-form">
            <h3>{isEditing ? 'Редактировать план' : 'Создать план'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Название плана"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: План Q1 2025" />
                </Form.Item>

                <Form.Item
                    label="Описание"
                    name="description"
                >
                    <TextArea
                        rows={3}
                        placeholder="Описание плана (опционально)"
                        maxLength={500}
                    />
                </Form.Item>

                <Form.Item
                    label="Период"
                    name="dateRange"
                    rules={[
                        { required: true, message: 'Выберите период' }
                    ]}
                >
                    <RangePicker
                        style={{ width: '100%' }}
                        format="DD.MM.YYYY"
                    />
                </Form.Item>

                <Form.Item>
                    {isEditing ? (
                        <div style={{ display: 'flex', gap: '8px' }}>
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
                        </div>
                    ) : (
                        <Button
                            type="primary"
                            htmlType="submit"
                            icon={<PlusOutlined />}
                            loading={loading}
                            block
                        >
                            Добавить план
                        </Button>
                    )}
                </Form.Item>
            </Form>
        </div>
    );
};

export default PlanForm;