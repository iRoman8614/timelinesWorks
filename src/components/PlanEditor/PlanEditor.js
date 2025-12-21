import React, { useState, useEffect } from 'react';
import { Row, Col, Modal, DatePicker, Alert, Upload, message, Button } from 'antd';
import { DownloadOutlined, UploadOutlined, FileExcelOutlined, CalendarOutlined } from '@ant-design/icons';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import PlanForm from '../forms/PlanForm';
import PlanTable from '../tables/PlanTable';
import FluxGenerationPanel from '../FluxGenerationPanel/FluxGenerationPanel';
import MonthlyReportModal from '../Reports/MonthlyReportModal';
import AnnualReportModal from '../Reports/AnnualReportModal';
import planApi from '../../services/api/planApi';
import historyApi from '../../services/api/historyApi';
import './PlanEditor.css';

const PlanEditor = ({ projectId, project, onPlanSelect }) => {
    const [searchParams, setSearchParams] = useSearchParams();
    const [plans, setPlans] = useState([]);
    const [editingPlan, setEditingPlan] = useState(null);
    const [selectedPlan, setSelectedPlan] = useState(null);
    const [loading, setLoading] = useState(false);

    const [downloadModalVisible, setDownloadModalVisible] = useState(false);
    const [baseDate, setBaseDate] = useState(dayjs());
    const [downloading, setDownloading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const [monthlyReportVisible, setMonthlyReportVisible] = useState(false);
    const [annualReportVisible, setAnnualReportVisible] = useState(false);

    const structure = React.useMemo(() => {
        if (!project?.structure) return null;
        try {
            return typeof project.structure === 'string'
                ? JSON.parse(project.structure)
                : project.structure;
        } catch (error) {
            console.error('Error parsing structure:', error);
            return null;
        }
    }, [project]);

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

            const planIdFromUrl = searchParams.get('planId');

            if (planIdFromUrl) {
                const planFromUrl = data.find(p => p.id === planIdFromUrl);
                if (planFromUrl) {
                    setSelectedPlan(planFromUrl);
                    if (onPlanSelect) {
                        onPlanSelect(planFromUrl);
                    }
                } else {
                    if (data.length > 0) {
                        setSelectedPlan(data[0]);
                        setSearchParams({ planId: data[0].id }, { replace: true });
                        if (onPlanSelect) {
                            onPlanSelect(data[0]);
                        }
                    }
                }
            } else {
                if (data.length > 0) {
                    setSelectedPlan(data[0]);
                    setSearchParams({ planId: data[0].id }, { replace: true });
                    if (onPlanSelect) {
                        onPlanSelect(data[0]);
                    }
                }
            }
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

    const handleOpenDownloadModal = () => {
        setBaseDate(dayjs());
        setDownloadModalVisible(true);
    };

    const handleDownloadTemplate = async () => {
        if (!projectId) {
            message.error('Проект не выбран');
            return;
        }

        setDownloading(true);
        try {
            const formattedDate = baseDate.format('YYYY-MM-DDTHH:mm:ss');
            const filename = `template_${projectId}_${baseDate.format('YYYY-MM-DD')}.xlsx`;

            await historyApi.downloadTemplateFile(
                projectId,
                formattedDate,
                true,
                filename
            );

            message.success('Шаблон успешно скачан');
            setDownloadModalVisible(false);
        } catch (error) {
            console.error('Download error:', error);
            message.error('Ошибка при скачивании шаблона');
        } finally {
            setDownloading(false);
        }
    };

    const handleUpload = async (file) => {
        if (!projectId) {
            message.error('Проект не выбран');
            return false;
        }

        setUploading(true);
        try {
            await historyApi.uploadHistory(projectId, file);
            message.success('Наработки успешно импортированы');
        } catch (error) {
            console.error('Upload error:', error);
            message.error('Ошибка при импорте наработок');
        } finally {
            setUploading(false);
        }

        return false;
    };

    return (
        <div className="plan-editor">
            <div className="plan-editor-actions">
                <Button
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleOpenDownloadModal}
                    loading={downloading}
                >
                    Скачать шаблон
                </Button>

                <Upload
                    accept=".xlsx,.xls"
                    beforeUpload={handleUpload}
                    showUploadList={false}
                    disabled={uploading}
                >
                    <Button
                        icon={<UploadOutlined />}
                        loading={uploading}
                    >
                        Импортировать наработки
                    </Button>
                </Upload>
            </div>

            <Row gutter={24}>
                <Col xs={24} lg={6}>
                    <PlanForm
                        projectId={projectId}
                        historyUpdatedAt={project?.historyUpdatedAt}
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
                        onSelect={(plan) => {
                            setSelectedPlan(plan);
                            setSearchParams({ planId: plan.id }, { replace: true });
                            if (onPlanSelect) {
                                onPlanSelect(plan);
                            }
                        }}
                    />
                </Col>
            </Row>

            <Row gutter={24}>
                <Col xs={24}>
                    <FluxGenerationPanel
                        project={project}
                        selectedPlan={selectedPlan}
                        onTimelineUpdate={(timeline) => {
                            const updatedPlan = {
                                ...selectedPlan,
                                timeline: timeline
                            };
                            setSelectedPlan(updatedPlan);

                            if (onPlanSelect) {
                                onPlanSelect(updatedPlan);
                            }
                        }}
                        onPlanSaved={(updatedPlan) => {
                            loadPlans();
                            setSelectedPlan(updatedPlan);
                        }}
                    />
                </Col>
            </Row>
            <Row gutter={24} style={{ marginTop: 16 }}>
                <Col xs={24}>
                    <div style={{
                        padding: '16px',
                        background: '#fafafa',
                        borderRadius: 8,
                        display: 'flex',
                        justifyContent: 'flex-end',
                        gap: 12
                    }}>
                        <span style={{ marginRight: 'auto', fontWeight: 500, color: '#595959' }}>
                            Выгрузка отчетов:
                        </span>
                        <Button
                            icon={<FileExcelOutlined />}
                            onClick={() => setMonthlyReportVisible(true)}
                            disabled={!structure || !selectedPlan}
                        >
                            Скачать месячный отчет
                        </Button>
                        <Button
                            icon={<CalendarOutlined />}
                            onClick={() => setAnnualReportVisible(true)}
                            disabled={!structure || !selectedPlan}
                        >
                            Скачать годовой отчет
                        </Button>
                    </div>
                </Col>
            </Row>
            <MonthlyReportModal
                visible={monthlyReportVisible}
                onCancel={() => setMonthlyReportVisible(false)}
                project={project}
                plan={selectedPlan}
                structure={structure}
            />

            <AnnualReportModal
                visible={annualReportVisible}
                onCancel={() => setAnnualReportVisible(false)}
                project={project}
                plan={selectedPlan}
                structure={structure}
            />

            <Modal
                title={
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <DownloadOutlined />
                        <span>Скачать шаблон</span>
                    </div>
                }
                open={downloadModalVisible}
                onCancel={() => setDownloadModalVisible(false)}
                onOk={handleDownloadTemplate}
                okText="Скачать шаблон"
                cancelText="Отмена"
                confirmLoading={downloading}
                okButtonProps={{
                    icon: <DownloadOutlined />
                }}
            >
                <div style={{ marginBottom: 16 }}>
                    <p style={{ color: '#8c8c8c', marginBottom: 16 }}>
                        Выберите базовую дату для выгрузки наработок в шаблон
                    </p>

                    <div style={{ marginBottom: 16 }}>
                        <label style={{ display: 'block', marginBottom: 8, fontWeight: 500 }}>
                            Базовая дата:
                        </label>
                        <DatePicker
                            value={baseDate}
                            onChange={(date) => setBaseDate(date || dayjs())}
                            format="YYYY-MM-DD"
                            style={{ width: '100%' }}
                            size="large"
                        />
                    </div>

                    <Alert
                        message="Примечание:"
                        description="Базовая дата используется для расчета наработок оборудования в шаблоне."
                        type="info"
                        showIcon
                    />
                </div>
            </Modal>
        </div>
    );
};

export default PlanEditor;