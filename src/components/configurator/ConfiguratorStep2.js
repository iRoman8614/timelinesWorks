import React, { useState } from 'react';
import { Row, Col } from 'antd';
import AssemblyTypeForm from '../forms/AssemblyTypeForm';
import ComponentForm from '../forms/ComponentForm';
import AssemblyTypeTable from '../tables/AssemblyTypeTable';
import './ConfiguratorStep2.css';

const ConfiguratorStep2 = ({
                               assemblyTypes,
                               componentTypes,
                               onAdd,
                               onUpdate,
                               onDelete,
                               onAddComponent,
                               onUpdateComponent,
                               onDeleteComponent
                           }) => {
    const [editingAssembly, setEditingAssembly] = useState(null);
    const [editingComponent, setEditingComponent] = useState(null);
    const [addingComponentTo, setAddingComponentTo] = useState(null);

    const showComponentForm = addingComponentTo !== null || editingComponent !== null;

    const handleEditAssembly = (record) => {
        setEditingAssembly(record);
        setAddingComponentTo(null);
        setEditingComponent(null);
    };

    const handleCancelEditAssembly = () => {
        setEditingAssembly(null);
    };

    const handleUpdateAssembly = async (id, values) => {
        await onUpdate(id, values);
        setEditingAssembly(null);
    };

    const handleAddComponent = (assemblyTypeId) => {
        setAddingComponentTo(assemblyTypeId);
        setEditingAssembly(null);
        setEditingComponent(null);
    };

    const handleEditComponent = (assemblyTypeId, component) => {
        setEditingComponent({ ...component, assemblyTypeId });
        setAddingComponentTo(null);
        setEditingAssembly(null);
    };

    const handleCancelEditComponent = () => {
        setEditingComponent(null);
    };

    const handleBackToAssembly = () => {
        setAddingComponentTo(null);
        setEditingComponent(null);
    };

    const handleAddComponentSubmit = async (assemblyTypeId, component) => {
        await onAddComponent(assemblyTypeId, component);
        setAddingComponentTo(null);
    };

    const handleUpdateComponentSubmit = async (assemblyTypeId, componentId, values) => {
        await onUpdateComponent(assemblyTypeId, componentId, values);
        setEditingComponent(null);
    };

    return (
        <div className="configurator-step">
            <Row gutter={24} style={{ height: '100%' }}>
                <Col xs={24} lg={6} style={{ height: '100%' }}>
                    {showComponentForm ? (
                        <ComponentForm
                            assemblyTypeId={addingComponentTo || editingComponent?.assemblyTypeId}
                            componentTypes={componentTypes}
                            onAdd={handleAddComponentSubmit}
                            onUpdate={handleUpdateComponentSubmit}
                            editingItem={editingComponent}
                            onCancelEdit={handleCancelEditComponent}
                            onBack={handleBackToAssembly}
                        />
                    ) : (
                        <AssemblyTypeForm
                            onAdd={onAdd}
                            onUpdate={handleUpdateAssembly}
                            editingItem={editingAssembly}
                            onCancelEdit={handleCancelEditAssembly}
                        />
                    )}
                </Col>

                <Col xs={24} lg={18} style={{ height: '100%' }}>
                    <AssemblyTypeTable
                        data={assemblyTypes}
                        componentTypes={componentTypes}
                        onEdit={handleEditAssembly}
                        onDelete={onDelete}
                        onAddComponent={handleAddComponent}
                        onEditComponent={handleEditComponent}
                        onDeleteComponent={onDeleteComponent}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default ConfiguratorStep2;