import React, {useState, useMemo, useCallback} from 'react';
import { Card } from 'antd';
import Timeline from 'react-timelines';
import 'react-timelines/lib/css/style.css';
import './TimelineTab.css';
import { getContrastTextColor } from '../../utils/contrastTextColor';

const TimelineTab = ({ project }) => {
    const [zoom, setZoom] = useState(30);

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
    }, []);

    const clickTrackButton = useCallback((track) => {
        console.log('Clicked track button:', track);
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
            return { tracks: [], start: new Date('2024-01-01'), end: new Date('2024-12-31') };
        }

        let minDate = new Date('2024-01-01');
        let maxDate = new Date('2024-12-31');

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

        // Рекурсивная функция для обработки узлов
        const processNode = (node) => {
            const track = {
                id: node.id,
                title: node.name,
                elements: [],
                tracks: [],
                isOpen: true // Всегда открыт
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

            return track;
        };

        // Обработка Assembly
        const processAssembly = (assembly) => {
            const assemblyTrack = {
                id: assembly.id,
                title: assembly.name,
                elements: [],
                tracks: [],
                isOpen: true // Всегда открыт
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
                    : new Date('2024-12-31');

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
                    title: stateName, // Показываем название состояния на элементе
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
                const componentTrack = {
                    id: `${assembly.id}-${component.id}`,
                    title: component.name,
                    elements: [],
                    tracks: [],
                    isOpen: true
                };

                // Находим Unit, назначенный на этот компонент
                const unitAssignment = project.timeline?.unitAssignments?.find(
                    ua => ua.componentOfAssembly?.assemblyId === assembly.id &&
                        ua.componentOfAssembly?.componentPath?.includes(component.id)
                );

                if (unitAssignment) {
                    // Находим все MaintenanceEvent для этого Unit
                    const maintenanceEvents = project.timeline?.maintenanceEvents?.filter(
                        me => me.unitId === unitAssignment.unitId
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
                                title: maintenanceType.name, // Короткое название для отображения
                                start: eventStart,
                                end: eventEnd,
                                style: {
                                    backgroundColor: bgColor,
                                    borderRadius: '4px',
                                    color: textColor, // Контрастный цвет текста
                                    fontSize: '11px',
                                    fontWeight: '500',
                                    border: 'none'
                                },
                                dataTitle: tooltipText // Для кастомного тултипа
                            });

                            if (eventStart < minDate) minDate = eventStart;
                            if (eventEnd > maxDate) maxDate = eventEnd;
                        }
                    });
                }

                assemblyTrack.tracks.push(componentTrack);
            });

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
    }, [project]);

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
                title: new Date(2024, i, 1).toLocaleDateString('ru-RU', { month: 'long' }),
                start: new Date(2024, i, 1),
                end: new Date(2024, i + 1, 1)
            })),
            style: {}
        },
        {
            id: 'days',
            title: 'Дни',
            cells: generateDaysInRange(new Date('2024-01-01'), new Date('2024-12-31')),
            style: {}
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
                        timebar={timebar}
                        tracks={tracks}
                        now={now}
                        enableSticky
                        scrollToNow
                        customElementRenderer={customElementRenderer}
                    />
                </div>
            </Card>
        </div>
    );
};

export default TimelineTab;