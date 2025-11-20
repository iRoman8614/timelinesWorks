import React, { useState } from 'react';
import { Form, Input, InputNumber, Button, Space, ColorPicker, Select, Divider, Typography } from 'antd';

const { Text } = Typography;

const MaintenanceTypeForm = ({ onSubmit, initialValues, allMaintenanceTypes = [] }) => {
    const [form] = Form.useForm();
    const [color, setColor] = useState(initialValues?.color || '#1890ff');

    const flattenMaintenanceTypes = (types, level = 0, result = []) => {
        types.forEach(type => {
            result.push({
                ...type,
                level,
                displayName: '  '.repeat(level) + type.name
            });
            if (type.children && type.children.length > 0) {
                flattenMaintenanceTypes(type.children, level + 1, result);
            }
        });
        return result;
    };

    const flatTypes = flattenMaintenanceTypes(allMaintenanceTypes);

    const handleFinish = (values) => {
        const maintenanceTypeData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            duration: values.duration,
            priority: values.priority,
            interval: values.interval,
            deviation: values.deviation,
            color: typeof color === 'string' ? color : color.toHexString(),
            parentId: values.parentId || null,
            children: []
        };
        onSubmit(maintenanceTypeData);
        form.resetFields();
        setColor('#1890ff');
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={initialValues}
        >
            <Form.Item
                name="name"
                label="Название типа ТО"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Название типа обслуживания" />
            </Form.Item>

            <Form.Item
                name="parentId"
                label="Родительский тип ТО (необязательно)"
                tooltip="Выберите родительский тип ТО, если хотите создать вложенный тип"
            >
                <Select
                    placeholder="Выберите родительский тип или оставьте пустым"
                    allowClear
                >
                    {flatTypes.map(type => (
                        <Select.Option
                            key={type.id}
                            value={type.id}
                            disabled={initialValues?.id === type.id} // Нельзя выбрать самого себя
                        >
                            {type.displayName}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Divider />

            <Form.Item
                label="Цвет на таймлайне"
            >
                <ColorPicker
                    value={color}
                    onChange={(value) => setColor(value)}
                    showText
                />
            </Form.Item>

            <Form.Item
                name="duration"
                label="Продолжительность (дни)"
                rules={[{ required: true, message: 'Введите продолжительность' }]}
            >
                <InputNumber min={1} placeholder="Количество дней" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="priority"
                label="Приоритет"
                rules={[{ message: 'Введите приоритет' }]}
            >
                <InputNumber min={1} placeholder="Приоритет" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="interval"
                label="Интервал наработки (часы)"
                rules={[{ required: true, message: 'Введите интервал' }]}
            >
                <InputNumber min={0} placeholder="Наработка в часах" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="deviation"
                label="Отклонение (часы)"
                tooltip="Допустимое отклонение от интервала наработки"
            >
                <InputNumber min={0} placeholder="Допустимое отклонение в часах" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
            >
                <Input.TextArea rows={3} placeholder="Описание типа ТО" />
            </Form.Item>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">
                        {initialValues ? 'Обновить' : 'Создать'}
                    </Button>
                    <Button onClick={() => {
                        form.resetFields();
                        setColor('#1890ff');
                    }}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default MaintenanceTypeForm;