import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const ComponentForm = ({
                           assemblyTypeId,
                           componentTypes,
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
                await onUpdate(assemblyTypeId, editingItem.id, values);
                message.success('Компонент обновлён');
                onCancelEdit();
            } else {
                const newComponent = {
                    id: uuidv4(),
                    name: values.name,
                    componentTypeId: values.componentTypeId,
                    description: values.description || ''
                };

                await onAdd(assemblyTypeId, newComponent);
                message.success('Компонент добавлен');
            }
            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении компонента');
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

    const componentTypeOptions = componentTypes.map(ct => ({
        label: ct.name,
        value: ct.id
    }));

    return (
        <div className="component-form">
            <div style={{ marginBottom: 16 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={onBack}
                    type="link"
                    style={{ padding: 0 }}
                >
                    Назад к агрегату
                </Button>
            </div>

            <h3>{isEditing ? 'Редактировать компонент' : 'Добавить компонент'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Название компонента"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: Основной двигатель" />
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
                            Добавить компонент
                        </Button>
                    )}
                </Form.Item>
            </Form>
        </div>
    );
};

export default ComponentForm;