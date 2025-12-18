import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const PartModelForm = ({
                           componentTypes,
                           onAdd,
                           onUpdate,
                           editingItem,
                           onCancelEdit
                       }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!editingItem;

    useEffect(() => {
        if (editingItem) {
            form.setFieldsValue({
                name: editingItem.name,
                internalUID: editingItem.internalUID || '',
                specification: editingItem.specification || '',
                componentTypeId: editingItem.componentTypeId,
                description: editingItem.description || ''
            });
        } else {
            form.resetFields();
        }
    }, [editingItem, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (isEditing) {
                await onUpdate(editingItem.id, values);
                message.success('Модель детали обновлена');
                onCancelEdit();
            } else {
                const newPartModel = {
                    id: uuidv4(),
                    name: values.name,
                    internalUID: values.internalUID || '',
                    specification: values.specification || '',
                    componentTypeId: values.componentTypeId,
                    description: values.description || '',
                    maintenanceTypes: [],
                    units: []
                };

                await onAdd(newPartModel);
                message.success('Модель детали добавлена');
            }
            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении модели детали');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancelEdit();
    };

    const componentTypeOptions = componentTypes.map(ct => ({
        label: ct.name,
        value: ct.id
    }));

    return (
        <div className="part-model-form">
            <h3>{isEditing ? 'Редактировать модель детали' : 'Создать модель детали'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Название модели"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: Лопатка турбины Т-100" />
                </Form.Item>

                <Form.Item
                    label="Внутренний UID"
                    name="internalUID"
                >
                    <Input placeholder="Внутренний идентификатор" />
                </Form.Item>

                <Form.Item
                    label="Спецификация"
                    name="specification"
                >
                    <Input placeholder="Техническая спецификация" />
                </Form.Item>

                <Form.Item
                    label="Тип компонента"
                    name="componentTypeId"
                    rules={[
                        { required: true, message: 'Выберите тип компонента' }
                    ]}
                >
                    <Select
                        placeholder="Выберите тип"
                        options={componentTypeOptions}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
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
                            Добавить модель детали
                        </Button>
                    )}
                </Form.Item>
            </Form>
        </div>
    );
};

export default PartModelForm;