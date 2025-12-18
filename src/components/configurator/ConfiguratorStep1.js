import React, { useState } from 'react';
import { Row, Col } from 'antd';
import ComponentTypeForm from '../forms/ComponentTypeForm';
import ComponentTypeTable from '../tables/ComponentTypeTable';
import './ConfiguratorStep1.css';

const ConfiguratorStep1 = ({ componentTypes, onAdd, onUpdate, onDelete }) => {
    const [editingItem, setEditingItem] = useState(null);

    const handleEdit = (record) => {
        setEditingItem(record);
    };

    const handleCancelEdit = () => {
        setEditingItem(null);
    };

    const handleUpdate = async (id, values) => {
        await onUpdate(id, values);
        setEditingItem(null);
    };

    return (
        <div className="configurator-step">
            <Row gutter={24} style={{ height: '100%' }}>
                <Col xs={24} lg={6} style={{ height: '100%' }}>
                    <ComponentTypeForm
                        onAdd={onAdd}
                        onUpdate={handleUpdate}
                        componentTypes={componentTypes}
                        editingItem={editingItem}
                        onCancelEdit={handleCancelEdit}
                    />
                </Col>

                <Col xs={24} lg={18} style={{ height: '100%' }}>
                    <ComponentTypeTable
                        data={componentTypes}
                        onUpdate={handleUpdate}
                        onDelete={onDelete}
                        onEdit={handleEdit}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default ConfiguratorStep1;