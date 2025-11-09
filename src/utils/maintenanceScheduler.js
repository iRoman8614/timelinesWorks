import dayjs from 'dayjs';

/**
 * Генерирует план технического обслуживания на основе данных проекта
 * Имитация работы бэкенда-оптимизатора
 *
 * @param {Object} project - Объект проекта
 * @returns {Object} Обновленный объект timeline с новым планом
 */
export const generateMaintenancePlan = (project) => {
    if (!project || !project.timeline) {
        throw new Error('Некорректный проект');
    }

    const timeline = project.timeline;

    // Сохраняем только custom события (внеплановые работы)
    const customMaintenanceEvents = (timeline.maintenanceEvents || []).filter(
        event => event.custom === true
    );

    const customUnitAssignments = (timeline.unitAssignments || []).filter(
        assignment => assignment.custom === true
    );

    // Получаем все агрегаты из структуры узлов
    const assemblies = getAllAssemblies(project.nodes || []);

    // Генерируем assemblyStates на основе maintenance events
    const assemblyStates = generateAssemblyStates(
        assemblies,
        customMaintenanceEvents,
        project,
        timeline
    );

    // Генерируем запланированные maintenance events на основе интервалов
    const scheduledMaintenanceEvents = generateScheduledMaintenanceEvents(
        project,
        timeline
    );

    // Объединяем custom и запланированные события
    const allMaintenanceEvents = [
        ...customMaintenanceEvents,
        ...scheduledMaintenanceEvents
    ].sort((a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf());

    return {
        start: timeline.start || '2025-01-01',
        end: timeline.end || '2025-12-31',
        assemblyStates: assemblyStates,
        unitAssignments: timeline.unitAssignments || [],
        maintenanceEvents: allMaintenanceEvents
    };
};

/**
 * Рекурсивно собирает все агрегаты из дерева узлов
 */
const getAllAssemblies = (nodes) => {
    const assemblies = [];

    const traverse = (items) => {
        items.forEach(item => {
            if (item.type === 'ASSEMBLY' && item.assemblyTypeId) {
                assemblies.push(item);
            }
            if (item.children) {
                traverse(item.children);
            }
        });
    };

    traverse(nodes);
    return assemblies;
};

/**
 * Генерирует состояния агрегатов на основе событий ТО
 */
const generateAssemblyStates = (assemblies, maintenanceEvents, project, timeline) => {
    const states = [];
    const timelineStart = dayjs(timeline.start || '2025-01-01');
    const timelineEnd = dayjs(timeline.end || '2025-12-31');

    assemblies.forEach(assembly => {
        // Находим все компоненты агрегата
        const assemblyType = project.assemblyTypes?.find(
            at => at.id === assembly.assemblyTypeId
        );

        if (!assemblyType) return;

        // Находим все units, назначенные на компоненты этого агрегата
        const assemblyUnits = getAssemblyUnits(assembly, timeline, project);

        // Находим все maintenance события для units этого агрегата
        const assemblyMaintenanceEvents = maintenanceEvents.filter(event =>
            assemblyUnits.some(unit => unit.id === event.unitId)
        );

        // Сортируем события по времени
        const sortedEvents = assemblyMaintenanceEvents.sort(
            (a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf()
        );

        // Начальное состояние - WORKING
        states.push({
            assemblyId: assembly.id,
            type: 'WORKING',
            dateTime: timelineStart.format('YYYY-MM-DDTHH:mm:ss')
        });

        // Генерируем состояния для каждого ТО
        sortedEvents.forEach(event => {
            const maintenanceType = getMaintenanceType(event.maintenanceTypeId, project);
            if (!maintenanceType) return;

            const eventStart = dayjs(event.dateTime);

            // 1 день до ТО - SHUTTING_DOWN
            const shutdownTime = eventStart.subtract(1, 'day');
            if (shutdownTime.isAfter(timelineStart)) {
                states.push({
                    assemblyId: assembly.id,
                    type: 'SHUTTING_DOWN',
                    dateTime: shutdownTime.format('YYYY-MM-DDTHH:mm:ss')
                });
            }

            // Начало ТО - IDLE
            states.push({
                assemblyId: assembly.id,
                type: 'IDLE',
                dateTime: eventStart.format('YYYY-MM-DDTHH:mm:ss')
            });

            // Окончание ТО - STARTING_UP (1 день)
            const maintenanceEnd = eventStart.add(maintenanceType.duration, 'day');
            states.push({
                assemblyId: assembly.id,
                type: 'STARTING_UP',
                dateTime: maintenanceEnd.format('YYYY-MM-DDTHH:mm:ss')
            });

            // Возврат к работе - WORKING
            const workingTime = maintenanceEnd.add(1, 'day');
            if (workingTime.isBefore(timelineEnd)) {
                states.push({
                    assemblyId: assembly.id,
                    type: 'WORKING',
                    dateTime: workingTime.format('YYYY-MM-DDTHH:mm:ss')
                });
            }
        });
    });

    return states.sort((a, b) => {
        // Сортируем по времени, а при равенстве по assemblyId
        const timeDiff = dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf();
        if (timeDiff !== 0) return timeDiff;
        return a.assemblyId.localeCompare(b.assemblyId);
    });
};

/**
 * Получает все units для агрегата
 */
const getAssemblyUnits = (assembly, timeline, project) => {
    const unitIds = new Set();

    // Находим все назначения для этого агрегата
    (timeline.unitAssignments || []).forEach(assignment => {
        if (assignment.componentOfAssembly?.assemblyId === assembly.id) {
            unitIds.add(assignment.unitId);
        }
    });

    // Находим полную информацию о units
    const units = [];
    project.partModels?.forEach(pm => {
        (pm.units || []).forEach(unit => {
            if (unitIds.has(unit.id)) {
                units.push(unit);
            }
        });
    });

    return units;
};

/**
 * Получает MaintenanceType по ID
 */
const getMaintenanceType = (maintenanceTypeId, project) => {
    let found = null;
    project.partModels?.forEach(pm => {
        (pm.maintenanceTypes || []).forEach(mt => {
            if (mt.id === maintenanceTypeId) {
                found = mt;
            }
        });
    });
    return found;
};

/**
 * Генерирует запланированные события ТО на основе интервалов
 * (Упрощенная версия - в реальности будет оптимизатор)
 */
const generateScheduledMaintenanceEvents = (project, timeline) => {
    const events = [];
    const timelineStart = dayjs(timeline.start || '2025-01-01');
    const timelineEnd = dayjs(timeline.end || '2025-12-31');

    // Для каждого назначенного unit генерируем события по интервалам
    (timeline.unitAssignments || []).forEach(assignment => {
        const assignmentDate = dayjs(assignment.dateTime);

        // Находим unit и его maintenance types
        const unit = findUnit(assignment.unitId, project);
        if (!unit) return;

        const partModel = project.partModels?.find(pm =>
            pm.id === unit.partModelId
        );
        if (!partModel) return;

        // Генерируем события для каждого типа ТО
        (partModel.maintenanceTypes || []).forEach(maintenanceType => {
            let currentDate = assignmentDate.clone();

            // Генерируем события с интервалом
            while (currentDate.isBefore(timelineEnd)) {
                // Первое ТО - через interval дней после назначения
                currentDate = currentDate.add(maintenanceType.interval, 'day');

                if (currentDate.isAfter(timelineStart) && currentDate.isBefore(timelineEnd)) {
                    events.push({
                        maintenanceTypeId: maintenanceType.id,
                        unitId: unit.id,
                        dateTime: currentDate.format('YYYY-MM-DDTHH:mm:ss'),
                        custom: false
                    });
                }
            }
        });
    });

    return events;
};

/**
 * Находит unit по ID
 */
const findUnit = (unitId, project) => {
    let found = null;
    project.partModels?.forEach(pm => {
        (pm.units || []).forEach(unit => {
            if (unit.id === unitId) {
                found = unit;
            }
        });
    });
    return found;
};