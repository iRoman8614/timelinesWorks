// import dayjs from 'dayjs';
//
// /**
//  * Генерирует план технического обслуживания на основе данных проекта
//  * Имитация работы бэкенда-оптимизатора
//  *
//  * @param {Object} project - Объект проекта
//  * @returns {Object} Обновленный объект timeline с новым планом
//  */
// export const generateMaintenancePlan = (project) => {
//     if (!project || !project.timeline) {
//         throw new Error('Некорректный проект');
//     }
//
//     const timeline = project.timeline;
//
//     // Сохраняем только custom события (внеплановые работы)
//     const customMaintenanceEvents = (timeline.maintenanceEvents || []).filter(
//         event => event.custom === true
//     );
//
//     // Получаем все агрегаты из структуры узлов
//     const assemblies = getAllAssemblies(project.nodes || []);
//
//     // Генерируем assemblyStates на основе ТОЛЬКО custom maintenance events
//     const assemblyStates = generateAssemblyStates(
//         assemblies,
//         customMaintenanceEvents,
//         project,
//         timeline
//     );
//
//     return {
//         start: timeline.start || '2025-01-01',
//         end: timeline.end || '2025-12-31',
//         assemblyStates: assemblyStates,
//         unitAssignments: timeline.unitAssignments || [],
//         maintenanceEvents: customMaintenanceEvents
//     };
// };
//
// /**
//  * Рекурсивно собирает все агрегаты из дерева узлов
//  */
// const getAllAssemblies = (nodes) => {
//     const assemblies = [];
//
//     const traverse = (items) => {
//         items.forEach(item => {
//             if (item.type === 'ASSEMBLY' && item.assemblyTypeId) {
//                 assemblies.push(item);
//             }
//             if (item.children) {
//                 traverse(item.children);
//             }
//         });
//     };
//
//     traverse(nodes);
//     return assemblies;
// };
//
// /**
//  * Генерирует состояния агрегатов на основе событий ТО
//  * Создает реалистичные простои с учетом custom работ
//  */
// const generateAssemblyStates = (assemblies, maintenanceEvents, project, timeline) => {
//     const states = [];
//     const timelineStart = dayjs(timeline.start || '2025-01-01');
//     const timelineEnd = dayjs(timeline.end || '2025-12-31');
//
//     assemblies.forEach(assembly => {
//         const assemblyType = project.assemblyTypes?.find(
//             at => at.id === assembly.assemblyTypeId
//         );
//
//         if (!assemblyType) return;
//
//         // Находим все maintenance события для этого агрегата (включая виртуальные unitId)
//         const assemblyMaintenanceEvents = getMaintenanceEventsForAssembly(
//             assembly,
//             maintenanceEvents,
//             assemblyType,
//             timeline,
//             project
//         );
//
//         if (assemblyMaintenanceEvents.length === 0) {
//             // Если нет работ, агрегат просто работает весь период
//             states.push({
//                 assemblyId: assembly.id,
//                 type: 'WORKING',
//                 dateTime: timelineStart.format('YYYY-MM-DDTHH:mm:ss')
//             });
//             return;
//         }
//
//         // Группируем работы в простои
//         const idlePeriods = groupEventsIntoIdlePeriods(
//             assemblyMaintenanceEvents,
//             project,
//             timelineStart,
//             timelineEnd
//         );
//
//         // Начальное состояние - WORKING
//         states.push({
//             assemblyId: assembly.id,
//             type: 'WORKING',
//             dateTime: timelineStart.format('YYYY-MM-DDTHH:mm:ss')
//         });
//
//         // Генерируем состояния для каждого простоя
//         idlePeriods.forEach(period => {
//             const idleStart = dayjs(period.start);
//             const idleEnd = dayjs(period.end);
//
//             // Случайный интервал для SHUTTING_DOWN (0.5-1.5 секунды в виде минут для наглядности)
//             const shutdownDelay = Math.floor(Math.random() * 61) + 30; // 30-90 минут = 0.5-1.5 часа
//             const shutdownTime = idleStart.subtract(1, 'day').add(shutdownDelay, 'minute');
//
//             if (shutdownTime.isAfter(timelineStart)) {
//                 states.push({
//                     assemblyId: assembly.id,
//                     type: 'SHUTTING_DOWN',
//                     dateTime: shutdownTime.format('YYYY-MM-DDTHH:mm:ss')
//                 });
//             }
//
//             // Случайный интервал для IDLE
//             const idleDelay = Math.floor(Math.random() * 61) + 30;
//             states.push({
//                 assemblyId: assembly.id,
//                 type: 'IDLE',
//                 dateTime: idleStart.add(idleDelay, 'minute').format('YYYY-MM-DDTHH:mm:ss')
//             });
//
//             // Случайный интервал для STARTING_UP
//             const startupDelay = Math.floor(Math.random() * 61) + 30;
//             states.push({
//                 assemblyId: assembly.id,
//                 type: 'STARTING_UP',
//                 dateTime: idleEnd.add(startupDelay, 'minute').format('YYYY-MM-DDTHH:mm:ss')
//             });
//
//             // Случайный интервал для возврата к WORKING
//             const workingDelay = Math.floor(Math.random() * 61) + 30;
//             const workingTime = idleEnd.add(1, 'day').add(workingDelay, 'minute');
//
//             if (workingTime.isBefore(timelineEnd)) {
//                 states.push({
//                     assemblyId: assembly.id,
//                     type: 'WORKING',
//                     dateTime: workingTime.format('YYYY-MM-DDTHH:mm:ss')
//                 });
//             }
//         });
//     });
//
//     return states.sort((a, b) => {
//         const timeDiff = dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf();
//         if (timeDiff !== 0) return timeDiff;
//         return a.assemblyId.localeCompare(b.assemblyId);
//     });
// };
//
// /**
//  * Находит все maintenance события для агрегата
//  * Включая события с виртуальным unitId (component-{id})
//  */
// const getMaintenanceEventsForAssembly = (assembly, maintenanceEvents, assemblyType, timeline, project) => {
//     const events = [];
//
//     // Получаем все componentId этого агрегата
//     const componentIds = assemblyType.components.map(c => c.id);
//
//     maintenanceEvents.forEach(event => {
//         // Проверяем события с реальными unitId
//         const isRealUnit = (timeline.unitAssignments || []).some(
//             ua => ua.unitId === event.unitId &&
//                 ua.componentOfAssembly?.assemblyId === assembly.id
//         );
//
//         if (isRealUnit) {
//             events.push(event);
//             return;
//         }
//
//         // Проверяем события с виртуальным unitId (component-{componentId})
//         componentIds.forEach(componentId => {
//             if (event.unitId === `component-${componentId}`) {
//                 events.push(event);
//             }
//         });
//     });
//
//     return events;
// };
//
// /**
//  * Группирует события в периоды простоя
//  * Если события близко друг к другу - объединяет их в один простой
//  * Добавляет буфер до и после работ
//  */
// const groupEventsIntoIdlePeriods = (events, project, timelineStart, timelineEnd) => {
//     if (events.length === 0) return [];
//
//     // Сортируем события по времени
//     const sortedEvents = events.sort(
//         (a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf()
//     );
//
//     const periods = [];
//     let currentPeriod = null;
//
//     sortedEvents.forEach(event => {
//         const maintenanceType = getMaintenanceType(event.maintenanceTypeId, project);
//         if (!maintenanceType) return;
//
//         const eventStart = dayjs(event.dateTime);
//         const eventEnd = eventStart.add(maintenanceType.duration, 'day');
//
//         if (!currentPeriod) {
//             // Начинаем новый период с буфером ДО работы
//             const bufferBefore = Math.floor(Math.random() * 4) + 2; // 2-5 дней до
//             currentPeriod = {
//                 start: eventStart.subtract(bufferBefore, 'day').format('YYYY-MM-DDTHH:mm:ss'),
//                 end: eventEnd.format('YYYY-MM-DDTHH:mm:ss'),
//                 events: [event]
//             };
//         } else {
//             const currentEnd = dayjs(currentPeriod.end);
//             const gapDays = eventStart.diff(currentEnd, 'day');
//
//             // Если между событиями меньше 3 дней - объединяем в один простой
//             if (gapDays <= 3) {
//                 // Расширяем текущий период
//                 currentPeriod.end = eventEnd.format('YYYY-MM-DDTHH:mm:ss');
//                 currentPeriod.events.push(event);
//             } else {
//                 // Добавляем буфер ПОСЛЕ текущего периода
//                 const bufferAfter = Math.floor(Math.random() * 4) + 2; // 2-5 дней после
//                 currentPeriod.end = dayjs(currentPeriod.end).add(bufferAfter, 'day').format('YYYY-MM-DDTHH:mm:ss');
//                 periods.push(currentPeriod);
//
//                 // Начинаем новый период с буфером ДО
//                 const bufferBefore = Math.floor(Math.random() * 4) + 2;
//                 currentPeriod = {
//                     start: eventStart.subtract(bufferBefore, 'day').format('YYYY-MM-DDTHH:mm:ss'),
//                     end: eventEnd.format('YYYY-MM-DDTHH:mm:ss'),
//                     events: [event]
//                 };
//             }
//         }
//     });
//
//     // Добавляем последний период с буфером ПОСЛЕ
//     if (currentPeriod) {
//         const bufferAfter = Math.floor(Math.random() * 4) + 2;
//         currentPeriod.end = dayjs(currentPeriod.end).add(bufferAfter, 'day').format('YYYY-MM-DDTHH:mm:ss');
//         periods.push(currentPeriod);
//     }
//
//     // Генерируем дополнительные простои в промежутках без работ
//     const periodsWithExtra = addExtraIdlePeriods(periods, timelineStart, timelineEnd);
//
//     return periodsWithExtra;
// };
//
// /**
//  * Добавляет дополнительные простои там, где нет custom работ
//  */
// const addExtraIdlePeriods = (existingPeriods, timelineStart, timelineEnd) => {
//     if (existingPeriods.length === 0) {
//         // Если нет работ вообще, добавляем 1-2 случайных простоя
//         return generateRandomIdlePeriods(timelineStart, timelineEnd, 1, 2);
//     }
//
//     const allPeriods = [...existingPeriods];
//
//     // Проверяем промежутки между существующими простоями
//     for (let i = 0; i < existingPeriods.length - 1; i++) {
//         const currentEnd = dayjs(existingPeriods[i].end);
//         const nextStart = dayjs(existingPeriods[i + 1].start);
//         const gapDays = nextStart.diff(currentEnd, 'day');
//
//         // Если промежуток больше 30 дней, добавляем дополнительный простой
//         if (gapDays > 30) {
//             const extraPeriods = generateRandomIdlePeriods(currentEnd, nextStart, 0, 1);
//             allPeriods.push(...extraPeriods);
//         }
//     }
//
//     // Проверяем начало timeline
//     const firstPeriodStart = dayjs(existingPeriods[0].start);
//     const daysFromStart = firstPeriodStart.diff(timelineStart, 'day');
//     if (daysFromStart > 30) {
//         const extraPeriods = generateRandomIdlePeriods(timelineStart, firstPeriodStart, 0, 1);
//         allPeriods.push(...extraPeriods);
//     }
//
//     // Проверяем конец timeline
//     const lastPeriodEnd = dayjs(existingPeriods[existingPeriods.length - 1].end);
//     const daysToEnd = timelineEnd.diff(lastPeriodEnd, 'day');
//     if (daysToEnd > 30) {
//         const extraPeriods = generateRandomIdlePeriods(lastPeriodEnd, timelineEnd, 0, 1);
//         allPeriods.push(...extraPeriods);
//     }
//
//     // Сортируем все периоды по времени начала
//     return allPeriods.sort((a, b) =>
//         dayjs(a.start).valueOf() - dayjs(b.start).valueOf()
//     );
// };
//
// /**
//  * Генерирует случайные простои в указанном диапазоне
//  */
// const generateRandomIdlePeriods = (rangeStart, rangeEnd, minCount, maxCount) => {
//     const periods = [];
//     const count = Math.floor(Math.random() * (maxCount - minCount + 1)) + minCount;
//
//     const rangeDays = rangeEnd.diff(rangeStart, 'day');
//     if (rangeDays < 10) return periods; // Слишком маленький промежуток
//
//     for (let i = 0; i < count; i++) {
//         // Случайная дата начала простоя
//         const randomDayOffset = Math.floor(Math.random() * (rangeDays - 20));
//         const periodStart = rangeStart.add(randomDayOffset, 'day');
//
//         // Случайная длительность простоя (5-15 дней)
//         const duration = Math.floor(Math.random() * 11) + 5;
//         const periodEnd = periodStart.add(duration, 'day');
//
//         // Проверяем, что не выходим за пределы
//         if (periodEnd.isBefore(rangeEnd)) {
//             periods.push({
//                 start: periodStart.format('YYYY-MM-DDTHH:mm:ss'),
//                 end: periodEnd.format('YYYY-MM-DDTHH:mm:ss'),
//                 events: [] // Пустой массив - это простой без custom работ
//             });
//         }
//     }
//
//     return periods;
// };
//
// /**
//  * Получает все units для агрегата
//  */
// const getAssemblyUnits = (assembly, timeline, project) => {
//     const unitIds = new Set();
//
//     // Находим все назначения для этого агрегата
//     (timeline.unitAssignments || []).forEach(assignment => {
//         if (assignment.componentOfAssembly?.assemblyId === assembly.id) {
//             unitIds.add(assignment.unitId);
//         }
//     });
//
//     // Находим полную информацию о units
//     const units = [];
//     project.partModels?.forEach(pm => {
//         (pm.units || []).forEach(unit => {
//             if (unitIds.has(unit.id)) {
//                 units.push(unit);
//             }
//         });
//     });
//
//     return units;
// };
//
// /**
//  * Получает MaintenanceType по ID
//  */
// const getMaintenanceType = (maintenanceTypeId, project) => {
//     let found = null;
//     project.partModels?.forEach(pm => {
//         (pm.maintenanceTypes || []).forEach(mt => {
//             if (mt.id === maintenanceTypeId) {
//                 found = mt;
//             }
//         });
//     });
//     return found;
// };
//
// /**
//  * Находит unit по ID
//  */
// const findUnit = (unitId, project) => {
//     let found = null;
//     project.partModels?.forEach(pm => {
//         (pm.units || []).forEach(unit => {
//             if (unit.id === unitId) {
//                 found = unit;
//             }
//         });
//     });
//     return found;
// };

import dayjs from 'dayjs';

/**
 * Задержка выполнения (имитация работы сервера)
 */
const delay = (minMs, maxMs) => {
    const ms = Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
    return new Promise(resolve => setTimeout(resolve, ms));
};

/**
 * Генерирует план технического обслуживания на основе данных проекта
 * Имитация работы бэкенда-оптимизатора с асинхронными задержками
 *
 * @param {Object} project - Объект проекта
 * @param {Function} onProgress - Callback для отображения прогресса
 * @returns {Promise<Object>} Обновленный объект timeline с новым планом
 */
export const generateMaintenancePlan = async (project, onProgress = null) => {
    if (!project || !project.timeline) {
        throw new Error('Некорректный проект');
    }

    const timeline = project.timeline;

    // Шаг 1: Анализ заданных работ
    if (onProgress) onProgress('Анализ заданных работ...', 10);
    await delay(1000, 3000);

    const customMaintenanceEvents = (timeline.maintenanceEvents || []).filter(
        event => event.custom === true
    );

    // Шаг 2: Анализ структуры агрегатов
    if (onProgress) onProgress('Анализ структуры агрегатов...', 20);
    await delay(1000, 3000);

    const assemblies = getAllAssemblies(project.nodes || []);

    // Шаг 3: Планирование простоев
    if (onProgress) onProgress('Планирование простоев...', 40);
    await delay(1000, 3000);

    const { assemblyStates: initialAssemblyStates, idlePeriodsMap } = await generateAssemblyStatesWithPeriods(
        assemblies,
        customMaintenanceEvents,
        project,
        timeline
    );

    // Шаг 4: Генерация плановых работ для заполнения простоев
    if (onProgress) onProgress('Генерация плановых работ...', 70);
    await delay(1000, 3000);

    const generatedEvents = await generateMaintenanceEventsForIdlePeriods(
        assemblies,
        idlePeriodsMap,
        customMaintenanceEvents,
        project,
        timeline,
        onProgress
    );

    // Шаг 5: Финализация
    if (onProgress) onProgress('Финализация плана...', 90);
    await delay(1000, 3000);

    const allMaintenanceEvents = [
        ...customMaintenanceEvents,
        ...generatedEvents
    ].sort((a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf());

    if (onProgress) onProgress('План готов!', 100);
    await delay(300, 500);

    const finalIdlePeriodsMap = recalculateIdlePeriodsWithAllEvents(
        assemblies,
        allMaintenanceEvents,
        project,
        timeline
    );

    const finalAssemblyStates = buildAssemblyStatesFromIdlePeriods(
        assemblies,
        finalIdlePeriodsMap,
        project,
        timeline
    );

    return {
        start: timeline.start || '2025-01-01',
        end: timeline.end || '2025-12-31',
        assemblyStates: finalAssemblyStates,
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
 * Генерирует состояния агрегатов И возвращает карту простоев
 */
const generateAssemblyStatesWithPeriods = async (assemblies, maintenanceEvents, project, timeline) => {
    const states = [];
    const idlePeriodsMap = new Map(); // assemblyId -> idlePeriods[]
    const timelineStart = dayjs(timeline.start || '2025-01-01');
    const timelineEnd = dayjs(timeline.end || '2025-12-31');

    assemblies.forEach(assembly => {
        const assemblyType = project.assemblyTypes?.find(
            at => at.id === assembly.assemblyTypeId
        );

        if (!assemblyType) return;

        const assemblyMaintenanceEvents = getMaintenanceEventsForAssembly(
            assembly,
            maintenanceEvents,
            assemblyType,
            timeline,
            project
        );

        if (assemblyMaintenanceEvents.length === 0) {
            states.push({
                assemblyId: assembly.id,
                type: 'WORKING',
                dateTime: timelineStart.format('YYYY-MM-DDTHH:mm:ss')
            });
            idlePeriodsMap.set(assembly.id, []);
            return;
        }

        const idlePeriods = groupEventsIntoIdlePeriods(
            assemblyMaintenanceEvents,
            project,
            timelineStart,
            timelineEnd
        );

        // Сохраняем периоды для этого агрегата
        idlePeriodsMap.set(assembly.id, idlePeriods);

        states.push({
            assemblyId: assembly.id,
            type: 'WORKING',
            dateTime: timelineStart.format('YYYY-MM-DDTHH:mm:ss')
        });

        idlePeriods.forEach(period => {
            const idleStart = dayjs(period.start);
            const idleEnd = dayjs(period.end);

            const shutdownDelay = Math.floor(Math.random() * 61) + 30;
            const shutdownTime = idleStart.subtract(1, 'day').add(shutdownDelay, 'minute');

            if (shutdownTime.isAfter(timelineStart)) {
                states.push({
                    assemblyId: assembly.id,
                    type: 'SHUTTING_DOWN',
                    dateTime: shutdownTime.format('YYYY-MM-DDTHH:mm:ss')
                });
            }

            const idleDelay = Math.floor(Math.random() * 61) + 30;
            states.push({
                assemblyId: assembly.id,
                type: 'IDLE',
                dateTime: idleStart.add(idleDelay, 'minute').format('YYYY-MM-DDTHH:mm:ss')
            });

            const startupDelay = Math.floor(Math.random() * 61) + 30;
            states.push({
                assemblyId: assembly.id,
                type: 'STARTING_UP',
                dateTime: idleEnd.add(startupDelay, 'minute').format('YYYY-MM-DDTHH:mm:ss')
            });

            const workingDelay = Math.floor(Math.random() * 61) + 30;
            const workingTime = idleEnd.add(1, 'day').add(workingDelay, 'minute');

            if (workingTime.isBefore(timelineEnd)) {
                states.push({
                    assemblyId: assembly.id,
                    type: 'WORKING',
                    dateTime: workingTime.format('YYYY-MM-DDTHH:mm:ss')
                });
            }
        });
    });

    const sortedStates = states.sort((a, b) => {
        const timeDiff = dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf();
        if (timeDiff !== 0) return timeDiff;
        return a.assemblyId.localeCompare(b.assemblyId);
    });

    return { assemblyStates: sortedStates, idlePeriodsMap };
};

const recalculateIdlePeriodsWithAllEvents = (assemblies, allEvents, project, timeline) => {
    const recalculatedMap = new Map();
    const timelineStart = dayjs(timeline.start || '2025-01-01');
    const timelineEnd = dayjs(timeline.end || '2025-12-31');

    assemblies.forEach(assembly => {
        const assemblyType = project.assemblyTypes?.find(at => at.id === assembly.assemblyTypeId);
        if (!assemblyType) {
            recalculatedMap.set(assembly.id, []);
            return;
        }

        const eventsForAssembly = getMaintenanceEventsForAssembly(
            assembly,
            allEvents,
            assemblyType,
            timeline,
            project
        );

        if (eventsForAssembly.length === 0) {
            recalculatedMap.set(assembly.id, []);
            return;
        }

        const idlePeriods = groupEventsIntoIdlePeriods(
            eventsForAssembly,
            project,
            timelineStart,
            timelineEnd
        );

        recalculatedMap.set(assembly.id, idlePeriods);
    });

    return recalculatedMap;
};

const buildAssemblyStatesFromIdlePeriods = (assemblies, idlePeriodsMap, project, timeline) => {
    const states = [];
    const timelineStart = dayjs(timeline.start || '2025-01-01');
    const timelineEnd = dayjs(timeline.end || '2025-12-31');

    assemblies.forEach(assembly => {
        const idlePeriods = idlePeriodsMap.get(assembly.id) || [];

        states.push({
            assemblyId: assembly.id,
            type: 'WORKING',
            dateTime: timelineStart.format('YYYY-MM-DDTHH:mm:ss')
        });

        idlePeriods.forEach(period => {
            const idleStart = dayjs(period.start);
            const idleEnd = dayjs(period.end);

            const shutdownDelay = Math.floor(Math.random() * 61) + 30;
            const shutdownTime = idleStart.subtract(1, 'day').add(shutdownDelay, 'minute');

            if (shutdownTime.isAfter(timelineStart)) {
                states.push({
                    assemblyId: assembly.id,
                    type: 'SHUTTING_DOWN',
                    dateTime: shutdownTime.format('YYYY-MM-DDTHH:mm:ss')
                });
            }

            const idleDelay = Math.floor(Math.random() * 61) + 30;
            states.push({
                assemblyId: assembly.id,
                type: 'IDLE',
                dateTime: idleStart.add(idleDelay, 'minute').format('YYYY-MM-DDTHH:mm:ss')
            });

            const startupDelay = Math.floor(Math.random() * 61) + 30;
            states.push({
                assemblyId: assembly.id,
                type: 'STARTING_UP',
                dateTime: idleEnd.add(startupDelay, 'minute').format('YYYY-MM-DDTHH:mm:ss')
            });

            const workingDelay = Math.floor(Math.random() * 61) + 30;
            const workingTime = idleEnd.add(1, 'day').add(workingDelay, 'minute');

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
        const timeDiff = dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf();
        if (timeDiff !== 0) return timeDiff;
        return a.assemblyId.localeCompare(b.assemblyId);
    });
};

/**
 * Генерирует случайные maintenance events для заполнения простоев
 */
const generateMaintenanceEventsForIdlePeriods = async (assemblies, idlePeriodsMap, customEvents, project, timeline, onProgress) => {
    const generatedEvents = [];
    const timelineRangeEnd = dayjs(timeline.end || '2025-12-31');

    for (const assembly of assemblies) {
        const idlePeriods = idlePeriodsMap.get(assembly.id) || [];
        const assemblyType = project.assemblyTypes?.find(at => at.id === assembly.assemblyTypeId);
        if (!assemblyType) continue;

        await delay(1000, 3000);

        for (const period of idlePeriods) {
            const periodStart = dayjs(period.start);
            let periodEnd = dayjs(period.end);
            let periodDuration = periodEnd.diff(periodStart, 'day');

            // Получаем все компоненты агрегата
            const components = assemblyType.components;

            // Для каждого компонента пытаемся сгенерировать работы
            for (const component of components) {
                // Получаем доступные типы ТО для этого компонента
                const availableMaintenanceTypes = getAvailableMaintenanceTypesForComponent(
                    component,
                    project
                );

                if (availableMaintenanceTypes.length === 0) continue;

                // Проверяем, какие работы уже есть в этом периоде для этого компонента
                const existingWorksInPeriod = getExistingWorksForComponentInPeriod(
                    assembly.id,
                    component.id,
                    period,
                    [...customEvents, ...generatedEvents]
                );

                // Генерируем 1-3 случайные работы для компонента
                const worksCount = Math.floor(Math.random() * 3) + 1;

                for (let i = 0; i < worksCount; i++) {
                    // Выбираем случайный тип работы
                    const randomMaintenanceType = availableMaintenanceTypes[
                        Math.floor(Math.random() * availableMaintenanceTypes.length)
                        ];

                    // Проверяем, что такой работы еще нет в этом периоде
                    const alreadyExists = existingWorksInPeriod.some(
                        w => w.maintenanceTypeId === randomMaintenanceType.id
                    );

                    if (alreadyExists) continue;

                    // Актуализируем длительность периода (мог измениться после расширения)
                    periodEnd = dayjs(period.end);
                    periodDuration = periodEnd.diff(periodStart, 'day');
                    const requiredDuration = randomMaintenanceType.duration;

                    // Если период слишком короткий, пытаемся расширить его
                    if (periodDuration < requiredDuration) {
                        const extensionBuffer = Math.floor(Math.random() * 3) + 1; // 1-3 дня
                        const requiredExtension = requiredDuration - periodDuration + extensionBuffer;
                        const potentialNewEnd = periodEnd.add(requiredExtension, 'day');

                        if (potentialNewEnd.isBefore(timelineRangeEnd) || potentialNewEnd.isSame(timelineRangeEnd, 'day')) {
                            periodEnd = potentialNewEnd;
                            period.end = potentialNewEnd.format('YYYY-MM-DDTHH:mm:ss');
                            periodDuration = periodEnd.diff(periodStart, 'day');
                        } else {
                            // Увеличить период нельзя, пропускаем работу
                            continue;
                        }
                    }

                    const maxStartOffset = Math.max(periodDuration - requiredDuration, 0);
                    let workDate = periodStart.add(
                        Math.floor(Math.random() * (maxStartOffset + 1)),
                        'day'
                    );

                    let workEnd = workDate.add(requiredDuration, 'day');

                    if (workEnd.isAfter(periodEnd)) {
                        // Смещаем работу ближе к концу периода
                        workDate = periodEnd.subtract(requiredDuration, 'day');
                        workEnd = workDate.add(requiredDuration, 'day');

                        // Если после смещения всё ещё не помещается — пробуем слегка расширить период
                        if (workDate.isBefore(periodStart)) {
                            const extensionBuffer = Math.floor(Math.random() * 3) + 1;
                            const extraExtension = requiredDuration - periodDuration + extensionBuffer;
                            const potentialNewEnd = periodEnd.add(extraExtension, 'day');

                            if (potentialNewEnd.isBefore(timelineRangeEnd) || potentialNewEnd.isSame(timelineRangeEnd, 'day')) {
                                periodEnd = potentialNewEnd;
                                period.end = potentialNewEnd.format('YYYY-MM-DDTHH:mm:ss');
                                periodDuration = periodEnd.diff(periodStart, 'day');
                                workDate = periodEnd.subtract(requiredDuration, 'day');
                                workEnd = workDate.add(requiredDuration, 'day');
                            } else {
                                // Расширить нельзя — пропускаем
                                continue;
                            }
                        }
                    }

                    if (workDate.isBefore(periodStart) || workEnd.isAfter(periodEnd)) {
                        continue;
                    }

                    generatedEvents.push({
                        maintenanceTypeId: randomMaintenanceType.id,
                        unitId: `component-${component.id}`,
                        dateTime: workDate.format('YYYY-MM-DDTHH:mm:ss'),
                        custom: false
                    });

                    existingWorksInPeriod.push({
                        maintenanceTypeId: randomMaintenanceType.id
                    });
                }
            }
        }
    }

    return generatedEvents;
};

/**
 * Получает доступные типы ТО для компонента
 */
const getAvailableMaintenanceTypesForComponent = (component, project) => {
    const componentTypeId = component.componentTypeId;
    if (!componentTypeId) return [];

    const maintenanceTypes = [];
    project.partModels?.forEach(pm => {
        if (pm.componentTypeId === componentTypeId && pm.maintenanceTypes) {
            pm.maintenanceTypes.forEach(mt => {
                if (!maintenanceTypes.find(existing => existing.id === mt.id)) {
                    maintenanceTypes.push(mt);
                }
            });
        }
    });

    return maintenanceTypes;
};

/**
 * Получает существующие работы для компонента в периоде
 */
const getExistingWorksForComponentInPeriod = (assemblyId, componentId, period, allEvents) => {
    const periodStart = dayjs(period.start);
    const periodEnd = dayjs(period.end);
    const virtualUnitId = `component-${componentId}`;

    return allEvents.filter(event => {
        if (event.unitId !== virtualUnitId) return false;

        const eventDate = dayjs(event.dateTime);
        return eventDate.isAfter(periodStart) && eventDate.isBefore(periodEnd);
    });
};

/**
 * Находит все maintenance события для агрегата
 */
const getMaintenanceEventsForAssembly = (assembly, maintenanceEvents, assemblyType, timeline, project) => {
    const events = [];
    const componentIds = assemblyType.components.map(c => c.id);

    maintenanceEvents.forEach(event => {
        const isRealUnit = (timeline.unitAssignments || []).some(
            ua => ua.unitId === event.unitId &&
                ua.componentOfAssembly?.assemblyId === assembly.id
        );

        if (isRealUnit) {
            events.push(event);
            return;
        }

        componentIds.forEach(componentId => {
            if (event.unitId === `component-${componentId}`) {
                events.push(event);
            }
        });
    });

    return events;
};

/**
 * Группирует события в периоды простоя
 */
const groupEventsIntoIdlePeriods = (events, project, timelineStart, timelineEnd) => {
    if (events.length === 0) return [];

    const sortedEvents = events.sort(
        (a, b) => dayjs(a.dateTime).valueOf() - dayjs(b.dateTime).valueOf()
    );

    const periods = [];
    let currentPeriod = null;

    sortedEvents.forEach(event => {
        const maintenanceType = getMaintenanceType(event.maintenanceTypeId, project);
        if (!maintenanceType) return;

        const eventStart = dayjs(event.dateTime);
        const eventEnd = eventStart.add(maintenanceType.duration, 'day');

        if (!currentPeriod) {
            const bufferBefore = Math.floor(Math.random() * 4) + 2;
            currentPeriod = {
                start: eventStart.subtract(bufferBefore, 'day').format('YYYY-MM-DDTHH:mm:ss'),
                end: eventEnd.format('YYYY-MM-DDTHH:mm:ss'),
                events: [event]
            };
        } else {
            const currentEnd = dayjs(currentPeriod.end);
            const gapDays = eventStart.diff(currentEnd, 'day');

            if (gapDays <= 3) {
                currentPeriod.end = eventEnd.format('YYYY-MM-DDTHH:mm:ss');
                currentPeriod.events.push(event);
            } else {
                const bufferAfter = Math.floor(Math.random() * 4) + 2;
                currentPeriod.end = dayjs(currentPeriod.end).add(bufferAfter, 'day').format('YYYY-MM-DDTHH:mm:ss');
                periods.push(currentPeriod);

                const bufferBefore = Math.floor(Math.random() * 4) + 2;
                currentPeriod = {
                    start: eventStart.subtract(bufferBefore, 'day').format('YYYY-MM-DDTHH:mm:ss'),
                    end: eventEnd.format('YYYY-MM-DDTHH:mm:ss'),
                    events: [event]
                };
            }
        }
    });

    if (currentPeriod) {
        const bufferAfter = Math.floor(Math.random() * 4) + 2;
        currentPeriod.end = dayjs(currentPeriod.end).add(bufferAfter, 'day').format('YYYY-MM-DDTHH:mm:ss');
        periods.push(currentPeriod);
    }

    const periodsWithExtra = addExtraIdlePeriods(periods, timelineStart, timelineEnd);
    return periodsWithExtra;
};

const calculateIdlePeriodCountRange = (rangeStart, rangeEnd) => {
    const rangeDays = Math.max(0, rangeEnd.diff(rangeStart, 'day'));
    const segments = Math.max(1, Math.floor(rangeDays / 90) || 1);

    return {
        minCount: segments,
        maxCount: segments * 2
    };
};

/**
 * Добавляет дополнительные простои там, где нет custom работ
 */
const addExtraIdlePeriods = (existingPeriods, timelineStart, timelineEnd) => {
    if (existingPeriods.length === 0) {
        const { minCount, maxCount } = calculateIdlePeriodCountRange(timelineStart, timelineEnd);
        return generateRandomIdlePeriods(timelineStart, timelineEnd, minCount, maxCount);
    }

    const allPeriods = [...existingPeriods];

    for (let i = 0; i < existingPeriods.length - 1; i++) {
        const currentEnd = dayjs(existingPeriods[i].end);
        const nextStart = dayjs(existingPeriods[i + 1].start);
        const gapDays = nextStart.diff(currentEnd, 'day');

        if (gapDays > 30) {
            const { minCount, maxCount } = calculateIdlePeriodCountRange(currentEnd, nextStart);
            const extraPeriods = generateRandomIdlePeriods(currentEnd, nextStart, minCount, maxCount);
            allPeriods.push(...extraPeriods);
        }
    }

    const firstPeriodStart = dayjs(existingPeriods[0].start);
    const daysFromStart = firstPeriodStart.diff(timelineStart, 'day');
    if (daysFromStart > 30) {
        const { minCount, maxCount } = calculateIdlePeriodCountRange(timelineStart, firstPeriodStart);
        const extraPeriods = generateRandomIdlePeriods(timelineStart, firstPeriodStart, minCount, maxCount);
        allPeriods.push(...extraPeriods);
    }

    const lastPeriodEnd = dayjs(existingPeriods[existingPeriods.length - 1].end);
    const daysToEnd = timelineEnd.diff(lastPeriodEnd, 'day');
    if (daysToEnd > 30) {
        const { minCount, maxCount } = calculateIdlePeriodCountRange(lastPeriodEnd, timelineEnd);
        const extraPeriods = generateRandomIdlePeriods(lastPeriodEnd, timelineEnd, minCount, maxCount);
        allPeriods.push(...extraPeriods);
    }

    return allPeriods.sort((a, b) =>
        dayjs(a.start).valueOf() - dayjs(b.start).valueOf()
    );
};

/**
 * Генерирует случайные простои в указанном диапазоне
 */
const generateRandomIdlePeriods = (rangeStart, rangeEnd, minCount, maxCount) => {
    const periods = [];
    const rangeDays = Math.max(0, rangeEnd.diff(rangeStart, 'day'));

    if (rangeDays < 10 || maxCount < 1) {
        return periods;
    }

    const safeMin = Math.max(0, minCount);
    const safeMax = Math.max(safeMin, maxCount);
    const count = Math.floor(Math.random() * (safeMax - safeMin + 1)) + safeMin;

    if (count === 0) {
        return periods;
    }

    const maxOffset = Math.max(rangeDays - 20, 1);

    for (let i = 0; i < count; i++) {
        const duration = Math.floor(Math.random() * 11) + 5;
        const maxStartOffset = Math.max(rangeDays - duration - 1, 0);
        const randomDayOffset = Math.min(
            Math.floor(Math.random() * maxOffset),
            maxStartOffset
        );
        const periodStart = rangeStart.add(randomDayOffset, 'day');

        const periodEnd = periodStart.add(duration, 'day');

        if (periodEnd.isBefore(rangeEnd) || periodEnd.isSame(rangeEnd, 'day')) {
            periods.push({
                start: periodStart.format('YYYY-MM-DDTHH:mm:ss'),
                end: periodEnd.format('YYYY-MM-DDTHH:mm:ss'),
                events: []
            });
        }
    }

    return periods;
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