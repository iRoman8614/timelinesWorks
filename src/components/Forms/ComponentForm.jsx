import React, { useEffect } from 'react';
import { Form, Input, Select, Button, Space } from 'antd';

const ComponentForm = ({ onSubmit, initialValues, componentTypes = [] }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue({
                name: initialValues.name,
                description: initialValues.description,
                componentTypeId: initialValues.componentTypeId || initialValues.type
            });
        } else {
            form.resetFields();
        }
    }, [form, initialValues]);

    const handleFinish = (values) => {
        const componentData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name?.trim(),
            description: values.description?.trim() || '',
            componentTypeId: values.componentTypeId
        };
        onSubmit(componentData);
        form.resetFields();
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
        >
            <Form.Item
                name="name"
                label="Название компонента"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Поршень1, Двигатель1" />
            </Form.Item>

            <Form.Item
                name="componentTypeId"
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
                        Сохранить
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