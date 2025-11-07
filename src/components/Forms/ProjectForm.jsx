import React from 'react';
import { Form, Input, Button, Space } from 'antd';

const ProjectForm = ({ onSubmit, initialValues }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        const projectData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description
        };
        onSubmit(projectData);
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
                label="Название проекта"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Название" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
            >
                <Input.TextArea rows={4} placeholder="Описание проекта" />
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

export default ProjectForm;