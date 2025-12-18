import React, { useState, useEffect } from 'react';
import { Form, Input, Button, Select, InputNumber, message } from 'antd';
import { PlusOutlined, SaveOutlined, CloseOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { v4 as uuidv4 } from 'uuid';

const MaintenanceTypeForm = ({
                                 partModelId,
                                 maintenanceTypes,
                                 onAdd,
                                 onUpdate,
                                 editingItem,
                                 onCancelEdit,
                                 onBack
                             }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [durationUnit, setDurationUnit] = useState('days');
    const [intervalUnit, setIntervalUnit] = useState('hours');
    const [deviationUnit, setDeviationUnit] = useState('hours');
    const isEditing = !!editingItem;

    useEffect(() => {
        if (editingItem) {
            form.setFieldsValue({
                name: editingItem.name,
                color: editingItem.color || '#1890ff',
                duration: editingItem.duration || 0,
                interval: editingItem.interval || 0,
                deviation: editingItem.deviation || 0,
                description: editingItem.description || '',
                parentId: editingItem.parentId || undefined
            });
        } else {
            form.resetFields();
        }
    }, [editingItem, form]);

    const convertDurationToDays = (value) => {
        if (durationUnit === 'hours') {
            return value / 24;
        }
        return value;
    };

    const convertToHours = (value, unit) => {
        if (unit === 'days') {
            return value * 24;
        }
        return value;
    };

    const handleSubmit = async (values) => {
        setLoading(true);
        try {
            const data = {
                name: values.name,
                color: values.color || '#1890ff',
                duration: convertDurationToDays(values.duration || 0),
                interval: convertToHours(values.interval || 0, intervalUnit),
                deviation: convertToHours(values.deviation || 0, deviationUnit),
                description: values.description || '',
                parentId: values.parentId || null
            };

            if (isEditing) {
                await onUpdate(partModelId, editingItem.id, data);
                message.success('Работа ТО обновлена');
                onCancelEdit();
            } else {
                const newMaintenanceType = {
                    id: uuidv4(),
                    ...data
                };

                await onAdd(partModelId, newMaintenanceType);
                message.success('Работа ТО добавлена');
            }
            form.resetFields();
        } catch (error) {
            message.error(isEditing ? 'Ошибка при обновлении' : 'Ошибка при добавлении работы ТО');
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

    const parentOptions = maintenanceTypes
        .filter(mt => !mt.parentId)
        .map(mt => ({
            label: mt.name,
            value: mt.id
        }));

    return (
        <div className="maintenance-type-form">
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

            <h3>{isEditing ? 'Редактировать работу ТО' : 'Добавить работу ТО'}</h3>
            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
            >
                <Form.Item
                    label="Название типа ТО"
                    name="name"
                    rules={[
                        { required: true, message: 'Введите название' },
                        { max: 100, message: 'Максимум 100 символов' }
                    ]}
                >
                    <Input placeholder="Например: Регламентное ТО-1" />
                </Form.Item>

                <Form.Item
                    label="Цвет (hex)"
                    name="color"
                    initialValue="#1890ff"
                >
                    <Input type="color" style={{ width: '100%', height: 40 }} />
                </Form.Item>

                <Form.Item label="Продолжительность">
                    <Input.Group compact>
                        <Form.Item
                            name="duration"
                            noStyle
                            rules={[{ required: true, message: 'Введите продолжительность' }]}
                        >
                            <InputNumber
                                placeholder="Продолжительность"
                                style={{ width: '70%' }}
                                min={0}
                            />
                        </Form.Item>
                        <Select
                            value={durationUnit}
                            onChange={setDurationUnit}
                            style={{ width: '30%' }}
                        >
                            <Select.Option value="days">Дни</Select.Option>
                            <Select.Option value="hours">Часы</Select.Option>
                        </Select>
                    </Input.Group>
                </Form.Item>

                <Form.Item label="Интервал наработки">
                    <Input.Group compact>
                        <Form.Item
                            name="interval"
                            noStyle
                            rules={[{ required: true, message: 'Введите интервал' }]}
                        >
                            <InputNumber
                                placeholder="Интервал"
                                style={{ width: '70%' }}
                                min={0}
                            />
                        </Form.Item>
                        <Select
                            value={intervalUnit}
                            onChange={setIntervalUnit}
                            style={{ width: '30%' }}
                        >
                            <Select.Option value="hours">Часы</Select.Option>
                            <Select.Option value="days">Дни</Select.Option>
                        </Select>
                    </Input.Group>
                </Form.Item>

                <Form.Item label="Отклонение">
                    <Input.Group compact>
                        <Form.Item
                            name="deviation"
                            noStyle
                        >
                            <InputNumber
                                placeholder="Отклонение"
                                style={{ width: '70%' }}
                                min={0}
                            />
                        </Form.Item>
                        <Select
                            value={deviationUnit}
                            onChange={setDeviationUnit}
                            style={{ width: '30%' }}
                        >
                            <Select.Option value="hours">Часы</Select.Option>
                            <Select.Option value="days">Дни</Select.Option>
                        </Select>
                    </Input.Group>
                </Form.Item>

                <Form.Item
                    label="Родительская работа"
                    name="parentId"
                    tooltip="Выберите, если эта работа является частью другой"
                >
                    <Select
                        placeholder="Без родителя"
                        allowClear
                        options={parentOptions}
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
                        rows={2}
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
                            Добавить работу ТО
                        </Button>
                    )}
                </Form.Item>
            </Form>
        </div>
    );
};

export default MaintenanceTypeForm;