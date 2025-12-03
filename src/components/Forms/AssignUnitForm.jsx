import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Space, Divider } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;

const AssignUnitForm = ({ project, onSubmit }) => {
    const [form] = Form.useForm();
    const [selectedAssemblyTypeId, setSelectedAssemblyTypeId] = useState(null);
    const [selectedAssemblyId, setSelectedAssemblyId] = useState(null);
    const [selectedComponentId, setSelectedComponentId] = useState(null);
    const [selectedPartModelId, setSelectedPartModelId] = useState(null);

    // Получаем все агрегаты из дерева нод
    const getAllAssemblies = (nodes, result = []) => {
        nodes?.forEach(node => {
            if (node.type === 'ASSEMBLY') {
                result.push(node);
            }
            if (node.children) {
                getAllAssemblies(node.children, result);
            }
        });
        return result;
    };

    const allAssemblies = getAllAssemblies(project.nodes || []);

    // Получаем assemblyType для выбранного агрегата
    const getAssemblyType = (assemblyId) => {
        const assembly = allAssemblies.find(a => a.id === assemblyId);
        if (!assembly) return null;
        return project.assemblyTypes?.find(at => at.id === assembly.assemblyTypeId);
    };

    // Получаем компоненты для выбранного агрегата
    const getComponentsForAssembly = (assemblyId) => {
        const assemblyType = getAssemblyType(assemblyId);
        return assemblyType?.components || [];
    };

    // Получаем componentType для выбранного компонента
    const getComponentType = (componentId) => {
        if (!selectedAssemblyId) return null;
        const components = getComponentsForAssembly(selectedAssemblyId);
        const component = components.find(c => c.id === componentId);
        if (!component) return null;
        return project.componentTypes?.find(ct => ct.id === component.componentTypeId);
    };

    // Получаем модели деталей для выбранного типа компонента
    const getPartModelsForComponentType = (componentId) => {
        const componentType = getComponentType(componentId);
        if (!componentType) return [];
        return project.partModels?.filter(pm => pm.componentTypeId === componentType.id) || [];
    };

    // Получаем детали для выбранной модели
    const getUnitsForPartModel = (partModelId) => {
        const partModel = project.partModels?.find(pm => pm.id === partModelId);
        return partModel?.units || [];
    };

    const handleSubmit = (values) => {
        const unitAssignment = {
            unitId: values.unitId,
            componentOfAssembly: {
                assemblyId: values.assemblyId,
                componentPath: [values.componentId]
            },
            dateTime: values.dateTime.toISOString()
        };

        onSubmit(unitAssignment);
        form.resetFields();
        setSelectedAssemblyId(null);
        setSelectedComponentId(null);
        setSelectedPartModelId(null);
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
        >
            <Form.Item
                label="Агрегат"
                name="assemblyId"
                rules={[{ required: true, message: 'Выберите агрегат' }]}
            >
                <Select
                    placeholder="Выберите агрегат"
                    onChange={(value) => {
                        setSelectedAssemblyId(value);
                        form.setFieldsValue({
                            componentId: undefined,
                            partModelId: undefined,
                            unitId: undefined
                        });
                        setSelectedComponentId(null);
                        setSelectedPartModelId(null);
                    }}
                >
                    {allAssemblies.map(assembly => (
                        <Option key={assembly.id} value={assembly.id}>
                            {assembly.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Компонент"
                name="componentId"
                rules={[{ required: true, message: 'Выберите компонент' }]}
            >
                <Select
                    placeholder="Выберите компонент"
                    disabled={!selectedAssemblyId}
                    onChange={(value) => {
                        setSelectedComponentId(value);
                        form.setFieldsValue({
                            partModelId: undefined,
                            unitId: undefined
                        });
                        setSelectedPartModelId(null);
                    }}
                >
                    {getComponentsForAssembly(selectedAssemblyId).map(component => (
                        <Option key={component.id} value={component.id}>
                            {component.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Модель детали"
                name="partModelId"
                rules={[{ required: true, message: 'Выберите модель детали' }]}
            >
                <Select
                    placeholder="Выберите модель детали"
                    disabled={!selectedComponentId}
                    onChange={(value) => {
                        setSelectedPartModelId(value);
                        form.setFieldsValue({ unitId: undefined });
                    }}
                >
                    {getPartModelsForComponentType(selectedComponentId).map(partModel => (
                        <Option key={partModel.id} value={partModel.id}>
                            {partModel.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Деталь (экземпляр)"
                name="unitId"
                rules={[{ required: true, message: 'Выберите деталь' }]}
            >
                <Select
                    placeholder="Выберите деталь"
                    disabled={!selectedPartModelId}
                >
                    {getUnitsForPartModel(selectedPartModelId).map(unit => (
                        <Option key={unit.id} value={unit.id}>
                            {unit.name} - {unit.serialNumber}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Дата и время назначения"
                name="dateTime"
                rules={[{ required: true, message: 'Выберите дату и время' }]}
                initialValue={dayjs()}
            >
                <DatePicker
                    showTime
                    format="DD.MM.YYYY HH:mm"
                    style={{ width: '100%' }}
                />
            </Form.Item>

            <Divider />

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">
                        Назначить
                    </Button>
                    <Button onClick={() => form.resetFields()}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default AssignUnitForm;