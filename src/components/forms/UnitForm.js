import React, { useState, useEffect } from 'react';
import { Form, Input, Button, DatePicker, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';
import dayjs from 'dayjs';

const UnitForm = ({
                      partModelId,
                      onAdd,
                      onUpdate,
                      editingItem,
                      onCancelEdit,
                      onBack
                  }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!editingItem;

    useEffect(() => {
        if (editingItem) {
            form.setFieldsValue({
                name: editingItem.name,
                serialNumber: editingItem.serialNumber || '',
                manufactureDate: editingItem.manufactureDate ? dayjs(editingItem.manufactureDate) : null,
                description: editingItem.description || ''
            });
        } else {
            form.resetFields();
        }
    }, [editingItem, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const data = {
                name: values.name,
                serialNumber: values.serialNumber || '',
                manufactureDate: values.manufactureDate ? values.manufactureDate.format('YYYY-MM-DD') : null,
                description: values.description || ''
            };

            if (isEditing) {
                await onUpdate(partModelId, editingItem.id, data);
                message.success('Деталь обновлена');
                onCancelEdit();
            } else {
                const newUnit = {
                    id: uuidv4(),
                    ...data
                };

                await onAdd(partModelId, newUnit);
                message.success('Деталь добавлена на склад');
            }
            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении детали');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        if (isEditing) {
            onCancelEdit();
        } else {
            onBack();
        }
    };

    return (
        <div className="unit-form">
            <div style={{ marginBottom: 16 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={onBack}
                    type="link"
                    style={{ padding: 0 }}
                >
                    Назад к модели
                </Button>
            </div>

            <h3>{isEditing ? 'Редактировать деталь' : 'Добавить деталь на склад'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Название детали"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: Лопатка #001" />
                </Form.Item>

                <Form.Item
                    label="Серийный номер"
                    name="serialNumber"
                >
                    <Input placeholder="S/N или заводской номер" />
                </Form.Item>

                <Form.Item
                    label="Дата производства"
                    name="manufactureDate"
                >
                    <DatePicker
                        placeholder="Выберите дату"
                        format="DD.MM.YYYY"
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <Form.Item
                    label="Описание"
                    name="description"
                >
                    <Input.TextArea
                        placeholder="Опциональное описание"
                        rows={3}
                        maxLength={500}
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
                            Добавить на склад
                        </Button>
                    )}
                </Form.Item>
            </Form>
        </div>
    );
};

export default UnitForm;