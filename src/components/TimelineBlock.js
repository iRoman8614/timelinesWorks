import React, { useState } from 'react';
import { Collapse } from 'antd';
import PlanEditor from './PlanEditor/PlanEditor';
import TimelineManager from './TimelineManager/TimelineManager';
import TimelineView from './TimelineView/TimelineView';
import './TimelineBlock.css';

const { Panel } = Collapse;

const TimelineBlock = ({ project, onProjectUpdate }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [refreshKey, setRefreshKey] = useState(0);
    const [isGenerating, setIsGenerating] = useState(false);
    const [currentTimeline, setCurrentTimeline] = useState(null);

    const structure = React.useMemo(() => {
        if (!project?.structure) return null;
        try {
            return typeof project.structure === 'string'
                ? JSON.parse(project.structure)
                : project.structure;
        } catch (error) {
            console.error('Error parsing structure:', error);
            return null;
        }
    }, [project]);

    const handlePlanSelect = (plan) => {
        setSelectedPlan(plan);
        setCurrentTimeline(null);
    };

    const handleTimelineUpdate = async (newTimeline) => {
        if (newTimeline) {
            setCurrentTimeline(newTimeline);

            if (selectedPlan) {
                try {
                    const planApi = (await import('../services/api/planApi')).default;
                    await planApi.create({
                        id: selectedPlan.id,
                        ...selectedPlan,
                        timeline: JSON.stringify(newTimeline)
                    });
                } catch (error) {
                    console.error('Ошибка сохранения в план:', error);
                }
            } else if (onProjectUpdate) {
                try {
                    const projectApi = (await import('../services/api/projectApi')).default;
                    await projectApi.patch(project.id, {
                        timeline: JSON.stringify(newTimeline)
                    });
                    onProjectUpdate({ ...project, _refresh: true });
                } catch (error) {
                    console.error('Ошибка сохранения в проект:', error);
                }
            }
        }
        setRefreshKey(prev => prev + 1);
    };


    const displayTimeline = React.useMemo(() => {
        if (currentTimeline) {
            return currentTimeline;
        }
        if (selectedPlan?.timeline) {
            try {
                return typeof selectedPlan.timeline === 'string'
                    ? JSON.parse(selectedPlan.timeline)
                    : selectedPlan.timeline;
            } catch (error) {
                console.error('Ошибка парсинга timeline плана:', error);
            }
        }

        if (project?.timeline) {
            try {
                return typeof project.timeline === 'string'
                    ? JSON.parse(project.timeline)
                    : project.timeline;
            } catch (error) {
                console.error('Ошибка парсинга timeline проекта:', error);
            }
        }

        return {};
    }, [selectedPlan, project, currentTimeline]);

    return (
        <div className="timeline-block">
            <Collapse
                defaultActiveKey={['plans']}
                className="timeline-collapse"
            >
                <Panel header="Редактор планов" key="plans" className="plan-panel">
                    <PlanEditor
                        projectId={project?.id}
                        project={project}
                        onPlanSelect={handlePlanSelect}
                    />
                </Panel>
            </Collapse>

            {/*<div style={{ padding: '16px 24px 0' }}>*/}
            {/*    <TimelineManager*/}
            {/*        project={project}*/}
            {/*        plan={selectedPlan}*/}
            {/*        currentTimeline={currentTimeline || displayTimeline}*/}
            {/*        onUpdate={handleTimelineUpdate}*/}
            {/*        onRefresh={() => {*/}
            {/*            // Вызываем полный рефреш - родитель перезагрузит проект*/}
            {/*            if (onProjectUpdate) {*/}
            {/*                onProjectUpdate({ ...project, _refresh: true });*/}
            {/*            }*/}
            {/*        }}*/}
            {/*    />*/}
            {/*</div>*/}

            <div className="timeline-main">
                <h2 className="timeline-main-title">График работ</h2>
                <TimelineView
                    key={refreshKey}
                    structure={structure}
                    timeline={displayTimeline}
                    selectedPlan={selectedPlan}
                    onTimelineUpdate={handleTimelineUpdate}
                    isGenerating={isGenerating}
                />
            </div>
        </div>
    );
};

export default TimelineBlock;