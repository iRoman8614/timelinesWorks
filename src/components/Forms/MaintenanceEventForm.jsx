import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Space, message, Typography, Divider } from 'antd';

const { Text } = Typography;

const MaintenanceEventForm = ({ onSubmit, project }) => {
    const [form] = Form.useForm();
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [selectedAssembly, setSelectedAssembly] = useState(null);
    const [selectedComponent, setSelectedComponent] = useState(null);
    const [availableMaintenanceTypes, setAvailableMaintenanceTypes] = useState([]);

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

// Получить тип агрегата
    const getAssemblyType = (assemblyTypeId) => {
        return project.assemblyTypes.find(at => at.id === assemblyTypeId);
    };

// Получить тип компонента
    const getComponentType = (componentTypeId) => {
        return project.componentTypes.find(ct => ct.id === componentTypeId);
    };

// Получить компоненты выбранного агрегата
    const getAssemblyComponents = () => {
        if (!selectedAssembly) return [];
        const assembly = getAssemblyInfo(selectedAssembly);
        if (!assembly) return [];
        const assemblyType = getAssemblyType(assembly.assemblyTypeId);
        if (!assemblyType) return [];
        return assemblyType.components || [];
    };

// Получить текущий назначенный Unit для компонента
    const getCurrentUnitForComponent = (assemblyId, componentId) => {
        const assignments = (project.timeline?.unitAssignments || [])
            .filter(ua =>
                ua.componentOfAssembly?.assemblyId === assemblyId &&
                ua.componentOfAssembly?.componentPath?.includes(componentId)
            )
            .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));
        return assignments[0]?.unitId || null;
    };

    useEffect(() => {
        if (!selectedAssembly || !selectedComponent) {
            setAvailableMaintenanceTypes([]);
            return;
        }

        const assembly = getAssemblyInfo(selectedAssembly);
        if (!assembly) return;

        const assemblyType = getAssemblyType(assembly.assemblyTypeId);
        if (!assemblyType) return;

        const component = assemblyType.components.find(c => c.id === selectedComponent);
        if (!component) return;

        // Получаем ComponentType для этого компонента
        const componentTypeId = component.componentTypeId;
        if (!componentTypeId) {
            setAvailableMaintenanceTypes([]);
            return;
        }

        // Находим все PartModels этого типа и собираем их maintenanceTypes
        const allMaintenanceTypes = [];
        project.partModels?.forEach(pm => {
            if (pm.componentTypeId === componentTypeId && pm.maintenanceTypes) {
                pm.maintenanceTypes.forEach(mt => {
                    // Добавляем только уникальные (по id)
                    if (!allMaintenanceTypes.find(existing => existing.id === mt.id)) {
                        allMaintenanceTypes.push(mt);
                    }
                });
            }
        });

        setAvailableMaintenanceTypes(allMaintenanceTypes);
    }, [selectedAssembly, selectedComponent, project]);
    const handleAssemblyChange = (assemblyId) => {
        setSelectedAssembly(assemblyId);
        setSelectedComponent(null);
        form.setFieldsValue({ componentId: undefined, maintenanceTypeId: undefined });
    };

    const handleComponentChange = (componentId) => {
        setSelectedComponent(componentId);
        form.setFieldsValue({ maintenanceTypeId: undefined });
    };

    const resolveUnitIdForComponent = (assemblyId, componentId) => {
        const assignedUnitId = getCurrentUnitForComponent(assemblyId, componentId);
        if (assignedUnitId) {
            return assignedUnitId;
        }
        const assembly = getAssemblyInfo(assemblyId);
        if (!assembly) return null;
        const assemblyType = getAssemblyType(assembly.assemblyTypeId);
        if (!assemblyType) return null;
        const component = assemblyType.components.find(c => c.id === componentId);
        if (!component) return null;
        const componentTypeId = component.componentTypeId;
        if (!componentTypeId) return null;
        const partModelWithUnits = project.partModels?.find(
            pm => pm.componentTypeId === componentTypeId && pm.units && pm.units.length > 0
        );
        if (!partModelWithUnits) return null;
        return partModelWithUnits.units[0].id;
    };


    // const handleFinish = (values) => {
    //     const assembly = getAssemblyInfo(values.assemblyId);
    //     if (!assembly) {
    //         message.error('Агрегат не найден');
    //         return;
    //     }
    //
    //     const assemblyType = getAssemblyType(assembly.assemblyTypeId);
    //     console.log('assemblyType', assemblyType)
    //     console.log('assembly', assembly)
    //     const component = assemblyType?.components.find(c => c.id === values.componentId);
    //     console.log('componentId', values.componentId)
    //     console.log('component', component)
    //     if (!component) {
    //         message.error('Компонент не найден');
    //         return;
    //     }
    //
    //     // Создаём специальный unitId для работ без привязки к конкретному Unit
    //     const virtualUnitId = `${values.componentId}`;
    //
    //     const eventData = {
    //         maintenanceTypeId: values.maintenanceTypeId,
    //         unitId: virtualUnitId,
    //         componentOfAssembly: {
    //             assemblyId: values.assemblyId,
    //             componentPath: [values.componentId]
    //         },
    //         dateTime: values.dateTime.format('YYYY-MM-DDTHH:mm:ss'),
    //         custom: true
    //     };
    //
    //     onSubmit(eventData);
    //     form.resetFields();
    //     setSelectedAssembly(null);
    //     setSelectedComponent(null);
    //     message.success('Внеплановая работа добавлена');
    // };

    const handleFinish = (values) => {
        const assembly = getAssemblyInfo(values.assemblyId);
        if (!assembly) {
            message.error('Агрегат не найден');
            return;
        }

        const assemblyType = getAssemblyType(assembly.assemblyTypeId);
        const component = assemblyType?.components.find(c => c.id === values.componentId);
        if (!component) {
            message.error('Компонент не найден');
            return;
        }

        const unitId = resolveUnitIdForComponent(values.assemblyId, values.componentId);
        if (!unitId) {
            message.error('Не удалось определить Unit для выбранного компонента');
            return;
        }

        const eventData = {
            maintenanceTypeId: values.maintenanceTypeId,
            unitId,
            componentOfAssembly: {
                assemblyId: values.assemblyId,
                componentPath: [values.componentId]
            },
            dateTime: values.dateTime.format('YYYY-MM-DDTHH:mm:ss'),
            custom: true
        };

        onSubmit(eventData);
        form.resetFields();
        setSelectedAssembly(null);
        setSelectedComponent(null);
        message.success('Внеплановая работа добавлена');
    };

    const selectedAssemblyInfo = selectedAssembly ? getAssemblyInfo(selectedAssembly) : null;
    const selectedAssemblyType = selectedAssemblyInfo ? getAssemblyType(selectedAssemblyInfo.assemblyTypeId) : null;

    return (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item name="assemblyId" label="Агрегат" rules={[{ required: true, message: 'Выберите агрегат' }]}>
                <Select placeholder="Выберите агрегат" onChange={handleAssemblyChange}>
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
                <div style={{ padding: '12px', background: '#f5f5f5', borderRadius: '4px', marginBottom: '16px' }}>
                    <Text strong>Тип агрегата: </Text>
                    <Text>{selectedAssemblyType?.name}</Text>
                </div>
            )}

            <Form.Item name="componentId" label="Компонент агрегата" rules={[{ required: true, message: 'Выберите компонент' }]}>
                <Select placeholder="Выберите компонент" disabled={!selectedAssembly} onChange={handleComponentChange}>
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

            <Form.Item name="maintenanceTypeId" label="Тип работы (ТО)" rules={[{ required: true, message: 'Выберите тип работы' }]}>
                <Select placeholder="Выберите тип работы" disabled={!selectedComponent || availableMaintenanceTypes.length === 0} showSearch optionFilterProp="children">
                    {availableMaintenanceTypes.map(mt => (
                        <Select.Option key={mt.id} value={mt.id}>
                            {mt.name} (Длительность: {mt.duration} дн.)
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            {availableMaintenanceTypes.length === 0 && selectedComponent && (
                <div style={{ padding: '12px', background: '#fff7e6', borderRadius: '4px', marginBottom: '16px', border: '1px solid #ffd591' }}>
                    <Text type="warning">
                        ⚠️ Для выбранного типа компонента нет доступных типов работ.
                        Создайте модель детали с типами ТО для этого типа компонента.
                    </Text>
                </div>
            )}

            <Divider />

            <Form.Item name="dateTime" label="Дата и время начала работы" rules={[{ required: true, message: 'Укажите дату и время' }]}>
                <DatePicker showTime={{ format: 'HH:mm' }} format="YYYY-MM-DD HH:mm" style={{ width: '100%' }} />
            </Form.Item>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">Добавить внеплановую работу</Button>
                    <Button onClick={() => { form.resetFields(); setSelectedAssembly(null); setSelectedComponent(null); }}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default MaintenanceEventForm;