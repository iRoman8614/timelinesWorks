import React, { useState, useEffect } from 'react';
import { Form, Input, InputNumber, Select, Button, Space, message, Divider, Typography, Checkbox } from 'antd';

const { Text } = Typography;

const UnitAssignmentForm = ({ onSubmit, project }) => {
    const [form] = Form.useForm();
    const [selectedAssembly, setSelectedAssembly] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [availableUnits, setAvailableUnits] = useState([]);
    const [includeOperatingInterval, setIncludeOperatingInterval] = useState(false);

    const getAllAssemblies = (nodes) => {
        const assemblies = [];

        const traverse = (items) => {
            items.forEach(item => {
                if (item.type === 'ASSEMBLY' || item.type === 'assembly') {
                    assemblies.push(item);
                }
                if (item.children) {
                    traverse(item.children);
                }
            });
        };

        traverse(nodes);
        return assemblies;
    };

    const assemblies = getAllAssemblies(project.nodes || []);

    const getAssemblyInfo = (assemblyId) => {
        return assemblies.find(a => a.id === assemblyId);
    };

    const getAssemblyType = (assemblyTypeId) => {
        return project.assemblyTypes.find(at => at.id === assemblyTypeId);
    };

    const getComponentType = (componentTypeId) => {
        return project.componentTypes.find(ct => ct.id === componentTypeId);
    };

    useEffect(() => {
        if (!selectedAssembly || !selectedComponent) {
            setAvailableUnits([]);
            return;
        }

        const assembly = getAssemblyInfo(selectedAssembly);
        if (!assembly) return;

        const assemblyType = getAssemblyType(assembly.assemblyTypeId);
        if (!assemblyType) return;

        const component = assemblyType.components.find(c => c.id === selectedComponent);
        if (!component) return;

        const componentTypeId = component.componentTypeId;
        if (!componentTypeId) return;

        const compatibleUnits = [];
        project.partModels.forEach(pm => {
            if (pm.componentTypeId === componentTypeId && pm.units && pm.units.length > 0) {
                pm.units.forEach(unit => {
                    compatibleUnits.push({
                        ...unit,
                        partModelName: pm.name,
                        partModelId: pm.id
                    });
                });
            }
        });

        setAvailableUnits(compatibleUnits);
    }, [selectedAssembly, selectedComponent, project]);

    const handleAssemblyChange = (assemblyId) => {
        setSelectedAssembly(assemblyId);
        setSelectedComponent(null);
        form.setFieldsValue({ componentId: undefined, unitId: undefined });
    };

    const handleComponentChange = (componentId) => {
        setSelectedComponent(componentId);
        form.setFieldsValue({ unitId: undefined });
    };

    const handleFinish = (values) => {
        const assembly = getAssemblyInfo(values.assemblyId);
        if (!assembly) {
            message.error('Агрегат не найден');
            return;
        }

        // Преобразуем datetime-local в ISO формат
        const dateTime = new Date(values.dateTime).toISOString();

        const assignmentData = {
            unitId: values.unitId,
            componentOfAssembly: {
                assemblyId: values.assemblyId,
                componentPath: [values.componentId]
            },
            dateTime: dateTime,
            operatingInterval: includeOperatingInterval ? values.operatingInterval : null
        };

        onSubmit(assignmentData);
        form.resetFields();
        setSelectedAssembly(null);
        setSelectedComponent(null);
        setIncludeOperatingInterval(false);
    };

    const getAssemblyComponents = () => {
        if (!selectedAssembly) return [];

        const assembly = getAssemblyInfo(selectedAssembly);
        if (!assembly) return [];

        const assemblyType = getAssemblyType(assembly.assemblyTypeId);
        if (!assemblyType) return [];

        return assemblyType.components || [];
    };

    const selectedAssemblyInfo = selectedAssembly ? getAssemblyInfo(selectedAssembly) : null;
    const selectedAssemblyType = selectedAssemblyInfo
        ? getAssemblyType(selectedAssemblyInfo.assemblyTypeId)
        : null;

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
        >
            <Form.Item
                name="dateTime"
                label="Дата и время замены"
                rules={[{ required: true, message: 'Выберите дату' }]}
            >
                <Input
                    type="datetime-local"
                    style={{ width: '100%' }}
                    placeholder="Выберите дату и время"
                />
            </Form.Item>

            <Divider />

            <Form.Item>
                <Checkbox
                    checked={includeOperatingInterval}
                    onChange={(e) => setIncludeOperatingInterval(e.target.checked)}
                >
                    Указать наработку (часы)
                </Checkbox>
            </Form.Item>

            {includeOperatingInterval && (
                <Form.Item
                    name="operatingInterval"
                    label="Наработка (часы)"
                    rules={[
                        {
                            required: includeOperatingInterval,
                            message: 'Введите наработку'
                        },
                        {
                            type: 'number',
                            min: 0,
                            message: 'Наработка должна быть положительным числом'
                        }
                    ]}
                    extra="Количество отработанных часов на момент установки детали"
                >
                    <InputNumber
                        min={0}
                        placeholder="Введите наработку в часах"
                        style={{ width: '100%' }}
                        step={1}
                    />
                </Form.Item>
            )}

            <Divider />

            <Form.Item
                name="assemblyId"
                label="Агрегат"
                rules={[{ required: true, message: 'Выберите агрегат' }]}
            >
                <Select
                    placeholder="Выберите агрегат"
                    onChange={handleAssemblyChange}
                >
                    {assemblies.map(assembly => {
                        const assemblyType = getAssemblyType(assembly.assemblyTypeId);
                        return (
                            <Select.Option key={assembly.id} value={assembly.id}>
                                {assembly.name} ({assemblyType?.name || 'Неизвестный тип'})
                            </Select.Option>
                        );
                    })}
                </Select>
            </Form.Item>

            {selectedAssemblyInfo && (
                <div style={{
                    padding: '12px',
                    background: '#f5f5f5',
                    borderRadius: '4px',
                    marginBottom: '16px'
                }}>
                    <Text strong>Тип агрегата: </Text>
                    <Text>{selectedAssemblyType?.name}</Text>
                </div>
            )}

            <Form.Item
                name="componentId"
                label="Компонент агрегата"
                rules={[{ required: true, message: 'Выберите компонент' }]}
            >
                <Select
                    placeholder="Выберите компонент"
                    disabled={!selectedAssembly}
                    onChange={handleComponentChange}
                >
                    {getAssemblyComponents().map(component => {
                        const componentType = getComponentType(component.componentTypeId);
                        return (
                            <Select.Option key={component.id} value={component.id}>
                                {component.name} ({componentType?.name || 'Неизвестный тип'})
                            </Select.Option>
                        );
                    })}
                </Select>
            </Form.Item>

            <Form.Item
                name="unitId"
                label="Деталь (Unit)"
                rules={[{ required: true, message: 'Выберите деталь' }]}
            >
                <Select
                    placeholder="Выберите деталь"
                    disabled={!selectedComponent}
                    showSearch
                    optionFilterProp="children"
                >
                    {availableUnits.map(unit => (
                        <Select.Option key={unit.id} value={unit.id}>
                            {unit.name} - {unit.serialNumber} (Модель: {unit.partModelName})
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            {availableUnits.length === 0 && selectedComponent && (
                <div style={{
                    padding: '12px',
                    background: '#fff7e6',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    border: '1px solid #ffd591'
                }}>
                    <Text type="warning">
                        ⚠️ Нет доступных деталей для выбранного компонента.
                        Создайте детали в разделе "Модели деталей".
                    </Text>
                </div>
            )}

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">
                        Назначить деталь
                    </Button>
                    <Button onClick={() => {
                        form.resetFields();
                        setSelectedAssembly(null);
                        setSelectedComponent(null);
                        setIncludeOperatingInterval(false);
                    }}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default UnitAssignmentForm;