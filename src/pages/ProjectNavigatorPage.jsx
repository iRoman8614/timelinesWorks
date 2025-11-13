import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {Layout, Typography, Spin, Modal, Button, Space, message, Table} from 'antd';
import {PlusOutlined, FolderAddOutlined, CheckOutlined, CloseOutlined} from '@ant-design/icons';
import ProjectTree from '../components/ProjectNavigator/ProjectTree';
import { dataService } from '../services/dataService';
import ProjectForm from "../components/Forms/ProjectForm";
import FolderForm from "../components/Forms/FolderForm";
import {serverProjectsApi} from "../services/apiService";

const { Header, Content } = Layout;
const { Title } = Typography;

const ProjectNavigatorPage = () => {
    const [structureTree, setStructureTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
    const [selectedParentKey, setSelectedParentKey] = useState(null);
    const navigate = useNavigate();
    const [serverProjects, setServerProjects] = useState([]);
    const [loadingProjects, setLoadingProjects] = useState(true);
    const [deletingId, setDeletingId] = useState(null);

    const loadStructureTree = () => {
        setLoading(true);
        dataService.getStructureTree()
            .then(data => {
                setStructureTree(data);
                setLoading(false);
            })
            .catch(error => {
                console.error('Error loading structure tree:', error);
                message.error('Ошибка загрузки дерева проектов');
                setLoading(false);
            });
    };

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
        loadStructureTree();
        loadServerProjects();
    }, []);

    const handleSelectProject = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const handleCreateProject = async () => {
        try {
            const created = await serverProjectsApi.createEmpty('Новый проект');
            message.success('Проект создан на сервере');
            await loadServerProjects();
            navigate(`/project/${created.id}`);
        } catch (error) {
            console.error('Error creating project:', error);
            message.error('Ошибка создания проекта на сервере');
        }
    };

    const handleCreateFolder = (folderData) => {
        dataService.addFolder(folderData, selectedParentKey)
            .then(() => {
                message.success('Папка создана успешно');
                setIsFolderModalVisible(false);
                setSelectedParentKey(null);
                loadStructureTree();
            })
            .catch(error => {
                console.error('Error creating folder:', error);
                message.error('Ошибка создания папки');
            });
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

    const handleDeleteItem = (itemKey) => {
        Modal.confirm({
            title: 'Подтверждение удаления',
            content: 'Вы уверены, что хотите удалить этот элемент?',
            okText: 'Удалить',
            cancelText: 'Отмена',
            okButtonProps: { danger: true },
            onOk: () => {
                dataService.deleteFromTree(itemKey)
                    .then(() => {
                        message.success('Элемент удален');
                        loadStructureTree();
                    })
                    .catch(error => {
                        console.error('Error deleting item:', error);
                        message.error('Ошибка удаления');
                    });
            }
        });
    };

    const handleDeleteServerProject = (projectId) => {
        Modal.confirm({
            title: 'Удалить проект?',
            content: 'Проект будет удалён на сервере без возможности восстановления.',
            okText: 'Удалить',
            cancelText: 'Отмена',
            okButtonProps: { danger: true },
            onOk: async () => {
                try {
                    await serverProjectsApi.delete(projectId);
                    message.success('Проект удалён');
                    loadServerProjects();
                } catch (error) {
                    console.error('Error deleting project:', error);
                    message.error('Ошибка удаления проекта');
                }
            }
        });
    };


    if (loading) {
        return (
            <Layout style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Spin size="large" />
            </Layout>
        );
    }

    return (
        <>
            <Header style={{ background: '#fff', padding: '0 24px', borderBottom: '1px solid #f0f0f0' }}>
                <Title level={3} style={{ margin: '16px 0' }}>
                    Техническое Обслуживание
                </Title>
            </Header>
            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
                <div style={{ background: '#fff', padding: '24px', borderRadius: '8px', minHeight: '600px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                        <Title level={4} style={{ margin: 0 }}>Выберите проект</Title>
                        <Space>
                            {/*<Button*/}
                            {/*    type="primary"*/}
                            {/*    icon={<FolderAddOutlined />}*/}
                            {/*    onClick={() => {*/}
                            {/*        setSelectedParentKey(null);*/}
                            {/*        setIsFolderModalVisible(true);*/}
                            {/*    }}*/}
                            {/*>*/}
                            {/*    Создать папку*/}
                            {/*</Button>*/}
                            <Button
                                type="primary"
                                icon={<PlusOutlined />}
                                onClick={handleCreateProject}
                            >
                                Создать проект
                            </Button>
                        </Space>
                    </div>
                    {structureTree && (
                        <ProjectTree
                            data={structureTree}
                            onSelectProject={handleSelectProject}
                            onDeleteItem={handleDeleteItem}
                        />
                    )}
                </div>
            </Content>

            {/*<Modal*/}
            {/*    title="Создать папку"*/}
            {/*    open={isFolderModalVisible}*/}
            {/*    onCancel={() => {*/}
            {/*        setIsFolderModalVisible(false);*/}
            {/*        setSelectedParentKey(null);*/}
            {/*    }}*/}
            {/*    footer={null}*/}
            {/*    width={600}*/}
            {/*>*/}
            {/*    <FolderForm onSubmit={handleCreateFolder} />*/}
            {/*</Modal>*/}

            <Modal
                title="Создать проект"
                open={isProjectModalVisible}
                onCancel={() => {
                    setIsProjectModalVisible(false);
                    setSelectedParentKey(null);
                }}
                footer={null}
                width={600}
            >
                <ProjectForm onSubmit={handleCreateProject} />
            </Modal>
            <div style={{ padding: '24px', background: '#f0f2f5' }}>
                <Title level={5}>Проекты на сервере</Title>
                {loadingProjects ? (
                    <Spin />
                ) : (
                    <Table
                        rowKey="id"
                        dataSource={serverProjects}
                        pagination={false}
                        columns={[
                            { title: 'Название', dataIndex: 'name', key: 'name' },
                            { title: 'Описание', dataIndex: 'description', key: 'description' },
                            {
                                title: 'Действия',
                                key: 'actions',
                                width: 240,
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
                )}
            </div>
        </>
    );
};

export default ProjectNavigatorPage;