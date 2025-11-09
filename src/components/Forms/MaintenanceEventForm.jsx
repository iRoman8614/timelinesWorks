import React, { useState, useEffect } from 'react';
import { Form, Select, DatePicker, Button, Space, message, Typography } from 'antd';
import dayjs from 'dayjs';

const { Text } = Typography;

const MaintenanceEventForm = ({ onSubmit, project }) => {
    const [form] = Form.useForm();
    const [selectedUnit, setSelectedUnit] = useState(null);
    const [availableMaintenanceTypes, setAvailableMaintenanceTypes] = useState([]);

    // Получить все Units из всех PartModels
    const getAllUnits = () => {
        const units = [];
        project.partModels?.forEach(pm => {
            (pm.units || []).forEach(unit => {
                units.push({
                    ...unit,
                    partModelName: pm.name,
                    partModelId: pm.id,
                    maintenanceTypes: pm.maintenanceTypes || []
                });
            });
        });
        return units;
    };

    const allUnits = getAllUnits();

    // Получить доступные типы ТО для выбранного Unit
    useEffect(() => {
        if (!selectedUnit) {
            setAvailableMaintenanceTypes([]);
            return;
        }

        const unit = allUnits.find(u => u.id === selectedUnit);
        if (!unit) return;

        const partModel = project.partModels.find(pm => pm.id === unit.partModelId);
        if (!partModel) return;

        setAvailableMaintenanceTypes(partModel.maintenanceTypes || []);
    }, [selectedUnit, project]);

    const handleUnitChange = (unitId) => {
        setSelectedUnit(unitId);
        form.setFieldsValue({ maintenanceTypeId: undefined });
    };

    const handleFinish = (values) => {
        const eventData = {
            maintenanceTypeId: values.maintenanceTypeId,
            unitId: values.unitId,
            dateTime: values.dateTime.format('YYYY-MM-DDTHH:mm:ss'),
            custom: true // Флаг внепланового ТО
        };

        onSubmit(eventData);
        form.resetFields();
        setSelectedUnit(null);
        message.success('Внеплановая работа добавлена');
    };

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleFinish}
        >
            <Form.Item
                name="unitId"
                label="Деталь (Unit)"
                rules={[{ required: true, message: 'Выберите деталь' }]}
            >
                <Select
                    placeholder="Выберите деталь"
                    onChange={handleUnitChange}
                    showSearch
                    optionFilterProp="children"
                >
                    {allUnits.map(unit => (
                        <Select.Option key={unit.id} value={unit.id}>
                            {unit.name} - {unit.serialNumber} (Модель: {unit.partModelName})
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                name="maintenanceTypeId"
                label="Тип работы (ТО)"
                rules={[{ required: true, message: 'Выберите тип работы' }]}
            >
                <Select
                    placeholder="Выберите тип работы"
                    disabled={!selectedUnit || availableMaintenanceTypes.length === 0}
                    showSearch
                    optionFilterProp="children"
                >
                    {availableMaintenanceTypes.map(mt => (
                        <Select.Option key={mt.id} value={mt.id}>
                            {mt.name} (Длительность: {mt.duration} дн.)
                        </Select.Option>
                    ))}
                </Select>
            </Form.Item>

            {availableMaintenanceTypes.length === 0 && selectedUnit && (
                <div style={{
                    padding: '12px',
                    background: '#fff7e6',
                    borderRadius: '4px',
                    marginBottom: '16px',
                    border: '1px solid #ffd591'
                }}>
                    <Text type="warning">
                        ⚠️ Для выбранной детали нет доступных типов работ.
                        Добавьте типы ТО в модель детали.
                    </Text>
                </div>
            )}

            <Form.Item
                name="dateTime"
                label="Дата и время начала работы"
                rules={[{ required: true, message: 'Укажите дату и время' }]}
            >
                <DatePicker
                    showTime={{ format: 'HH:mm' }}
                    format="YYYY-MM-DD HH:mm"
                    style={{ width: '100%' }}
                />
            </Form.Item>

            <Form.Item>
                <Space>
                    <Button type="primary" htmlType="submit">
                        Добавить внеплановую работу
                    </Button>
                    <Button onClick={() => {
                        form.resetFields();
                        setSelectedUnit(null);
                    }}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default MaintenanceEventForm;