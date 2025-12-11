import React, {useState, useMemo, useCallback} from 'react';
import { Modal, DatePicker, Row, Col, Checkbox, Button, message, Typography, Alert } from 'antd';
import { FileExcelOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Title } = Typography;

/**
 * Модальное окно для генерации месячного отчета
 *
 * @param {Object} props
 * @param {boolean} props.visible - Видимость модального окна
 * @param {Function} props.onClose - Callback для закрытия
 * @param {Object} props.project - Текущий проект
 * @param {string|null} props.planId - ID активного плана (null для исторического таймлайна)
 * @param {Object} props.activePlan - Активный план с датами startTime и endTime
 * @param {Function} props.onGenerate - Callback для генерации отчета
 */
const MonthlyReportModal = ({ visible, onClose, project, planId, activePlan, onGenerate }) => {
    const [startDate, setStartDate] = useState(dayjs().startOf('month'));
    const [endDate, setEndDate] = useState(dayjs().endOf('month'));
    const [selectedAssemblies, setSelectedAssemblies] = useState([]);
    const [selectedComponents, setSelectedComponents] = useState([]);
    const [isGenerating, setIsGenerating] = useState(false);

    // Получаем даты плана
    const planStartDate = activePlan?.startTime ? dayjs(activePlan.startTime) : null;
    const planEndDate = activePlan?.endTime ? dayjs(activePlan.endTime) : null;

    // Извлекаем все assembly из структуры проекта
    const assemblies = useMemo(() => {
        if (!project || !project.nodes) return [];

        const result = [];

        const extractAssemblies = (nodes) => {
            nodes.forEach(node => {
                // NODE может содержать дочерние ASSEMBLY
                if (node.type === 'NODE' && node.children) {
                    extractAssemblies(node.children);
                }
                // ASSEMBLY - это то что нам нужно
                else if (node.type === 'ASSEMBLY' || node.assemblyTypeId) {
                    result.push({
                        id: node.id,
                        name: node.name || `Агрегат ${node.id}`,
                        assemblyTypeId: node.assemblyTypeId
                    });

                    // Рекурсивно проверяем дочерние узлы (на случай вложенных ASSEMBLY)
                    if (node.children && node.children.length > 0) {
                        extractAssemblies(node.children);
                    }
                }
            });
        };

        extractAssemblies(project.nodes);
        return result;
    }, [project]);

    // Извлекаем все типы компонентов из конфигуратора проекта
    const componentTypes = useMemo(() => {
        if (!project || !project.componentTypes) return [];

        // Используем componentTypes напрямую из проекта
        return project.componentTypes.map(ct => ({
            id: ct.id,
            name: ct.name || `Тип компонента ${ct.id}`,
            description: ct.description || ''
        }));
    }, [project]);

    // Генерация яркого случайного цвета (красный, желтый, зеленый, голубой, оранжевый, розовый)
    const generateBrightColor = useCallback(() => {
        const brightColors = [
            '#FF5733', '#FF6B6B', '#FF8C42', '#FFA07A', // Красные/Оранжевые
            '#FFD93D', '#FFC947', '#FFE66D', '#FFEB99', // Желтые
            '#6BCF7F', '#51CF66', '#69DB7C', '#8CE99A', // Зеленые
            '#4ECDC4', '#45B7D1', '#4FC3F7', '#67E8F9', // Голубые
            '#FF6EC7', '#FF85D3', '#FF99E5', '#FFB3F0', // Розовые
            '#A78BFA', '#C084FC', '#D8B4FE', '#E9D5FF', // Фиолетовые
            '#FB923C', '#FDBA74', '#FCD34D', '#FDE047', // Оранжево-желтые
        ];
        return brightColors[Math.floor(Math.random() * brightColors.length)];
    }, []);

    // Получаем maintenances с hex цветами из partModels
    const maintenancesMap = useMemo(() => {
        if (!project || !project.partModels) return {};

        const map = {};

        // Проходим по всем partModels
        project.partModels.forEach(partModel => {
            if (partModel.maintenanceTypes && Array.isArray(partModel.maintenanceTypes)) {
                // Собираем все maintenance types из всех моделей
                partModel.maintenanceTypes.forEach(mt => {
                    if (mt.id && !map[mt.id]) { // Проверяем что еще не добавили
                        if (mt.color) {
                            // Если есть цвет в конфигураторе - используем его
                            map[mt.id] = mt.color;
                        } else {
                            // Если цвета нет - генерируем яркий случайный
                            map[mt.id] = generateBrightColor();
                        }
                    }
                });
            }
        });

        return map;
    }, [project, generateBrightColor]);

    const handleAssemblyChange = (checkedValues) => {
        setSelectedAssemblies(checkedValues);
    };

    const handleComponentChange = (checkedValues) => {
        setSelectedComponents(checkedValues);
    };

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
        // Валидация
        if (!startDate || !endDate) {
            message.warning('Выберите даты начала и окончания');
            return;
        }

        if (endDate.isBefore(startDate)) {
            message.error('Дата окончания не может быть раньше даты начала');
            return;
        }

        if (planStartDate && planEndDate) {
            if (startDate.isBefore(planStartDate, 'day')) {
                message.error(`Дата начала отчета не может быть раньше даты начала плана (${planStartDate.format('DD.MM.YYYY')})`);
                return;
            }

            if (endDate.isAfter(planEndDate, 'day')) {
                message.error(`Дата окончания отчета не может быть позже даты окончания плана (${planEndDate.format('DD.MM.YYYY')})`);
                return;
            }
        }

        if (selectedAssemblies.length === 0) {
            message.warning('Выберите хотя бы один агрегат');
            return;
        }

        if (selectedComponents.length === 0) {
            message.warning('Выберите хотя бы один тип компонента');
            return;
        }

        try {
            setIsGenerating(true);

            // ✅ ПРЕОБРАЗУЕМ maintenancesMap (объект) в массив объектов для бэкенда
            const maintenancesArray = Object.entries(maintenancesMap).map(([maintenanceTypeId, hexColor]) => ({
                maintenanceTypeId: maintenanceTypeId,
                hexColor: hexColor
            }));

            await onGenerate({
                startDate: startDate.format('YYYY-MM-DD'),
                endDate: endDate.format('YYYY-MM-DD'),
                assemblies: selectedAssemblies,
                components: selectedComponents,
                maintenances: maintenancesArray  // ← Массив объектов вместо объекта
            });

            message.success('Отчет успешно сгенерирован');
            handleClose();
        } catch (error) {
            console.error('Ошибка генерации отчета:', error);
            message.error('Не удалось сгенерировать отчет: ' + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleClose = () => {
        // Сброс состояния при закрытии
        setStartDate(dayjs().startOf('month'));
        setEndDate(dayjs().endOf('month'));
        setSelectedAssemblies([]);
        setSelectedComponents([]);
        setIsGenerating(false);
        onClose();
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
            onCancel={handleClose}
            width={900}
            footer={[
                <Button key="cancel" onClick={handleClose} disabled={isGenerating}>
                    Отмена
                </Button>,
                <Button
                    key="generate"
                    type="primary"
                    icon={<FileExcelOutlined />}
                    onClick={handleGenerate}
                    loading={isGenerating}
                >
                    Сгенерировать отчет
                </Button>
            ]}
        >
            {/*{planStartDate && planEndDate && (*/}
            {/*    <Alert*/}
            {/*        message="Диапазон дат плана"*/}
            {/*        description={`Период действия плана: ${planStartDate.format('DD.MM.YYYY')} - ${planEndDate.format('DD.MM.YYYY')}`}*/}
            {/*        type="info"*/}
            {/*        showIcon*/}
            {/*        style={{ marginBottom: 16 }}*/}
            {/*    />*/}
            {/*)}*/}

            {/* Даты */}
            <Row gutter={16} style={{ marginBottom: 24 }}>
                <Col span={12}>
                    <Typography.Text strong>Дата начала:</Typography.Text>
                    <DatePicker
                        value={startDate}
                        onChange={setStartDate}
                        format="YYYY-MM-DD"
                        style={{ width: '100%', marginTop: 8 }}
                        placeholder="Выберите дату начала"
                        disabledDate={(current) => {
                            if (!current) return false;
                            if (planStartDate && current.isBefore(planStartDate, 'day')) {
                                return true;
                            }
                            if (planEndDate && current.isAfter(planEndDate, 'day')) {
                                return true;
                            }
                            return false;
                        }}
                    />
                </Col>
                <Col span={12}>
                    <Typography.Text strong>Дата окончания:</Typography.Text>
                    <DatePicker
                        value={endDate}
                        onChange={setEndDate}
                        format="YYYY-MM-DD"
                        style={{ width: '100%', marginTop: 8 }}
                        placeholder="Выберите дату окончания"
                        disabledDate={(current) => {
                            if (!current) return false;
                            if (startDate && current.isBefore(startDate, 'day')) {
                                return true;
                            }
                            if (planStartDate && current.isBefore(planStartDate, 'day')) {
                                return true;
                            }
                            if (planEndDate && current.isAfter(planEndDate, 'day')) {
                                return true;
                            }
                            return false;
                        }}
                    />
                </Col>
            </Row>

            {/* Выбор агрегатов и компонентов */}
            <Row gutter={16}>
                {/* Колонка с агрегатами */}
                <Col span={12}>
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={5} style={{ margin: 0 }}>
                            Агрегаты для отображения:
                        </Title>
                        <Button
                            type="link"
                            size="small"
                            onClick={handleSelectAllAssemblies}
                        >
                            {selectedAssemblies.length === assemblies.length ? 'Снять все' : 'Выбрать все'}
                        </Button>
                    </div>
                    <div
                        style={{
                            border: '1px solid #d9d9d9',
                            borderRadius: 4,
                            padding: 12,
                            maxHeight: 400,
                            overflowY: 'auto'
                        }}
                    >
                        <Checkbox.Group
                            value={selectedAssemblies}
                            onChange={handleAssemblyChange}
                            style={{ width: '100%' }}
                        >
                            {assemblies.length === 0 ? (
                                <Typography.Text type="secondary">Агрегаты не найдены</Typography.Text>
                            ) : (
                                assemblies.map(assembly => (
                                    <div key={assembly.id} style={{ marginBottom: 8 }}>
                                        <Checkbox value={assembly.id}>
                                            {assembly.name}
                                        </Checkbox>
                                    </div>
                                ))
                            )}
                        </Checkbox.Group>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                        Выбрано: {selectedAssemblies.length} из {assemblies.length}
                    </Typography.Text>
                </Col>

                {/* Колонка с типами компонентов */}
                <Col span={12}>
                    <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Title level={5} style={{ margin: 0 }}>
                            Типы компонентов:
                        </Title>
                        <Button
                            type="link"
                            size="small"
                            onClick={handleSelectAllComponents}
                        >
                            {selectedComponents.length === componentTypes.length ? 'Снять все' : 'Выбрать все'}
                        </Button>
                    </div>
                    <div
                        style={{
                            border: '1px solid #d9d9d9',
                            borderRadius: 4,
                            padding: 12,
                            maxHeight: 400,
                            overflowY: 'auto'
                        }}
                    >
                        <Checkbox.Group
                            value={selectedComponents}
                            onChange={handleComponentChange}
                            style={{ width: '100%' }}
                        >
                            {componentTypes.length === 0 ? (
                                <Typography.Text type="secondary">Типы компонентов не найдены</Typography.Text>
                            ) : (
                                componentTypes.map(componentType => (
                                    <div key={componentType.id} style={{ marginBottom: 8 }}>
                                        <Checkbox value={componentType.id}>
                                            {componentType.name}
                                        </Checkbox>
                                    </div>
                                ))
                            )}
                        </Checkbox.Group>
                    </div>
                    <Typography.Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
                        Выбрано: {selectedComponents.length} из {componentTypes.length}
                    </Typography.Text>
                </Col>
            </Row>
        </Modal>
    );
};

export default MonthlyReportModal;