import React, { useState, useCallback } from 'react';
import { Button, Space, message } from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import ConfiguratorStep1 from './configurator/ConfiguratorStep1';
import ConfiguratorStep2 from './configurator/ConfiguratorStep2';
import ConfiguratorStep3 from './configurator/ConfiguratorStep3';
import ConfiguratorStep4 from './configurator/ConfiguratorStep4';
import './ConfigBlock.css';

const ConfigBlock = ({ initialStructure, onSave }) => {
    const [structure, setStructure] = useState(initialStructure);
    const [currentStep, setCurrentStep] = useState(0);

    const steps = [
        { key: 0, title: 'Компоненты' },
        { key: 1, title: 'Агрегаты' },
        { key: 2, title: 'Детали' },
        { key: 3, title: 'Структура' },
    ];

    const updateStructure = useCallback(async (updater) => {
        try {
            const newStructure = typeof updater === 'function'
                ? updater(structure)
                : updater;

            setStructure(newStructure);

            await onSave(JSON.stringify(newStructure));

            return true;
        } catch (error) {
            console.error('Error updating structure:', error);
            message.error('Ошибка при сохранении изменений');
            return false;
        }
    }, [structure, onSave]);

    const handleAddComponentType = useCallback((componentType) => {
        return updateStructure(prev => ({
            ...prev,
            componentTypes: [...prev.componentTypes, componentType]
        }));
    }, [updateStructure]);

    const handleUpdateComponentType = useCallback((id, updates) => {
        return updateStructure(prev => {
            const oldItem = prev.componentTypes.find(ct => ct.id === id);
            const newItem = { ...oldItem, ...updates };

            const componentTypes = prev.componentTypes.map(ct => {
                if (ct.id === id) {
                    return newItem;
                }
                return ct;
            });

            return {
                ...prev,
                componentTypes
            };
        });
    }, [updateStructure]);

    const handleDeleteComponentType = useCallback((id) => {
        const isUsedInAssemblyTypes = structure.assemblyTypes.some(at =>
            at.components?.some(c => c.componentTypeId === id)
        );
        const isUsedInPartModels = structure.partModels.some(pm =>
            pm.componentTypeId === id
        );

        if (isUsedInAssemblyTypes || isUsedInPartModels) {
            message.error('Невозможно удалить: тип компонента используется');
            return false;
        }

        const idsToDelete = new Set([id]);
        const findChildren = (parentId) => {
            structure.componentTypes.forEach(ct => {
                if (ct.parentId === parentId) {
                    idsToDelete.add(ct.id);
                    findChildren(ct.id);
                }
            });
        };
        findChildren(id);

        for (const childId of idsToDelete) {
            const isChildUsedInAssemblyTypes = structure.assemblyTypes.some(at =>
                at.components?.some(c => c.componentTypeId === childId)
            );
            const isChildUsedInPartModels = structure.partModels.some(pm =>
                pm.componentTypeId === childId
            );

            if (isChildUsedInAssemblyTypes || isChildUsedInPartModels) {
                message.error('Невозможно удалить: дочерний тип компонента используется');
                return false;
            }
        }

        return updateStructure(prev => ({
            ...prev,
            componentTypes: prev.componentTypes.filter(ct => !idsToDelete.has(ct.id))
        }));
    }, [structure, updateStructure]);

    const handleAddAssemblyType = useCallback((assemblyType) => {
        return updateStructure(prev => ({
            ...prev,
            assemblyTypes: [...prev.assemblyTypes, assemblyType]
        }));
    }, [updateStructure]);

    const handleUpdateAssemblyType = useCallback((id, updates) => {
        return updateStructure(prev => ({
            ...prev,
            assemblyTypes: prev.assemblyTypes.map(at =>
                at.id === id ? { ...at, ...updates } : at
            )
        }));
    }, [updateStructure]);

    const handleDeleteAssemblyType = useCallback((id) => {
        // TODO: Проверить, используется ли в Nodes (Assembly)
        const isUsedInNodes = JSON.stringify(structure.nodes).includes(id);

        if (isUsedInNodes) {
            message.error('Невозможно удалить: тип агрегата используется');
            return false;
        }

        return updateStructure(prev => ({
            ...prev,
            assemblyTypes: prev.assemblyTypes.filter(at => at.id !== id)
        }));
    }, [structure, updateStructure]);

    const handleAddComponent = useCallback((assemblyTypeId, component) => {
        return updateStructure(prev => ({
            ...prev,
            assemblyTypes: prev.assemblyTypes.map(at =>
                at.id === assemblyTypeId
                    ? { ...at, components: [...(at.components || []), component] }
                    : at
            )
        }));
    }, [updateStructure]);

    const handleUpdateComponent = useCallback((assemblyTypeId, componentId, updates) => {
        return updateStructure(prev => ({
            ...prev,
            assemblyTypes: prev.assemblyTypes.map(at =>
                at.id === assemblyTypeId
                    ? {
                        ...at,
                        components: at.components.map(c =>
                            c.id === componentId ? { ...c, ...updates } : c
                        )
                    }
                    : at
            )
        }));
    }, [updateStructure]);

    const handleDeleteComponent = useCallback((assemblyTypeId, componentId) => {
        return updateStructure(prev => ({
            ...prev,
            assemblyTypes: prev.assemblyTypes.map(at =>
                at.id === assemblyTypeId
                    ? {
                        ...at,
                        components: at.components.filter(c => c.id !== componentId)
                    }
                    : at
            )
        }));
    }, [updateStructure]);

    const handleAddPartModel = useCallback((partModel) => {
        return updateStructure(prev => ({
            ...prev,
            partModels: [...prev.partModels, partModel]
        }));
    }, [updateStructure]);

    const handleUpdatePartModel = useCallback((id, updates) => {
        return updateStructure(prev => ({
            ...prev,
            partModels: prev.partModels.map(pm =>
                pm.id === id ? { ...pm, ...updates } : pm
            )
        }));
    }, [updateStructure]);

    const handleDeletePartModel = useCallback((id) => {
        // TODO: Проверить, используется ли в Timeline
        return updateStructure(prev => ({
            ...prev,
            partModels: prev.partModels.filter(pm => pm.id !== id)
        }));
    }, [updateStructure]);

    const handleAddMaintenanceType = useCallback((partModelId, maintenanceType) => {
        return updateStructure(prev => ({
            ...prev,
            partModels: prev.partModels.map(pm =>
                pm.id === partModelId
                    ? { ...pm, maintenanceTypes: [...(pm.maintenanceTypes || []), maintenanceType] }
                    : pm
            )
        }));
    }, [updateStructure]);

    const handleUpdateMaintenanceType = useCallback((partModelId, maintenanceId, updates) => {
        return updateStructure(prev => ({
            ...prev,
            partModels: prev.partModels.map(pm =>
                pm.id === partModelId
                    ? {
                        ...pm,
                        maintenanceTypes: pm.maintenanceTypes.map(mt =>
                            mt.id === maintenanceId ? { ...mt, ...updates } : mt
                        )
                    }
                    : pm
            )
        }));
    }, [updateStructure]);

    const handleDeleteMaintenanceType = useCallback((partModelId, maintenanceId) => {
        return updateStructure(prev => ({
            ...prev,
            partModels: prev.partModels.map(pm =>
                pm.id === partModelId
                    ? {
                        ...pm,
                        maintenanceTypes: pm.maintenanceTypes.filter(mt => mt.id !== maintenanceId)
                    }
                    : pm
            )
        }));
    }, [updateStructure]);

    const handleAddUnit = useCallback((partModelId, unit) => {
        return updateStructure(prev => ({
            ...prev,
            partModels: prev.partModels.map(pm =>
                pm.id === partModelId
                    ? { ...pm, units: [...(pm.units || []), unit] }
                    : pm
            )
        }));
    }, [updateStructure]);

    const handleUpdateUnit = useCallback((partModelId, unitId, updates) => {
        return updateStructure(prev => ({
            ...prev,
            partModels: prev.partModels.map(pm =>
                pm.id === partModelId
                    ? {
                        ...pm,
                        units: pm.units.map(u =>
                            u.id === unitId ? { ...u, ...updates } : u
                        )
                    }
                    : pm
            )
        }));
    }, [updateStructure]);

    const handleDeleteUnit = useCallback((partModelId, unitId) => {
        return updateStructure(prev => ({
            ...prev,
            partModels: prev.partModels.map(pm =>
                pm.id === partModelId
                    ? {
                        ...pm,
                        units: pm.units.filter(u => u.id !== unitId)
                    }
                    : pm
            )
        }));
    }, [updateStructure]);

    const handleAddNode = useCallback((node) => {
        return updateStructure(prev => ({
            ...prev,
            nodes: [...prev.nodes, node]
        }));
    }, [updateStructure]);

    const handleUpdateNode = useCallback((id, updates) => {
        const updateInTree = (nodes) => {
            return nodes.map(node => {
                if (node.id === id) {
                    return { ...node, ...updates };
                }
                if (node.children) {
                    return { ...node, children: updateInTree(node.children) };
                }
                return node;
            });
        };

        return updateStructure(prev => ({
            ...prev,
            nodes: updateInTree(prev.nodes)
        }));
    }, [updateStructure]);

    const handleDeleteNode = useCallback((id) => {
        const removeFromTree = (nodes) => {
            return nodes.filter(node => node.id !== id).map(node => {
                if (node.children) {
                    return { ...node, children: removeFromTree(node.children) };
                }
                return node;
            });
        };

        return updateStructure(prev => ({
            ...prev,
            nodes: removeFromTree(prev.nodes)
        }));
    }, [updateStructure]);

    const handleAddAssembly = useCallback((assembly) => {
        return updateStructure(prev => ({
            ...prev,
            nodes: [...prev.nodes, assembly]
        }));
    }, [updateStructure]);

    const handleUpdateAssembly = useCallback((id, updates) => {
        const updateInTree = (nodes) => {
            return nodes.map(node => {
                if (node.id === id) {
                    return { ...node, ...updates };
                }
                if (node.children) {
                    return { ...node, children: updateInTree(node.children) };
                }
                return node;
            });
        };

        return updateStructure(prev => ({
            ...prev,
            nodes: updateInTree(prev.nodes)
        }));
    }, [updateStructure]);

    const handleDeleteAssembly = useCallback((id) => {
        const removeFromTree = (nodes) => {
            return nodes.filter(node => node.id !== id).map(node => {
                if (node.children) {
                    return { ...node, children: removeFromTree(node.children) };
                }
                return node;
            });
        };

        return updateStructure(prev => ({
            ...prev,
            nodes: removeFromTree(prev.nodes)
        }));
    }, [updateStructure]);

    const handleMoveNodeItem = useCallback((itemId, newParentId) => {
        let movedItem = null;

        const removeItem = (nodes) => {
            const result = [];
            for (const node of nodes) {
                if (node.id === itemId) {
                    const { parentId: oldParentId, ...rest } = node;
                    movedItem = newParentId === null
                        ? { ...rest, parentId: null }
                        : { ...rest, parentId: newParentId };
                } else {
                    const newNode = { ...node };
                    if (node.children) {
                        newNode.children = removeItem(node.children);
                    }
                    result.push(newNode);
                }
            }
            return result;
        };

        const insertItem = (nodes) => {
            if (newParentId === null) {
                return nodes;
            }

            return nodes.map(node => {
                if (node.id === newParentId && node.type === 'NODE') {
                    return {
                        ...node,
                        children: [...(node.children || []), movedItem]
                    };
                }
                if (node.children) {
                    return { ...node, children: insertItem(node.children) };
                }
                return node;
            });
        };

        return updateStructure(prev => {
            let newNodes = removeItem(prev.nodes);

            if (newParentId === null && movedItem) {
                newNodes = [...newNodes, movedItem];
            } else if (movedItem) {
                newNodes = insertItem(newNodes);
            }

            return { ...prev, nodes: newNodes };
        });
    }, [updateStructure]);

    const canGoToStep = (step) => {
        if (step === 0) return true;
        if (step === 1) return structure?.componentTypes?.length > 0;
        if (step === 2) return structure?.assemblyTypes?.length > 0;
        if (step === 3) return structure?.partModels?.length > 0;
        return false;
    };

    const handleStepChange = (step) => {
        if (canGoToStep(step)) {
            setCurrentStep(step);
        } else {
            message.warning('Заполните текущий шаг перед переходом к следующему');
        }
    };

    const handlePrev = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            handleStepChange(currentStep + 1);
        }
    };

    return (
        <div className="config-block">
            <div className="config-block-navigation">
                <Space size="middle">
                    <Button
                        icon={<LeftOutlined />}
                        onClick={handlePrev}
                        disabled={currentStep === 0}
                    >
                        Назад
                    </Button>

                    {steps.map(step => (
                        <Button
                            key={step.key}
                            type={currentStep === step.key ? 'primary' : 'default'}
                            onClick={() => handleStepChange(step.key)}
                            disabled={!canGoToStep(step.key)}
                        >
                            {step.title}
                        </Button>
                    ))}

                    <Button
                        icon={<RightOutlined />}
                        onClick={handleNext}
                        disabled={currentStep === steps.length - 1 || !canGoToStep(currentStep + 1)}
                        iconPosition="end"
                    >
                        Вперёд
                    </Button>
                </Space>
            </div>

            <div className="config-block-content">
                {currentStep === 0 && (
                    <ConfiguratorStep1
                        componentTypes={structure.componentTypes}
                        onAdd={handleAddComponentType}
                        onUpdate={handleUpdateComponentType}
                        onDelete={handleDeleteComponentType}
                    />
                )}

                {currentStep === 1 && (
                    <ConfiguratorStep2
                        assemblyTypes={structure.assemblyTypes}
                        componentTypes={structure.componentTypes}
                        onAdd={handleAddAssemblyType}
                        onUpdate={handleUpdateAssemblyType}
                        onDelete={handleDeleteAssemblyType}
                        onAddComponent={handleAddComponent}
                        onUpdateComponent={handleUpdateComponent}
                        onDeleteComponent={handleDeleteComponent}
                    />
                )}

                {currentStep === 2 && (
                    <ConfiguratorStep3
                        partModels={structure.partModels}
                        componentTypes={structure.componentTypes}
                        onAdd={handleAddPartModel}
                        onUpdate={handleUpdatePartModel}
                        onDelete={handleDeletePartModel}
                        onAddMaintenance={handleAddMaintenanceType}
                        onUpdateMaintenance={handleUpdateMaintenanceType}
                        onDeleteMaintenance={handleDeleteMaintenanceType}
                        onAddUnit={handleAddUnit}
                        onUpdateUnit={handleUpdateUnit}
                        onDeleteUnit={handleDeleteUnit}
                    />
                )}

                {currentStep === 3 && (
                    <ConfiguratorStep4
                        nodes={structure.nodes}
                        assemblyTypes={structure.assemblyTypes}
                        onAddNode={handleAddNode}
                        onUpdateNode={handleUpdateNode}
                        onDeleteNode={handleDeleteNode}
                        onAddAssembly={handleAddAssembly}
                        onUpdateAssembly={handleUpdateAssembly}
                        onDeleteAssembly={handleDeleteAssembly}
                        onMoveItem={handleMoveNodeItem}
                    />
                )}
            </div>
        </div>
    );
};

export default ConfigBlock;