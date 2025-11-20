import React, {useState, useMemo, useCallback, useEffect} from 'react';
import { Card, DatePicker, Space, Typography, Form, Select, Button, message, InputNumber, Checkbox, Progress, Alert, Descriptions } from 'antd';
import { LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Timeline from 'react-timelines';
import 'react-timelines/lib/css/style.css';
import './TimelineTab.css';
import { getContrastTextColor } from '../../utils/contrastTextColor';
import { useFluxTimelineGeneration } from '../../hooks/useFluxTimelineGeneraion';
import dayjs from 'dayjs';
import { MaintenanceEventForm } from '../Forms/index';
import { dataService } from '../../services/dataService';


const DATE_FORMAT = 'YYYY-MM-DD';
const ASSIGNMENT_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const TimelineTab = ({ project, onProjectUpdate, apiBaseUrl = '/api' }) => {
    const [zoom, setZoom] = useState(30);
    const [assignmentForm] = Form.useForm();
    const [openTracks, setOpenTracks] = useState({});
    const [includeOperatingInterval, setIncludeOperatingInterval] = useState(false);
    const [forceRenderKey, setForceRenderKey] = useState(0);
    const [selectedElement, setSelectedElement] = useState(null);

    // Flux генерация
    const {
        isGenerating,
        progress,
        error: fluxError,
        generatePlan,
        cancelGeneration,
        clearError
    } = useFluxTimelineGeneration();

    const timeline = project?.timeline || {};

    const projectStart = timeline?.start || project?.start;
    const projectEnd = timeline?.end || project?.end;

    const currentYear = dayjs().year();
    const defaultStart = dayjs().year(currentYear).startOf('year');
    const defaultEnd = dayjs().year(currentYear).endOf('year');

    const rawTimelineStart = projectStart ? dayjs(projectStart) : null;
    const rawTimelineEnd = projectEnd ? dayjs(projectEnd) : null;

    const timelineStartDayjs = rawTimelineStart && rawTimelineStart.isValid()
        ? rawTimelineStart.startOf('day')
        : defaultStart;

    let timelineEndDayjs = rawTimelineEnd && rawTimelineEnd.isValid()
        ? rawTimelineEnd.startOf('day')
        : defaultEnd;

    if (timelineEndDayjs.isBefore(timelineStartDayjs)) {
        timelineEndDayjs = timelineStartDayjs;
    }

    const timelineEndKey = timelineEndDayjs.format(DATE_FORMAT);
    const timelineStartDate = timelineStartDayjs.startOf('day').toDate();
    const timelineEndDate = timelineEndDayjs.endOf('day').toDate();

    React.useEffect(() => {
        if (fluxError) {
            message.error(fluxError);
        }
    }, [fluxError]);

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
        if (maintenanceType?.color) {
            return maintenanceType.color;
        }
        return '#8c8c8c';
    };

    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 2, 40));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 2, 5));
    }, []);

    const clickElement = useCallback((element) => {
        console.log('Clicked element:', element);

        if (
            element?.meta &&
            ['unitAssignment', 'maintenanceEvent', 'assemblyState'].includes(element.meta.kind)
        ) {
            setSelectedElement(element);
        }
    }, []);

    //
    // const toggleTrackOpen = useCallback((trackId) => {
    //     setOpenTracks(prev => ({
    //         ...prev,
    //         [trackId]: !prev[trackId]
    //     }));
    // }, []);

    const toggleTrackOpen = useCallback((track) => {
        setOpenTracks(prev => {
            const wasOpen = prev[track.id] !== false; // по умолчанию открыт
            return {
                ...prev,
                [track.id]: !wasOpen,
            };
        });
    }, []);


    const clickTrackButton = useCallback(
        (track) => {
            console.log('Clicked track button:', track);
            toggleTrackOpen(track);
        },
        [toggleTrackOpen]
    );


    // const customElementRenderer = useCallback(({ element, ...props }) => {
    //     return (
    //         <div
    //             {...props}
    //             data-title={element.dataTitle || element.title}
    //             style={{
    //                 ...props.style,
    //                 ...element.style
    //             }}
    //         >
    //             {element.title}
    //         </div>
    //     );
    // }, []);

    const customElementRenderer = useCallback(
        ({ element, ...props }) => {
            const handleDoubleClick = (e) => {
                e.stopPropagation();

                if (
                    element.meta &&
                    (element.meta.kind === 'unitAssignment' ||
                        element.meta.kind === 'maintenanceEvent')
                ) {
                    setSelectedElement(element);
                }
            };

            const isInteractive =
                element.meta &&
                (element.meta.kind === 'unitAssignment' ||
                    element.meta.kind === 'maintenanceEvent');

            return (
                <div
                    {...props}
                    onDoubleClick={handleDoubleClick}
                    data-title={element.dataTitle || element.title}
                    style={{
                        ...props.style,
                        ...element.style,
                        cursor: isInteractive ? 'pointer' : props.style?.cursor,
                    }}
                >
                    {element.title}
                </div>
            );
        },
        []
    );



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

    // Функция для получения MaintenanceType по ID
    const getMaintenanceType = useCallback((maintenanceTypeId) => {
        const allMaintenanceTypes = [];
        project?.partModels?.forEach(pm => {
            if (pm.maintenanceTypes) {
                allMaintenanceTypes.push(...pm.maintenanceTypes);
            }
        });
        return allMaintenanceTypes.find(mt => mt.id === maintenanceTypeId);
    }, [project?.partModels]);

    const normalizeUnitId = (unitId) => {
        console.log('unitId', unitId)
        if (typeof unitId !== 'string') return unitId;
        return unitId.startsWith('component-')
            ? unitId.replace('component-', '')
            : unitId;
    };

    const getUnitById = useCallback((unitId) => {
        const cleanId = normalizeUnitId(unitId);

        return project?.partModels
            ?.flatMap(pm => pm.units || [])
            .find(u => u.id === cleanId);
    }, [project?.partModels]);

    // Функция для получения Assembly по ID
    const getAssegetmblyById = useCallback((assemblyId) => {
        const findAssembly = (nodes) => {
            for (const node of nodes) {
                if (node.id === assemblyId) {
                    return node;
                }
                if (node.children) {
                    const found = findAssembly(node.children);
                    if (found) return found;
                }
            }
            return null;
        };
        return findAssembly(project?.nodes || []);
    }, [project?.nodes]);

    // НОВАЯ ЛОГИКА: Строим треки только из данных timeline
    const tracks = useMemo(() => {

        console.log(
            '🧩 build tracks',
            {
                assemblyStates: timeline.assemblyStates?.length || 0,
                unitAssignments: timeline.unitAssignments?.length || 0,
                maintenanceEvents: timeline.maintenanceEvents?.length || 0
            }
        );

        if (!project || !project.nodes || project.nodes.length === 0) {
            return [];
        }

        const fallbackTimelineEndDate = dayjs(timelineEndKey).endOf('day').toDate();
        const allTracks = [];

        // Функция для получения компонентов из AssemblyType
        const getComponentsForAssembly = (assemblyTypeId) => {
            const assemblyType = project.assemblyTypes?.find(at => at.id === assemblyTypeId);
            return assemblyType?.components || [];
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
                    if (child.type === 'ASSEMBLY' || child.assemblyTypeId) {
                        const assemblyTrack = processAssembly(child);
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

            // Получаем состояния агрегата (если есть)
            const assemblyStates = timeline.assemblyStates?.filter(
                state => state.assemblyId === assembly.id
            ) || [];

            // Добавляем состояния как фоновые элементы
            if (assemblyStates.length > 0) {
                assemblyStates.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));
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
                        'SHUTTING_DOWN': 'Останов',
                        'STARTING_UP': 'Запуск'
                    };

                    assemblyTrack.elements.push({
                        id: `state-${assembly.id}-${index}`,
                        title: `${stateNames[state.type] || state.type}`,
                        dataTitle: `${stateNames[state.type] || state.type}: ${startDateStr} - ${endDateStr}`,
                        start: stateStart,
                        end: stateEnd,
                        style: {
                            backgroundColor: getStateColor(state.type),
                            color: getContrastTextColor(getStateColor(state.type)),
                            border: 'none',
                            borderRadius: '4px',
                            opacity: 0.3
                        },
                        meta: {
                            kind: 'assemblyState',
                            state,
                            assembly,
                        },
                    });
                });
            }

            // Получаем компоненты агрегата
            const components = getComponentsForAssembly(assembly.assemblyTypeId);

            // Создаем треки для каждого компонента
            components.forEach(component => {
                const componentTrack = {
                    id: `${assembly.id}-${component.id}`,
                    title: component.name,
                    elements: [],
                    tracks: [],
                    isOpen: true,
                    toggleOpen: () => {}
                };

                // Получаем все unitAssignments для этого компонента
                const componentAssignments = timeline.unitAssignments?.filter(ua =>
                    ua.componentOfAssembly?.assemblyId === assembly.id &&
                    ua.componentOfAssembly?.componentPath?.includes(component.id)
                ) || [];

                // Сортируем по дате
                componentAssignments.sort((a, b) =>
                    new Date(a.dateTime) - new Date(b.dateTime)
                );

                // Добавляем unitAssignments как метки (точки на таймлайне)
                componentAssignments.forEach((assignment, index) => {
                    const assignmentDate = new Date(assignment.dateTime);
                    const unit = getUnitById(assignment.unitId);

                    if (unit) {
                        const dateStr = assignmentDate.toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                        });

                        const operatingIntervalText = assignment.operatingInterval
                            ? ` | Наработка: ${assignment.operatingInterval} ч`
                            : '';

                        // Метка - очень короткий интервал (1 час)
                        const markerEnd = new Date(assignmentDate.getTime() + 60 * 60 * 1000);

                        componentTrack.elements.push({
                            id: `assignment-${assignment.unitId}-${index}`,
                            title: '◆',
                            dataTitle: `Замена: ${unit.name} (${unit.serialNumber || 'б/н'}) - ${dateStr}${operatingIntervalText}`,
                            start: assignmentDate,
                            end: markerEnd,
                            style: {
                                backgroundColor: '#003a8c',
                                color: '#ffffff',
                                border: '2px solid #001529',
                                borderRadius: '2px',
                                fontWeight: 'bold',
                                fontSize: '16px',
                                textAlign: 'center'
                            },
                            meta: {
                                kind: 'unitAssignment',
                                assignment,
                                unit,
                                assembly,
                                component,
                            },
                        });

                        // Добавляем события ТО для этого Unit на этот же трек компонента
                        const assignmentEnd = componentAssignments[index + 1]
                            ? new Date(componentAssignments[index + 1].dateTime)
                            : fallbackTimelineEndDate;

                        const maintenanceEvents = (timeline.maintenanceEvents || []).filter((me) => {
                            if (me.unitId !== assignment.unitId) return false;

                            const eventTime = new Date(me.dateTime).getTime();
                            const assignTime = assignmentDate.getTime();

                            if (Number.isNaN(eventTime)) {
                                console.warn('⚠️ maintenanceEvent с некорректной датой:', me);
                                return false;
                            }

                            return eventTime >= assignTime;
                        });


                        maintenanceEvents.forEach((event, eventIndex) => {
                            const maintenanceType = getMaintenanceType(event.maintenanceTypeId);
                            if (maintenanceType) {
                                const eventStart = new Date(event.dateTime);
                                const eventEnd = new Date(eventStart.getTime() + maintenanceType.duration * 24 * 60 * 60 * 1000);

                                const eventStartStr = eventStart.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
                                const eventEndStr = eventEnd.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });

                                componentTrack.elements.push({
                                    id: `maintenance-${assignment.unitId}-${event.dateTime}-${eventIndex}`,
                                    title: maintenanceType.name,
                                    dataTitle: `${maintenanceType.name}: ${eventStartStr} - ${eventEndStr} (${maintenanceType.duration} дн.)${event.custom ? ' [Внеплановое]' : ''}`,
                                    start: eventStart,
                                    end: eventEnd,
                                    style: {
                                        backgroundColor: getMaintenanceColor(maintenanceType),
                                        color: getContrastTextColor(getMaintenanceColor(maintenanceType)),
                                        border: `2px solid ${getMaintenanceColor(maintenanceType)}`,
                                        borderRadius: '4px',
                                        opacity: event.custom ? 0.7 : 0.9
                                    },
                                    meta: {
                                        kind: 'maintenanceEvent',
                                        event,
                                        unit,
                                        assembly,
                                        component,
                                        maintenanceType,
                                    },
                                });
                            }
                        });
                    }
                });

                assemblyTrack.tracks.push(componentTrack);
            });

            return assemblyTrack;
        };

        // Обрабатываем все корневые узлы
        project.nodes.forEach(node => {
            if (node.type === 'NODE') {
                const track = processNode(node);
                allTracks.push(track);
            } else if (node.type === 'ASSEMBLY' || node.assemblyTypeId) {
                const track = processAssembly(node);
                allTracks.push(track);
            }
        });

        return allTracks;
    }, [project, timeline, openTracks, timelineEndKey, getMaintenanceType, getUnitById, assemblyTypeMap]);

    const timebar = useMemo(() => {
        const startDate = timelineStartDate;
        const endDate = timelineEndDate;

        const timebars = [];

        // Месяцы
        const months = [];
        let currentMonth = dayjs(startDate).startOf('month');
        while (currentMonth.isBefore(endDate)) {
            months.push({
                id: `month-${currentMonth.format('YYYY-MM')}`,
                title: currentMonth.format('MMM YYYY'),
                start: currentMonth.toDate(),
                end: currentMonth.endOf('month').toDate()
            });
            currentMonth = currentMonth.add(1, 'month');
        }

        if (months.length > 0) {
            timebars.push({
                id: 'months',
                title: 'Месяцы',
                cells: months,
                style: {},
                useAsGrid: false
            });
        }

        // Дни
        const days = [];
        let currentDay = dayjs(startDate).startOf('day');
        while (currentDay.isBefore(endDate)) {
            days.push({
                id: `day-${currentDay.format('YYYY-MM-DD')}`,
                title: currentDay.format('D'),
                start: currentDay.toDate(),
                end: currentDay.endOf('day').toDate()
            });
            currentDay = currentDay.add(1, 'day');
        }

        if (days.length > 0) {
            timebars.push({
                id: 'days',
                title: 'Дни',
                cells: days,
                style: {},
                useAsGrid: true
            });
        }

        return timebars;
    }, [timelineStartDate, timelineEndDate]);
    const now = useMemo(() => new Date(), []);

    const handleStartChange = useCallback((date) => {
        if (!date || !onProjectUpdate) return;
        onProjectUpdate({
            ...project,
            start: date.format(DATE_FORMAT),
            timeline: { ...timeline }
        });
    }, [project, timeline, onProjectUpdate]);

    const handleEndChange = useCallback((date) => {
        if (!date || !onProjectUpdate) return;
        onProjectUpdate({
            ...project,
            end: date.format(DATE_FORMAT),
            timeline: { ...timeline }
        });
    }, [project, timeline, onProjectUpdate]);

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
                : dayjs().format(ASSIGNMENT_DATETIME_FORMAT),
            operatingInterval: includeOperatingInterval ? values.operatingInterval : null
        };

        const existingAssignments = timeline.unitAssignments || [];
        const updatedAssignments = [...existingAssignments, assignment]
            .sort((a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf());

        onProjectUpdate({
            ...project,
            timeline: {
                ...timeline,
                assemblyStates: timeline.assemblyStates || [],
                unitAssignments: updatedAssignments,
                maintenanceEvents: timeline.maintenanceEvents || []
            }
        });

        assignmentForm.resetFields();
        setIncludeOperatingInterval(false);
        message.success('Назначение детали добавлено');
    }, [assignmentForm, assemblyOptionMap, assemblyTypeMap, onProjectUpdate, project, timeline, unitOptions, includeOperatingInterval]);


    const handleMaintenanceEventSubmit = useCallback(async (values) => {
        if (!project || !onProjectUpdate) return;

        const cleanUnitId = normalizeUnitId(values.unitId);

        const event = {
            maintenanceTypeId: values.maintenanceTypeId,
            unitId: cleanUnitId,
            dateTime: dayjs(values.dateTime).format(ASSIGNMENT_DATETIME_FORMAT),
            custom: true,
        };

        const updatedTimeline = {
            ...project.timeline,
            maintenanceEvents: [
                ...(project.timeline?.maintenanceEvents || []),
                event
            ].sort((a, b) => dayjs(a.dateTime) - dayjs(b.dateTime)),
        };

        const tempProject = {
            ...project,
            timeline: updatedTimeline
        };

        await dataService.saveProject(project.id, tempProject);

        const freshProject = await dataService.getProject(project.id);

        onProjectUpdate(freshProject);

        message.success('Внеплановая работа добавлена');
    }, [project, onProjectUpdate]);


    const handleGeneratePlan = useCallback(async () => {
            console.log('🎯 handleGeneratePlan вызван');
            console.log('📦 project:', project);

            if (!project) {
                console.error('❌ Проект не загружен');
                message.error('Проект не загружен');
                return;
            }

            if (!project.start || !project.end) {
                console.error('❌ У проекта отсутствуют даты');
                message.error('У проекта отсутствуют даты start и end. Установите их через DatePicker выше.');
                return;
            }

            console.log('⏱️ [BEFORE FLUX] project.timeline:', project.timeline);

            try {
                await generatePlan(project, async (generatedTimeline) => {
                    console.log('🎉 План ТО успешно сгенерирован (callback from hook)');
                    console.log('⏱️ [FROM FLUX] generatedTimeline:', generatedTimeline);

                    // 🔥 КЛАДЁМ НОВЫЙ ТАЙМЛАЙН В ПРОЕКТ
                    const updatedProject = {
                        ...project,
                        timeline: generatedTimeline,
                    };

                    // обновляем стейт проекта в родителе
                    onProjectUpdate(updatedProject);

                    // и сразу сохраняем демо-проект в localStorage
                    try {
                        await dataService.saveProject(project.id, updatedProject);
                        console.log('💾 Проект с новым таймлайном сохранён в localStorage');
                    } catch (e) {
                        console.warn('⚠️ Не удалось сохранить проект с новым таймлайном:', e);
                    }

                    message.success('План ТО успешно сгенерирован');
                });
            } catch (error) {
                console.error('❌ Error generating plan:', error);
                message.error('Ошибка при генерации плана ТО');
            }
        }, [project, generatePlan, onProjectUpdate]);


    const hasAssemblies = assemblyOptions.length > 0;
    const hasUnits = unitOptions.some(option => option.componentTypeId);
    const assignmentDisabled = !hasAssemblies;
    const showUnitsHint = hasAssemblies && !hasUnits;

    const hasTimelineData =
        tracks.length > 0 ||
        (timeline.assemblyStates && timeline.assemblyStates.length > 0) ||
        (timeline.unitAssignments && timeline.unitAssignments.length > 0) ||
        (timeline.maintenanceEvents && timeline.maintenanceEvents.length > 0);

    const scaleEnd = timelineEndDate <= timelineStartDate
        ? dayjs(timelineStartDate).add(1, 'day').toDate()
        : timelineEndDate;

    const renderSelectedElementInfo = () => {
        if (!selectedElement || !selectedElement.meta) return null;
        const { meta } = selectedElement;

        if (meta.kind === 'unitAssignment' && meta.assignment) {
            const { assignment, unit, assembly, component } = meta;

            return (
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Тип">
                        Назначение детали
                    </Descriptions.Item>
                    <Descriptions.Item label="Деталь">
                        {unit
                            ? `${unit.name} (${unit.serialNumber || 'б/н'})`
                            : assignment.unitId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Агрегат">
                        {assembly?.name ||
                            assignment.componentOfAssembly?.assemblyId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Компонент">
                        {component?.name ||
                            (assignment.componentOfAssembly?.componentPath || []).join(
                                ' / '
                            )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Дата и время">
                        {dayjs(assignment.dateTime).format('YYYY-MM-DD HH:mm')}
                    </Descriptions.Item>
                    {assignment.operatingInterval != null && (
                        <Descriptions.Item label="Наработка, ч">
                            {assignment.operatingInterval}
                        </Descriptions.Item>
                    )}
                </Descriptions>
            );
        }

        if (meta.kind === 'maintenanceEvent' && meta.event) {
            const { event, unit, assembly, component, maintenanceType } = meta;

            return (
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Тип">
                        Работа по ТО
                    </Descriptions.Item>
                    <Descriptions.Item label="Вид работ">
                        {maintenanceType?.name || event.maintenanceTypeId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Деталь">
                        {unit
                            ? `${unit.name} (${unit.serialNumber || 'б/н'})`
                            : event.unitId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Агрегат">
                        {assembly?.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Компонент">
                        {component?.name}
                    </Descriptions.Item>
                    <Descriptions.Item label="Начало работ">
                        {dayjs(event.dateTime).format('YYYY-MM-DD HH:mm')}
                    </Descriptions.Item>
                    {maintenanceType?.duration != null && (
                        <Descriptions.Item label="Длительность, дней">
                            {maintenanceType.duration}
                        </Descriptions.Item>
                    )}
                    {event.custom && (
                        <Descriptions.Item label="Тип события">
                            Внеплановое
                        </Descriptions.Item>
                    )}
                </Descriptions>
            );
        }

        if (meta.kind === 'assemblyState' && meta.state) {
            const { state, assembly } = meta;

            const stateNames = {
                WORKING: 'Работает',
                IDLE: 'Простой',
                SHUTTING_DOWN: 'Останов',
                STARTING_UP: 'Запуск',
            };

            return (
                <Descriptions column={1} size="small" bordered>
                    <Descriptions.Item label="Тип">
                        Состояние агрегата
                    </Descriptions.Item>
                    <Descriptions.Item label="Агрегат">
                        {assembly?.name || state.assemblyId}
                    </Descriptions.Item>
                    <Descriptions.Item label="Состояние">
                        {stateNames[state.type] || state.type}
                    </Descriptions.Item>
                    <Descriptions.Item label="Дата и время">
                        {dayjs(state.dateTime).format('YYYY-MM-DD HH:mm')}
                    </Descriptions.Item>
                </Descriptions>
            );
        }

        return null;
    };


    const handleDeleteSelectedElement = useCallback(
        async () => {
            if (!selectedElement || !project || !onProjectUpdate) return;
            const meta = selectedElement.meta;
            if (!meta) return;

            try {
                let updatedTimeline = { ...(project.timeline || {}) };

                if (meta.kind === 'unitAssignment' && meta.assignment) {
                    const prev = updatedTimeline.unitAssignments || [];
                    updatedTimeline = {
                        ...updatedTimeline,
                        unitAssignments: prev.filter((a) => a !== meta.assignment),
                    };
                }

                if (meta.kind === 'maintenanceEvent' && meta.event) {
                    const prev = updatedTimeline.maintenanceEvents || [];
                    updatedTimeline = {
                        ...updatedTimeline,
                        maintenanceEvents: prev.filter((e) => e !== meta.event),
                    };
                }

                if (meta.kind === 'assemblyState' && meta.state) {
                    const prev = updatedTimeline.assemblyStates || [];
                    updatedTimeline = {
                        ...updatedTimeline,
                        assemblyStates: prev.filter((s) => s !== meta.state),
                    };
                }

                const updatedProject = {
                    ...project,
                    timeline: updatedTimeline,
                };

                await dataService.saveProject(project.id, updatedProject);
                const freshProject = await dataService.getProject(project.id);

                onProjectUpdate(freshProject);
                message.success('Элемент удалён');
            } catch (err) {
                console.error('Ошибка при удалении элемента таймлайна', err);
                message.error('Не удалось удалить элемент');
            } finally {
                setSelectedElement(null);
                setForceRenderKey((k) => k + 1);
            }
        },
        [selectedElement, project, onProjectUpdate]
    );



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
            {/* Форма назначения детали */}
            <Card className="timeline-assignment-card">
                <Typography.Text className="timeline-assignment-title">
                    Назначить деталь компоненту
                </Typography.Text>
                <Form
                    form={assignmentForm}
                    layout="vertical"
                    onFinish={handleAssignmentSubmit}
                >
                    <Form.Item
                        name="assemblyId"
                        label="Агрегат"
                        rules={[{ required: true, message: 'Выберите агрегат' }]}
                    >
                        <Select
                            placeholder={assignmentDisabled ? 'Агрегаты недоступны' : 'Выберите агрегат'}
                            disabled={assignmentDisabled}
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
                                    return true;
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

                    {/* Поля для operatingInterval */}
                    <Form.Item>
                        <Checkbox
                            checked={includeOperatingInterval}
                            onChange={(e) => setIncludeOperatingInterval(e.target.checked)}
                        >
                            Указать наработку (часы)
                        </Checkbox>
                    </Form.Item>

                    {includeOperatingInterval && (
                        <Form.Item
                            name="operatingInterval"
                            label="Наработка (часы)"
                            rules={[
                                {
                                    required: includeOperatingInterval,
                                    message: 'Введите наработку'
                                },
                                {
                                    type: 'number',
                                    min: 0,
                                    message: 'Наработка должна быть положительным числом'
                                }
                            ]}
                            extra="Количество отработанных часов на момент установки детали"
                        >
                            <InputNumber
                                min={0}
                                placeholder="Введите наработку в часах"
                                style={{ width: '100%' }}
                                step={1}
                            />
                        </Form.Item>
                    )}

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
                )}unitId
            </Card>

            {/* Форма добавления внеплановой работы */}
            <Card className="timeline-assignment-card">
                <Typography.Text className="timeline-assignment-title">
                    Добавить внеплановую работу
                </Typography.Text>
                <MaintenanceEventForm
                    project={project}
                    onSubmit={handleMaintenanceEventSubmit}
                />
            </Card>


            {/* Генерация плана через Flux */}
            <Card className="timeline-controls-card">
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        <Button
                            type="primary"
                            onClick={handleGeneratePlan}
                            loading={isGenerating}
                            disabled={isGenerating}
                            icon={isGenerating ? <LoadingOutlined /> : null}
                        >
                            {isGenerating ? 'Генерация...' : 'Сгенерировать план ТО'}
                        </Button>
                        {isGenerating && (
                            <Button
                                danger
                                onClick={cancelGeneration}
                                icon={<CloseCircleOutlined />}
                            >
                                Отменить
                            </Button>
                        )}
                    </Space>

                    {/* Прогресс генерации */}
                    {isGenerating && progress && (
                        <Alert
                            message="Генерация плана ТО"
                            description={
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    <Typography.Text>{progress}</Typography.Text>
                                    <Progress percent={0} status="active" showInfo={false} />
                                </Space>
                            }
                            type="info"
                            showIcon
                        />
                    )}

                    {/* Ошибка */}
                    {fluxError && !isGenerating && (
                        <Alert
                            message="Ошибка генерации"
                            description={fluxError}
                            type="error"
                            closable
                            onClose={clearError}
                            showIcon
                        />
                    )}
                </Space>
            </Card>

            <Card className="timeline-chart" key={`timeline-card-${forceRenderKey}`}>
                {hasTimelineData ? (
                    <div className="timeline-wrapper">
                        <Timeline
                            key={`timeline-${forceRenderKey}`}
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
                            clickTrackButton={clickTrackButton}
                            toggleTrackOpen={toggleTrackOpen}
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

            {selectedElement && (
                <div className="timeline-overlay">
                    <div
                        className="timeline-overlay-backdrop"
                        onClick={() => setSelectedElement(null)}
                    />
                    <div className="timeline-overlay-modal">
                        <div className="timeline-overlay-header">
                            <span>Информация о событии</span>
                            <button
                                className="timeline-overlay-close"
                                onClick={() => setSelectedElement(null)}
                            >
                                ×
                            </button>
                        </div>
                        <div className="timeline-overlay-body">
                            {renderSelectedElementInfo()}
                        </div>
                        <div className="timeline-overlay-footer">
                            <Button onClick={() => setSelectedElement(null)}>
                                Закрыть
                            </Button>
                            {selectedElement.meta && (
                                <Button danger onClick={handleDeleteSelectedElement}>
                                    Удалить
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default TimelineTab;