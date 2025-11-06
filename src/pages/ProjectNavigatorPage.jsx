import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Typography, Spin } from 'antd';
import ProjectTree from '../components/ProjectNavigator/ProjectTree';
import { dataService } from '../services/dataService';

const { Header, Content } = Layout;
const { Title } = Typography;

const ProjectNavigatorPage = () => {
    const [structureTree, setStructureTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    useEffect(() => {
        // Загрузка дерева проектов
        dataService.getStructureTree()
            .then(data => {
                setStructureTree(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading structure tree:', error);
                setLoading(false);
            });
    }, []);

    const handleSelectProject = (projectId) => {
        // Переход на страницу проекта
        navigate(`/project/${projectId}`);
    };

    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </Layout>
        );
    }

    return (
        <Layout style={{ minHeight: '100vh' }}>
            <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
                <Title level={3} style={{ margin: '16px 0' }}>
                    Техническое Обслуживание
                </Title>
            </Header>
            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: '600px' }}>
                    <Title level={4} style={{ marginBottom: '24px' }}>Выберите проект</Title>
                    {structureTree && (
                        <ProjectTree
                            data={structureTree}
                            onSelectProject={handleSelectProject}
                        />
                    )}
                </div>
            </Content>
        </Layout>
    );
};

export default ProjectNavigatorPage;