import React, { useState } from 'react';
import { Collapse } from 'antd';
import PlanEditor from './PlanEditor/PlanEditor';
import TimelineView from './TimelineView/TimelineView';
import './TimelineBlock.css';

const { Panel } = Collapse;

const TimelineBlock = ({ project }) => {
    const [selectedPlan, setSelectedPlan] = useState(null);

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

    return (
        <div className="timeline-block">
            <Collapse
                defaultActiveKey={['plans']}
                className="timeline-collapse"
            >
                <Panel header="Редактор планов" key="plans" className="plan-panel">
                    <PlanEditor projectId={project?.id} />
                </Panel>
            </Collapse>

            <div className="timeline-main">
                <h2 className="timeline-main-title">График работ</h2>
                <TimelineView
                    structure={structure}
                    selectedPlan={selectedPlan}
                />
            </div>
        </div>
    );
};

export default TimelineBlock;