import React, { useState, useMemo } from 'react';
import { Modal, Form, Select, DatePicker, InputNumber, message } from 'antd';
import dayjs from 'dayjs';

const AssignUnitModal = ({ visible, onCancel, onAssign, structure }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [selectedAssemblyId, setSelectedAssemblyId] = useState(null);
    const [selectedComponentId, setSelectedComponentId] = useState(null);
    const [selectedPartModelId, setSelectedPartModelId] = useState(null);

    const assemblies = useMemo(() => {
        const allAssemblies = [];

        if (!structure || !structure.nodes) return [];

        const traverse = (nodes, path = []) => {
            nodes.forEach(node => {
                if (node.type === 'NODE' && node.children) {
                    traverse(node.children, [...path, node.name]);
                } else if (node.type === 'ASSEMBLY') {
                    allAssemblies.push({
                        ...node,
                        path: path.join(' / ')
                    });
                }
            });
        };

        traverse(structure.nodes);
        return allAssemblies;
    }, [structure]);

    const components = useMemo(() => {
        if (!selectedAssemblyId) return [];

        const assembly = assemblies.find(a => a.id === selectedAssemblyId);
        if (!assembly) return [];

        const assemblyType = structure.assemblyTypes?.find(
            at => at.id === assembly.assemblyTypeId
        );

        if (!assemblyType?.components) return [];

        return assemblyType.components.map(comp => {
            const componentType = structure.componentTypes?.find(
                ct => ct.id === comp.componentTypeId
            );

            const partModel = structure.partModels?.find(pm =>
                pm.componentTypeId === comp.componentTypeId ||
                pm.id === componentType?.partModelId
            );

            return {
                ...comp,
                componentType: componentType,
                partModel: partModel,
                name: componentType?.name || comp.name || 'Без имени'
            };
        });
    }, [selectedAssemblyId, assemblies, structure]);

    const units = useMemo(() => {
        if (!selectedPartModelId || !structure?.partModels) return [];

        const partModel = structure.partModels.find(pm => pm.id === selectedPartModelId);

        return partModel?.units || [];
    }, [selectedPartModelId, structure]);

    const partModels = useMemo(() => {
        return structure?.partModels || [];
    }, [structure]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const assignment = {
                unitId: values.unitId,
                componentOfAssembly: {
                    assemblyId: selectedAssemblyId,
                    componentPath: [selectedComponentId]
                },
                operatingInterval: values.operatingInterval || 0,
                dateTime: values.dateTime.format('YYYY-MM-DDTHH:mm:ss')
            };

            await onAssign(assignment);

            message.success('Деталь назначена компоненту');
            form.resetFields();
            setSelectedAssemblyId(null);
            setSelectedComponentId(null);
            setSelectedPartModelId(null);
            onCancel();
        } catch (error) {
            console.error('Assign unit error:', error);
            message.error('Ошибка при назначении детали');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedAssemblyId(null);
        setSelectedComponentId(null);
        setSelectedPartModelId(null);
        onCancel();
    };

    return (
        <Modal
            title="Назначить деталь компоненту"
            open={visible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            okText="Назначить"
            cancelText="Отмена"
            confirmLoading={loading}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    dateTime: dayjs(),
                    operatingInterval: 0
                }}
            >
                <Form.Item
                    name="assemblyId"
                    label="Агрегат"
                    rules={[{ required: true, message: 'Выберите агрегат' }]}
                >
                    <Select
                        placeholder="Выберите агрегат"
                        onChange={(value) => {
                            setSelectedAssemblyId(value);
                            setSelectedComponentId(null);
                            setSelectedPartModelId(null);
                            form.setFieldsValue({
                                componentId: undefined,
                                partModelId: undefined,
                                unitId: undefined
                            });
                        }}
                        showSearch
                        optionFilterProp="children"
                    >
                        {assemblies.map(assembly => (
                            <Select.Option key={assembly.id} value={assembly.id}>
                                {assembly.path ? `${assembly.path} / ` : ''}{assembly.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="componentId"
                    label="Компонент"
                    rules={[{ required: true, message: 'Выберите компонент' }]}
                >
                    <Select
                        placeholder="Выберите компонент"
                        disabled={!selectedAssemblyId}
                        onChange={(value) => {
                            setSelectedComponentId(value);
                            const comp = components.find(c => c.id === value);
                            if (comp?.partModel) {
                                setSelectedPartModelId(comp.partModel.id);
                                form.setFieldsValue({ partModelId: comp.partModel.id });
                            } else {
                                setSelectedPartModelId(null);
                                form.setFieldsValue({ partModelId: undefined });
                            }
                            form.setFieldsValue({ unitId: undefined });
                        }}
                        showSearch
                        optionFilterProp="children"
                    >
                        {components.map(comp => (
                            <Select.Option key={comp.id} value={comp.id}>
                                {comp.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="partModelId"
                    label="Модель детали"
                    rules={[{ required: true, message: 'Выберите модель детали' }]}
                >
                    <Select
                        placeholder="Выберите модель детали"
                        disabled={!selectedComponentId}
                        onChange={(value) => {
                            setSelectedPartModelId(value);
                            form.setFieldsValue({ unitId: undefined });
                        }}
                        showSearch
                        optionFilterProp="children"
                    >
                        {partModels.map(pm => (
                            <Select.Option key={pm.id} value={pm.id}>
                                {pm.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="unitId"
                    label="Деталь (экземпляр)"
                    rules={[{ required: true, message: 'Выберите деталь' }]}
                >
                    <Select
                        placeholder="Выберите деталь"
                        disabled={!selectedPartModelId}
                        showSearch
                        optionFilterProp="children"
                    >
                        {units.map(unit => (
                            <Select.Option key={unit.id} value={unit.id}>
                                {unit.name} ({unit.serialNumber || unit.id.slice(0, 8)})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="operatingInterval"
                    label="Наработка (часы)"
                >
                    <InputNumber
                        min={0}
                        style={{ width: '100%' }}
                        placeholder="0"
                    />
                </Form.Item>

                <Form.Item
                    name="dateTime"
                    label="Дата и время назначения"
                    rules={[{ required: true, message: 'Выберите дату и время' }]}
                >
                    <DatePicker
                        showTime
                        format="DD.MM.YYYY HH:mm"
                        placeholder="21.12.2025 12:00"
                        style={{ width: '100%' }}
                    />
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default AssignUnitModal;