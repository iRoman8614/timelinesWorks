import React from 'react';
import { Form, Input, Button, Space } from 'antd';

const FolderForm = ({ onSubmit, initialValues }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        const folderData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            children: []
        };
        onSubmit(folderData);
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
                label="Название папки"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Название" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
            >
                <Input.TextArea rows={3} placeholder="Описание папки" />
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

export default FolderForm;