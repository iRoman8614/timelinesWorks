import React from 'react';
import { Form, Input, Button, Space } from 'antd';

const PartModelForm = ({ onSubmit, initialValues }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        const partModelData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            uid: values.uid,
            specification: values.specification,
            maintenanceTypes: [],
            units: []
        };
        onSubmit(partModelData);
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
                label="Название модели детали"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Название модели" />
            </Form.Item>

            <Form.Item
                name="uid"
                label="UID"
                rules={[{ required: true, message: 'Введите UID' }]}
            >
                <Input placeholder="Уникальный идентификатор" />
            </Form.Item>

            <Form.Item
                name="specification"
                label="Спецификация"
                rules={[{ required: true, message: 'Введите спецификацию' }]}
            >
                <Input placeholder="Спецификация детали" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
            >
                <Input.TextArea rows={3} placeholder="Описание модели детали" />
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

export default PartModelForm;