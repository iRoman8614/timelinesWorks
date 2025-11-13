import React from 'react';
import { Form, Input, Button, Space } from 'antd';

const NodeForm = ({ onSubmit, initialValues }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        const nodeData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            type: 'NODE',
            children: [],
            conditions: []
        };
        onSubmit(nodeData);
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
                label="Название узла"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Название узла" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
            >
                <Input.TextArea rows={4} placeholder="Описание узла" />
            </Form.Item>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">
                        Создать узел
                    </Button>
                    <Button onClick={() => form.resetFields()}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default NodeForm;