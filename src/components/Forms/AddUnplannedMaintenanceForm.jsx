import React, { useState } from 'react';
import { Form, Select, DatePicker, Button, Space, Divider, Typography } from 'antd';
import dayjs from 'dayjs';

const { Option } = Select;
const { Text } = Typography;

const AddUnplannedMaintenanceForm = ({ project, onSubmit }) => {
    const [form] = Form.useForm();
    const [selectedPartModelId, setSelectedPartModelId] = useState(null);
    const [selectedUnitId, setSelectedUnitId] = useState(null);
    const [selectedMaintenanceTypeId, setSelectedMaintenanceTypeId] = useState(null);

    // Получаем модель детали для выбранной детали
    const getPartModelForUnit = (unitId) => {
        return project.partModels?.find(pm =>
            pm.units?.some(u => u.id === unitId)
        );
    };

    // Получаем типы ТО для выбранной модели детали
    const getMaintenanceTypesForPartModel = (partModelId) => {
        const partModel = project.partModels?.find(pm => pm.id === partModelId);
        return partModel?.maintenanceTypes || [];
    };

    // Получаем детали для выбранной модели
    const getUnitsForPartModel = (partModelId) => {
        const partModel = project.partModels?.find(pm => pm.id === partModelId);
        return partModel?.units || [];
    };

    // Получаем информацию о типе ТО
    const getMaintenanceTypeInfo = (maintenanceTypeId) => {
        if (!selectedPartModelId) return null;
        const maintenanceTypes = getMaintenanceTypesForPartModel(selectedPartModelId);
        return maintenanceTypes.find(mt => mt.id === maintenanceTypeId);
    };

    const handleSubmit = (values) => {
        const maintenanceEvent = {
            maintenanceTypeId: values.maintenanceTypeId,
            unitId: values.unitId,
            dateTime: values.dateTime.toISOString(),
            custom: true // Помечаем как внеплановую работу
        };

        onSubmit(maintenanceEvent);
        form.resetFields();
        setSelectedPartModelId(null);
        setSelectedUnitId(null);
        setSelectedMaintenanceTypeId(null);
    };

    const maintenanceTypeInfo = getMaintenanceTypeInfo(selectedMaintenanceTypeId);

    return (
        <Form
            form={form}
            layout="vertical"
            onFinish={handleSubmit}
        >
            <Form.Item
                label="Модель детали"
                name="partModelId"
                rules={[{ required: true, message: 'Выберите модель детали' }]}
            >
                <Select
                    placeholder="Выберите модель детали"
                    onChange={(value) => {
                        setSelectedPartModelId(value);
                        form.setFieldsValue({
                            unitId: undefined,
                            maintenanceTypeId: undefined
                        });
                        setSelectedUnitId(null);
                        setSelectedMaintenanceTypeId(null);
                    }}
                >
                    {(project.partModels || []).map(partModel => (
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
                    onChange={(value) => {
                        setSelectedUnitId(value);
                    }}
                >
                    {getUnitsForPartModel(selectedPartModelId).map(unit => (
                        <Option key={unit.id} value={unit.id}>
                            {unit.name} - {unit.serialNumber}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            <Form.Item
                label="Тип работы ТО"
                name="maintenanceTypeId"
                rules={[{ required: true, message: 'Выберите тип работы ТО' }]}
            >
                <Select
                    placeholder="Выберите тип работы ТО"
                    disabled={!selectedPartModelId}
                    onChange={(value) => {
                        setSelectedMaintenanceTypeId(value);
                    }}
                >
                    {getMaintenanceTypesForPartModel(selectedPartModelId).map(maintenanceType => (
                        <Option key={maintenanceType.id} value={maintenanceType.id}>
                            {maintenanceType.name}
                        </Option>
                    ))}
                </Select>
            </Form.Item>

            {maintenanceTypeInfo && (
                <div style={{
                    background: '#f5f5f5',
                    padding: '12px',
                    borderRadius: '4px',
                    marginBottom: '16px'
                }}>
                    <Text strong>Информация о работе ТО:</Text>
                    <div style={{ marginTop: '8px' }}>
                        <div>
                            <Text type="secondary">Название: </Text>
                            <Text>{maintenanceTypeInfo.name}</Text>
                        </div>
                        <div>
                            <Text type="secondary">Длительность: </Text>
                            <Text>{maintenanceTypeInfo.duration} дн.</Text>
                        </div>
                        <div>
                            <Text type="secondary">Интервал: </Text>
                            <Text>{maintenanceTypeInfo.interval} ч.</Text>
                        </div>
                        <div>
                            <Text type="secondary">Цвет: </Text>
                            <div
                                style={{
                                    display: 'inline-block',
                                    width: '20px',
                                    height: '20px',
                                    backgroundColor: maintenanceTypeInfo.color,
                                    border: '1px solid #d9d9d9',
                                    borderRadius: '2px',
                                    marginLeft: '8px',
                                    verticalAlign: 'middle'
                                }}
                            />
                        </div>
                    </div>
                </div>
            )}

            <Form.Item
                label="Дата и время начала работы"
                name="dateTime"
                rules={[{ required: true, message: 'Выберите дату и время' }]}
                initialValue={dayjs()}
                help="Внеплановая работа будет помечена особым образом"
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
                        Добавить работу
                    </Button>
                    <Button onClick={() => {
                        form.resetFields();
                        setSelectedPartModelId(null);
                        setSelectedUnitId(null);
                        setSelectedMaintenanceTypeId(null);
                    }}>
                        Очистить
                    </Button>
                </Space>
            </Form.Item>
        </Form>
    );
};

export default AddUnplannedMaintenanceForm;