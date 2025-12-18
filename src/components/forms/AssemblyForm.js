import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const AssemblyForm = ({
                          assemblyTypes,
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
                assemblyTypeId: editingItem.assemblyTypeId
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
                assemblyTypeId: values.assemblyTypeId
            };

            if (isEditing) {
                await onUpdate(editingItem.id, data);
                message.success('Агрегат обновлён');
                onCancelEdit();
            } else {
                const newAssembly = {
                    id: uuidv4(),
                    type: 'ASSEMBLY',
                    ...data
                };

                await onAdd(newAssembly);
                message.success('Агрегат добавлен');
            }
            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении агрегата');
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

    const assemblyTypeOptions = assemblyTypes.map(at => ({
        label: at.name,
        value: at.id
    }));

    return (
        <div className="assembly-form">
            <div style={{ marginBottom: 16 }}>
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={onBack}
                    type="link"
                    style={{ padding: 0 }}
                >
                    Назад к узлу
                </Button>
            </div>

            <h3>{isEditing ? 'Редактировать агрегат' : 'Добавить агрегат'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Название агрегата"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: ГТД-110 #1" />
                </Form.Item>

                <Form.Item
                    label="Тип агрегата"
                    name="assemblyTypeId"
                    rules={[
                        { required: true, message: 'Выберите тип агрегата' }
                    ]}
                >
                    <Select
                        placeholder="Выберите тип"
                        options={assemblyTypeOptions}
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
                            Добавить агрегат
                        </Button>
                    )}
                </Form.Item>
            </Form>
        </div>
    );
};

export default AssemblyForm;