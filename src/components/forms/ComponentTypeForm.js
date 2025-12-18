import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const ComponentTypeForm = ({ onAdd, onUpdate, componentTypes, editingItem, onCancelEdit }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const isEditing = !!editingItem;

    useEffect(() => {
        if (editingItem) {
            form.setFieldsValue({
                name: editingItem.name,
                description: editingItem.description || '',
                parentId: editingItem.parentId || undefined
            });
        } else {
            form.resetFields();
        }
    }, [editingItem, form]);

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            if (isEditing) {
                if (values.parentId === editingItem.id) {
                    message.error('Компонент не может быть родителем самого себя');
                    setLoading(false);
                    return;
                }

                await onUpdate(editingItem.id, values);
                message.success('Тип компонента обновлён');
                onCancelEdit();
            } else {
                const newComponentType = {
                    id: uuidv4(),
                    name: values.name,
                    description: values.description || '',
                    parentId: values.parentId || null,
                    children: []
                };

                await onAdd(newComponentType);
                message.success('Тип компонента добавлен');
            }
            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении типа компонента');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        onCancelEdit();
    };

    const getParentOptions = () => {
        if (isEditing) {
            const excludeIds = new Set([editingItem.id]);

            const findDescendants = (parentId) => {
                componentTypes.forEach(item => {
                    if (item.parentId === parentId) {
                        excludeIds.add(item.id);
                        findDescendants(item.id);
                    }
                });
            };

            findDescendants(editingItem.id);

            return componentTypes
                .filter(ct => !excludeIds.has(ct.id) && !ct.parentId)
                .map(ct => ({
                    label: ct.name,
                    value: ct.id
                }));
        } else {
            return componentTypes
                .filter(ct => !ct.parentId)
                .map(ct => ({
                    label: ct.name,
                    value: ct.id
                }));
        }
    };

    return (
        <div className="component-type-form">
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <h3>{isEditing ? 'Редактировать тип компонента' : 'Создать тип компонента'}</h3>
                <Form.Item
                    label="Название"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: Двигатель, Компрессор" />
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

                <Form.Item
                    label="Родительский компонент"
                    name="parentId"
                    tooltip="Выберите, если этот компонент является подтипом другого"
                >
                    <Select
                        placeholder="Без родителя (корневой элемент)"
                        allowClear
                        options={getParentOptions()}
                        showSearch
                        filterOption={(input, option) =>
                            (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                        }
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
                            Добавить тип компонента
                        </Button>
                    )}
                </Form.Item>
            </Form>
        </div>
    );
};

export default ComponentTypeForm;