import React from 'react';
import { Form, Input, Select, Button, Space } from 'antd';

const AssemblyForm = ({ onSubmit, initialValues, assemblyTypes = [] }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        const assemblyData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            type: 'ASSEMBLY',
            assemblyTypeId: values.type
        };
        onSubmit(assemblyData);
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
                label="Название агрегата"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Название агрегата" />
            </Form.Item>

            <Form.Item
                name="type"
                label="Тип агрегата"
                rules={[{ required: true, message: 'Выберите тип' }]}
            >
                <Select placeholder="Выберите тип агрегата">
                    {assemblyTypes.map(type => (
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
                <Input.TextArea rows={3} placeholder="Описание агрегата" />
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

export default AssemblyForm;