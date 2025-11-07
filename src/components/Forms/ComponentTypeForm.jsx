import React, { useEffect } from 'react';
import { Form, Input, Button, Space } from 'antd';

const ComponentTypeForm = ({ onSubmit, initialValues }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form]);

    const handleFinish = (values) => {
        const componentTypeData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description
        };
        onSubmit(componentTypeData);
        if (!initialValues) {
            form.resetFields();
        }
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
                label="Название типа компонента"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Двигатель, Компрессор, Фильтр" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
                rules={[{ required: true, message: 'Введите описание' }]}
            >
                <Input.TextArea rows={3} placeholder="Газотурбинный двигатель" />
            </Form.Item>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">
                        {initialValues ? 'Обновить' : 'Создать'}
                    </Button>
                    <Button onClick={() => form.resetFields()}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default ComponentTypeForm;