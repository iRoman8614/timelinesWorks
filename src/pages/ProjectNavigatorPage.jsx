import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Layout, Typography, Spin, Modal, Button, Space, message, Table} from 'antd';
import {PlusOutlined, CheckOutlined, CloseOutlined} from '@ant-design/icons';
import ProjectForm from "../components/Forms/ProjectForm";
import {serverProjectsApi} from "../services/apiService";

const { Header, Content } = Layout;
const { Title } = Typography;

const ProjectNavigatorPage = () => {
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const navigate = useNavigate();
    const [serverProjects, setServerProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const loadServerProjects = () => {
        setLoadingProjects(true);
        serverProjectsApi.getAll()
            .then(data => {
                setServerProjects(data);
                setLoadingProjects(false);
            })
            .catch(error => {
                console.error('Error loading server projects:', error);
                message.error('Ошибка загрузки проектов с сервера');
                setLoadingProjects(false);
            });
    };

    useEffect(() => {
        loadServerProjects();
    }, []);

    const handleSelectProject = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const handleCreateProject = async (projectData) => {
        try {
            const created = await serverProjectsApi.createEmpty(projectData.name, projectData.description);
            message.success('Проект создан');
            setIsProjectModalVisible(false);
            await loadServerProjects();
            navigate(`/project/${created.id}`);
        } catch (error) {
            console.error('Error creating project:', error);
            message.error('Ошибка создания проекта');
        }
    };

    const startDelete = (projectId) => {
        setDeletingId(projectId);
    };

    const handleConfirmDelete = async (project) => {
        try {
            await serverProjectsApi.delete(project.id);
            message.success('Проект удалён');
            setDeletingId(null);
            loadServerProjects();
        } catch (error) {
            console.error('Error deleting project:', error);
            message.error('Ошибка удаления проекта');
        }
    };

    const handleCancelDelete = () => {
        setDeletingId(null);
    };

    if (loadingProjects) {
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Title level={4} style={{ margin: 0 }}>Проекты</Title>
                        <Button
                            type="primary"
                            icon={<PlusOutlined />}
                            onClick={() => setIsProjectModalVisible(true)}
                        >
                            Создать проект
                        </Button>
                    </div>

                    <Table
                        rowKey="id"
                        dataSource={serverProjects}
                        pagination={false}
                        loading={loadingProjects}
                        columns={[
                            {
                                title: 'Название',
                                dataIndex: 'name',
                                key: 'name',
                                width: '30%'
                            },
                            {
                                title: 'Описание',
                                dataIndex: 'description',
                                key: 'description',
                                width: '50%'
                            },
                            {
                                title: 'Действия',
                                key: 'actions',
                                width: '20%',
                                render: (_, record) => {
                                    if (deletingId === record.id) {
                                        return (
                                            <Space size="small">
                                                <Button
                                                    size="small"
                                                    type="primary"
                                                    danger
                                                    icon={<CheckOutlined />}
                                                    onClick={() => handleConfirmDelete(record)}
                                                >
                                                    Да
                                                </Button>

                                                <Button
                                                    size="small"
                                                    icon={<CloseOutlined />}
                                                    onClick={handleCancelDelete}
                                                >
                                                    Нет
                                                </Button>
                                            </Space>
                                        );
                                    }

                                    return (
                                        <Space size="small">
                                            <Button
                                                type="link"
                                                onClick={() => handleSelectProject(record.id)}
                                            >
                                                Открыть
                                            </Button>
                                            <Button
                                                size="small"
                                                danger
                                                onClick={() => startDelete(record.id)}
                                            >
                                                Удалить
                                            </Button>
                                        </Space>
                                    );
                                }
                            }
                        ]}
                    />
                </div>
            </Content>

            <Modal
                title="Создать проект"
                open={isProjectModalVisible}
                onCancel={() => setIsProjectModalVisible(false)}
                footer={null}
                width={600}
            >
                <ProjectForm onSubmit={handleCreateProject} />
            </Modal>
        </Layout>
    );
};

export default ProjectNavigatorPage;