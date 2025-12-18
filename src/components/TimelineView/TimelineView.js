import React, { useState, useMemo } from 'react';
import { Button } from 'antd';
import { DownOutlined, RightOutlined } from '@ant-design/icons';
import Timeline, { buildTimebar } from 'react-timelines';
import 'react-timelines/lib/css/style.css';
import dayjs from 'dayjs';
import 'dayjs/locale/ru';
import './TimelineView.css';

dayjs.locale('ru');

const TimelineView = ({ structure }) => {
    // Состояние для раскрытых Assembly (показ компонентов)
    const [expandedAssemblies, setExpandedAssemblies] = useState(new Set());

    // Состояние для глобального контроля всех Assembly
    const [allAssembliesExpanded, setAllAssembliesExpanded] = useState(false);

    // Парсим структуру если это строка
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

    // Вычисляем диапазон дат (текущий месяц)
    const { startDate, endDate, timebar } = useMemo(() => {
        const now = dayjs();
        const start = now.startOf('month');
        const end = now.endOf('month');

        // Создаем timebar с помощью buildTimebar из react-timelines
        const timebarData = buildTimebar({
            start: start.toDate(),
            end: end.toDate(),
            timebar: [
                {
                    id: 'month',
                    title: start.format('MMMM YYYY')
                }
            ]
        });

        return {
            startDate: start.toDate(),
            endDate: end.toDate(),
            timebar: timebarData
        };
    }, []);

    // Строим плоское дерево для timeline
    const buildTimelineData = useMemo(() => {
        const tracks = [];
        const elements = [];
        let trackId = 0;

        const traverse = (items, level = 0) => {
            if (!items || !Array.isArray(items)) return;

            items.forEach(item => {
                if (item.type === 'NODE') {
                    // Добавляем узел как трек
                    tracks.push({
                        id: `track-${trackId++}`,
                        title: item.name,
                        level: level,
                        itemType: 'NODE',
                        itemId: item.id,
                        hasChildren: item.children && item.children.length > 0
                    });

                    // Рекурсивно обрабатываем детей
                    if (item.children) {
                        traverse(item.children, level + 1);
                    }
                } else if (item.type === 'ASSEMBLY') {
                    const isExpanded = expandedAssemblies.has(item.id);

                    // Добавляем агрегат как трек
                    tracks.push({
                        id: `track-${trackId++}`,
                        title: item.name,
                        level: level,
                        itemType: 'ASSEMBLY',
                        itemId: item.id,
                        hasChildren: true, // У агрегата всегда есть потенциальные компоненты
                        isExpanded: isExpanded
                    });

                    // Если раскрыт, добавляем компоненты
                    if (isExpanded) {
                        // Нужно получить информацию о компонентах из assemblyType
                        const assemblyType = parsedStructure?.assemblyTypes?.find(
                            at => at.id === item.assemblyTypeId
                        );

                        if (assemblyType?.components) {
                            assemblyType.components.forEach(component => {
                                // Получаем название компонента из componentType
                                const componentType = parsedStructure?.componentTypes?.find(
                                    ct => ct.id === component.componentTypeId
                                );

                                const componentName = componentType
                                    ? `${componentType.name} (${component.quantity})`
                                    : component.componentTypeId;

                                tracks.push({
                                    id: `track-${trackId++}`,
                                    title: componentName,
                                    level: level + 1,
                                    itemType: 'COMPONENT',
                                    itemId: component.id,
                                    parentAssemblyId: item.id
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

        return { tracks, elements };
    }, [parsedStructure, expandedAssemblies]);

    // Переключение агрегата
    const toggleAssembly = (assemblyId) => {
        setExpandedAssemblies(prev => {
            const newSet = new Set(prev);
            if (newSet.has(assemblyId)) {
                newSet.delete(assemblyId);
            } else {
                newSet.add(assemblyId);
            }
            return newSet;
        });
    };

    // Свернуть/развернуть все агрегаты
    const toggleAllAssemblies = () => {
        if (allAssembliesExpanded) {
            // Свернуть все
            setExpandedAssemblies(new Set());
        } else {
            // Развернуть все - собрать все ID агрегатов
            const allAssemblyIds = [];
            const collectAssemblyIds = (items) => {
                if (!items || !Array.isArray(items)) return;

                items.forEach(item => {
                    if (item.type === 'ASSEMBLY') {
                        allAssemblyIds.push(item.id);
                    }
                    if (item.children) {
                        collectAssemblyIds(item.children);
                    }
                });
            };
            if (parsedStructure?.nodes) {
                collectAssemblyIds(parsedStructure.nodes);
            }
            setExpandedAssemblies(new Set(allAssemblyIds));
        }
        setAllAssembliesExpanded(!allAssembliesExpanded);
    };

    // Кастомный рендеринг трека с отступами и кнопками
    const customTrackRenderer = (track) => {
        const indent = track.level * 24;
        const isAssembly = track.itemType === 'ASSEMBLY';
        const hasExpandButton = track.itemType === 'NODE' && track.hasChildren;
        const hasAssemblyButton = isAssembly;

        return (
            <div
                className="custom-track"
                style={{ paddingLeft: `${indent}px` }}
            >
                {/* Кнопка раскрытия для узлов с детьми */}
                {hasExpandButton && (
                    <Button
                        type="text"
                        size="small"
                        icon={<RightOutlined />}
                        className="expand-button"
                        style={{ visibility: 'hidden' }} // Пока не реализовано сворачивание узлов
                    />
                )}

                {/* Кнопка раскрытия для агрегатов */}
                {hasAssemblyButton && (
                    <Button
                        type="text"
                        size="small"
                        icon={track.isExpanded ? <DownOutlined /> : <RightOutlined />}
                        onClick={() => toggleAssembly(track.itemId)}
                        className="expand-button"
                    />
                )}

                {/* Иконка типа */}
                <span className={`item-type-icon ${track.itemType.toLowerCase()}`}>
                    {track.itemType === 'NODE' && '■'}
                    {track.itemType === 'ASSEMBLY' && '▣'}
                    {track.itemType === 'COMPONENT' && '□'}
                </span>

                {/* Название */}
                <span className="track-title">{track.title}</span>
            </div>
        );
    };

    // Если нет структуры или треков
    if (!parsedStructure || buildTimelineData.tracks.length === 0) {
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
                        Управление агрегатами:
                    </span>
                    <Button
                        size="small"
                        icon={allAssembliesExpanded ? <DownOutlined /> : <RightOutlined />}
                        onClick={toggleAllAssemblies}
                    >
                        {allAssembliesExpanded ? 'Свернуть все' : 'Развернуть все'}
                    </Button>
                </div>
            </div>

            <div className="timeline-container">
                <Timeline
                    scale={{
                        start: startDate,
                        end: endDate,
                        zoom: 1,
                        zoomMin: 1,
                        zoomMax: 5
                    }}
                    isOpen={true}
                    toggleOpen={() => {}}
                    zoomIn={() => {}}
                    zoomOut={() => {}}
                    clickElement={() => {}}
                    clickTrackButton={() => {}}
                    timebar={timebar}
                    tracks={buildTimelineData.tracks}
                    now={new Date()}
                    enableSticky={true}
                    scrollToNow={true}
                    customTrackRenderer={customTrackRenderer}
                />
            </div>
        </div>
    );
};

export default TimelineView;