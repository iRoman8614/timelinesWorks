import React, {useState, useMemo, useCallback} from 'react';
import { Card, Modal, Descriptions } from 'antd';
import Timeline from 'react-timelines';
import 'react-timelines/lib/css/style.css';
import './TimelineTab.css';
import { getContrastTextColor } from '../../utils/contrastTextColor';

const TimelineTab = ({ project }) => {
    const [zoom, setZoom] = useState(30);
    const [trackStates, setTrackStates] = useState({});
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedElement, setSelectedElement] = useState(null);

    const getStateColor = (stateType) => {
        const colors = {
            'WORKING': '#52c41a',
            'IDLE': '#faad14',
            'SHUTTING_DOWN': '#ff4d4f',
            'STARTING_UP': '#1890ff'
        };
        return colors[stateType] || '#d9d9d9';
    };

    const getMaintenanceColor = (maintenanceName) => {
        const colors = {
            'ТО двигателя': '#1890ff',
            'ТО компрессора': '#52c41a',
            'Замена фильтра': '#faad14',
            'Замена фильтров': '#722ed1',
            'Проверка клапанов': '#f5222d'
        };
        return colors[maintenanceName] || '#8c8c8c';
    };

    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 2, 40)); // Увеличиваем до 40
    }, []);

    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 2, 5)); // Минимум 5
    }, []);

    const clickElement = useCallback((element) => {
        console.log('Clicked element:', element);
        setSelectedElement(element);
        setIsModalOpen(true);
    }, []);

    const handleModalClose = useCallback(() => {
        setIsModalOpen(false);
        setSelectedElement(null);
    }, []);

    const formatDate = useCallback((date) => {
        if (!date) return 'Не указано';
        const d = new Date(date);
        return d.toLocaleDateString('ru-RU', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    }, []);

    const toggleTrackOpen = useCallback((track) => {
        setTrackStates(prev => ({
            ...prev,
            [track.id]: !prev[track.id]
        }));
    }, []);

    const clickTrackButton = useCallback((track) => {
        console.log('Clicked track button:', track);
        // Если нужно, можно добавить дополнительную логику здесь
    }, []);

    const customElementRenderer = useCallback(({ element, ...props }) => {
        return (
            <div
                {...props}
                data-title={element.dataTitle || element.title}
                style={{
                    ...props.style,
                    ...element.style
                }}
            >
                {element.title}
            </div>
        );
    }, []);

    const { tracks, start, end } = useMemo(() => {
        if (!project || !project.nodes) {
            return { tracks: [], start: new Date('2025-01-01'), end: new Date('2025-12-31') };
        }

        let minDate = new Date('2025-01-01');
        let maxDate = new Date('2025-12-31');

        const allTracks = [];

        // Функция для получения информации о компонентах из AssemblyType
        const getComponentsForAssembly = (assemblyTypeId) => {
            const assemblyType = project.assemblyTypes?.find(at => at.id === assemblyTypeId);
            return assemblyType?.components || [];
        };

        // Функция для получения MaintenanceType по ID
        const getMaintenanceType = (maintenanceTypeId) => {
            const allMaintenanceTypes = [];
            project.partModels?.forEach(pm => {
                if (pm.maintenanceTypes) {
                    allMaintenanceTypes.push(...pm.maintenanceTypes);
                }
            });
            return allMaintenanceTypes.find(mt => mt.id === maintenanceTypeId);
        };

        // Функция для получения информации о Unit по ID
        const getUnit = (unitId) => {
            for (const partModel of project.partModels || []) {
                const unit = partModel.units?.find(u => u.id === unitId);
                if (unit) {
                    return { ...unit, partModelName: partModel.name };
                }
            }
            return null;
        };

        // Рекурсивная функция для обработки узлов
        const processNode = (node) => {
            const track = {
                id: node.id,
                title: node.name,
                elements: [],
                tracks: []
            };

            if (node.children) {
                node.children.forEach(child => {
                    if (child.type === 'ASSEMBLY') {
                        const assemblyTrack = processAssembly(child);
                        track.tracks.push(assemblyTrack);
                    } else if (child.type === 'NODE') {
                        const childTrack = processNode(child);
                        track.tracks.push(childTrack);
                    }
                });
            }

            // Устанавливаем isOpen только если есть дочерние элементы
            if (track.tracks.length > 0) {
                track.isOpen = trackStates[node.id] !== undefined ? trackStates[node.id] : true;
            }

            return track;
        };

        // Обработка Assembly
        const processAssembly = (assembly) => {
            const assemblyTrack = {
                id: assembly.id,
                title: assembly.name,
                elements: [],
                tracks: []
            };

            // Получаем состояния агрегата
            const assemblyStates = project.timeline?.assemblyStates?.filter(
                state => state.assemblyId === assembly.id
            ) || [];

            // Добавляем состояния как фоновые элементы
            assemblyStates.forEach((state, index) => {
                const stateStart = new Date(state.dateTime);
                const stateEnd = assemblyStates[index + 1]
                    ? new Date(assemblyStates[index + 1].dateTime)
                    : new Date('2025-12-31');

                const startDateStr = stateStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                const endDateStr = stateEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                const stateNames = {
                    'WORKING': 'Работает',
                    'IDLE': 'Простой',
                    'SHUTTING_DOWN': 'Останавливается',
                    'STARTING_UP': 'Запускается'
                };
                const stateName = stateNames[state.type] || state.type;
                const tooltipText = `${stateName}\n${startDateStr} - ${endDateStr}`;

                const bgColor = getStateColor(state.type);
                const textColor = getContrastTextColor(bgColor);

                assemblyTrack.elements.push({
                    id: `state-${assembly.id}-${index}`,
                    title: stateName,
                    start: stateStart,
                    end: stateEnd,
                    style: {
                        backgroundColor: bgColor,
                        borderRadius: '4px',
                        opacity: 0.5,
                        border: 'none',
                        color: textColor,
                        fontSize: '11px',
                        fontWeight: '600'
                    },
                    dataTitle: tooltipText
                });
            });

            const components = getComponentsForAssembly(assembly.assemblyTypeId);

            components.forEach(component => {
                const componentId = `${assembly.id}-${component.id}`;
                const componentTrack = {
                    id: componentId,
                    title: component.name,
                    elements: [],
                    tracks: []
                };

               const unitAssignments = project.timeline?.unitAssignments?.filter(
                    ua => ua.componentOfAssembly?.assemblyId === assembly.id &&
                        ua.componentOfAssembly?.componentPath?.includes(component.id)
                ) || [];

                unitAssignments.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

                unitAssignments.forEach((unitAssignment, assignmentIndex) => {
                    const assignmentStart = new Date(unitAssignment.dateTime);
                    // Определяем конец периода назначения: либо дата следующего назначения, либо конец года
                    const assignmentEnd = assignmentIndex < unitAssignments.length - 1
                        ? new Date(unitAssignments[assignmentIndex + 1].dateTime)
                        : new Date('2025-12-31');

                    if (assignmentIndex > 0) {
                        const prevUnit = getUnit(unitAssignments[assignmentIndex - 1].unitId);
                        const currentUnit = getUnit(unitAssignment.unitId);
                        
                        const prevUnitName = prevUnit ? `${prevUnit.name} (${prevUnit.partModelName})` : 'Неизвестный юнит';
                        const currentUnitName = currentUnit ? `${currentUnit.name} (${currentUnit.partModelName})` : 'Неизвестный юнит';
                        
                        const replacementDateStr = assignmentStart.toLocaleDateString('ru-RU', { 
                            day: '2-digit', 
                            month: '2-digit', 
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                        });
                        
                        const replacementTooltip = `Замена юнита\nДата: ${replacementDateStr}\nС: ${prevUnitName}\nНа: ${currentUnitName}`;

                        // Добавляем маркер замены юнита (вертикальная линия)
                        // Используем минимальную длительность для отображения вертикальной линии
                        const markerEnd = new Date(assignmentStart);
                        markerEnd.setHours(markerEnd.getHours() + 1); // 1 час для видимости
                        
                        componentTrack.elements.push({
                            id: `unit-replacement-${componentId}-${assignmentIndex}`,
                            title: 'Замена',
                            start: assignmentStart,
                            end: markerEnd,
                            style: {
                                backgroundColor: '#ff9800',
                                borderRadius: '2px',
                                color: '#fff',
                                fontSize: '12px',
                                fontWeight: '700',
                                border: '3px solid #f57c00',
                                minWidth: '6px',
                                width: '6px',
                                zIndex: 100,
                                boxShadow: '0 2px 6px rgba(255,152,0,0.5)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                padding: '2px'
                            },
                            dataTitle: replacementTooltip
                        });
                    }

                    // Находим все MaintenanceEvent для этого Unit в период его назначения
                    const maintenanceEvents = project.timeline?.maintenanceEvents?.filter(
                        me => me.unitId === unitAssignment.unitId &&
                            new Date(me.dateTime) >= assignmentStart &&
                            new Date(me.dateTime) < assignmentEnd
                    ) || [];

                    maintenanceEvents.forEach(event => {
                        const maintenanceType = getMaintenanceType(event.maintenanceTypeId);
                        if (maintenanceType) {
                            const eventStart = new Date(event.dateTime);
                            const eventEnd = new Date(eventStart);
                            eventEnd.setDate(eventEnd.getDate() + maintenanceType.duration);

                            const startDateStr = eventStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
                            const endDateStr = eventEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
                            const tooltipText = `${maintenanceType.name}\n${startDateStr} - ${endDateStr}\nДлительность: ${maintenanceType.duration} дн.`;

                            const bgColor = getMaintenanceColor(maintenanceType.name);
                            const textColor = getContrastTextColor(bgColor);

                            componentTrack.elements.push({
                                id: event.maintenanceTypeId + '-' + event.dateTime,
                                title: maintenanceType.name,
                                start: eventStart,
                                end: eventEnd,
                                style: {
                                    backgroundColor: bgColor,
                                    borderRadius: '4px',
                                    color: textColor,
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    border: 'none'
                                },
                                dataTitle: tooltipText
                            });

                            if (eventStart < minDate) minDate = eventStart;
                            if (eventEnd > maxDate) maxDate = eventEnd;
                        }
                    });
                });

                assemblyTrack.tracks.push(componentTrack);
            });

            // Устанавливаем isOpen только если есть дочерние элементы
            if (assemblyTrack.tracks.length > 0) {
                assemblyTrack.isOpen = trackStates[assembly.id] !== undefined ? trackStates[assembly.id] : true;
            }

            return assemblyTrack;
        };

        project.nodes.forEach(node => {
            const track = processNode(node);
            allTracks.push(track);
        });

        return {
            tracks: allTracks,
            start: minDate,
            end: maxDate
        };
    }, [project, trackStates]);

    const now = new Date();

    // Генерация дней для timebar
    const generateDaysInRange = (startDate, endDate) => {
        const days = [];
        let currentDate = new Date(startDate);

        while (currentDate <= endDate) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + 1);

            const dayNum = currentDate.getDate();
            const monthShort = currentDate.toLocaleDateString('ru-RU', { month: 'short' });

            days.push({
                id: `day-${currentDate.getTime()}`,
                title: dayNum === 1 ? `${dayNum} ${monthShort}` : dayNum.toString(),
                start: new Date(currentDate),
                end: nextDate
            });

            currentDate = nextDate;
        }

        return days;
    };

    const timebar = [
        {
            id: 'months',
            title: 'Месяцы',
            cells: Array.from({ length: 12 }, (_, i) => ({
                id: `month-${i}`,
                title: new Date(2025, i, 1).toLocaleDateString('ru-RU', { month: 'long' }),
                start: new Date(2025, i, 1),
                end: new Date(2025, i + 1, 1)
            })),
            style: {}
        },
        {
            id: 'days',
            title: 'Дни',
            cells: generateDaysInRange(new Date('2025-01-01'), new Date('2025-12-31')),
            style: {},
            useAsGrid: true // Используем дни для генерации вертикальных линий сетки
        }
    ];

    if (!project || !project.nodes || tracks.length === 0) {
        return (
            <Card>
                <p>Нет данных для отображения таймлайна</p>
            </Card>
        );
    }

    return (
        <div className="timeline-tab">
            <Card className="timeline-chart">
                <div className="timeline-wrapper">
                    <Timeline
                        scale={{
                            start: start,
                            end: end,
                            zoom: zoom,
                        }}
                        isOpen={true}
                        zoomIn={zoomIn}
                        zoomOut={zoomOut}
                        clickElement={clickElement}
                        clickTrackButton={clickTrackButton}
                        toggleTrackOpen={toggleTrackOpen}
                        timebar={timebar}
                        tracks={tracks}
                        now={now}
                        enableSticky
                        scrollToNow
                        customElementRenderer={customElementRenderer}
                    />
                </div>
            </Card>
            <Modal
                title="Информация о работе"
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}
                width={600}
            >
                {selectedElement && (
                    <Descriptions column={1} bordered>
                        <Descriptions.Item label="Название работы">
                            {selectedElement.title || selectedElement.dataTitle || 'Не указано'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Дата начала">
                            {formatDate(selectedElement.start)}
                        </Descriptions.Item>
                        <Descriptions.Item label="Дата окончания">
                            {formatDate(selectedElement.end)}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </div>
    );
};

export default TimelineTab;