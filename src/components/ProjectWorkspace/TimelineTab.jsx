import React, {useState, useMemo, useCallback, useEffect, useRef} from 'react';
import {
    Card,
    DatePicker,
    Space,
    Typography,
    Form,
    Button,
    message,
    Progress,
    Alert,
    Descriptions,
    Input
} from 'antd';
import { LoadingOutlined, CloseCircleOutlined } from '@ant-design/icons';
import Timeline from 'react-timelines';
import 'react-timelines/lib/css/style.css';
import './TimelineTab.css';
import { getContrastTextColor } from '../../utils/contrastTextColor';
import { useFluxTimelineGeneration } from '../../hooks/useFluxTimelineGeneraion';
import dayjs from 'dayjs';
import { serverProjectsApi, plansApi, projectHistoryApi } from '../../services/apiService';

const DATE_FORMAT = 'YYYY-MM-DD';
const ASSIGNMENT_DATETIME_FORMAT = 'YYYY-MM-DDTHH:mm:ss';

const TimelineTab = ({ project, onProjectUpdate, onOpenAssignUnit, onOpenAddMaintenance, apiBaseUrl = '/api' }) => {
    const [zoom, setZoom] = useState(30);
    const [assignmentForm] = Form.useForm();
    const [openTracks, setOpenTracks] = useState({});
    const [includeOperatingInterval, setIncludeOperatingInterval] = useState(false);
    const [forceRenderKey, setForceRenderKey] = useState(0);
    const [selectedElement, setSelectedElement] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);

    const [planName, setPlanName] = useState('');
    const [isSavingPlan, setIsSavingPlan] = useState(false);

    const [plans, setPlans] = useState([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const [activePlanId, setActivePlanId] = useState(null);
    const [activePlan, setActivePlan] = useState(null);

    const fileInputRef = useRef(null);
    const [isDownloadingTemplate, setIsDownloadingTemplate] = useState(false);
    const [isUploadingHistory, setIsUploadingHistory] = useState(false);

    const [currentTimeline, setCurrentTimeline] = useState(selectedPlan?.timeline || project?.timeline || {});

    // Flux генерация
    const {
        isGenerating,
        progress,
        error: fluxError,
        generatePlan,
        cancelGeneration,
        clearError
    } = useFluxTimelineGeneration();

    // const timeline = project?.timeline || {};
    // const currentTimeline = selectedPlan?.timeline || project?.timeline || {};

    const timeline = currentTimeline;

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


    const toggleTrackOpen = useCallback((track) => {
        setOpenTracks(prev => {
            const wasOpen = prev[track.id] !== false;
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

    const loadPlans = useCallback(async () => {
        if (!project || !project.id) return;

        try {
            setIsLoadingPlans(true);
            const data = await plansApi.getAll(project.id);
            setPlans(Array.isArray(data) ? data : []);
        } catch (e) {
            console.error('Ошибка загрузки планов:', e);
            message.error('Не удалось загрузить список планов: ' + e.message);
        } finally {
            setIsLoadingPlans(false);
        }
    }, [project]);

    useEffect(() => {
        loadPlans();
    }, [loadPlans]);


    const handleSavePlan = useCallback(async () => {
        if (!project || !project.id) {
            message.error('Проект не загружен');
            return;
        }

        if (!planName || planName.trim() === '') {
            message.warning('Введите название плана');
            return;
        }

        try {
            setIsSavingPlan(true);

            const planData = {
                id: crypto.randomUUID(),
                name: planName.trim(),
                description: `План создан ${dayjs().format('DD.MM.YYYY HH:mm')}`,
                projectId: project.id,
                start: timelineStartDayjs.format('YYYY-MM-DDTHH:mm:ss'),
                end: timelineEndDayjs.format('YYYY-MM-DDTHH:mm:ss'),
                timeline: JSON.stringify(project.timeline || {})
            };

            await plansApi.create(planData).then(serverProjectsApi.getById(project.id));
            message.success(`План "${planName}" сохранен`);
            setPlanName('');
            await loadPlans()
        } catch (error) {
            console.error('Ошибка создания плана:', error);
            message.error('Не удалось сохранить план: ' + error.message);
        } finally {
            setIsSavingPlan(false);
        }
    }, [project, planName, timelineStartDayjs, timelineEndDayjs, loadPlans]);

    const handleSelectPlan = useCallback(
        async (plan) => {
            if (!project || !onProjectUpdate || !plan?.id) return;

            try {
                setActivePlanId(plan.id);
                setActivePlan(plan)
                console.log('plan', activePlan)

                const fullPlan = await plansApi.getById(plan.id);

                let planTimeline = fullPlan.timeline || fullPlan.timeLine;

                if (!planTimeline) {
                    message.warning('У выбранного плана нет данных таймлайна');
                    return;
                }

                if (typeof planTimeline === 'string') {
                    try {
                        planTimeline = JSON.parse(planTimeline);
                    } catch (e) {
                        console.error('Ошибка парсинга timeline плана:', e, planTimeline);
                        message.error('Не удалось прочитать таймлайн плана');
                        return;
                    }
                }

                const updatedProject = {
                    ...project,
                    start: fullPlan.start || project.start,
                    end: fullPlan.end || project.end,
                    timeline: planTimeline
                };

                onProjectUpdate(updatedProject);
                setForceRenderKey((k) => k + 1);
                message.success(`План "${fullPlan.name || plan.name}" загружен`);
            } catch (e) {
                console.error('Ошибка загрузки плана:', e);
                message.error('Не удалось загрузить план: ' + e.message);
            } finally {
                setActivePlanId(null);
            }
        },
        [project, onProjectUpdate]
    );

    const handleDeletePlan = useCallback(
        async (planId) => {
            if (!planId) return;
            try {
                await plansApi.delete(planId);
                setPlans((prev) => prev.filter((p) => p.id !== planId));
                if (activePlanId === planId) {
                    setActivePlanId(null);
                }
                message.success('План удалён');
            } catch (e) {
                console.error('Ошибка удаления плана:', e);
                message.error('Не удалось удалить план: ' + e.message);
            }
        },
        [activePlanId]
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

    const tracks = useMemo(() => {
        if (!project || !project.nodes || project.nodes.length === 0) {
            return [];
        }

        const fallbackTimelineEndDate = dayjs(timelineEndKey).endOf('day').toDate();
        const allTracks = [];
        const getComponentsForAssembly = (assemblyTypeId) => {
            const assemblyType = project.assemblyTypes?.find(at => at.id === assemblyTypeId);
            return assemblyType?.components || [];
        };
        const processNode = (node) => {
            const track = {
                id: node.id,
                title: node.name,
                elements: []
            };

            const childTracks = [];
            if (node.children) {
                node.children.forEach(child => {
                    if (child.type === 'ASSEMBLY' || child.assemblyTypeId) {
                        const assemblyTrack = processAssembly(child);
                        childTracks.push(assemblyTrack);
                    } else if (child.children) {
                        const childTrack = processNode(child);
                        childTracks.push(childTrack);
                    }
                });
            }

            if (childTracks.length > 0) {
                track.tracks = childTracks;
                track.isOpen = openTracks[node.id] !== false;
                track.toggleOpen = () => {};
            }

            return track;
        };

        const processAssembly = (assembly) => {
            const assemblyTrack = {
                id: assembly.id,
                title: assembly.name,
                elements: []
            };

            const assemblyStates = timeline.assemblyStates?.filter(
                state => state.assemblyId === assembly.id
            ) || [];

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
                        'STARTING_UP': 'Пуск'
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
                            opacity: 0.4,
                            zIndex: 1
                        },
                        meta: {
                            kind: 'assemblyState',
                            state,
                            assembly,
                        },
                    });
                });
            }

            const components = getComponentsForAssembly(assembly.assemblyTypeId);

            const componentTracks = [];
            components.forEach(component => {
                const componentTrack = {
                    id: `${assembly.id}-${component.id}`,
                    title: component.name,
                    elements: []
                };

                const componentAssignments = timeline.unitAssignments?.filter(ua =>
                    ua.componentOfAssembly?.assemblyId === assembly.id &&
                    ua.componentOfAssembly?.componentPath?.includes(component.id)
                ) || [];

                componentAssignments.sort((a, b) =>
                    new Date(a.dateTime) - new Date(b.dateTime)
                );

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

                        const assignmentEnd = componentAssignments[index + 1]
                            ? new Date(componentAssignments[index + 1].dateTime)
                            : fallbackTimelineEndDate;

                        const maintenanceEvents = (timeline.maintenanceEvents || []).filter((me) => {
                            if (me.unitId !== assignment.unitId) return false;

                            const eventTime = new Date(me.dateTime).getTime();
                            const assignTime = assignmentDate.getTime();

                            if (Number.isNaN(eventTime)) {
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

                componentTracks.push(componentTrack);
            });

            if (componentTracks.length > 0) {
                assemblyTrack.tracks = componentTracks;
                assemblyTrack.isOpen = openTracks[assembly.id] !== false;
                assemblyTrack.toggleOpen = () => {};

                const isCollapsed = openTracks[assembly.id] === false;
                if (isCollapsed) {
                    const allMaintenanceEvents = [];
                    const allUnitAssignments = [];

                    componentTracks.forEach(componentTrack => {
                        componentTrack.elements.forEach(element => {
                            if (element.meta?.kind === 'maintenanceEvent') {
                                allMaintenanceEvents.push(element);
                            } else if (element.meta?.kind === 'unitAssignment') {
                                allUnitAssignments.push(element);
                            }
                        });
                    });

                    assemblyTrack.elements = assemblyTrack.elements.map(element => {
                        if (element.meta?.kind === 'assemblyState') {
                            return {
                                ...element,
                                style: {
                                    ...element.style,
                                    top: '0%',
                                    height: '100%'
                                }
                            };
                        }
                        return element;
                    });

                    allUnitAssignments.forEach((assignment, index) => {
                        const originalBgColor = assignment.style?.backgroundColor || '#003a8c';

                        assemblyTrack.elements.push({
                            ...assignment,
                            id: `collapsed-${assignment.id}`,
                            style: {
                                ...assignment.style,
                                zIndex: 100,
                                height: '100%',
                                top: '0%',
                                fontSize: '12px',
                                opacity: 0.85,
                                backgroundColor: originalBgColor + 'E6',
                                pointerEvents: 'auto'
                            }
                        });
                    });

                    allMaintenanceEvents.forEach((event, index) => {
                        const originalBgColor = event.style?.backgroundColor || '#8c8c8c';

                        assemblyTrack.elements.push({
                            ...event,
                            id: `collapsed-${event.id}`,
                            style: {
                                ...event.style,
                                zIndex: 100-index,
                                height: '100%',
                                top: '0%',
                                fontSize: '13px',
                                opacity: 1,
                                border: '3px solid gray',
                                backgroundColor: originalBgColor,
                                pointerEvents: 'auto'
                            }
                        });
                    });
                }
            }

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

        await serverProjectsApi.save(tempProject);

        const freshProject = await serverProjectsApi.getById(project.id);

        onProjectUpdate(freshProject);

        message.success('Внеплановая работа добавлена');
    }, [project, onProjectUpdate]);

    const handleGeneratePlan = useCallback(async () => {
        console.log('🚀 handleGeneratePlan вызван');
        console.log('activePlan:', activePlan);

        if (!activePlan) {
            console.error('❌ Проект не загружен');
            message.error('Проект не загружен');
            return;
        }

        if (!activePlan.startTime || !activePlan.endTime) {
            console.error('❌ У проекта нет дат:', { start: activePlan.startTime, end: activePlan.endTime });
            message.error('У проекта отсутствуют даты start и end. Установите их через DatePicker выше.');
            return;
        }

        console.log('✅ Проверки пройдены, вызываем generatePlan');
        console.log('generatePlan function:', generatePlan);

        try {
            await generatePlan(project, activePlan, async (generatedTimeline) => {
                console.log('✅ Получен сгенерированный timeline:', generatedTimeline);

                setCurrentTimeline(generatedTimeline)

                // const updatedProject = {
                //     ...project,
                //     timeline: generatedTimeline,
                // };

                // Обновляем только локальный state
                // Сохранение на сервер произойдет по кнопке "Сохранить"
                //onProjectUpdate(updatedProject);

                message.success('План ТО успешно сгенерирован (не забудьте сохранить)');
            });
        } catch (error) {
            console.error('❌ Error generating plan:', error);
            message.error('Ошибка при генерации плана ТО');
        }
    }, [project, activePlan, generatePlan, onProjectUpdate]);

    const handlePlanUpdate = async ({timelne}) => {
        plansApi.create({
            'id': activePlan.id,
            'name': activePlan.name,
            "startTime": activePlan.startTime,
            "endTime": activePlan.endTime,
            'projectId': activePlan.projectId,
            'timelne': JSON.stringify(timelne),
        })
    }

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
        () => {
            if (!selectedElement || !project || !onProjectUpdate) return;
            const meta = selectedElement.meta;
            if (!meta) return;

            try {
                let updatedTimeline = { ...(project.timeline || {}) };

                if (meta.kind === 'unitAssignment' && meta.assignment) {
                    const prev = updatedTimeline.unitAssignments || [];
                    updatedTimeline = {
                        ...updatedTimeline,
                        unitAssignments: prev.filter((a) => {
                            // Сравниваем по полям, а не по ссылке
                            return !(
                                a.unitId === meta.assignment.unitId &&
                                a.componentOfAssembly?.assemblyId === meta.assignment.componentOfAssembly?.assemblyId &&
                                a.dateTime === meta.assignment.dateTime
                            );
                        }),
                    };
                }

                if (meta.kind === 'maintenanceEvent' && meta.event) {
                    const prev = updatedTimeline.maintenanceEvents || [];
                    updatedTimeline = {
                        ...updatedTimeline,
                        maintenanceEvents: prev.filter((e) => {
                            // Сравниваем по полям
                            return !(
                                e.maintenanceTypeId === meta.event.maintenanceTypeId &&
                                e.unitId === meta.event.unitId &&
                                e.dateTime === meta.event.dateTime
                            );
                        }),
                    };
                }

                if (meta.kind === 'assemblyState' && meta.state) {
                    const prev = updatedTimeline.assemblyStates || [];
                    updatedTimeline = {
                        ...updatedTimeline,
                        assemblyStates: prev.filter((s) => {
                            // Сравниваем по полям
                            return !(
                                s.assemblyId === meta.state.assemblyId &&
                                s.type === meta.state.type &&
                                s.dateTime === meta.state.dateTime
                            );
                        }),
                    };
                }

                const updatedProject = {
                    ...project,
                    timeline: updatedTimeline,
                };

                // Обновляем только локальный state, без сохранения на сервер
                // Сохранение произойдет по кнопке "Сохранить" в хедере
                onProjectUpdate(updatedProject);
                message.success('Элемент удалён (не забудьте сохранить)');

                setSelectedElement(null);
                setForceRenderKey((k) => k + 1);
            } catch (err) {
                console.error('Ошибка при удалении элемента таймлайна', err);
                message.error('Не удалось удалить элемент');
            }
        },
        [selectedElement, project, onProjectUpdate]
    );

    // Скачать шаблон Excel
    const handleDownloadTemplate = useCallback(async () => {
        if (!project || !project.id) {
            message.error('Проект не загружен');
            return;
        }

        try {
            setIsDownloadingTemplate(true);
            const blob = await projectHistoryApi.downloadTemplate(project.id);

            // Создать ссылку для скачивания
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `template_${project.name || 'project'}_${dayjs().format('YYYY-MM-DD')}.xlsx`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            message.success('Шаблон скачан');
        } catch (error) {
            console.error('Ошибка скачивания шаблона:', error);
            message.error('Не удалось скачать шаблон: ' + error.message);
        } finally {
            setIsDownloadingTemplate(false);
        }
    }, [project]);

    // Загрузить файл истории
    const handleUploadHistory = useCallback(async (event) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!project || !project.id) {
            message.error('Проект не загружен');
            event.target.value = ''; // Очистить input
            return;
        }

        try {
            setIsUploadingHistory(true);
            const result = await projectHistoryApi.loadHistory(project.id, file);

            message.success('Файл истории загружен');

            // Если API вернул обновленные данные timeline, применить их
            if (result && result.timeline) {
                const updatedProject = {
                    ...project,
                    timeline: result.timeline
                };
                onProjectUpdate(updatedProject);
            } else {
                // Если данных нет, просто перезагрузить проект
                if (onProjectUpdate && typeof onProjectUpdate === 'function') {
                    message.info('Обновите страницу для применения изменений');
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки файла истории:', error);
            message.error('Не удалось загрузить файл: ' + error.message);
        } finally {
            setIsUploadingHistory(false);
            event.target.value = ''; // Очистить input для повторной загрузки
        }
    }, [project, onProjectUpdate]);



    return (
        <div className="timeline-tab">
            <Card className="timeline-controls-card">
                <div className="timeline-range-controls">
                    <Typography.Text className="timeline-range-label">Создать новый план:</Typography.Text>
                    <Space size="middle" wrap>
                        <Space>
                            <Typography.Text>Название:</Typography.Text>
                            <Input
                                placeholder="Введите название плана"
                                value={planName}
                                onChange={(e) => setPlanName(e.target.value)}
                                style={{ width: 250 }}
                                onPressEnter={handleSavePlan}
                            />
                        </Space>
                        <Space>
                            <Typography.Text>Дата начала:</Typography.Text>
                            <DatePicker
                                value={timelineStartDayjs}
                                onChange={handleStartChange}
                                format={DATE_FORMAT}
                                allowClear={false}
                            />
                        </Space>
                        <Space>
                            <Typography.Text>Дата окончания:</Typography.Text>
                            <DatePicker
                                value={timelineEndDayjs}
                                onChange={handleEndChange}
                                format={DATE_FORMAT}
                                allowClear={false}
                            />
                        </Space>
                        <Button
                            type="primary"
                            onClick={handleSavePlan}
                            loading={isSavingPlan}
                            disabled={!planName || planName.trim() === ''}
                        >
                            Создать план
                        </Button>
                    </Space>
                </div>

                <div className="timeline-range-controls" style={{ marginTop: 16 }}>
                    <Typography.Text className="timeline-range-label">
                        Сохранённые планы:
                    </Typography.Text>

                    {isLoadingPlans ? (
                        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                            Загрузка планов...
                        </Typography.Text>
                    ) : plans.length === 0 ? (
                        <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                            Для этого проекта ещё нет сохранённых планов.
                        </Typography.Text>
                    ) : (
                        <Space direction="vertical" style={{ width: '100%', marginTop: 8 }}>
                            {plans.map((plan) => (
                                <div
                                    key={plan.id}
                                    style={{
                                        padding: '6px 10px',
                                        borderRadius: 4,
                                        border: '1px solid #f0f0f0',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <div
                                        style={{ flex: 1, marginRight: 8 }}
                                        onClick={() => handleSelectPlan(plan)}
                                    >
                                        <Typography.Text strong>
                                            {plan.name || 'Без названия'}
                                        </Typography.Text>
                                        <br />
                                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                            {plan.startTime && plan.endTime
                                                ? `${dayjs(plan.startTime).format('DD.MM.YYYY')} — ${dayjs(
                                                    plan.endTime
                                                ).format('DD.MM.YYYY')}`
                                                : 'Без дат'}
                                        </Typography.Text>
                                    </div>

                                    <Button
                                        danger
                                        size="small"
                                        loading={activePlanId === plan.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleDeletePlan(plan.id);
                                        }}
                                    >
                                        Удалить
                                    </Button>
                                </div>
                            ))}
                        </Space>
                    )}
                </div>


                <div className="timeline-range-controls" style={{ marginTop: 16 }}>
                    <Typography.Text className="timeline-range-label">Работа с историей:</Typography.Text>
                    <Space size="middle">
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".xlsx,.xls"
                            onChange={handleUploadHistory}
                            style={{ display: 'none' }}
                        />
                        <Button
                            type="primary"
                            onClick={() => fileInputRef.current?.click()}
                            loading={isUploadingHistory}
                        >
                            Импортировать файл с наработками
                        </Button>
                        <Button
                            type="primary"
                            onClick={handleDownloadTemplate}
                            loading={isDownloadingTemplate}
                        >
                            Скачать шаблон
                        </Button>
                    </Space>
                </div>
            </Card>


            <Card className="timeline-controls-card">
                <Space direction="vertical" style={{ width: '100%' }}>
                    <Space>
                        {onOpenAddMaintenance && <Button
                            type="primary"
                            onClick={onOpenAddMaintenance}
                            block
                        >
                            Назначить ТО
                        </Button>}
                        {onOpenAssignUnit && <Button
                            type="primary"
                            onClick={onOpenAssignUnit}
                            block
                        >
                            Назначить деталь
                        </Button>}
                    </Space>
                    <Space>
                        {activePlan !== null &&  <Typography.Text className="timeline-range-label">план {activePlan.name}</Typography.Text>}
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
                        <Button type="primary"
                                onClick={(currentTimeline) => {handlePlanUpdate(currentTimeline)}}>
                            Сохранить план
                        </Button>
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

            {/*<Card className="timeline-controls-card">*/}
            {/*    <div className="timeline-range-controls">*/}
            {/*        <Typography.Text className="timeline-range-label">Период отображения:</Typography.Text>*/}
            {/*        <Space size="middle">*/}
            {/*            <Space>*/}
            {/*                Начало*/}
            {/*                <DatePicker*/}
            {/*                    value={timelineStartDayjs}*/}
            {/*                    onChange={handleStartChange}*/}
            {/*                    format={DATE_FORMAT}*/}
            {/*                    allowClear={false}*/}
            {/*                />*/}
            {/*            </Space>*/}
            {/*            <Space>*/}
            {/*                Окончание*/}
            {/*                <DatePicker*/}
            {/*                    value={timelineEndDayjs}*/}
            {/*                    onChange={handleEndChange}*/}
            {/*                    format={DATE_FORMAT}*/}
            {/*                    allowClear={false}*/}
            {/*                />*/}
            {/*            </Space>*/}
            {/*            <Space>*/}
            {/*                <Button*/}
            {/*                    type="primary">*/}
            {/*                    Экспортровать файл*/}
            {/*                </Button>*/}
            {/*            </Space>*/}
            {/*        </Space>*/}
            {/*    </div>*/}
            {/*</Card>*/}

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