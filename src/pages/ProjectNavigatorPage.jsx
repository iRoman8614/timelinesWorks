import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Layout, Typography, Spin, Modal, Button, Space, message } from 'antd';
import { PlusOutlined, FolderAddOutlined } from '@ant-design/icons';
import ProjectTree from '../components/ProjectNavigator/ProjectTree';
import { dataService } from '../services/dataService';
import ProjectForm from "../components/Forms/ProjectForm";
import FolderForm from "../components/Forms/FolderForm";

const { Header, Content } = Layout;
const { Title } = Typography;

const ProjectNavigatorPage = () => {
    const [structureTree, setStructureTree] = useState(null);
    const [loading, setLoading] = useState(true);
    const [isProjectModalVisible, setIsProjectModalVisible] = useState(false);
    const [isFolderModalVisible, setIsFolderModalVisible] = useState(false);
    const [selectedParentKey, setSelectedParentKey] = useState(null);
    const navigate = useNavigate();

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

    useEffect(() => {
        loadStructureTree();
    }, []);

    const handleSelectProject = (projectId) => {
        navigate(`/project/${projectId}`);
    };

    const handleCreateProject = (projectData) => {
        dataService.addProjectToTree(projectData, selectedParentKey)
            .then(() => {
                message.success('Проект создан успешно');
                setIsProjectModalVisible(false);
                setSelectedParentKey(null);
                loadStructureTree();
            })
            .catch(error => {
                console.error('Error creating project:', error);
                message.error('Ошибка создания проекта');
            });
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
                                onClick={() => {
                                    setSelectedParentKey(null);
                                    setIsProjectModalVisible(true);
                                }}
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
        </Layout>
    );
};

export default ProjectNavigatorPage;