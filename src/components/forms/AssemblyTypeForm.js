import React, { useState, useEffect } from 'react';
import { Form, Input, Button, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const AssemblyTypeForm = ({ onAdd, onUpdate, editingItem, onCancelEdit }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!editingItem;

    useEffect(() => {
        if (editingItem) {
            form.setFieldsValue({
                name: editingItem.name,
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
                message.success('Тип агрегата обновлён');
                onCancelEdit();
            } else {
                const newAssemblyType = {
                    id: uuidv4(),
                    name: values.name,
                    description: values.description || '',
                    components: []
                };

                await onAdd(newAssemblyType);
                message.success('Тип агрегата добавлен');
            }
            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении типа агрегата');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancelEdit();
    };

    return (
        <div className="assembly-type-form">
            <h3>{isEditing ? 'Редактировать тип агрегата' : 'Создать тип агрегата'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Название"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: ГТД-110, Компрессорная станция" />
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
                            Добавить тип агрегата
                        </Button>
                    )}
                </Form.Item>
            </Form>
        </div>
    );
};

export default AssemblyTypeForm;