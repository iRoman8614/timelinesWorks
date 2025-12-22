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
        if (plan?.timeline && typeof plan.timeline === 'object') {
            setCurrentTimeline(plan.timeline);
        } else {
            setCurrentTimeline(null);
        }
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
            if (typeof selectedPlan.timeline === 'object' && selectedPlan.timeline !== null) {
                return selectedPlan.timeline;
            }
            try {
                return JSON.parse(selectedPlan.timeline);
            } catch (error) {
                console.error('Ошибка парсинга timeline плана:', error);
            }
        }

        if (structure?.timeline) {
            if (typeof structure.timeline === 'object' && structure.timeline !== null) {
                return structure.timeline;
            }
            try {
                return JSON.parse(structure.timeline);
            } catch (error) {
                console.error('Ошибка парсинга timeline структуры:', error);
            }
        }

        return {};
    }, [selectedPlan, selectedPlan?.timeline, structure, currentTimeline]);

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
                    projectId={project?.id}
                />
            </div>
        </div>
    );
};

export default TimelineBlock;