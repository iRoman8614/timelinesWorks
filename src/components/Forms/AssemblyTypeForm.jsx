import React, { useEffect } from 'react';
import { Form, Input, Button, Space } from 'antd';

const AssemblyTypeForm = ({ onSubmit, initialValues }) => {
    const [form] = Form.useForm();

    useEffect(() => {
        if (initialValues) {
            form.setFieldsValue(initialValues);
        }
    }, [initialValues, form]);

    const handleFinish = (values) => {
        const assemblyTypeData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            components: initialValues?.components || []
        };
        onSubmit(assemblyTypeData);
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
                label="Название типа агрегата"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="ГПА-Тип-1" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
                rules={[{ required: true, message: 'Введите описание' }]}
            >
                <Input.TextArea rows={4} placeholder="Газоперекачивающий агрегат типа 1" />
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

export default AssemblyTypeForm;