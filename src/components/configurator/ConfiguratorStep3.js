import React, { useState } from 'react';
import { Row, Col } from 'antd';
import PartModelForm from '../forms/PartModelForm';
import MaintenanceTypeForm from '../forms/MaintenanceTypeForm';
import UnitForm from '../forms/UnitForm';
import PartModelTable from '../tables/PartModelTable';
import './ConfiguratorStep3.css';

const ConfiguratorStep3 = ({
                               partModels,
                               componentTypes,
                               onAdd,
                               onUpdate,
                               onDelete,
                               onAddMaintenance,
                               onUpdateMaintenance,
                               onDeleteMaintenance,
                               onAddUnit,
                               onUpdateUnit,
                               onDeleteUnit
                           }) => {
    const [editingPartModel, setEditingPartModel] = useState(null);
    const [editingMaintenance, setEditingMaintenance] = useState(null);
    const [editingUnit, setEditingUnit] = useState(null);
    const [addingMaintenanceTo, setAddingMaintenanceTo] = useState(null);
    const [addingUnitTo, setAddingUnitTo] = useState(null);

    const showMaintenanceForm = addingMaintenanceTo !== null || editingMaintenance !== null;
    const showUnitForm = addingUnitTo !== null || editingUnit !== null;

    const handleEditPartModel = (record) => {
        setEditingPartModel(record);
        setAddingMaintenanceTo(null);
        setAddingUnitTo(null);
        setEditingMaintenance(null);
        setEditingUnit(null);
    };

    const handleCancelEditPartModel = () => {
        setEditingPartModel(null);
    };

    const handleUpdatePartModel = async (id, values) => {
        await onUpdate(id, values);
        setEditingPartModel(null);
    };

    const handleAddMaintenance = (partModelId) => {
        setAddingMaintenanceTo(partModelId);
        setEditingPartModel(null);
        setAddingUnitTo(null);
        setEditingMaintenance(null);
        setEditingUnit(null);
    };

    const handleEditMaintenance = (partModelId, maintenance) => {
        setEditingMaintenance({ ...maintenance, partModelId });
        setAddingMaintenanceTo(null);
        setAddingUnitTo(null);
        setEditingPartModel(null);
        setEditingUnit(null);
    };

    const handleCancelEditMaintenance = () => {
        setEditingMaintenance(null);
    };

    const handleBackFromMaintenance = () => {
        setAddingMaintenanceTo(null);
        setEditingMaintenance(null);
    };

    const handleAddMaintenanceSubmit = async (partModelId, maintenance) => {
        await onAddMaintenance(partModelId, maintenance);
        setAddingMaintenanceTo(null);
    };

    const handleUpdateMaintenanceSubmit = async (partModelId, maintenanceId, values) => {
        await onUpdateMaintenance(partModelId, maintenanceId, values);
        setEditingMaintenance(null);
    };

    const handleAddUnit = (partModelId) => {
        setAddingUnitTo(partModelId);
        setEditingPartModel(null);
        setAddingMaintenanceTo(null);
        setEditingMaintenance(null);
        setEditingUnit(null);
    };

    const handleEditUnit = (partModelId, unit) => {
        setEditingUnit({ ...unit, partModelId });
        setAddingUnitTo(null);
        setAddingMaintenanceTo(null);
        setEditingPartModel(null);
        setEditingMaintenance(null);
    };

    const handleCancelEditUnit = () => {
        setEditingUnit(null);
    };

    const handleBackFromUnit = () => {
        setAddingUnitTo(null);
        setEditingUnit(null);
    };

    const handleAddUnitSubmit = async (partModelId, unit) => {
        await onAddUnit(partModelId, unit);
        setAddingUnitTo(null);
    };

    const handleUpdateUnitSubmit = async (partModelId, unitId, values) => {
        await onUpdateUnit(partModelId, unitId, values);
        setEditingUnit(null);
    };

    const getCurrentMaintenanceTypes = () => {
        const partModelId = addingMaintenanceTo || editingMaintenance?.partModelId;
        if (!partModelId) return [];

        const partModel = partModels.find(pm => pm.id === partModelId);
        return partModel?.maintenanceTypes || [];
    };

    return (
        <div className="configurator-step">
            <Row gutter={24} style={{ height: '100%' }}>
                <Col xs={24} lg={6} style={{ height: '100%' }}>
                    {showMaintenanceForm ? (
                        <MaintenanceTypeForm
                            partModelId={addingMaintenanceTo || editingMaintenance?.partModelId}
                            maintenanceTypes={getCurrentMaintenanceTypes()}
                            onAdd={handleAddMaintenanceSubmit}
                            onUpdate={handleUpdateMaintenanceSubmit}
                            editingItem={editingMaintenance}
                            onCancelEdit={handleCancelEditMaintenance}
                            onBack={handleBackFromMaintenance}
                        />
                    ) : showUnitForm ? (
                        <UnitForm
                            partModelId={addingUnitTo || editingUnit?.partModelId}
                            onAdd={handleAddUnitSubmit}
                            onUpdate={handleUpdateUnitSubmit}
                            editingItem={editingUnit}
                            onCancelEdit={handleCancelEditUnit}
                            onBack={handleBackFromUnit}
                        />
                    ) : (
                        <PartModelForm
                            componentTypes={componentTypes}
                            onAdd={onAdd}
                            onUpdate={handleUpdatePartModel}
                            editingItem={editingPartModel}
                            onCancelEdit={handleCancelEditPartModel}
                        />
                    )}
                </Col>

                <Col xs={24} lg={18} style={{ height: '100%' }}>
                    <PartModelTable
                        data={partModels}
                        componentTypes={componentTypes}
                        onEdit={handleEditPartModel}
                        onDelete={onDelete}
                        onAddMaintenance={handleAddMaintenance}
                        onEditMaintenance={handleEditMaintenance}
                        onDeleteMaintenance={onDeleteMaintenance}
                        onAddUnit={handleAddUnit}
                        onEditUnit={handleEditUnit}
                        onDeleteUnit={onDeleteUnit}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default ConfiguratorStep3;