import React from 'react';
import { Form, Input, Select, Button, Space } from 'antd';

const UnitForm = ({ onSubmit, initialValues, partModels = [] }) => {
    const [form] = Form.useForm();

    const handleFinish = (values) => {
        const unitData = {
            id: initialValues?.id || crypto.randomUUID(),
            name: values.name,
            description: values.description,
            partModel: values.partModel,
            serialNumber: values.serialNumber
        };
        onSubmit(unitData);
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
                label="Название детали"
                rules={[{ required: true, message: 'Введите название' }]}
            >
                <Input placeholder="Название детали" />
            </Form.Item>

            <Form.Item
                name="partModel"
                label="Модель детали"
                rules={[{ required: true, message: 'Выберите модель' }]}
            >
                <Select placeholder="Выберите модель детали">
                    {partModels.map(model => (
                        <Select.Option key={model.id} value={model.id}>
                            {model.name}
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="serialNumber"
                label="Серийный номер"
                rules={[{ required: true, message: 'Введите серийный номер' }]}
            >
                <Input placeholder="Серийный номер детали" />
            </Form.Item>

            <Form.Item
                name="description"
                label="Описание"
            >
                <Input.TextArea rows={3} placeholder="Описание детали" />
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

export default UnitForm;