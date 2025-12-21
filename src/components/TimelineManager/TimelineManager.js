import React, { useState } from 'react';
import { Button, Space, message } from 'antd';
import { PlusOutlined, ToolOutlined } from '@ant-design/icons';
import AddMaintenanceModal from '../addingBlocks/AddMaintenanceModal';
import AssignUnitModal from '../addingBlocks/AssignUnitModal';
import planApi from '../../services/api/planApi';
import projectApi from '../../services/api/projectApi';
import './TimelineManager.css';

const TimelineManager = ({ project, plan, currentTimeline, onUpdate, onRefresh }) => {
    const [maintenanceModalVisible, setMaintenanceModalVisible] = useState(false);
    const [assignModalVisible, setAssignModalVisible] = useState(false);
    const [loading, setLoading] = useState(false);

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

    const getTimeline = () => {
        if (currentTimeline && typeof currentTimeline === 'object' && Object.keys(currentTimeline).length > 0) {
            return currentTimeline;
        }

        if (plan?.timeline) {
            const source = plan.timeline;
            try {
                const parsed = typeof source === 'string' ? JSON.parse(source) : source;
                return parsed;
            } catch (error) {
                console.error('Error parsing plan timeline:', error);
            }
        }

        if (project?.timeline) {
            const source = project.timeline;
            try {
                const parsed = typeof source === 'string' ? JSON.parse(source) : source;
                return parsed;
            } catch (error) {
                console.error('Error parsing project timeline:', error);
            }
        }

        return { assemblyStates: [], unitAssignments: [], maintenanceEvents: [] };
    };

    const handleAddMaintenance = async (maintenanceEvent) => {
        setLoading(true);
        try {
            const currentTl = getTimeline();
            const updatedTimeline = {
                ...currentTl,
                maintenanceEvents: [
                    ...(currentTl.maintenanceEvents || []),
                    maintenanceEvent
                ]
            };

            if (plan) {
                await planApi.create({
                    id: plan.id,
                    ...plan,
                    timeline: JSON.stringify(updatedTimeline)
                });
                message.success('ТО добавлено в план');
            } else {
                await projectApi.patch(project.id, {
                    timeline: JSON.stringify(updatedTimeline)
                });
                message.success('ТО добавлено в проект');
            }
            if (onRefresh) {
                onRefresh();
            }

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            message.error('Ошибка при добавлении ТО');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleAssignUnit = async (assignment) => {
        setLoading(true);
        try {
            const currentTl = getTimeline();
            const updatedTimeline = {
                ...currentTl,
                unitAssignments: [
                    ...(currentTl.unitAssignments || []),
                    assignment
                ]
            };

            if (plan) {
                await planApi.create({
                    id: plan.id,
                    ...plan,
                    timeline: JSON.stringify(updatedTimeline)
                });
                message.success('Деталь назначена в плане');
            } else {
                await projectApi.patch(project.id, {
                    timeline: JSON.stringify(updatedTimeline)
                });
                message.success('Деталь назначена в проекте');
            }

            if (onRefresh) {
                onRefresh();
            }

            if (onUpdate) {
                onUpdate();
            }
        } catch (error) {
            message.error('Ошибка при назначении детали');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    if (!structure) {
        return (
            <div className="timeline-manager-empty">
                <p>Нет структуры проекта</p>
            </div>
        );
    }

    return (
        <div className="timeline-manager">
            <div className="timeline-manager-header">
                <h3>Управление событиями {plan ? `(План: ${plan.name})` : '(Проект)'}</h3>
                <Space>
                    <Button
                        type="primary"
                        icon={<PlusOutlined />}
                        onClick={() => setMaintenanceModalVisible(true)}
                        loading={loading}
                    >
                        Добавить внеплановое ТО
                    </Button>

                    <Button
                        icon={<ToolOutlined />}
                        onClick={() => setAssignModalVisible(true)}
                        loading={loading}
                    >
                        Назначить деталь
                    </Button>
                </Space>
            </div>

            <AddMaintenanceModal
                visible={maintenanceModalVisible}
                onCancel={() => setMaintenanceModalVisible(false)}
                onAdd={handleAddMaintenance}
                structure={structure}
                planId={plan?.id}
            />

            <AssignUnitModal
                visible={assignModalVisible}
                onCancel={() => setAssignModalVisible(false)}
                onAssign={handleAssignUnit}
                structure={structure}
            />
        </div>
    );
};

export default TimelineManager;