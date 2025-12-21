import React, { useState, useMemo } from 'react';
import { Modal, DatePicker, Checkbox, Row, Col, Button, message, Spin } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import reportApi from '../../services/api/reportApi';

const DEFAULT_COLORS = [
    '#FB923C', '#FF99E5', '#FCD34D', '#FFD93D', '#8CE99A',
    '#FF6EC7', '#FF5733', '#FF85D3', '#E9D5FF', '#C084FC'
];

const MonthlyReportModal = ({ visible, onCancel, project, plan, structure }) => {
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(dayjs().startOf('month'));
    const [endDate, setEndDate] = useState(dayjs().endOf('month'));
    const [selectedAssemblies, setSelectedAssemblies] = useState([]);
    const [selectedComponents, setSelectedComponents] = useState([]);

    const assemblies = useMemo(() => {
        const result = [];
        if (!structure?.nodes) return result;

        const traverse = (nodes) => {
            nodes.forEach(node => {
                if (node.type === 'NODE' && node.children) {
                    traverse(node.children);
                } else if (node.type === 'ASSEMBLY') {
                    result.push({
                        id: node.id,
                        name: node.name
                    });
                }
            });
        };

        traverse(structure.nodes);
        return result;
    }, [structure]);

    const componentTypes = useMemo(() => {
        return structure?.componentTypes || [];
    }, [structure]);

    const allMaintenances = useMemo(() => {
        const result = [];
        if (!structure?.partModels) return result;

        let colorIndex = 0;
        structure.partModels.forEach(pm => {
            if (pm.maintenanceTypes) {
                pm.maintenanceTypes.forEach(mt => {
                    if (!result.find(r => r.maintenanceTypeId === mt.id)) {
                        result.push({
                            maintenanceTypeId: mt.id,
                            hexColor: mt.color || DEFAULT_COLORS[colorIndex % DEFAULT_COLORS.length]
                        });
                        colorIndex++;
                    }
                });
            }
        });

        return result;
    }, [structure]);

    const handleSelectAllAssemblies = () => {
        if (selectedAssemblies.length === assemblies.length) {
            setSelectedAssemblies([]);
        } else {
            setSelectedAssemblies(assemblies.map(a => a.id));
        }
    };

    const handleSelectAllComponents = () => {
        if (selectedComponents.length === componentTypes.length) {
            setSelectedComponents([]);
        } else {
            setSelectedComponents(componentTypes.map(c => c.id));
        }
    };

    const handleGenerate = async () => {
        if (selectedAssemblies.length === 0) {
            message.warning('Выберите хотя бы один агрегат');
            return;
        }

        if (selectedComponents.length === 0) {
            message.warning('Выберите хотя бы один тип компонента');
            return;
        }

        setLoading(true);
        try {
            const blob = await reportApi.generateMonthly(
                {
                    projectId: project.id,
                    planId: plan?.id,
                    startDate: startDate.format('YYYY-MM-DD'),
                    endDate: endDate.format('YYYY-MM-DD')
                },
                {
                    assemblies: selectedAssemblies,
                    components: selectedComponents,
                    maintenances: allMaintenances
                }
            );

            const filename = `monthly_report_${startDate.format('YYYY-MM')}.xlsx`;
            reportApi.downloadFile(blob, filename);

            message.success('Отчет успешно сгенерирован');
            onCancel();
        } catch (error) {
            console.error('Generate report error:', error);
            message.error('Ошибка при генерации отчета');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            title={
                <span>
                    <FileExcelOutlined style={{ marginRight: 8 }} />
                    Выгрузить месячный отчет
                </span>
            }
            open={visible}
            onCancel={onCancel}
            width={700}
            footer={[
                <Button key="cancel" onClick={onCancel}>
                    Отмена
                </Button>,
                <Button
                    key="generate"
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleGenerate}
                    loading={loading}
                >
                    Сгенерировать отчет
                </Button>
            ]}
        >
            <Spin spinning={loading}>
                <Row gutter={24} style={{ marginBottom: 24 }}>
                    <Col span={12}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>Дата начала:</div>
                        <DatePicker
                            value={startDate}
                            onChange={setStartDate}
                            format="YYYY-MM-DD"
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col span={12}>
                        <div style={{ marginBottom: 8, fontWeight: 500 }}>Дата окончания:</div>
                        <DatePicker
                            value={endDate}
                            onChange={setEndDate}
                            format="YYYY-MM-DD"
                            style={{ width: '100%' }}
                        />
                    </Col>
                </Row>

                <Row gutter={24}>
                    <Col span={12}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12
                        }}>
                            <span style={{ fontWeight: 500 }}>Агрегаты для отображения:</span>
                            <Button type="link" size="small" onClick={handleSelectAllAssemblies}>
                                {selectedAssemblies.length === assemblies.length ? 'Снять все' : 'Выбрать все'}
                            </Button>
                        </div>
                        <div style={{
                            border: '1px solid #d9d9d9',
                            borderRadius: 8,
                            padding: 12,
                            maxHeight: 200,
                            overflowY: 'auto'
                        }}>
                            <Checkbox.Group
                                value={selectedAssemblies}
                                onChange={setSelectedAssemblies}
                                style={{ width: '100%' }}
                            >
                                <Row>
                                    {assemblies.map(assembly => (
                                        <Col span={12} key={assembly.id} style={{ marginBottom: 8 }}>
                                            <Checkbox value={assembly.id}>
                                                {assembly.name}
                                            </Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
                            Выбрано: {selectedAssemblies.length} из {assemblies.length}
                        </div>
                    </Col>

                    <Col span={12}>
                        <div style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: 12
                        }}>
                            <span style={{ fontWeight: 500 }}>Типы компонентов:</span>
                            <Button type="link" size="small" onClick={handleSelectAllComponents}>
                                {selectedComponents.length === componentTypes.length ? 'Снять все' : 'Выбрать все'}
                            </Button>
                        </div>
                        <div style={{
                            border: '1px solid #d9d9d9',
                            borderRadius: 8,
                            padding: 12,
                            maxHeight: 200,
                            overflowY: 'auto'
                        }}>
                            <Checkbox.Group
                                value={selectedComponents}
                                onChange={setSelectedComponents}
                                style={{ width: '100%' }}
                            >
                                <Row>
                                    {componentTypes.map(ct => (
                                        <Col span={12} key={ct.id} style={{ marginBottom: 8 }}>
                                            <Checkbox value={ct.id}>
                                                {ct.name}
                                            </Checkbox>
                                        </Col>
                                    ))}
                                </Row>
                            </Checkbox.Group>
                        </div>
                        <div style={{ color: '#8c8c8c', fontSize: 12, marginTop: 8 }}>
                            Выбрано: {selectedComponents.length} из {componentTypes.length}
                        </div>
                    </Col>
                </Row>
            </Spin>
        </Modal>
    );
};

export default MonthlyReportModal;