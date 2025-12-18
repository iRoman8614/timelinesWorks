import React, { useState, useEffect } from 'react';
import { Row, Col } from 'antd';
import PlanForm from '../forms/PlanForm';
import PlanTable from '../tables/PlanTable';
import planApi from '../../services/api/planApi';
import './PlanEditor.css';

const PlanEditor = ({ projectId }) => {
    const [plans, setPlans] = useState([]);
    const [editingPlan, setEditingPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (projectId) {
            loadPlans();
        }
    }, [projectId]);

    const loadPlans = async () => {
        setLoading(true);
        try {
            const data = await planApi.getAll(projectId);
            setPlans(data);
        } catch (error) {
            console.error('Error loading plans:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleAdd = async (plan) => {
        await planApi.create(plan);
        await loadPlans();
    };

    const handleUpdate = async (plan) => {
        await planApi.create(plan);
        await loadPlans();
    };

    const handleDelete = async (id) => {
        await planApi.delete(id);
        await loadPlans();
    };

    const handleEdit = (plan) => {
        setEditingPlan(plan);
    };

    const handleCancelEdit = () => {
        setEditingPlan(null);
    };

    return (
        <div className="plan-editor">
            <Row gutter={24}>
                <Col xs={24} lg={6}>
                    <PlanForm
                        projectId={projectId}
                        onAdd={handleAdd}
                        onUpdate={handleUpdate}
                        editingItem={editingPlan}
                        onCancelEdit={handleCancelEdit}
                    />
                </Col>

                <Col xs={24} lg={18}>
                    <PlanTable
                        plans={plans}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                    />
                </Col>
            </Row>
        </div>
    );
};

export default PlanEditor;