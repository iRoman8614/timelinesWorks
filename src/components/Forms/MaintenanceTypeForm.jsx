import React from 'react';
import { Form, Input, InputNumber, Button, Space } from 'antd';

const MaintenanceTypeForm = ({ onSubmit, initialValues }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        const maintenanceTypeData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            duration: values.duration,
            priority: values.priority,
            interval: values.interval,
            deviation: values.deviation,
            children: []
        };
        onSubmit(maintenanceTypeData);
        form.resetFields();
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
                name="duration"
                label="Продолжительность (дни)"
                rules={[{ required: true, message: 'Введите продолжительность' }]}
            >
                <InputNumber min={1} placeholder="Количество дней" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="priority"
                label="Приоритет"
                rules={[{ required: true, message: 'Введите приоритет' }]}
            >
                <InputNumber min={1} placeholder="Приоритет" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="interval"
                label="Интервал наработки"
                rules={[{ required: true, message: 'Введите интервал' }]}
            >
                <InputNumber min={0} placeholder="Наработка" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item
                name="deviation"
                label="Отклонение"
            >
                <InputNumber min={0} placeholder="Допустимое отклонение" style={{ width: '100%' }} />
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
                        Создать
                    </Button>
                    <Button onClick={() => form.resetFields()}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default MaintenanceTypeForm;