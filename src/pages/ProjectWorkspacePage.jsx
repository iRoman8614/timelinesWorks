import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Typography, Button, Spin, Tabs } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { dataService } from '../services/dataService';
import TimelineTab from '../components/ProjectWorkspace/TimelineTab';
import './ProjectWorkspace.css';

const { Header, Content } = Layout;
const { Title } = Typography;

const ProjectWorkspacePage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Загрузка данных проекта
        dataService.getProject(projectId)
            .then(data => {
                setProject(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading project:', error);
                setLoading(false);
            });
    }, [projectId]);

    const handleBackToProjects = () => {
        navigate('/');
    };

    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </Layout>
        );
    }

    if (!project) {
        return (
            <Layout style={{ minHeight: '100vh' }}>
                <Content style={{ padding: '24px' }}>
                    <Title level={3}>Проект не найден</Title>
                    <Button onClick={handleBackToProjects}>Вернуться к списку проектов</Button>
                </Content>
            </Layout>
        );
    }

    const tabItems = [
        {
            key: 'timeline',
            label: '📊 Таймлайн',
            children: <TimelineTab project={project} />
        },
        {
            key: 'configurator',
            label: '⚙️ Конфигуратор',
            children: (
                <div className="tab-content">
                    <Title level={4}>Конфигуратор (в разработке)</Title>
                    <p>Здесь будут настройки типов работ, агрегатов, компонентов и деталей</p>
                </div>
            )
        }
    ];

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                        <Button
                            icon={<ArrowLeftOutlined />}
                            onClick={handleBackToProjects}
                            type="text"
                        >
                            Назад к проектам
                        </Button>
                        <Title level={3} style={{ margin: '16px 0' }}>
                            {project.name}
                        </Title>
                    </div>
                </div>
            </Header>
            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
                <div className="project-workspace">
                    <Tabs defaultActiveKey="timeline" items={tabItems} />
                </div>
            </Content>
        </Layout>
    );
};

export default ProjectWorkspacePage;