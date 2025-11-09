import React, { useState, useMemo, useCallback } from 'react';
import { Card, DatePicker, Space, Typography, Form, Select, Button, message } from 'antd';
import Timeline from 'react-timelines';
import 'react-timelines/lib/css/style.css';
import './TimelineTab.css';
import { getContrastTextColor } from '../../utils/contrastTextColor';
import { generateMaintenancePlan } from '../../utils/maintenanceScheduler';
import dayjs from 'dayjs';
import {MaintenanceEventForm} from '../Forms/index';

const DATE_FORMAT = 'YYYY-MM-DD';
const ASSIGNMENT_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const TimelineTab = ({ project, onProjectUpdate }) => {
    const [zoom, setZoom] = useState(30);
    const [assignmentForm] = Form.useForm();
    const [openTracks, setOpenTracks] = useState({});

    const timeline = project?.timeline || {};

    const currentYear = dayjs().year();
    const defaultStart = dayjs().year(currentYear).startOf('year');
    const defaultEnd = dayjs().year(currentYear).endOf('year');

    const rawTimelineStart = timeline.start ? dayjs(timeline.start) : null;
    const rawTimelineEnd = timeline.end ? dayjs(timeline.end) : null;

    const timelineStartDayjs = rawTimelineStart && rawTimelineStart.isValid()
        ? rawTimelineStart.startOf('day')
        : defaultStart;

    let timelineEndDayjs = rawTimelineEnd && rawTimelineEnd.isValid()
        ? rawTimelineEnd.startOf('day')
        : defaultEnd;

    if (timelineEndDayjs.isBefore(timelineStartDayjs)) {
        timelineEndDayjs = timelineStartDayjs;
    }

    const timelineStartKey = timelineStartDayjs.format(DATE_FORMAT);
    const timelineEndKey = timelineEndDayjs.format(DATE_FORMAT);
    const timelineStartDate = timelineStartDayjs.startOf('day').toDate();
    const timelineEndDate = timelineEndDayjs.endOf('day').toDate();

    const getStateColor = (stateType) => {
        const colors = {
            'WORKING': '#52c41a',
            'IDLE': '#faad14',
            'SHUTTING_DOWN': '#ff4d4f',
            'STARTING_UP': '#1890ff'
        };
        return colors[stateType] || '#d9d9d9';
    };

    const getMaintenanceColor = (maintenanceType) => {
        // Если есть кастомный цвет - используем его
        if (maintenanceType?.color) {
            return maintenanceType.color;
        }
        // Иначе используем цвет по умолчанию
        return '#8c8c8c';
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

    const toggleTrackOpen = useCallback((trackId) => {
        setOpenTracks(prev => ({
            ...prev,
            [trackId]: !prev[trackId]
        }));
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

    const assemblyTypeMap = useMemo(() => {
        const map = new Map();
        (project?.assemblyTypes || []).forEach(type => {
            map.set(type.id, type);
        });
        return map;
    }, [project?.assemblyTypes]);

    const assemblyOptions = useMemo(() => {
        if (!project?.nodes || project.nodes.length === 0) {
            return [];
        }

        const result = [];

        const traverseNodes = (nodes, trail = []) => {
            nodes.forEach(node => {
                if (node.type === 'ASSEMBLY') {
                    result.push({
                        value: node.id,
                        label: [...trail, node.name].join(' / '),
                        assemblyTypeId: node.assemblyTypeId
                    });
                }

                if (node.children && node.children.length > 0) {
                    const nextTrail = node.type === 'NODE' ? [...trail, node.name] : trail;
                    traverseNodes(node.children, nextTrail);
                }
            });
        };

        traverseNodes(project.nodes);
        return result;
    }, [project?.nodes]);

    const assemblyOptionMap = useMemo(() => {
        const map = new Map();
        assemblyOptions.forEach(option => {
            map.set(option.value, option);
        });
        return map;
    }, [assemblyOptions]);

    const unitOptions = useMemo(() => {
        if (!project?.partModels) {
            return [];
        }

        const options = [];
        project.partModels.forEach(partModel => {
            (partModel.units || []).forEach(unit => {
                const serial = unit.serialNumber ? ` (${unit.serialNumber})` : '';
                options.push({
                    value: unit.id,
                    label: `${unit.name}${serial} — ${partModel.name}`,
                    partModelId: unit.partModelId || partModel.id,
                    componentTypeId: partModel.componentTypeId || null
                });
            });
        });

        return options;
    }, [project?.partModels]);

    const tracks = useMemo(() => {
        if (!project || !project.nodes) {
            return [];
        }

        const fallbackTimelineEndDate = dayjs(timelineEndKey).endOf('day').toDate();

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
                isOpen: openTracks[node.id] !== false,
                toggleOpen: () => {}
            };

            if (node.children) {
                node.children.forEach(child => {
                    if (child.assemblyTypeId) {
                        const assemblyTrack = processAssembly({
                            ...child,
                            type: 'ASSEMBLY'
                        });
                        track.tracks.push(assemblyTrack);
                    } else if (child.children) {
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
                isOpen: openTracks[assembly.id] !== false,
                toggleOpen: () => {}
            };

            // Получаем состояния агрегата
            const assemblyStates = timeline.assemblyStates?.filter(
                state => state.assemblyId === assembly.id
            ) || [];

            // Добавляем состояния как фоновые элементы
            assemblyStates.forEach((state, index) => {
                const stateStart = new Date(state.dateTime);
                const stateEnd = assemblyStates[index + 1]
                    ? new Date(assemblyStates[index + 1].dateTime)
                    : fallbackTimelineEndDate;

                const startDateStr = stateStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                const endDateStr = stateEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                const stateNames = {
                    'WORKING': 'Работает',
                    'IDLE': 'Простой',
                    'SHUTTING_DOWN': 'Останавливается',
                    'STARTING_UP': 'Запусчкается'
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
                // Находим последний назначенный Unit для отображения в заголовке
                const componentAssignments = (timeline.unitAssignments || [])
                    .filter(ua =>
                        ua.componentOfAssembly?.assemblyId === assembly.id &&
                        ua.componentOfAssembly?.componentPath?.includes(component.id)
                    )
                    .sort((a, b) => new Date(b.dateTime) - new Date(a.dateTime));

                const latestAssignment = componentAssignments[0];
                let trackTitle = component.name;

                if (latestAssignment) {
                    const unitInfo = project.partModels?.flatMap(pm => pm.units || [])
                        .find(u => u.id === latestAssignment.unitId);
                    if (unitInfo) {
                        trackTitle = `${component.name} [${unitInfo.serialNumber}]`;
                    }
                }

                const componentTrack = {
                    id: `${assembly.id}-${component.id}`,
                    title: trackTitle,
                    elements: [],
                    tracks: [],
                    //isOpen: openTracks[`${assembly.id}-${component.id}`] !== false,
                    toggleOpen: () => {}
                };

                // Находим все UnitAssignments для этого компонента, отсортированные по времени
                const assignmentsForComponent = (timeline.unitAssignments || [])
                    .filter(ua =>
                        ua.componentOfAssembly?.assemblyId === assembly.id &&
                        ua.componentOfAssembly?.componentPath?.includes(component.id)
                    )
                    .sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

                // Добавляем маркеры замены юнитов
                assignmentsForComponent.forEach((assignment, index) => {
                    const assignmentDate = new Date(assignment.dateTime);

                    // Находим информацию о юните
                    const unitInfo = project.partModels?.flatMap(pm => pm.units || [])
                        .find(u => u.id === assignment.unitId);

                    if (unitInfo) {
                        const unitName = unitInfo.name || unitInfo.serialNumber || 'Unit';
                        const markerEnd = new Date(assignmentDate.getTime() + 1000 * 60 * 60); // 1 час для видимости

                        componentTrack.elements.push({
                            id: `assignment-${assignment.unitId}-${assignment.dateTime}`,
                            title: `▼ ${unitName}`,
                            start: assignmentDate,
                            end: markerEnd,
                            style: {
                                backgroundColor: '#722ed1',
                                color: '#ffffff',
                                borderRadius: '4px',
                                fontSize: '11px',
                                fontWeight: '600',
                                border: '2px solid #531dab',
                                zIndex: 10
                            },
                            dataTitle: `Замена юнита: ${unitName}\n${assignmentDate.toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                            })}`
                        });
                    }
                });

                // Определяем активный Unit для компонента на каждый период
// Определяем активный Unit для компонента на каждый период
                assignmentsForComponent.forEach((assignment, index) => {
                    const activeUnitId = assignment.unitId;

                    // Находим все MaintenanceEvent для этого Unit
                    const maintenanceEvents = timeline.maintenanceEvents?.filter(
                        me => me.unitId === activeUnitId
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

                            const bgColor = getMaintenanceColor(maintenanceType);
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
                        }
                    });
                });

// ДОБАВИТЬ ЭТОТ НОВЫЙ БЛОК - для событий с виртуальным unitId (привязанных к компоненту)
                const virtualUnitId = `component-${component.id}`;
                const componentMaintenanceEvents = timeline.maintenanceEvents?.filter(
                    me => me.unitId === virtualUnitId
                ) || [];

                componentMaintenanceEvents.forEach(event => {
                    const maintenanceType = getMaintenanceType(event.maintenanceTypeId);
                    if (maintenanceType) {
                        const eventStart = new Date(event.dateTime);
                        const eventEnd = new Date(eventStart);
                        eventEnd.setDate(eventEnd.getDate() + maintenanceType.duration);

                        const startDateStr = eventStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
                        const endDateStr = eventEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
                        const tooltipText = `${maintenanceType.name}\n${startDateStr} - ${endDateStr}\nДлительность: ${maintenanceType.duration} дн.`;

                        const bgColor = getMaintenanceColor(maintenanceType);
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
                    }
                });
                assemblyTrack.tracks.push(componentTrack);
            });

            return assemblyTrack;
        };

        project.nodes.forEach(node => {
            const track = processNode(node);
            allTracks.push(track);
        });

        return allTracks;
    }, [project, timeline, timelineEndKey, openTracks, toggleTrackOpen]);

    const now = new Date();

    const generateDaysInRange = (startDate, endDate) => {
        const days = [];
        let current = dayjs(startDate).startOf('day');
        const endDay = dayjs(endDate).startOf('day');

        while (current.isBefore(endDay) || current.isSame(endDay, 'day')) {
            const next = current.add(1, 'day');
            const currentNative = current.toDate();

            const dayNum = currentNative.getDate();
            const monthShort = currentNative.toLocaleDateString('ru-RU', { month: 'short' });

            days.push({
                id: `day-${current.valueOf()}`,
                title: dayNum === 1 ? `${dayNum} ${monthShort}` : dayNum.toString(),
                start: currentNative,
                end: next.toDate()
            });

            current = next;
        }

        return days;
    };

    const generateMonthsInRange = (startDate, endDate) => {
        const months = [];
        let current = dayjs(startDate).startOf('month');
        const endMonth = dayjs(endDate).startOf('month');
        const showYear = dayjs(startDate).year() !== dayjs(endDate).year();

        while (current.isBefore(endMonth) || current.isSame(endMonth, 'month')) {
            const next = current.add(1, 'month');
            const titleOptions = { month: 'long' };
            if (showYear) {
                titleOptions.year = 'numeric';
            }

            months.push({
                id: `month-${current.year()}-${current.month()}`,
                title: current.toDate().toLocaleDateString('ru-RU', titleOptions),
                start: current.toDate(),
                end: next.toDate()
            });

            current = next;
        }

        return months;
    };

    const timebar = useMemo(() => ([
        {
            id: 'months',
            title: 'Месяцы',
            cells: generateMonthsInRange(timelineStartDate, timelineEndDate),
            style: {}
        },
        {
            id: 'days',
            title: 'Дни',
            cells: generateDaysInRange(timelineStartDate, timelineEndDate),
            style: {}
        }
    ]), [timelineStartKey, timelineEndKey]);

    const handleStartChange = useCallback((value) => {
        if (!value || !project || !onProjectUpdate) {
            return;
        }

        const normalizedStart = value.startOf('day');
        const newStart = normalizedStart.format(DATE_FORMAT);

        const existingEnd = timeline.end ? dayjs(timeline.end) : null;
        const normalizedEnd = existingEnd && existingEnd.isValid() && !existingEnd.isBefore(normalizedStart)
            ? existingEnd.startOf('day')
            : normalizedStart;
        const newEnd = normalizedEnd.format(DATE_FORMAT);

        if (timeline.start === newStart && timeline.end === newEnd) {
            return;
        }

        onProjectUpdate({
            ...project,
            timeline: {
                ...timeline,
                start: newStart,
                end: newEnd,
                assemblyStates: timeline.assemblyStates || [],
                unitAssignments: timeline.unitAssignments || [],
                maintenanceEvents: timeline.maintenanceEvents || []
            }
        });
    }, [onProjectUpdate, project, timeline]);

    const handleEndChange = useCallback((value) => {
        if (!value || !project || !onProjectUpdate) {
            return;
        }

        const normalizedEnd = value.startOf('day');
        const newEnd = normalizedEnd.format(DATE_FORMAT);

        const existingStart = timeline.start ? dayjs(timeline.start) : null;
        const normalizedStart = existingStart && existingStart.isValid() && !normalizedEnd.isBefore(existingStart)
            ? existingStart.startOf('day')
            : normalizedEnd;
        const newStart = normalizedStart.format(DATE_FORMAT);

        if (timeline.start === newStart && timeline.end === newEnd) {
            return;
        }

        onProjectUpdate({
            ...project,
            timeline: {
                ...timeline,
                start: newStart,
                end: newEnd,
                assemblyStates: timeline.assemblyStates || [],
                unitAssignments: timeline.unitAssignments || [],
                maintenanceEvents: timeline.maintenanceEvents || []
            }
        });
    }, [onProjectUpdate, project, timeline]);

    const hasTimelineData = Boolean(project) && Array.isArray(tracks) && tracks.length > 0;
    const scaleEnd = timelineEndDate <= timelineStartDate
        ? dayjs(timelineStartDate).add(1, 'day').toDate()
        : timelineEndDate;

    const handleAssignmentSubmit = useCallback((values) => {
        if (!project || !onProjectUpdate) {
            return;
        }

        const selectedAssemblyOption = assemblyOptionMap.get(values.assemblyId);
        const assemblyType = selectedAssemblyOption
            ? assemblyTypeMap.get(selectedAssemblyOption.assemblyTypeId)
            : null;
        const component = assemblyType?.components?.find(c => c.id === values.componentId);
        const componentTypeId = component?.componentTypeId || null;

        const selectedUnit = unitOptions.find(option => option.value === values.unitId);

        if (!component) {
            message.error('Не удалось определить тип компонента. Проверьте конфигурацию.');
            return;
        }

        if (!selectedUnit) {
            message.error('Выберите деталь для назначения.');
            return;
        }

        if (componentTypeId && selectedUnit.componentTypeId && selectedUnit.componentTypeId !== componentTypeId) {
            message.error('Деталь не подходит к выбранному компоненту.');
            return;
        }

        if (componentTypeId && !selectedUnit.componentTypeId) {
            message.warning('Деталь назначена, но у модели не настроен тип компонента. Рекомендуется обновить модель.');
        }

        const assignment = {
            unitId: values.unitId,
            componentOfAssembly: {
                assemblyId: values.assemblyId,
                componentPath: [values.componentId]
            },
            dateTime: values.dateTime
                ? values.dateTime.format(ASSIGNMENT_DATETIME_FORMAT)
                : dayjs().format(ASSIGNMENT_DATETIME_FORMAT)
        };

        const existingAssignments = timeline.unitAssignments || [];
        const updatedAssignments = [...existingAssignments, assignment]
            .sort((a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf());

        onProjectUpdate({
            ...project,
            timeline: {
                ...timeline,
                start: timeline.start || timelineStartKey,
                end: timeline.end || timelineEndKey,
                assemblyStates: timeline.assemblyStates || [],
                unitAssignments: updatedAssignments,
                maintenanceEvents: timeline.maintenanceEvents || []
            }
        });

        assignmentForm.resetFields();
        message.success('Назначение детали добавлено');
    }, [assignmentForm, assemblyOptionMap, assemblyTypeMap, onProjectUpdate, project, timeline, timelineEndKey, timelineStartKey, unitOptions]);

    const handleMaintenanceEventSubmit = useCallback((values) => {
        if (!project || !onProjectUpdate) {
            return;
        }

        const event = {
            maintenanceTypeId: values.maintenanceTypeId,
            unitId: values.unitId,
            dateTime: values.dateTime,
            custom: true
        };

        const existingEvents = timeline.maintenanceEvents || [];
        const updatedEvents = [...existingEvents, event]
            .sort((a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf());

        onProjectUpdate({
            ...project,
            timeline: {
                ...timeline,
                start: timeline.start || timelineStartKey,
                end: timeline.end || timelineEndKey,
                assemblyStates: timeline.assemblyStates || [],
                unitAssignments: timeline.unitAssignments || [],
                maintenanceEvents: updatedEvents
            }
        });
    }, [onProjectUpdate, project, timeline, timelineEndKey, timelineStartKey]);

    const hasAssemblies = assemblyOptions.length > 0;
    const hasUnits = unitOptions.some(option => option.componentTypeId);
    const assignmentDisabled = !hasAssemblies;
    const showUnitsHint = hasAssemblies && !hasUnits;

    const handleClearTimeline = useCallback(() => {
        if (!project || !onProjectUpdate) {
            return;
        }

        onProjectUpdate({
            ...project,
            timeline: {
                start: '2025-01-01',
                end: '2025-12-31',
                assemblyStates: [],
                unitAssignments: [],
                maintenanceEvents: []
            }
        });

        message.success('Таймлайн очищен');
    }, [project, onProjectUpdate]);

    const handleGeneratePlan = useCallback(() => {
        if (!project || !onProjectUpdate) {
            return;
        }

        try {
            const newTimeline = generateMaintenancePlan(project);

            onProjectUpdate({
                ...project,
                timeline: newTimeline
            });

            message.success('План ТО сгенерирован');
        } catch (error) {
            console.error('Ошибка генерации плана:', error);
            message.error('Ошибка при генерации плана ТО');
        }
    }, [project, onProjectUpdate]);


    return (
        <div className="timeline-tab">
            <Card className="timeline-controls-card">
                <div className="timeline-range-controls">
                    <Typography.Text className="timeline-range-label">Период отображения:</Typography.Text>
                    <Space size="middle">
                        <Space direction="vertical" size={4}>
                            <Typography.Text type="secondary">Начало</Typography.Text>
                            <DatePicker
                                value={timelineStartDayjs}
                                onChange={handleStartChange}
                                format={DATE_FORMAT}
                                allowClear={false}
                            />
                        </Space>
                        <Space direction="vertical" size={4}>
                            <Typography.Text type="secondary">Окончание</Typography.Text>
                            <DatePicker
                                value={timelineEndDayjs}
                                onChange={handleEndChange}
                                format={DATE_FORMAT}
                                allowClear={false}
                            />
                        </Space>
                    </Space>
                </div>
            </Card>
            <Card className="timeline-assignment-card">
                <Typography.Text className="timeline-assignment-title">Назначить деталь компоненту</Typography.Text>
                <Form
                    form={assignmentForm}
                    layout="vertical"
                    onFinish={handleAssignmentSubmit}
                    className="timeline-assignment-form"
                    disabled={assignmentDisabled}
                >
                    <Form.Item
                        name="assemblyId"
                        label="Агрегат"
                        rules={[{ required: true, message: 'Выберите агрегат' }]}
                    >
                        <Select
                            placeholder={assignmentDisabled ? 'Нет доступных агрегатов' : 'Выберите агрегат'}
                            options={assemblyOptions}
                            showSearch
                            optionFilterProp="label"
                        />
                    </Form.Item>
                    <Form.Item
                        shouldUpdate={(prev, curr) => prev.assemblyId !== curr.assemblyId}
                        noStyle
                    >
                        {({ getFieldValue, setFieldsValue }) => {
                            const selectedAssemblyId = getFieldValue('assemblyId');
                            const selectedAssembly = assemblyOptions.find(option => option.value === selectedAssemblyId);
                            const components = selectedAssembly
                                ? (assemblyTypeMap.get(selectedAssembly.assemblyTypeId)?.components || [])
                                : [];
                            const hasComponents = components.length > 0;
                            const componentPlaceholder = assignmentDisabled
                                ? 'Компоненты недоступны'
                                : selectedAssembly
                                    ? hasComponents
                                        ? 'Выберите компонент'
                                        : 'У агрегата нет компонентов'
                                    : 'Сначала выберите агрегат';

                            if (!components.some(component => component.id === getFieldValue('componentId'))) {
                                setFieldsValue({ componentId: undefined, unitId: undefined });
                            }

                            return (
                                <Form.Item
                                    name="componentId"
                                    label="Компонент"
                                    rules={[{ required: true, message: 'Выберите компонент' }]}
                                >
                                    <Select
                                        placeholder={componentPlaceholder}
                                        disabled={!selectedAssembly || !hasComponents}
                                        options={components.map(component => ({
                                            value: component.id,
                                            label: component.name
                                        }))}
                                        showSearch
                                        optionFilterProp="label"
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                    <Form.Item
                        shouldUpdate={(prev, curr) =>
                            prev.assemblyId !== curr.assemblyId ||
                            prev.componentId !== curr.componentId
                        }
                        noStyle
                    >
                        {({ getFieldValue }) => {
                            const assemblyId = getFieldValue('assemblyId');
                            const componentId = getFieldValue('componentId');
                            const assemblyOption = assemblyOptionMap.get(assemblyId);
                            const assemblyType = assemblyOption
                                ? assemblyTypeMap.get(assemblyOption.assemblyTypeId)
                                : null;
                            const component = assemblyType?.components?.find(c => c.id === componentId);
                            const componentTypeId = component?.componentTypeId || null;

                            const compatibleUnits = unitOptions.filter(option => {
                                if (!componentTypeId) {
                                    return true;
                                }
                                if (option.componentTypeId == null) {
                                    return true; // детали без типа доступны, но лучше перенастроить
                                }
                                return option.componentTypeId === componentTypeId;
                            });

                            return (
                                <Form.Item
                                    name="unitId"
                                    label="Деталь"
                                    rules={[{ required: true, message: 'Выберите деталь' }]}
                                >
                                    <Select
                                        placeholder={
                                            assignmentDisabled
                                                ? 'Детали недоступны'
                                                : component
                                                    ? (compatibleUnits.length > 0
                                                        ? 'Выберите деталь'
                                                        : 'Для компонента нет доступных деталей')
                                                    : 'Сначала выберите компонент'
                                        }
                                        disabled={!component || compatibleUnits.length === 0}
                                        options={compatibleUnits}
                                        showSearch
                                        optionFilterProp="label"
                                    />
                                </Form.Item>
                            );
                        }}
                    </Form.Item>
                    <Form.Item
                        name="dateTime"
                        label="Дата и время назначения"
                        rules={[{ required: true, message: 'Укажите дату и время' }]}
                    >
                        <DatePicker
                            showTime={{ format: 'HH:mm' }}
                            format="YYYY-MM-DD HH:mm"
                            style={{ width: '100%' }}
                        />
                    </Form.Item>
                    <Form.Item>
                        <Button type="primary" htmlType="submit" block>
                            Добавить назначение
                        </Button>
                    </Form.Item>
                </Form>
                {assignmentDisabled && (
                    <Typography.Text type="secondary">
                        Чтобы добавить назначение, сначала создайте агрегаты с компонентами в конфигураторе проекта.
                    </Typography.Text>
                )}
                {showUnitsHint && !assignmentDisabled && (
                    <Typography.Text type="secondary">
                        Для выбранных типов компонентов создайте подходящие детали в разделе моделей, чтобы их можно было назначить.
                    </Typography.Text>
                )}
            </Card>
            <Card className="timeline-assignment-card">
                <Typography.Text className="timeline-assignment-title">Добавить внеплановую работу</Typography.Text>
                <MaintenanceEventForm
                    project={project}
                    onSubmit={handleMaintenanceEventSubmit}
                />
            </Card>
            <Card className="timeline-controls-card">
                <Space>
                    <Button
                        type="primary"
                        onClick={handleGeneratePlan}
                    >
                        Сгенерировать план ТО
                    </Button>
                    <Button
                        danger
                        onClick={handleClearTimeline}
                    >
                        Очистить таймлайн
                    </Button>
                </Space>
            </Card>
            <Card className="timeline-chart">
                {hasTimelineData ? (
                    <div className="timeline-wrapper">
                        <Timeline
                            scale={{
                                start: timelineStartDate,
                                end: scaleEnd,
                                zoom: zoom,
                            }}
                            zoomIn={zoomIn}
                            zoomOut={zoomOut}
                            clickElement={clickElement}
                            timebar={timebar}
                            tracks={tracks}
                            now={now}
                            enableSticky
                            scrollToNow
                            customElementRenderer={customElementRenderer}
                        />
                    </div>
                ) : (
                    <div className="timeline-empty-state">
                        <Typography.Text type="secondary">
                            Нет данных для отображения таймлайна
                        </Typography.Text>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default TimelineTab;