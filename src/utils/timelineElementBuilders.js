/**
 * Нормализация ID юнита
 */
export const normalizeUnitId = (unitId) => {
    if (typeof unitId !== 'string') return unitId;
    return unitId.startsWith('component-')
        ? unitId.replace('component-', '')
        : unitId;
};

/**
 * Получить цвет состояния агрегата
 */
export const getStateColor = (stateType) => {
    const colors = {
        'WORKING': '#52c41a',
        'IDLE': '#faad14',
        'SHUTTING_DOWN': '#ff4d4f',
        'STARTING_UP': '#1890ff',
        'MAINTENANCE': '#8c8c8c'
    };
    return colors[stateType] || '#d9d9d9';
};

/**
 * Получить цвет для типа ТО
 */
export const getMaintenanceColor = (maintenanceType) => {
    if (maintenanceType?.color) {
        return maintenanceType.color;
    }
    return '#8c8c8c';
};

/**
 * Получить контрастный цвет текста
 */
export const getContrastTextColor = (bgColor) => {
    if (!bgColor) return '#000000';

    const color = bgColor.replace('#', '');

    const r = parseInt(color.substr(0, 2), 16);
    const g = parseInt(color.substr(2, 2), 16);
    const b = parseInt(color.substr(4, 2), 16);

    const brightness = (r * 299 + g * 587 + b * 114) / 1000;

    return brightness > 128 ? '#000000' : '#ffffff';
};

/**
 * Названия состояний агрегатов
 */
export const STATE_NAMES = {
    'WORKING': 'Работает',
    'IDLE': 'Простой',
    'SHUTTING_DOWN': 'Останов',
    'STARTING_UP': 'Пуск',
    'MAINTENANCE': 'ТО'
};

/**
 * Построение элементов состояний агрегата
 */
export const buildAssemblyStateElements = (assemblyId, timeline, fallbackEndDate) => {
    const assemblyStates = timeline.assemblyStates?.filter(
        state => state.assemblyId === assemblyId
    ) || [];

    if (assemblyStates.length === 0) return [];

    const elements = [];

    assemblyStates.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    assemblyStates.forEach((state, index) => {
        const stateStart = new Date(state.dateTime);
        const stateEnd = assemblyStates[index + 1]
            ? new Date(assemblyStates[index + 1].dateTime)
            : fallbackEndDate;

        const startDateStr = stateStart.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });
        const endDateStr = stateEnd.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });

        elements.push({
            id: `state-${assemblyId}-${index}`,
            title: STATE_NAMES[state.type] || state.type,
            tooltip: `${STATE_NAMES[state.type] || state.type}\nС ${startDateStr}\nДо ${endDateStr}`,
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
                assemblyId
            }
        });
    });

    return elements;
};

/**
 * Построение элементов назначений юнитов
 */
export const buildUnitAssignmentElements = (
    componentId,
    assemblyId,
    timeline,
    getUnitById,
    fallbackEndDate
) => {
    const componentAssignments = timeline.unitAssignments?.filter(ua =>
        ua.componentOfAssembly?.assemblyId === assemblyId &&
        ua.componentOfAssembly?.componentPath?.includes(componentId)
    ) || [];

    if (componentAssignments.length === 0) return [];

    const elements = [];

    componentAssignments.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

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

            elements.push({
                id: `assignment-${assignment.unitId}-${index}`,
                title: '◆',
                tooltip: `Замена: ${unit.name} (${unit.serialNumber || 'б/н'}) - ${dateStr}${operatingIntervalText}`,
                start: assignmentDate,
                end: markerEnd,
                style: {
                    backgroundColor: '#003a8c',
                    color: '#ffffff',
                    border: '2px solid #001529',
                    borderRadius: '2px',
                    fontWeight: 'bold',
                    fontSize: '16px',
                    textAlign: 'center',
                    zIndex: 100
                },
                meta: {
                    kind: 'unitAssignment',
                    assignment,
                    unit,
                    assemblyId,
                    componentId
                }
            });
        }
    });

    return elements;
};

/**
 * Построение элементов работ ТО
 */
export const buildMaintenanceEventElements = (
    componentId,
    assemblyId,
    timeline,
    getUnitById,
    getMaintenanceType,
    fallbackEndDate
) => {
    const componentAssignments = timeline.unitAssignments?.filter(ua =>
        ua.componentOfAssembly?.assemblyId === assemblyId &&
        ua.componentOfAssembly?.componentPath?.includes(componentId)
    ) || [];

    if (componentAssignments.length === 0) return [];

    const elements = [];

    componentAssignments.sort((a, b) => new Date(a.dateTime) - new Date(b.dateTime));

    componentAssignments.forEach((assignment, assignmentIndex) => {
        const assignmentDate = new Date(assignment.dateTime);
        const assignmentEnd = componentAssignments[assignmentIndex + 1]
            ? new Date(componentAssignments[assignmentIndex + 1].dateTime)
            : fallbackEndDate;

        const maintenanceEvents = (timeline.maintenanceEvents || []).filter((me) => {
            if (me.unitId !== assignment.unitId) return false;

            const eventTime = new Date(me.dateTime).getTime();
            const assignTime = assignmentDate.getTime();

            if (Number.isNaN(eventTime)) {
                return false;
            }

            return eventTime >= assignTime && eventTime < assignmentEnd.getTime();
        });

        const groupedEvents = groupOverlappingEvents(maintenanceEvents, getMaintenanceType);

        groupedEvents.forEach((group, groupIndex) => {
            const uniqueKey = `${assemblyId}-${componentId}-${assignmentIndex}-${groupIndex}`;

            if (group.length === 1) {
                const event = group[0];
                const maintenanceType = getMaintenanceType(event.maintenanceTypeId);

                if (maintenanceType) {
                    const eventStart = new Date(event.dateTime);
                    const eventEnd = new Date(
                        eventStart.getTime() + maintenanceType.duration * 24 * 60 * 60 * 1000
                    );

                    const eventStartStr = eventStart.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short'
                    });
                    const eventEndStr = eventEnd.toLocaleDateString('ru-RU', {
                        day: 'numeric',
                        month: 'short'
                    });

                    elements.push({
                        id: `maintenance-${uniqueKey}`,
                        title: maintenanceType.name,
                        tooltip: `${maintenanceType.name}${event.custom ? ' [Внеплановое]' : ''}\nС ${eventStartStr}\nДо ${eventEndStr}\nДлительность: ${maintenanceType.duration} дн.`,
                        start: eventStart,
                        end: eventEnd,
                        style: {
                            backgroundColor: getMaintenanceColor(maintenanceType),
                            color: getContrastTextColor(getMaintenanceColor(maintenanceType)),
                            border: `2px solid ${getMaintenanceColor(maintenanceType)}`,
                            borderRadius: '4px',
                            opacity: event.custom ? 0.7 : 0.9,
                            zIndex: 50
                        },
                        meta: {
                            kind: 'maintenanceEvent',
                            event,
                            unit: getUnitById(assignment.unitId),
                            assemblyId,
                            componentId,
                            maintenanceType
                        }
                    });
                }
            } else {
                const groupStart = new Date(Math.min(...group.map(e => new Date(e.dateTime).getTime())));
                const groupEnd = new Date(Math.max(...group.map(e => {
                    const mt = getMaintenanceType(e.maintenanceTypeId);
                    const start = new Date(e.dateTime);
                    return start.getTime() + (mt?.duration || 0) * 24 * 60 * 60 * 1000;
                })));

                const groupStartStr = groupStart.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                });
                const groupEndStr = groupEnd.toLocaleDateString('ru-RU', {
                    day: 'numeric',
                    month: 'short'
                });

                const eventNames = group.map(e => {
                    const mt = getMaintenanceType(e.maintenanceTypeId);
                    return mt?.name || 'ТО';
                });

                const uniqueNames = [...new Set(eventNames)];

                elements.push({
                    id: `maintenance-group-${uniqueKey}`,
                    title: uniqueNames.join('/'),
                    tooltip: `Группа работ: ${uniqueNames.join(', ')}\nС ${groupStartStr}\nДо ${groupEndStr}`,
                    start: groupStart,
                    end: groupEnd,
                    style: {
                        backgroundColor: '#722ed1',
                        color: '#ffffff',
                        border: '2px solid #531dab',
                        borderRadius: '4px',
                        opacity: 0.85,
                        zIndex: 50
                    },
                    meta: {
                        kind: 'maintenanceEventGroup',
                        events: group,
                        unit: getUnitById(assignment.unitId),
                        assemblyId,
                        componentId
                    }
                });
            }
        });
    });

    return elements;
};

/**
 * Группировка пересекающихся событий ТО
 */
const groupOverlappingEvents = (events, getMaintenanceType) => {
    if (events.length === 0) return [];

    const sortedEvents = [...events].sort(
        (a, b) => new Date(a.dateTime) - new Date(b.dateTime)
    );

    const groups = [];
    let currentGroup = [sortedEvents[0]];

    for (let i = 1; i < sortedEvents.length; i++) {
        const currentEvent = sortedEvents[i];
        const lastEventInGroup = currentGroup[currentGroup.length - 1];

        const lastEventType = getMaintenanceType(lastEventInGroup.maintenanceTypeId);
        const lastEventEnd = new Date(
            new Date(lastEventInGroup.dateTime).getTime() +
            (lastEventType?.duration || 0) * 24 * 60 * 60 * 1000
        );

        const currentEventStart = new Date(currentEvent.dateTime);

        if (currentEventStart < lastEventEnd) {
            currentGroup.push(currentEvent);
        } else {
            groups.push(currentGroup);
            currentGroup = [currentEvent];
        }
    }

    groups.push(currentGroup);

    return groups;
};

/**
 * Построение элементов ошибок валидации для конкретной ноды
 * @param {Array} validations - массив validations из timeline
 * @param {string} nodeId - ID ноды для фильтрации
 * @param {Date} timelineStart - начало видимого диапазона
 * @param {Date} timelineEnd - конец видимого диапазона
 */
export const buildValidationErrorElements = (validations, nodeId, timelineStart, timelineEnd) => {
    if (!validations || !Array.isArray(validations) || !nodeId) {
        return [];
    }

    const elements = [];

    const nodeValidation = validations.find(v =>
        v.validatedCondition?.nodeId === nodeId
    );

    if (!nodeValidation || !nodeValidation.actualStates) {
        return [];
    }

    const condition = nodeValidation.validatedCondition?.condition;
    const requiredWorking = condition?.requiredWorking || 0;

    const falseStates = nodeValidation.actualStates.filter(state => state.valid === false);

    falseStates.forEach((state, stateIndex) => {
        const dateStart = new Date(state.date + 'T00:00:00');
        const dateEnd = new Date(state.date + 'T23:59:59');

        if (timelineStart && dateStart < timelineStart) return;
        if (timelineEnd && dateEnd > timelineEnd) return;

        const dateStr = dateStart.toLocaleDateString('ru-RU', {
            day: 'numeric',
            month: 'short'
        });

        const actual = state.actual?.working || 0;

        elements.push({
            id: `validation-error-${nodeId}-${stateIndex}-${state.date}`,
            title: `${actual}`,
            tooltip: `Нарушение: ${dateStr}\nРаботает: ${actual} (нужно: ${requiredWorking})`,
            start: dateStart,
            end: dateEnd,
            style: {
                backgroundColor: 'rgba(255, 77, 79, 0.4)',
                color: '#ffffff',
                border: '1px solid #ff4d4f',
                borderRadius: '2px',
                fontWeight: 'bold',
                fontSize: '10px',
                textAlign: 'center',
                zIndex: 150
            },
            meta: {
                kind: 'validationError',
                date: state.date,
                actual: state.actual,
                nodeId: nodeId,
                required: requiredWorking
            }
        });
    });

    return elements;
};

/**
 * Подсчёт количества нарушений для ноды
 */
export const countValidationErrors = (validations, nodeId) => {
    if (!validations || !Array.isArray(validations) || !nodeId) {
        return 0;
    }

    const nodeValidation = validations.find(v =>
        v.validatedCondition?.nodeId === nodeId
    );

    if (!nodeValidation || !nodeValidation.actualStates) {
        return 0;
    }

    return nodeValidation.actualStates.filter(state => state.valid === false).length;
};