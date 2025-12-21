import React, { useState, useMemo } from 'react';
import { Modal, Form, Select, DatePicker, message } from 'antd';
import dayjs from 'dayjs';

const AddMaintenanceModal = ({ visible, onCancel, onAdd, structure, planId }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);

    const [selectedPartModelId, setSelectedPartModelId] = useState(null);
    const maintenanceTypes = useMemo(() => {
        if (!structure || !structure.partModels) return [];

        const allTypes = [];
        structure.partModels.forEach(partModel => {
            if (partModel.maintenanceTypes) {
                partModel.maintenanceTypes.forEach(mt => {
                    allTypes.push({
                        ...mt,
                        partModelId: partModel.id,
                        partModelName: partModel.name
                    });
                });
            }
        });

        return allTypes;
    }, [structure]);

    const filteredMaintenanceTypes = useMemo(() => {
        if (!selectedPartModelId) return [];

        const partModel = structure?.partModels?.find(pm => pm.id === selectedPartModelId);
        return partModel?.maintenanceTypes || [];
    }, [selectedPartModelId, structure]);

    const filteredUnits = useMemo(() => {
        if (!selectedPartModelId || !structure?.partModels) return [];
        const partModel = structure.partModels.find(pm => pm.id === selectedPartModelId);
        return partModel?.units || [];
    }, [selectedPartModelId, structure]);

    const handleSubmit = async () => {
        try {
            const values = await form.validateFields();
            setLoading(true);

            const maintenanceType = maintenanceTypes.find(
                mt => mt.id === values.maintenanceTypeId
            );

            const newEvent = {
                maintenanceTypeId: values.maintenanceTypeId,
                unitId: values.unitId,
                dateTime: values.dateTime.format('YYYY-MM-DDTHH:mm:ss'),
                custom: true
            };

            await onAdd(newEvent);

            message.success('Внеплановое ТО добавлено');
            form.resetFields();
            setSelectedPartModelId(null);
            onCancel();
        } catch (error) {
            console.error('Add maintenance error:', error);
            message.error('Ошибка при добавлении ТО');
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = () => {
        form.resetFields();
        setSelectedPartModelId(null);
        onCancel();
    };

    return (
        <Modal
            title="Добавить внеплановую работу ТО"
            open={visible}
            onCancel={handleCancel}
            onOk={handleSubmit}
            okText="Добавить работу"
            cancelText="Очистить"
            confirmLoading={loading}
            width={600}
        >
            <Form
                form={form}
                layout="vertical"
                initialValues={{
                    dateTime: dayjs()
                }}
            >
                <Form.Item
                    name="partModelId"
                    label="Модель детали"
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
                        }}
                        showSearch
                        optionFilterProp="children"
                    >
                        {structure?.partModels?.map(pm => (
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
                        {filteredUnits.map(unit => (
                            <Select.Option key={unit.id} value={unit.id}>
                                {unit.name} ({unit.serialNumber || unit.id.slice(0, 8)})
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="maintenanceTypeId"
                    label="Тип работы ТО"
                    rules={[{ required: true, message: 'Выберите тип работы ТО' }]}
                >
                    <Select
                        placeholder="Выберите тип работы ТО"
                        disabled={!selectedPartModelId}
                        showSearch
                        optionFilterProp="children"
                    >
                        {filteredMaintenanceTypes.map(mt => (
                            <Select.Option key={mt.id} value={mt.id}>
                                {mt.name}
                            </Select.Option>
                        ))}
                    </Select>
                </Form.Item>

                <Form.Item
                    name="dateTime"
                    label="Дата и время начала работы"
                    rules={[{ required: true, message: 'Выберите дату и время' }]}
                >
                    <DatePicker
                        showTime
                        format="DD.MM.YYYY HH:mm"
                        placeholder="19.12.2025 11:50"
                        style={{ width: '100%' }}
                    />
                </Form.Item>

                <div style={{
                    padding: 12,
                    background: '#f0f0f0',
                    borderRadius: 4,
                    color: '#595959',
                    fontSize: 13
                }}>
                    Внеплановая работа будет помечена особым образом
                </div>
            </Form>
        </Modal>
    );
};

export default AddMaintenanceModal;