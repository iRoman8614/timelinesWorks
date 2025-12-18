import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button, Spin, Tabs } from 'antd';
import { ArrowLeftOutlined, SettingOutlined, CalendarOutlined } from '@ant-design/icons';
import { useProjects } from '../../hooks/useProjectContext';
import ConfigBlock from '../../components/ConfigBlock';
import './ProjectEditor.css';

const { TabPane } = Tabs;

const ProjectEditor = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const { selectedProject, openProject, updateProject } = useProjects();
    const [activeTab, setActiveTab] = useState('timeline');
    const [structure, setStructure] = useState(null);

    useEffect(() => {
        if (projectId) {
            openProject(projectId);
        }
    }, [projectId, openProject]);

    useEffect(() => {
        if (selectedProject) {
            if (!selectedProject.structure || selectedProject.structure === '') {
                const emptyStructure = {
                    id: selectedProject.id,
                    name: selectedProject.name,
                    description: selectedProject.description || '',
                    assemblyTypes: [],
                    componentTypes: [],
                    partModels: [],
                    nodes: [],
                    timeline: {
                        assemblyStates: [],
                        unitAssignments: [],
                        maintenanceEvents: []
                    }
                };
                setStructure(emptyStructure);
                setActiveTab('configurator');
            } else {
                try {
                    const parsed = JSON.parse(selectedProject.structure);
                    setStructure(parsed);
                } catch (error) {
                    console.error('Parse error:', error);
                }
            }
        }
    }, [selectedProject]);

    const handleBack = () => {
        navigate('/');
    };

    const handleSaveStructure = async (structureString) => {
        try {
            await updateProject(selectedProject.id, {
                structure: structureString
            });
            setStructure(JSON.parse(structureString));
        } catch (error) {
            console.error('Save error:', error);
            throw error;
        }
    };

    if (!selectedProject) {
        return (
            <div className="project-editor-loading">
                <Spin size="large" tip="Загрузка проекта..." />
            </div>
        );
    }

    if (!structure) {
        return (
            <div className="project-editor-loading">
                <Spin size="large" tip="Инициализация структуры..." />
            </div>
        );
    }

    return (
        <div className="project-editor">
            <div className="project-editor-header">
                <Button
                    icon={<ArrowLeftOutlined />}
                    onClick={handleBack}
                >
                    Назад к проектам
                </Button>
                <h1>{selectedProject.name}</h1>
            </div>

            <div className="project-editor-content">
                <Tabs
                    activeKey={activeTab}
                    onChange={setActiveTab}
                    size="large"
                >
                    <TabPane
                        tab={
                            <span>
                                <CalendarOutlined />
                                Timeline
                            </span>
                        }
                        key="timeline"
                    >
                        <div className="timeline-tab">
                            <div style={{ padding: 24, textAlign: 'center', color: '#8c8c8c' }}>
                                <h2>Timeline</h2>
                                <p>Здесь будет визуализация временной шкалы событий (Этап 3)</p>
                            </div>
                        </div>
                    </TabPane>

                    <TabPane
                        tab={
                            <span>
                                <SettingOutlined />
                                Конфигуратор
                            </span>
                        }
                        key="configurator"
                    >
                        <div className="configurator-tab">
                            <ConfigBlock
                                initialStructure={structure}
                                onSave={handleSaveStructure}
                            />
                        </div>
                    </TabPane>
                </Tabs>
            </div>
        </div>
    );
};

export default ProjectEditor;