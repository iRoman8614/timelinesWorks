import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Button, Space, DatePicker, Modal, Descriptions, Popconfirm, message, Tooltip } from 'antd';
import { ZoomInOutlined, ZoomOutOutlined, ExpandOutlined, CompressOutlined, QuestionCircleOutlined } from '@ant-design/icons';
import Timeline from 'react-timelines';
import 'react-timelines/lib/css/style.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './TimelineView.css';
import {
    buildAssemblyStateElements,
    buildUnitAssignmentElements,
    buildMaintenanceEventElements
} from '../../utils/timelineElementBuilders';
import { applyDOMLocalization } from '../../utils/timelineLocalization';

dayjs.locale('ru');

/**
 * Группировка пересекающихся элементов ТО для свёрнутого состояния
 */
const groupOverlappingMaintenanceElements = (elements) => {
    if (elements.length === 0) return [];

    const sorted = [...elements].sort((a, b) =>
        new Date(a.start).getTime() - new Date(b.start).getTime()
    );

    const groups = [];
    let currentGroup = {
        elements: [sorted[0]],
        start: new Date(sorted[0].start),
        end: new Date(sorted[0].end)
    };

    for (let i = 1; i < sorted.length; i++) {
        const el = sorted[i];
        const elStart = new Date(el.start);
        const elEnd = new Date(el.end);

        if (elStart < currentGroup.end) {
            currentGroup.elements.push(el);
            if (elEnd > currentGroup.end) {
                currentGroup.end = elEnd;
            }
        } else {
            groups.push(currentGroup);
            currentGroup = {
                elements: [el],
                start: elStart,
                end: elEnd
            };
        }
    }

    groups.push(currentGroup);

    return groups;
};

const TimelineView = ({ structure, timeline = {}, selectedPlan, onTimelineUpdate, isGenerating }) => {
    const [collapsedAssemblies, setCollapsedAssemblies] = useState(new Set());
    const [allExpanded, setAllExpanded] = useState(true);
    const [zoom, setZoom] = useState(30);
    const zoomMin = 5;
    const zoomMax = 40;
    const [timelineStart, setTimelineStart] = useState(() => dayjs().startOf('month'));
    const [timelineEnd, setTimelineEnd] = useState(() => dayjs().endOf('month'));
    const [selectedEvent, setSelectedEvent] = useState(null);
    const [eventModalVisible, setEventModalVisible] = useState(false);

    useEffect(() => {
        const observer = applyDOMLocalization();
        const timeouts = [
            setTimeout(() => applyDOMLocalization(), 200),
            setTimeout(() => applyDOMLocalization(), 500),
            setTimeout(() => applyDOMLocalization(), 1000)
        ];

        return () => {
            observer?.disconnect();
            timeouts.forEach(t => clearTimeout(t));
        };
    }, [timeline]);

    useEffect(() => {
        const scrollToToday = () => {
            const tracksContainer = document.querySelector('.rt-tracks');
            const timelineGrid = document.querySelector('.rt-timeline__grid');

            if (tracksContainer || timelineGrid) {
                const container = tracksContainer || timelineGrid;
                const today = new Date();
                const start = timelineStart.toDate();
                const end = timelineEnd.toDate();
                const totalMs = end.getTime() - start.getTime();
                const todayMs = today.getTime() - start.getTime();
                const percentage = todayMs / totalMs;

                if (percentage >= 0 && percentage <= 1) {
                    const scrollContainer = container.closest('.rt-layout__main') ||
                        container.closest('.rt-timeline') ||
                        container.parentElement;

                    if (scrollContainer && scrollContainer.scrollWidth > scrollContainer.clientWidth) {
                        const scrollLeft = scrollContainer.scrollWidth * percentage - scrollContainer.clientWidth / 2;
                        scrollContainer.scrollTo({
                            left: Math.max(0, scrollLeft),
                            behavior: 'smooth'
                        });
                    }
                }
            }
        };

        const timeout = setTimeout(scrollToToday, 800);
        return () => clearTimeout(timeout);
    }, [timelineStart, timelineEnd]);

    const parsedStructure = useMemo(() => {
        if (!structure) return null;
        if (typeof structure === 'string') {
            try {
                return JSON.parse(structure);
            } catch (error) {
                console.error('Error parsing structure:', error);
                return null;
            }
        }
        return structure;
    }, [structure]);

    const calculateTimelineRange = useCallback((timelineData) => {
        if (!timelineData) return null;

        const allStartDates = [];
        const allEndDates = [];

        const findMaintenanceType = (maintenanceTypeId) => {
            if (!parsedStructure?.partModels) return null;
            for (const partModel of parsedStructure.partModels) {
                const mt = partModel.maintenanceTypes?.find(m => m.id === maintenanceTypeId);
                if (mt) return mt;
            }
            return null;
        };

        if (timelineData.assemblyStates) {
            Object.values(timelineData.assemblyStates).forEach(states => {
                if (Array.isArray(states)) {
                    states.forEach(state => {
                        if (state.dateTime) {
                            const date = new Date(state.dateTime);
                            allStartDates.push(date);
                            allEndDates.push(date);
                        }
                    });
                }
            });
        }

        if (timelineData.unitAssignments) {
            timelineData.unitAssignments.forEach(ua => {
                if (ua.dateTime) {
                    const date = new Date(ua.dateTime);
                    allStartDates.push(date);
                    allEndDates.push(date);
                }
            });
        }

        if (timelineData.maintenanceEvents) {
            timelineData.maintenanceEvents.forEach(me => {
                if (me.dateTime) {
                    const startDate = new Date(me.dateTime);
                    allStartDates.push(startDate);

                    const mt = findMaintenanceType(me.maintenanceTypeId);
                    const duration = mt?.duration || 1; // дней
                    const endDate = new Date(startDate.getTime() + duration * 24 * 60 * 60 * 1000);
                    allEndDates.push(endDate);
                }
            });
        }

        if (allStartDates.length === 0) return null;

        const minDate = new Date(Math.min(...allStartDates.map(d => d.getTime())));
        const maxDate = new Date(Math.max(...allEndDates.map(d => d.getTime())));

        return {
            start: dayjs(minDate).subtract(3, 'day').startOf('day'),
            end: dayjs(maxDate).add(3, 'day').endOf('day')
        };
    }, [parsedStructure]);

    const ensureTodayIncluded = useCallback((start, end) => {
        const today = dayjs();
        let newStart = start;
        let newEnd = end;

        if (today.isBefore(start, 'day')) {
            newStart = today.startOf('month');
        }

        if (today.isAfter(end, 'day')) {
            newEnd = today.endOf('month');
        }

        return { start: newStart, end: newEnd };
    }, []);

    useEffect(() => {
        const today = dayjs();
        let finalStart = today.startOf('month');
        let finalEnd = today.endOf('month');

        const projectRange = calculateTimelineRange(timeline);

        if (projectRange) {
            finalStart = projectRange.start;
            finalEnd = projectRange.end;
        }

        if (selectedPlan) {
            let planTimeline = selectedPlan.timeline;
            if (typeof planTimeline === 'string') {
                try {
                    planTimeline = JSON.parse(planTimeline);
                } catch (e) {
                    planTimeline = null;
                }
            }

            const planRange = planTimeline ? calculateTimelineRange(planTimeline) : null;

            if (planRange) {
                if (planRange.start.isBefore(finalStart)) {
                    finalStart = planRange.start;
                }
                if (planRange.end.isAfter(finalEnd)) {
                    finalEnd = planRange.end;
                }
            }

            if (selectedPlan.startTime) {
                const planStart = dayjs(selectedPlan.startTime);
                if (planStart.isBefore(finalStart)) {
                    finalStart = planStart;
                }
            }
            if (selectedPlan.endTime) {
                const planEnd = dayjs(selectedPlan.endTime);
                if (planEnd.isAfter(finalEnd)) {
                    finalEnd = planEnd;
                }
            }
        }
        const { start: adjustedStart, end: adjustedEnd } = ensureTodayIncluded(finalStart, finalEnd);
        setTimelineStart(adjustedStart);
        setTimelineEnd(adjustedEnd);
    }, [selectedPlan?.id, selectedPlan?.startTime, selectedPlan?.endTime, selectedPlan?.timeline, timeline, calculateTimelineRange, ensureTodayIncluded]);

    const zoomIn = useCallback(() => {
        setZoom(prev => Math.min(prev + 2, zoomMax));
    }, []);

    const zoomOut = useCallback(() => {
        setZoom(prev => Math.max(prev - 2, zoomMin));
    }, []);

    const toggleAssembly = useCallback((assemblyId) => {
        setCollapsedAssemblies(prev => {
            const next = new Set(prev);
            if (next.has(assemblyId)) {
                next.delete(assemblyId);
            } else {
                next.add(assemblyId);
            }
            return next;
        });
    }, []);

    const toggleAllAssemblies = useCallback(() => {
        if (allExpanded) {
            const allAssemblyIds = new Set();
            const collectIds = (items) => {
                if (!items) return;
                items.forEach(item => {
                    if (item.type === 'ASSEMBLY') {
                        allAssemblyIds.add(item.id);
                    }
                    if (item.children) {
                        collectIds(item.children);
                    }
                });
            };
            collectIds(parsedStructure?.nodes);
            setCollapsedAssemblies(allAssemblyIds);
        } else {
            setCollapsedAssemblies(new Set());
        }
        setAllExpanded(!allExpanded);
    }, [allExpanded, parsedStructure]);

    const getUnitById = useCallback((unitId) => {
        if (!parsedStructure?.partModels) return null;
        for (const partModel of parsedStructure.partModels) {
            const unit = partModel.units?.find(u => u.id === unitId);
            if (unit) return unit;
        }
        return null;
    }, [parsedStructure]);

    const getMaintenanceType = useCallback((maintenanceTypeId) => {
        if (!parsedStructure?.partModels) return null;
        for (const partModel of parsedStructure.partModels) {
            const mt = partModel.maintenanceTypes?.find(m => m.id === maintenanceTypeId);
            if (mt) return mt;
        }
        return null;
    }, [parsedStructure]);

    const getMaintenanceStats = useCallback((assemblyId, componentId) => {
        const stats = {};

        const assignments = timeline?.unitAssignments?.filter(ua => {
            if (ua.componentOfAssembly?.assemblyId !== assemblyId) return false;
            const path = ua.componentOfAssembly?.componentPath;
            return path && path.includes(componentId);
        }) || [];

        const unitIds = assignments.map(a => a.unitId);

        (timeline?.maintenanceEvents || []).forEach(event => {
            if (unitIds.includes(event.unitId)) {
                const mt = getMaintenanceType(event.maintenanceTypeId);
                const name = mt?.name || event.maintenanceTypeId;
                stats[name] = (stats[name] || 0) + 1;
            }
        });

        return stats;
    }, [timeline, getMaintenanceType]);

    const getAssemblyMaintenanceStats = useCallback((assemblyId) => {
        const stats = {};
        const assignments = timeline?.unitAssignments?.filter(ua =>
            ua.componentOfAssembly?.assemblyId === assemblyId
        ) || [];

        const unitIds = assignments.map(a => a.unitId);

        (timeline?.maintenanceEvents || []).forEach(event => {
            if (unitIds.includes(event.unitId)) {
                const mt = getMaintenanceType(event.maintenanceTypeId);
                const name = mt?.name || event.maintenanceTypeId;
                stats[name] = (stats[name] || 0) + 1;
            }
        });

        return stats;
    }, [timeline, getMaintenanceType]);

    const renderMaintenanceTooltip = useCallback((stats, name = '') => {
        const entries = Object.entries(stats);
        if (entries.length === 0) return 'Нет запланированных работ';

        return (
            <div>
                <div style={{ fontWeight: 'bold', marginBottom: 4 }}>Запланированные работы:</div>
                {entries.map(([typeName, count]) => (
                    <div key={typeName}>{typeName}: {count}</div>
                ))}
            </div>
        );
    }, []);

    const getNodeConstraints = useCallback((nodeId) => {
        let constraintsList = parsedStructure?.nodeConstraints
            || parsedStructure?.constraints
            || parsedStructure?.node_constraints
            || [];

        if (constraintsList && typeof constraintsList === 'object' && !Array.isArray(constraintsList)) {
            const constraint = constraintsList[nodeId];
            if (constraint) {
                return {
                    minWorking: constraint.minWorkingAssemblies ?? constraint.minWorking ?? constraint.working,
                    maxMaintenance: constraint.maxMaintenanceAssemblies ?? constraint.maxMaintenance ?? constraint.maintenance
                };
            }
        }

        if (Array.isArray(constraintsList)) {
            const constraints = constraintsList.find(nc => nc.nodeId === nodeId || nc.node_id === nodeId);
            if (constraints) {
                return {
                    minWorking: constraints.minWorkingAssemblies ?? constraints.minWorking ?? constraints.working,
                    maxMaintenance: constraints.maxMaintenanceAssemblies ?? constraints.maxMaintenance ?? constraints.maintenance
                };
            }
        }

        return null;
    }, [parsedStructure]);

    const { startDate, endDate, timebar } = useMemo(() => {
        const start = timelineStart.startOf('day');
        const end = timelineEnd.endOf('day');

        const months = [];
        let currentMonth = start.clone().startOf('month');

        while (currentMonth.isBefore(end) || currentMonth.isSame(end, 'month')) {
            months.push({
                id: `month-${currentMonth.format('YYYY-MM')}`,
                title: currentMonth.format('MMMM YYYY'),
                start: currentMonth.toDate(),
                end: currentMonth.endOf('month').toDate()
            });
            currentMonth = currentMonth.add(1, 'month');
        }

        const days = [];
        let currentDay = start.clone();

        while (currentDay.isBefore(end) || currentDay.isSame(end, 'day')) {
            days.push({
                id: `day-${currentDay.format('YYYY-MM-DD')}`,
                title: zoom >= 20 ? currentDay.format('D') : '',
                start: currentDay.toDate(),
                end: currentDay.endOf('day').toDate()
            });
            currentDay = currentDay.add(1, 'day');
        }

        const timebarData = [
            {
                id: 'months',
                title: 'Месяцы',
                cells: months,
                style: {},
                useAsGrid: false
            },
            {
                id: 'days',
                title: zoom >= 20 ? 'Дни' : '',
                cells: days,
                style: {},
                useAsGrid: true
            }
        ];

        return {
            startDate: start.toDate(),
            endDate: end.toDate(),
            timebar: timebarData
        };
    }, [timelineStart, timelineEnd, zoom]);

    const tracks = useMemo(() => {
        const result = [];

        const buildTrackTitle = (name, level, itemType, itemId, parentAssemblyId, isOpen) => {
            const indent = level * 24;

            let maintenanceStats = null;
            if (itemType === 'ASSEMBLY') {
                maintenanceStats = getAssemblyMaintenanceStats(itemId);
            } else if (itemType === 'COMPONENT' && parentAssemblyId) {
                maintenanceStats = getMaintenanceStats(parentAssemblyId, itemId);
            }

            const hasMaintenanceInfo = maintenanceStats && Object.keys(maintenanceStats).length > 0;

            const typeIcon = itemType === 'NODE' ? '' : itemType === 'ASSEMBLY' ? '' : '';
            const iconColor = itemType === 'NODE' ? '#1677ff' : itemType === 'ASSEMBLY' ? '#52c41a' : '#8c8c8c';

            return (
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    marginLeft: `${indent}px`
                }}>
                    <span style={{ color: iconColor, fontSize: 12 }}>{typeIcon}</span>
                    <span>{name}</span>
                    {(itemType === 'ASSEMBLY' || itemType === 'COMPONENT') && (
                        <Tooltip
                            title={renderMaintenanceTooltip(maintenanceStats || {})}
                            placement="right"
                        >
                            <QuestionCircleOutlined
                                style={{
                                    color: hasMaintenanceInfo ? '#1890ff' : '#d9d9d9',
                                    cursor: 'help',
                                    fontSize: 12
                                }}
                            />
                        </Tooltip>
                    )}
                </div>
            );
        };

        const traverse = (items, level = 0) => {
            if (!items || !Array.isArray(items)) return;

            items.forEach(item => {
                if (item.type === 'NODE') {
                    let nameWithConstraints = item.name;
                    if (item.constraints && item.constraints.length > 0) {
                        const workingConstraint = item.constraints.find(c => c.type === 'REQUIRED_WORKING');
                        const maintenanceConstraint = item.constraints.find(c => c.type === 'MAX_MAINTENANCE');

                        const minWorking = workingConstraint?.requiredWorking ?? 0;
                        const maxMaintenance = maintenanceConstraint?.maxUnderMaintenance ?? 0;

                        if (minWorking > 0 || maxMaintenance > 0) {
                            nameWithConstraints = `${item.name} (Раб: ${minWorking}; На ТО: ${maxMaintenance})`;
                        }
                    }

                    result.push({
                        id: item.id,
                        title: buildTrackTitle(nameWithConstraints, level, 'NODE', item.id, null, true),
                        level: level,
                        itemType: 'NODE',
                        itemId: item.id,
                        hasChildren: item.children && item.children.length > 0,
                        elements: [],
                        isOpen: true
                    });

                    if (item.children) {
                        traverse(item.children, level + 1);
                    }
                } else if (item.type === 'ASSEMBLY') {
                    const isCollapsed = collapsedAssemblies.has(item.id);

                    let assemblyElements = buildAssemblyStateElements(
                        item.id,
                        timeline,
                        endDate
                    );

                    if (isCollapsed) {
                        const assemblyType = parsedStructure?.assemblyTypes?.find(
                            at => at.id === item.assemblyTypeId
                        );

                        if (assemblyType?.components) {
                            const allMaintenanceElements = [];
                            const allAssignmentElements = [];

                            assemblyType.components.forEach(component => {
                                const assignmentElements = buildUnitAssignmentElements(
                                    component.id,
                                    item.id,
                                    timeline,
                                    getUnitById,
                                    endDate
                                );

                                const maintenanceElements = buildMaintenanceEventElements(
                                    component.id,
                                    item.id,
                                    timeline,
                                    getUnitById,
                                    getMaintenanceType,
                                    endDate
                                );

                                allAssignmentElements.push(...assignmentElements);
                                allMaintenanceElements.push(...maintenanceElements);
                            });

                            const groupedMaintenance = groupOverlappingMaintenanceElements(allMaintenanceElements);

                            allAssignmentElements.forEach((el, idx) => {
                                assemblyElements.push({
                                    ...el,
                                    id: `collapsed-assign-${item.id}-${idx}`,
                                    style: {
                                        ...el.style,
                                        zIndex: 100,
                                        opacity: 0.9
                                    }
                                });
                            });

                            groupedMaintenance.forEach((group, groupIdx) => {
                                if (group.elements.length === 1) {
                                    const el = group.elements[0];
                                    assemblyElements.push({
                                        ...el,
                                        id: `collapsed-maint-${item.id}-${groupIdx}`,
                                        style: {
                                            ...el.style,
                                            zIndex: 50,
                                            opacity: 0.85
                                        }
                                    });
                                } else {
                                    const titles = group.elements.map(el => el.title).filter((t, i, arr) => arr.indexOf(t) === i);
                                    const combinedTitle = titles.join('/');

                                    let longestElement = group.elements[0];
                                    let maxDuration = 0;
                                    group.elements.forEach(el => {
                                        const duration = new Date(el.end).getTime() - new Date(el.start).getTime();
                                        if (duration > maxDuration) {
                                            maxDuration = duration;
                                            longestElement = el;
                                        }
                                    });

                                    const bgColor = longestElement.style?.backgroundColor || '#722ed1';
                                    const textColor = longestElement.style?.color || '#ffffff';

                                    assemblyElements.push({
                                        id: `collapsed-group-${item.id}-${groupIdx}`,
                                        title: combinedTitle,
                                        tooltip: `Группа работ: ${combinedTitle}\nС ${group.start.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}\nДо ${group.end.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}`,
                                        start: group.start,
                                        end: group.end,
                                        style: {
                                            backgroundColor: bgColor,
                                            color: textColor,
                                            border: `2px solid ${bgColor}`,
                                            borderRadius: '4px',
                                            opacity: 0.9,
                                            zIndex: 50
                                        },
                                        meta: {
                                            kind: 'maintenanceEventGroup',
                                            events: group.elements.map(el => el.meta?.event).filter(Boolean)
                                        }
                                    });
                                }
                            });
                        }
                    }

                    result.push({
                        id: item.id,
                        title: buildTrackTitle(item.name, level, 'ASSEMBLY', item.id, null, !isCollapsed),
                        level: level,
                        itemType: 'ASSEMBLY',
                        itemId: item.id,
                        hasChildren: true,
                        elements: assemblyElements,
                        isOpen: !isCollapsed
                    });

                    if (!isCollapsed) {
                        const assemblyType = parsedStructure?.assemblyTypes?.find(
                            at => at.id === item.assemblyTypeId
                        );

                        if (assemblyType?.components) {
                            assemblyType.components.forEach(component => {
                                const componentType = parsedStructure?.componentTypes?.find(
                                    ct => ct.id === component.componentTypeId
                                );

                                const componentName = componentType
                                    ? componentType.name
                                    : `(${component.componentTypeId})`;

                                const assignmentElements = buildUnitAssignmentElements(
                                    component.id,
                                    item.id,
                                    timeline,
                                    getUnitById,
                                    endDate
                                );

                                const maintenanceElements = buildMaintenanceEventElements(
                                    component.id,
                                    item.id,
                                    timeline,
                                    getUnitById,
                                    getMaintenanceType,
                                    endDate
                                );

                                result.push({
                                    id: `${item.id}-${component.id}`,
                                    title: buildTrackTitle(componentName, level + 1, 'COMPONENT', component.id, item.id, false),
                                    level: level + 1,
                                    itemType: 'COMPONENT',
                                    itemId: component.id,
                                    parentAssemblyId: item.id,
                                    elements: [...assignmentElements, ...maintenanceElements],
                                    hasChildren: false,
                                    isOpen: false
                                });
                            });
                        }
                    }
                }
            });
        };

        if (parsedStructure?.nodes) {
            traverse(parsedStructure.nodes);
        }

        return result;
    }, [parsedStructure, collapsedAssemblies, timeline, endDate, getUnitById, getMaintenanceType, getNodeConstraints, getMaintenanceStats, getAssemblyMaintenanceStats, renderMaintenanceTooltip]);

    const handleElementClick = useCallback((element) => {
        if (!element?.meta) return;

        setSelectedEvent(element);
        setEventModalVisible(true);
    }, []);

    const handleCloseModal = useCallback(() => {
        setEventModalVisible(false);
        setSelectedEvent(null);
    }, []);

    const handleDeleteEvent = useCallback(() => {
        if (!selectedEvent?.meta || isGenerating) {
            message.warning('Нельзя удалять события во время генерации');
            return;
        }

        const { kind, event, state, assignment } = selectedEvent.meta;

        let newTimeline = JSON.parse(JSON.stringify(timeline));
        let deleted = false;

        if (kind === 'maintenanceEvent' && event) {
            if (newTimeline.maintenanceEvents) {
                const idx = newTimeline.maintenanceEvents.findIndex(me =>
                    me.maintenanceTypeId === event.maintenanceTypeId &&
                    me.unitId === event.unitId &&
                    me.dateTime === event.dateTime
                );
                if (idx !== -1) {
                    newTimeline.maintenanceEvents.splice(idx, 1);
                    deleted = true;
                }
            }
        } else if (kind === 'assemblyState' && state) {
            if (Array.isArray(newTimeline.assemblyStates)) {
                const idx = newTimeline.assemblyStates.findIndex(s =>
                    s.assemblyId === state.assemblyId &&
                    s.type === state.type &&
                    s.dateTime === state.dateTime
                );
                if (idx !== -1) {
                    newTimeline.assemblyStates.splice(idx, 1);
                    deleted = true;
                }
            } else if (newTimeline.assemblyStates && state.assemblyId) {
                const assemblyStates = newTimeline.assemblyStates[state.assemblyId];
                if (assemblyStates) {
                    const idx = assemblyStates.findIndex(s =>
                        s.type === state.type && s.dateTime === state.dateTime
                    );
                    if (idx !== -1) {
                        assemblyStates.splice(idx, 1);
                        deleted = true;
                    }
                }
            }
        } else if (kind === 'unitAssignment' && assignment) {
            if (newTimeline.unitAssignments) {
                const idx = newTimeline.unitAssignments.findIndex(ua =>
                    ua.unitId === assignment.unitId &&
                    ua.dateTime === assignment.dateTime
                );
                if (idx !== -1) {
                    newTimeline.unitAssignments.splice(idx, 1);
                    deleted = true;
                }
            }
        }

        if (deleted) {
            if (onTimelineUpdate) {
                onTimelineUpdate(newTimeline);
            }
            message.success('Событие удалено');
            handleCloseModal();
        } else {
            message.error('Не удалось найти событие для удаления');
        }
    }, [selectedEvent, timeline, isGenerating, onTimelineUpdate, handleCloseModal]);

    const renderEventInfo = () => {
        if (!selectedEvent?.meta) return null;

        const { kind, event, state, unit, maintenanceType, assemblyId, componentId } = selectedEvent.meta;

        const findAssemblyName = (id) => {
            const findInNodes = (nodes) => {
                if (!nodes) return null;
                for (const node of nodes) {
                    if (node.type === 'ASSEMBLY' && node.id === id) {
                        return node.name;
                    }
                    if (node.children) {
                        const found = findInNodes(node.children);
                        if (found) return found;
                    }
                }
                return null;
            };
            return findInNodes(parsedStructure?.nodes) || id;
        };

        const findComponentName = (assemblyId, componentId) => {
            const assemblyType = parsedStructure?.assemblyTypes?.find(at => {
                const findAssembly = (nodes) => {
                    if (!nodes) return null;
                    for (const node of nodes) {
                        if (node.type === 'ASSEMBLY' && node.id === assemblyId) {
                            return node.assemblyTypeId;
                        }
                        if (node.children) {
                            const found = findAssembly(node.children);
                            if (found) return found;
                        }
                    }
                    return null;
                };
                return at.id === findAssembly(parsedStructure?.nodes);
            });

            const component = assemblyType?.components?.find(c => c.id === componentId);
            return component?.name || componentId;
        };

        if (kind === 'maintenanceEvent') {
            return (
                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Тип">Работа по ТО</Descriptions.Item>
                    <Descriptions.Item label="Вид работ">{maintenanceType?.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Деталь">{unit?.name || '-'} ({unit?.serialNumber || '-'})</Descriptions.Item>
                    <Descriptions.Item label="Агрегат">{findAssemblyName(assemblyId)}</Descriptions.Item>
                    <Descriptions.Item label="Компонент">{findComponentName(assemblyId, componentId)}</Descriptions.Item>
                    <Descriptions.Item label="Начало работ">{event?.dateTime ? dayjs(event.dateTime).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                    <Descriptions.Item label="Длительность, дней">{maintenanceType?.duration || '-'}</Descriptions.Item>
                </Descriptions>
            );
        }

        if (kind === 'assemblyState') {
            const stateNames = {
                WORKING: 'Работает',
                IDLE: 'Простой',
                MAINTENANCE: 'На ТО',
                RESERVE: 'Резерв',
                UNAVAILABLE: 'Недоступен'
            };
            return (
                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Тип">Состояние агрегата</Descriptions.Item>
                    <Descriptions.Item label="Состояние">{stateNames[state?.type] || state?.type}</Descriptions.Item>
                    <Descriptions.Item label="Агрегат">{findAssemblyName(assemblyId)}</Descriptions.Item>
                    <Descriptions.Item label="Дата начала">{state?.dateTime ? dayjs(state.dateTime).format('YYYY-MM-DD HH:mm') : '-'}</Descriptions.Item>
                </Descriptions>
            );
        }

        if (kind === 'unitAssignment') {
            return (
                <Descriptions column={1} bordered size="small">
                    <Descriptions.Item label="Тип">Назначение детали</Descriptions.Item>
                    <Descriptions.Item label="Деталь">{unit?.name || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Серийный номер">{unit?.serialNumber || '-'}</Descriptions.Item>
                    <Descriptions.Item label="Агрегат">{findAssemblyName(assemblyId)}</Descriptions.Item>
                    <Descriptions.Item label="Компонент">{findComponentName(assemblyId, componentId)}</Descriptions.Item>
                </Descriptions>
            );
        }

        return null;
    };

    if (!parsedStructure || tracks.length === 0) {
        return (
            <div className="timeline-view">
                <div className="timeline-empty">
                    <p style={{ color: '#8c8c8c', textAlign: 'center', padding: '40px' }}>
                        Структура проекта пуста. Перейдите на вкладку "Конфигуратор" для создания структуры.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="timeline-view">
            <div className="timeline-header">
                <div className="timeline-controls">
                    <span className="timeline-title">
                        Управление:
                    </span>
                    <Space size="small" wrap>
                        <Space size="small">
                            <span style={{ fontSize: 12 }}>Начало:</span>
                            <DatePicker
                                value={timelineStart}
                                onChange={(date) => date && setTimelineStart(date)}
                                format="DD.MM.YYYY"
                                placeholder="Дата начала"
                                size="small"
                            />
                        </Space>

                        <Space size="small">
                            <span style={{ fontSize: 12 }}>Конец:</span>
                            <DatePicker
                                value={timelineEnd}
                                onChange={(date) => date && setTimelineEnd(date)}
                                format="DD.MM.YYYY"
                                placeholder="Дата окончания"
                                size="small"
                                disabledDate={(current) => current && current.isBefore(timelineStart, 'day')}
                            />
                        </Space>

                        <Space size="small">
                            <span style={{ fontSize: 12 }}>Перейти к:</span>
                            <DatePicker
                                format="DD.MM.YYYY"
                                placeholder="Выберите дату"
                                size="small"
                                onChange={(date) => {
                                    if (date) {
                                        const container = document.querySelector('.timeline-container');
                                        if (container) {
                                            const start = timelineStart.toDate();
                                            const end = timelineEnd.toDate();
                                            const targetDate = date.toDate();
                                            const totalMs = end.getTime() - start.getTime();
                                            const targetMs = targetDate.getTime() - start.getTime();
                                            const percentage = targetMs / totalMs;

                                            if (percentage >= 0 && percentage <= 1) {
                                                const scrollLeft = container.scrollWidth * percentage - container.clientWidth / 2;
                                                container.scrollTo({
                                                    left: Math.max(0, scrollLeft),
                                                    behavior: 'smooth'
                                                });
                                            }
                                        }
                                    }
                                }}
                                disabledDate={(current) => {
                                    if (!current) return false;
                                    return current.isBefore(timelineStart, 'day') || current.isAfter(timelineEnd, 'day');
                                }}
                            />
                        </Space>

                        <Button
                            size="small"
                            icon={allExpanded ? <CompressOutlined /> : <ExpandOutlined />}
                            onClick={toggleAllAssemblies}
                        >
                            {allExpanded ? 'Свернуть все' : 'Развернуть все'}
                        </Button>

                        <Button
                            size="small"
                            icon={<ZoomInOutlined />}
                            onClick={zoomIn}
                            disabled={zoom >= zoomMax}
                        >
                            Увеличить
                        </Button>

                        <Button
                            size="small"
                            icon={<ZoomOutOutlined />}
                            onClick={zoomOut}
                            disabled={zoom <= zoomMin}
                        >
                            Уменьшить
                        </Button>

                        <span style={{ color: '#8c8c8c', fontSize: 12, marginLeft: 8 }}>
                            Масштаб: {zoom}
                        </span>
                    </Space>
                </div>
            </div>

            <div
                className="timeline-top-scrollbar"
                ref={(el) => {
                    if (el) {
                        el.onscroll = () => {
                            const container = document.querySelector('.timeline-container');
                            if (container) container.scrollLeft = el.scrollLeft;
                        };
                    }
                }}
            >
                <div
                    className="timeline-top-scrollbar-inner"
                    ref={(el) => {
                        if (el) {
                            const updateWidth = () => {
                                const container = document.querySelector('.timeline-container');
                                if (container) {
                                    el.style.width = container.scrollWidth + 'px';
                                }
                            };
                            updateWidth();
                            setTimeout(updateWidth, 500);
                            setTimeout(updateWidth, 1000);
                        }
                    }}
                />
            </div>

            <div
                className={`timeline-container ${zoom < 20 ? 'hide-days-text' : ''}`}
                ref={(el) => {
                    if (el) {
                        el.onscroll = () => {
                            const topScrollbar = document.querySelector('.timeline-top-scrollbar');
                            if (topScrollbar) topScrollbar.scrollLeft = el.scrollLeft;
                        };
                    }
                }}
            >
                <Timeline
                    scale={{
                        start: startDate,
                        end: endDate,
                        zoom: zoom,
                        zoomMin: zoomMin,
                        zoomMax: zoomMax
                    }}
                    isOpen={true}
                    toggleOpen={() => {}}
                    zoomIn={zoomIn}
                    zoomOut={zoomOut}
                    clickElement={(element) => handleElementClick(element)}
                    clickTrackButton={(trackId) => {
                        const track = tracks.find(t => t.id === trackId);
                        if (track && track.itemType === 'ASSEMBLY') {
                            toggleAssembly(track.itemId);
                        }
                    }}
                    toggleTrackOpen={(track) => {
                        if (track.itemType === 'ASSEMBLY') {
                            toggleAssembly(track.itemId);
                        }
                    }}
                    timebar={timebar}
                    tracks={tracks}
                    now={new Date()}
                    enableSticky={true}
                    scrollToNow={true}
                />
            </div>

            <Modal
                title="Информация о событии"
                open={eventModalVisible}
                onCancel={handleCloseModal}
                footer={[
                    <Button key="close" onClick={handleCloseModal}>
                        Закрыть
                    </Button>,
                    <Popconfirm
                        key="delete"
                        title="Удалить событие?"
                        description="Это действие нельзя отменить"
                        onConfirm={handleDeleteEvent}
                        okText="Да, удалить"
                        cancelText="Отмена"
                        okButtonProps={{ danger: true }}
                        disabled={isGenerating}
                    >
                        <Button danger disabled={isGenerating}>
                            Удалить
                        </Button>
                    </Popconfirm>
                ]}
            >
                {renderEventInfo()}
            </Modal>
        </div>
    );
};

export default TimelineView;