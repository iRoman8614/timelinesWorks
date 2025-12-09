import React, { useState, useMemo } from 'react';
import { Form, Select, InputNumber, Button, Space, List, Typography, Card, Popconfirm, message } from 'antd';
import { EditOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';

const { Text, Title } = Typography;

/**
 * Синхронизированная форма управления условиями узлов
 * Работает напрямую с project.nodes[].conditions
 * Изменения сразу применяются к структуре проекта
 */
const NodeConstraintsForm = ({
                                 project,
                                 onProjectUpdate
                             }) => {
    const [form] = Form.useForm();
    const [constraintType, setConstraintType] = useState(null);
    const [editingNodeId, setEditingNodeId] = useState(null);
    const [editingIndex, setEditingIndex] = useState(null);

    // Рекурсивный сбор всех узлов
    const flattenNodes = (nodesList, prefix = '') => {
        let result = [];
        nodesList.forEach(node => {
            if (node.type === 'NODE') {
                result.push({
                    id: node.id,
                    name: prefix ? `${prefix} / ${node.name}` : node.name,
                    fullPath: prefix ? `${prefix} / ${node.name}` : node.name,
                    conditions: node.conditions || []
                });
                if (node.children) {
                    result = result.concat(flattenNodes(node.children, node.name));
                }
            }
        });
        return result;
    };

    const flatNodes = useMemo(() =>
            flattenNodes(project?.nodes || []),
        [project?.nodes]
    );

    // Собираем все условия из всех узлов
    const allConstraints = useMemo(() => {
        const constraints = [];
        flatNodes.forEach(node => {
            if (node.conditions && node.conditions.length > 0) {
                node.conditions.forEach((condition, index) => {
                    constraints.push({
                        nodeId: node.id,
                        nodeName: node.fullPath,
                        condition: condition,
                        localIndex: index
                    });
                });
            }
        });
        return constraints;
    }, [flatNodes]);

    const handleFinish = (values) => {
        const newCondition = {
            type: values.type
        };

        // if (values.type === 'MAX_MAINTENANCE') {
        //     newCondition.maxUnderMaintenance = values.value;
        // } else
            if (values.type === 'REQUIRED_WORKING') {
            newCondition.requiredWorking = values.value;
        }

        if (editingNodeId !== null && editingIndex !== null) {
            // Режим редактирования
            handleUpdateConstraint(editingNodeId, editingIndex, newCondition);
        } else {
            // Режим добавления
            handleAddConstraint(values.nodeId, newCondition);
        }

        form.resetFields();
        setConstraintType(null);
        setEditingNodeId(null);
        setEditingIndex(null);
    };

    const handleAddConstraint = (nodeId, condition) => {
        const updateNodesConditions = (nodes) => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    return {
                        ...node,
                        conditions: [...(node.conditions || []), condition]
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: updateNodesConditions(node.children)
                    };
                }
                return node;
            });
        };

        const updatedProject = {
            ...project,
            nodes: updateNodesConditions(project.nodes)
        };

        onProjectUpdate(updatedProject);
        message.success('Условие добавлено');
    };

    const handleUpdateConstraint = (nodeId, conditionIndex, newCondition) => {
        const updateNodesConditions = (nodes) => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    const updatedConditions = [...(node.conditions || [])];
                    updatedConditions[conditionIndex] = newCondition;
                    return {
                        ...node,
                        conditions: updatedConditions
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: updateNodesConditions(node.children)
                    };
                }
                return node;
            });
        };

        const updatedProject = {
            ...project,
            nodes: updateNodesConditions(project.nodes)
        };

        onProjectUpdate(updatedProject);
        message.success('Условие обновлено');
    };

    const handleDeleteConstraint = (nodeId, conditionIndex) => {
        const updateNodesConditions = (nodes) => {
            return nodes.map(node => {
                if (node.id === nodeId) {
                    const updatedConditions = (node.conditions || []).filter((_, i) => i !== conditionIndex);
                    return {
                        ...node,
                        conditions: updatedConditions
                    };
                }
                if (node.children) {
                    return {
                        ...node,
                        children: updateNodesConditions(node.children)
                    };
                }
                return node;
            });
        };

        const updatedProject = {
            ...project,
            nodes: updateNodesConditions(project.nodes)
        };

        onProjectUpdate(updatedProject);
        message.success('Условие удалено');
    };

    const handleTypeChange = (value) => {
        setConstraintType(value);
        form.setFieldValue('value', undefined);
    };

    const handleEdit = (nodeId, localIndex, condition) => {
        setEditingNodeId(nodeId);
        setEditingIndex(localIndex);

        let value;
        // if (condition.type === 'MAX_MAINTENANCE') {
        //     value = condition.maxUnderMaintenance;
        // } else
        if (condition.type === 'REQUIRED_WORKING') {
            value = condition.requiredWorking;
        }

        form.setFieldsValue({
            nodeId: nodeId,
            type: condition.type,
            value: value
        });
        setConstraintType(condition.type);
    };

    const handleCancelEdit = () => {
        setEditingNodeId(null);
        setEditingIndex(null);
        form.resetFields();
        setConstraintType(null);
    };

    const getConstraintTypeLabel = (type) => {
        const labels = {
            // 'MAX_MAINTENANCE': 'Максимум на ТО',
            'REQUIRED_WORKING': 'Число работающих'
        };
        return labels[type] || type;
    };

    const getConstraintText = (constraint) => {
        const typeLabel = getConstraintTypeLabel(constraint.condition.type);
        let value;
        // if (constraint.condition.type === 'MAX_MAINTENANCE') {
        //     value = constraint.condition.maxUnderMaintenance;
        // } else
        if (constraint.condition.type === 'REQUIRED_WORKING') {
            value = constraint.condition.requiredWorking;
        }
        return `${constraint.nodeName}: ${typeLabel} = ${value}`;
    };

    const isEditing = editingNodeId !== null && editingIndex !== null;

    return (
        <Card
            title="Управление ограничениями узлов"
            style={{ marginBottom: 16 }}
            size="small"
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Форма добавления/редактирования */}
                <Form
                    form={form}
                    layout="inline"
                    onFinish={handleFinish}
                    style={{ width: '100%', flexWrap: 'wrap', gap: '8px' }}
                >
                    <Form.Item
                        name="nodeId"
                        label="Узел"
                        rules={[{ required: true, message: 'Выберите узел' }]}
                        style={{ minWidth: 200, marginBottom: 8 }}
                    >
                        <Select
                            placeholder="Выберите узел"
                            showSearch
                            disabled={isEditing}
                            filterOption={(input, option) =>
                                option.children.toLowerCase().includes(input.toLowerCase())
                            }
                        >
                            {flatNodes.map(node => (
                                <Select.Option key={node.id} value={node.id}>
                                    {node.fullPath}
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item
                        name="type"
                        label="Тип ограничения"
                        rules={[{ required: true, message: 'Выберите тип' }]}
                        style={{ minWidth: 200, marginBottom: 8 }}
                    >
                        <Select
                            placeholder="Выберите тип"
                            onChange={handleTypeChange}
                        >
                            {/*<Select.Option value="MAX_MAINTENANCE">*/}
                            {/*    Максимум на ТО*/}
                            {/*</Select.Option>*/}
                            <Select.Option value="REQUIRED_WORKING">
                                Минимум работающих
                            </Select.Option>
                        </Select>
                    </Form.Item>

                    {constraintType && (
                        <Form.Item
                            name="value"
                            label="Значение"
                            rules={[
                                { required: true, message: 'Введите значение' },
                                { type: 'number', min: 0, message: 'Значение должно быть >= 0' }
                            ]}
                            style={{ marginBottom: 8 }}
                        >
                            <InputNumber
                                min={0}
                                placeholder="Значение"
                                style={{ width: 120 }}
                            />
                        </Form.Item>
                    )}

                    <Form.Item style={{ marginBottom: 8 }}>
                        <Space>
                            <Button
                                type="primary"
                                htmlType="submit"
                                disabled={!constraintType}
                                icon={isEditing ? <EditOutlined /> : <PlusOutlined />}
                            >
                                {isEditing ? 'Обновить' : 'Добавить'}
                            </Button>
                            {isEditing && (
                                <Button onClick={handleCancelEdit}>
                                    Отменить
                                </Button>
                            )}
                        </Space>
                    </Form.Item>
                </Form>

                {/* Список существующих условий */}
                {allConstraints.length > 0 ? (
                    <div>
                        <Title level={5} style={{ marginBottom: 8 }}>
                            Текущие ограничения ({allConstraints.length})
                        </Title>
                        <List
                            bordered
                            size="small"
                            dataSource={allConstraints}
                            renderItem={(constraint) => (
                                <List.Item
                                    key={`${constraint.nodeId}-${constraint.localIndex}`}
                                    actions={[
                                        <Button
                                            key="edit"
                                            type="text"
                                            size="small"
                                            icon={<EditOutlined />}
                                            onClick={() => handleEdit(
                                                constraint.nodeId,
                                                constraint.localIndex,
                                                constraint.condition
                                            )}
                                            disabled={isEditing && !(
                                                editingNodeId === constraint.nodeId &&
                                                editingIndex === constraint.localIndex
                                            )}
                                        >
                                            Редактировать
                                        </Button>,
                                        <Popconfirm
                                            key="delete"
                                            title="Удалить ограничение?"
                                            description="Вы уверены, что хотите удалить это ограничение?"
                                            onConfirm={() => handleDeleteConstraint(
                                                constraint.nodeId,
                                                constraint.localIndex
                                            )}
                                            okText="Да"
                                            cancelText="Нет"
                                            disabled={isEditing}
                                        >
                                            <Button
                                                type="text"
                                                size="small"
                                                danger
                                                icon={<DeleteOutlined />}
                                                disabled={isEditing}
                                            >
                                                Удалить
                                            </Button>
                                        </Popconfirm>
                                    ]}
                                >
                                    <Text>{getConstraintText(constraint)}</Text>
                                </List.Item>
                            )}
                        />
                    </div>
                ) : (
                    <div style={{
                        background: '#fafafa',
                        padding: '24px',
                        borderRadius: '8px',
                        textAlign: 'center'
                    }}>
                        <Text type="secondary">
                            Ограничения не заданы. Добавьте первое ограничение используя форму выше.
                        </Text>
                    </div>
                )}
            </Space>
        </Card>
    );
};

export default NodeConstraintsForm;