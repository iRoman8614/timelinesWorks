import React, { useState } from 'react';
import { Form, Select, InputNumber, Button, Space } from 'antd';

const NodeConditionForm = ({ onSubmit, initialValues }) => {
    const [form] = Form.useForm();
    const [conditionType, setConditionType] = useState(initialValues?.type || null);

    const handleFinish = (values) => {
        const conditionData = {
            type: values.type
        };

        if (values.type === 'MAX_MAINTENANCE') {
            conditionData.maxUnderMaintenance = values.value;
        } else if (values.type === 'REQUIRED_WORKING') {
            conditionData.requiredWorking = values.value;
        }

        onSubmit(conditionData);
        form.resetFields();
        setConditionType(null);
    };

    const handleTypeChange = (value) => {
        setConditionType(value);
        form.setFieldValue('value', undefined);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
            initialValues={initialValues}
        >
            <Form.Item
                name="type"
                label="Тип условия"
                rules={[{ required: true, message: 'Выберите тип условия' }]}
            >
                <Select
                    placeholder="Выберите тип условия"
                    onChange={handleTypeChange}
                >
                    <Select.Option value="MAX_MAINTENANCE">
                        Максимум агрегатов на ТО
                    </Select.Option>
                    <Select.Option value="REQUIRED_WORKING">
                        Минимум работающих агрегатов
                    </Select.Option>
                </Select>
            </Form.Item>

            {conditionType && (
                <Form.Item
                    name="value"
                    label={conditionType === 'MAX_MAINTENANCE' ? 'Максимум на ТО' : 'Минимум работающих'}
                    rules={[{ required: true, message: 'Введите значение' }]}
                >
                    <InputNumber
                        min={0}
                        placeholder="Значение"
                        style={{ width: '100%' }}
                    />
                </Form.Item>
            )}

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit" disabled={!conditionType}>
                        Добавить условие
                    </Button>
                    <Button onClick={() => {
                        form.resetFields();
                        setConditionType(null);
                    }}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default NodeConditionForm;