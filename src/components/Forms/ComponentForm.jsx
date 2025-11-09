import React from 'react';
import { Form, Input, Select, Button, Space } from 'antd';

const ComponentForm = ({ onSubmit, initialValues, componentTypes = [] }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        const componentData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            type: values.type
        };
        onSubmit(componentData);
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
                label="Название компонента"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Поршень1, Двигатель1" />
            </Form.Item>

            <Form.Item
                name="type"
                label="Тип компонента"
                rules={[{ required: true, message: 'Выберите тип' }]}
            >
                <Select placeholder="Выберите тип">
                    {componentTypes.map(type => (
                        <Select.Option key={type.id} value={type.id}>
                            {type.name}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
            >
                <Input.TextArea rows={3} placeholder="Описание компонента" />
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

export default ComponentForm;