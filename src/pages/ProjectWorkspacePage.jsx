import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Typography, Button, Spin, Tabs, message, Modal, Space, Collapse } from 'antd';
import { ArrowLeftOutlined, SaveOutlined, SendOutlined, PlusOutlined, ExclamationCircleOutlined } from '@ant-design/icons';
import { dataService } from '../services/dataService';
import TimelineTab from '../components/ProjectWorkspace/TimelineTab';
import InstructionBlock from '../components/ProjectWorkspace/InstructionBlock';
import './ProjectWorkspace.css';
import {
    NodeForm,
    AssemblyForm,
    AssemblyTypeForm,
    ComponentForm,
    ComponentTypeForm,
    PartModelForm,
    MaintenanceTypeForm,
    UnitForm,
    NodeConditionForm
} from '../components/Forms/index'
import {
    NodesTable,
    AssemblyTypesTable,
    ComponentsTable,
    ComponentTypesTable,
    PartModelsTable,
    MaintenanceTypesTable,
    UnitsTable
} from '../components/Tables/index'

const { Header, Content } = Layout;
const { Title } = Typography;
const { Panel } = Collapse;

const ProjectWorkspacePage = () => {
    const { projectId } = useParams();
    const navigate = useNavigate();
    const [project, setProject] = useState(null);
    const [loading, setLoading] = useState(true);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

    const [activeModal, setActiveModal] = useState(null);
    const [selectedItem, setSelectedItem] = useState(null);
    const [editingItem, setEditingItem] = useState(null);

    const loadProject = () => {
        setLoading(true);
        dataService.getProject(projectId)
            .then(data => {
                setProject(data);
                setLoading(false);
                setHasUnsavedChanges(false);
            })
            .catch(error => {
                console.error('Error loading project:', error);
                message.error('Ошибка загрузки проекта');
                setLoading(false);
            });
    };

    useEffect(() => {
        loadProject();
    }, [projectId]);

    const saveProject = () => {
        dataService.saveProject(projectId, project)
            .then(() => {
                message.success('Проект сохранен');
                setHasUnsavedChanges(false);
            })
            .catch(error => {
                console.error('Error saving project:', error);
                message.error('Ошибка сохранения проекта');
            });
    };

    const sendToServer = () => {
        message.info('Отправка на сервер...');

        // Пример POST запроса:
        // fetch('/api/projects/optimize', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify(project)
        // })
        // .then(response => response.json())
        // .then(data => {
        //     const updatedProject = { ...project, timeline: data.timeline };
        //     setProject(updatedProject);
        //     dataService.saveProject(projectId, updatedProject);
        //     message.success('Таймлайны получены от сервера');
        // });
    };

    const updateProject = (updatedData) => {
        setProject(updatedData);
        setHasUnsavedChanges(true);
    };

    const handleAddComponentType = (data) => {
        const updated = {
            ...project,
            componentTypes: [...project.componentTypes, data]
        };
        updateProject(updated);
        setActiveModal(null);
    };

    const handleDeleteComponentType = (record) => {
        const updated = {
            ...project,
            componentTypes: project.componentTypes.filter(item => item.id !== record.id)
        };
        updateProject(updated);
        message.success(`Тип агрегата "${record.name}" удален`);
    };

    const handleAddAssemblyType = (data) => {
        const updated = {
            ...project,
            assemblyTypes: [...project.assemblyTypes, data]
        };
        updateProject(updated);
        setActiveModal(null);
    };

    const handleDeleteAssemblyType = (record) => {
        const updated = {
            ...project,
            assemblyTypes: project.assemblyTypes.filter(item => item.id !== record.id)
        };
        updateProject(updated);
    };

    const handleManageComponents = (assemblyType) => {
        setSelectedItem(assemblyType);
        setActiveModal('components');
    };

    const handleAddComponentToAssemblyType = (data) => {
        const updated = {
            ...project,
            assemblyTypes: project.assemblyTypes.map(at =>
                at.id === selectedItem.id
                    ? { ...at, components: [...at.components, data] }
                    : at
            )
        };
        updateProject(updated);
        setSelectedItem(updated.assemblyTypes.find(at => at.id === selectedItem.id));
    };

    const handleDeleteComponentFromAssemblyType = (component) => {
        const updated = {
            ...project,
            assemblyTypes: project.assemblyTypes.map(at =>
                at.id === selectedItem.id
                    ? { ...at, components: at.components.filter(c => c.id !== component.id) }
                    : at
            )
        };
        updateProject(updated);
        setSelectedItem(updated.assemblyTypes.find(at => at.id === selectedItem.id));
    };

    const handleAddPartModel = (data) => {
        const updated = {
            ...project,
            partModels: [...project.partModels, data]
        };
        updateProject(updated);
        setActiveModal(null);
    };

    const handleDeletePartModel = (record) => {
        Modal.confirm({
            title: 'Удалить модель детали?',
            okText: 'Удалить',
            cancelText: 'Отмена',
            okButtonProps: { danger: true },
            onOk: () => {
                const updated = {
                    ...project,
                    partModels: project.partModels.filter(item => item.id !== record.id)
                };
                updateProject(updated);
            }
        });
    };

    const handleManageMaintenance = (partModel) => {
        setSelectedItem(partModel);
        setActiveModal('maintenance');
    };

    const handleManageUnits = (partModel) => {
        setSelectedItem(partModel);
        setActiveModal('units');
    };

    const handleAddMaintenanceType = (data) => {
        const updated = {
            ...project,
            partModels: project.partModels.map(pm =>
                pm.id === selectedItem.id
                    ? { ...pm, maintenanceTypes: [...pm.maintenanceTypes, data] }
                    : pm
            )
        };
        updateProject(updated);
        setSelectedItem(updated.partModels.find(pm => pm.id === selectedItem.id));
    };

    const handleEditMaintenanceType = (record) => {
        setEditingItem(record);
        setActiveModal('editMaintenanceType');
    }

    const handleDeleteMaintenanceType = (maintenanceType) => {
        const updated = {
            ...project,
            partModels: project.partModels.map(pm =>
                pm.id === selectedItem.id
                    ? { ...pm, maintenanceTypes: pm.maintenanceTypes.filter(mt => mt.id !== maintenanceType.id) }
                    : pm
            )
        };
        updateProject(updated);
        setSelectedItem(updated.partModels.find(pm => pm.id === selectedItem.id));
    };

    const handleAddUnit = (data) => {
        const updated = {
            ...project,
            partModels: project.partModels.map(pm =>
                pm.id === selectedItem.id
                    ? { ...pm, units: [...pm.units, data] }
                    : pm
            )
        };
        updateProject(updated);
        setSelectedItem(updated.partModels.find(pm => pm.id === selectedItem.id));
    };

    const handleDeleteUnit = (unit) => {
        const updated = {
            ...project,
            partModels: project.partModels.map(pm =>
                pm.id === selectedItem.id
                    ? { ...pm, units: pm.units.filter(u => u.id !== unit.id) }
                    : pm
            )
        };
        updateProject(updated);
        setSelectedItem(updated.partModels.find(pm => pm.id === selectedItem.id));
    };

    const handleAddNode = (data) => {
        const updated = {
            ...project,
            nodes: [...project.nodes, data]
        };
        updateProject(updated);
        setActiveModal(null);
    };

    const handleAddChildNode = (parentNode, data) => {
        const addChild = (nodes) => {
            return nodes.map(node => {
                if (node.id === parentNode.id) {
                    return {
                        ...node,
                        children: [...node.children, data]
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: addChild(node.children)
                    };
                }
                return node;
            });
        };

        const updated = {
            ...project,
            nodes: addChild(project.nodes)
        };
        updateProject(updated);
    };

    const handleDeleteNode = (node) => {
        const updated = {
            ...project,
            nodes: project.nodes.map(pm =>
                pm.id === node.id
                    ? { ...pm, nodes: pm.nodes.filter(mt => mt.id !== node.id) }
                    : pm
            )
        };
        updateProject(updated);
        setSelectedItem(updated.nodes.find(pm => pm.id === node.id));
    };

    const handleManageConditions = (node) => {
        setSelectedItem(node);
        setActiveModal('conditions');
    };

    const handleEditComponentType = (record) => {
        setEditingItem(record);
        setActiveModal('editComponentType');
    };

    const handleEditAssemblyType = (record) => {
        setEditingItem(record);
        setActiveModal('editAssemblyType');
    };

    const handleAddCondition = (data) => {
        const addConditionToNode = (nodes) => {
            return nodes.map(node => {
                if (node.id === selectedItem.id) {
                    return {
                        ...node,
                        conditions: [...node.conditions, data]
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: addConditionToNode(node.children)
                    };
                }
                return node;
            });
        };

        const updated = {
            ...project,
            nodes: addConditionToNode(project.nodes)
        };
        updateProject(updated);
        setSelectedItem(updated.nodes.find(n => n.id === selectedItem.id));
    };

    const handleBackToProjects = () => {
        if (hasUnsavedChanges) {
            Modal.confirm({
                title: 'Несохраненные изменения',
                content: 'У вас есть несохраненные изменения. Сохранить перед выходом?',
                okText: 'Сохранить и выйти',
                cancelText: 'Выйти без сохранения',
                onOk: () => {
                    saveProject();
                    navigate('/');
                },
                onCancel: () => {
                    navigate('/');
                }
            });
        } else {
            navigate('/');
        }
    };

    const handleAddChildClick = (parentNode) => {
        setSelectedItem(parentNode);
        setActiveModal('selectChildType');
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
                    <Button onClick={() => navigate('/')}>Вернуться к списку проектов</Button>
                </Content>
            </Layout>
        );
    }

    const tabItems = [
        {
            key: 'timeline',
            label: 'Таймлайн',
            children: <TimelineTab project={project} />
        },
        {
            key: 'configurator',
            label: 'Конфигуратор',
            children: (
                <div className="tab-content">
                    <InstructionBlock />

                    <Title level={4} style={{ marginBottom: 16 }}>Информация об элементах проекта</Title>

                    <Collapse defaultActiveKey={['1', '2', '3', '4']}>
                        <Panel
                            header={
                                <Space>
                                    <span>Типы компонентов</span>
                                </Space>
                            }
                            key="1"
                            extra={
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveModal('componentType');
                                    }}
                                >
                                    Добавить
                                </Button>
                            }
                        >
                            <ComponentTypesTable
                                componentTypes={project.componentTypes}
                                onEdit={handleEditComponentType}
                                onDelete={handleDeleteComponentType}
                            />
                        </Panel>

                        <Panel
                            header={
                                <Space>
                                    <span>Агрегаты</span>
                                </Space>
                            }
                            key="2"
                            extra={
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveModal('assemblyType');
                                    }}
                                >
                                    Добавить
                                </Button>
                            }
                        >
                            <AssemblyTypesTable
                                assemblyTypes={project.assemblyTypes}
                                onEdit={handleEditAssemblyType}
                                onDelete={handleDeleteAssemblyType}
                                onManageComponents={handleManageComponents}
                            />
                        </Panel>

                        <Panel
                            header={
                                <Space>
                                    <span>Модели деталей</span>
                                </Space>
                            }
                            key="3"
                            extra={
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveModal('partModel');
                                    }}
                                >
                                    Добавить
                                </Button>
                            }
                        >
                            <PartModelsTable
                                partModels={project.partModels}
                                onEdit={(record) => console.log('Edit', record)}
                                onDelete={handleDeletePartModel}
                                onManageMaintenance={handleManageMaintenance}
                                onManageUnits={handleManageUnits}
                            />
                        </Panel>

                        <Panel
                            header={
                                <Space>
                                    <span>Структура узлов</span>
                                </Space>
                            }
                            key="4"
                            extra={
                                <Button
                                    type="primary"
                                    size="small"
                                    icon={<PlusOutlined />}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveModal('node');
                                    }}
                                >
                                    Добавить
                                </Button>
                            }
                        >
                            <NodesTable
                                nodes={project.nodes}
                                onEdit={(record) => console.log('Edit', record)}
                                onDelete={handleDeleteNode}
                                onAddChild={handleAddChildClick}
                                onManageConditions={handleManageConditions}
                                assemblyTypes={project.assemblyTypes}
                            />
                        </Panel>
                    </Collapse>
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
                        {hasUnsavedChanges && <Typography.Text type="warning">(Несохранено)</Typography.Text>}
                    </div>
                    <Space>
                        <Button
                            icon={<SaveOutlined />}
                            onClick={saveProject}
                            disabled={!hasUnsavedChanges}
                        >
                            Сохранить
                        </Button>
                        <Button
                            type="primary"
                            icon={<SendOutlined />}
                            onClick={sendToServer}
                        >
                            Отправить на сервер
                        </Button>
                    </Space>
                </div>
            </Header>
            <Content style={{ padding: '24px', background: '#f0f2f5' }}>
                <div className="project-workspace">
                    <Tabs defaultActiveKey="timeline" items={tabItems} />
                </div>
            </Content>

            <Modal
                title="Добавить тип компонента"
                open={activeModal === 'componentType'}
                onCancel={() => setActiveModal(null)}
                footer={null}
                width={600}
            >
                <ComponentTypeForm onSubmit={handleAddComponentType} />
            </Modal>

            <Modal
                title="Добавить тип агрегата"
                open={activeModal === 'assemblyType'}
                onCancel={() => setActiveModal(null)}
                footer={null}
                width={600}
            >
                <AssemblyTypeForm onSubmit={handleAddAssemblyType} />
            </Modal>

            <Modal
                title="Добавить модель детали"
                open={activeModal === 'partModel'}
                onCancel={() => setActiveModal(null)}
                footer={null}
                width={600}
            >
                <PartModelForm onSubmit={handleAddPartModel} />
            </Modal>

            <Modal
                title="Добавить узел"
                open={activeModal === 'node'}
                onCancel={() => setActiveModal(null)}
                footer={null}
                width={600}
            >
                <NodeForm onSubmit={handleAddNode} />
            </Modal>

            <Modal
                title="Добавить дочерний узел"
                open={activeModal === 'childNode'}
                onCancel={() => {
                    setActiveModal(null);
                    setSelectedItem(null);
                }}
                footer={null}
                width={600}
            >
                <NodeForm onSubmit={(data) => {
                    handleAddChildNode(selectedItem, data);
                    setActiveModal(null);
                    setSelectedItem(null);
                }} />
            </Modal>

            <Modal
                title="Редактировать тип компонента"
                open={activeModal === 'editComponentType'}
                onCancel={() => {
                    setActiveModal(null);
                    setEditingItem(null);
                }}
                footer={null}
                width={600}
            >
                <ComponentTypeForm
                    initialValues={editingItem}
                    onSubmit={(data) => {
                        const updated = {
                            ...project,
                            componentTypes: project.componentTypes.map(ct =>
                                ct.id === editingItem.id
                                    ? { ...ct, name: data.name, description: data.description }
                                    : ct
                            )
                        };
                        updateProject(updated);
                        setActiveModal(null);
                        setEditingItem(null);
                        message.success('Тип компонента обновлен');
                    }}
                />
            </Modal>

            <Modal
                title="Редактировать тип агрегата"
                open={activeModal === 'editAssemblyType'}
                onCancel={() => {
                    setActiveModal(null);
                    setEditingItem(null);
                }}
                footer={null}
                width={600}
            >
                <AssemblyTypeForm
                    initialValues={editingItem}
                    onSubmit={(data) => {
                        const updated = {
                            ...project,
                            assemblyTypes: project.assemblyTypes.map(at =>
                                at.id === editingItem.id
                                    ? { ...at, name: data.name, description: data.description }
                                    : at
                            )
                        };
                        updateProject(updated);
                        setActiveModal(null);
                        setEditingItem(null);
                        message.success('Тип агрегата обновлен');
                    }}
                />
            </Modal>

            <Modal
                title="Добавить агрегат"
                open={activeModal === 'assembly'}
                onCancel={() => {
                    setActiveModal(null);
                    setSelectedItem(null);
                }}
                footer={null}
                width={600}
            >
                <AssemblyForm
                    onSubmit={(data) => {
                        handleAddChildNode(selectedItem, data);
                        setActiveModal(null);
                        setSelectedItem(null);
                    }}
                    assemblyTypes={project.assemblyTypes}
                />
            </Modal>

            <Modal
                title={`Компоненты: ${selectedItem?.name}`}
                open={activeModal === 'components'}
                onCancel={() => {
                    setActiveModal(null);
                    setSelectedItem(null);
                }}
                footer={null}
                width={1000}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <ComponentForm
                        onSubmit={handleAddComponentToAssemblyType}
                        componentTypes={project.componentTypes}
                    />
                    <ComponentsTable
                        components={selectedItem?.components || []}
                        onDelete={handleDeleteComponentFromAssemblyType}
                        componentTypes={project.componentTypes}
                    />
                </Space>
            </Modal>

            <Modal
                title={`Типы ТО: ${selectedItem?.name}`}
                open={activeModal === 'maintenance'}
                onCancel={() => {
                    setActiveModal(null);
                    setSelectedItem(null);
                }}
                footer={null}
                width={1000}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <MaintenanceTypeForm onSubmit={handleAddMaintenanceType} />
                    <MaintenanceTypesTable
                        maintenanceTypes={selectedItem?.maintenanceTypes || []}
                        onEdit={handleEditMaintenanceType}
                        onDelete={handleDeleteMaintenanceType}
                        onAddChild={handleAddMaintenanceType}
                    />
                </Space>
            </Modal>

            <Modal
                title={`Детали: ${selectedItem?.name}`}
                open={activeModal === 'units'}
                onCancel={() => {
                    setActiveModal(null);
                    setSelectedItem(null);
                }}
                footer={null}
                width={1000}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <UnitForm onSubmit={handleAddUnit} />
                    <UnitsTable
                        units={selectedItem?.units || []}
                        onEdit={(record) => console.log('Edit', record)}
                        onDelete={handleDeleteUnit}
                    />
                </Space>
            </Modal>

            <Modal
                title={`Добавить к узлу: ${selectedItem?.name}`}
                open={activeModal === 'selectChildType'}
                onCancel={() => {
                    setActiveModal(null);
                    setSelectedItem(null);
                }}
                footer={null}
                width={400}
            >
                <Space direction="vertical" style={{ width: '100%' }} size="large">
                    <Button
                        type="primary"
                        size="large"
                        block
                        icon={<PlusOutlined />}
                        onClick={() => {
                            setActiveModal('childNode');
                        }}
                    >
                        Добавить дочерний узел
                    </Button>
                    <Button
                        type="primary"
                        size="large"
                        block
                        icon={<PlusOutlined />}
                        style={{ background: '#52c41a', borderColor: '#52c41a' }}
                        onClick={() => {
                            setActiveModal('assembly');
                        }}
                    >
                        Добавить агрегат
                    </Button>
                </Space>
            </Modal>

            <Modal
                title={`Условия: ${selectedItem?.name}`}
                open={activeModal === 'conditions'}
                onCancel={() => {
                    setActiveModal(null);
                    setSelectedItem(null);
                }}
                footer={null}
                width={700}
            >
                <Space direction="vertical" size="middle" style={{ width: '100%' }}>
                    <NodeConditionForm onSubmit={handleAddCondition} />
                    <div style={{ background: '#fafafa', padding: '16px', borderRadius: '8px' }}>
                        <Title level={5}>Текущие условия</Title>
                        {selectedItem?.conditions?.map((condition, index) => (
                            <div key={index} style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>
                                <Typography.Text>
                                    {condition.type === 'MAX_MAINTENANCE'
                                        ? `Максимум на ТО: ${condition.maxUnderMaintenance}`
                                        : `Минимум работающих: ${condition.requiredWorking}`}
                                </Typography.Text>
                            </div>
                        ))}
                        {(!selectedItem?.conditions || selectedItem.conditions.length === 0) && (
                            <Typography.Text type="secondary">Условия не заданы</Typography.Text>
                        )}
                    </div>
                </Space>
            </Modal>
        </Layout>
    );
};

export default ProjectWorkspacePage;