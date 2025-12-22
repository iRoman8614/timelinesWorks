import React, { useEffect, useRef } from 'react';
import { Card, Button, Alert, Space, message } from 'antd';
import { ThunderboltOutlined, StopOutlined } from '@ant-design/icons';
import { useFluxTimelineGeneration } from '../../hooks/useFluxTimelineGeneration';
import OptimizationInfoDisplay from '../OptimizationInfoDisplay/OptimizationInfoDisplay';
import './FluxGenerationPanel.css';

const FluxGenerationPanel = ({ project, selectedPlan, onTimelineUpdate, onPlanSaved }) => {
    const {
        isGenerating,
        progress,
        error,
        timeline,
        optimizationInfo,
        optimizationHistory,
        wasCancelled,
        generatePlan,
        cancelGeneration,
        clearError,
    } = useFluxTimelineGeneration();

    const lastTimelineRef = useRef(null);
    const wasGeneratingRef = useRef(false);

    useEffect(() => {
        if (timeline && onTimelineUpdate) {
            lastTimelineRef.current = timeline;
            onTimelineUpdate(timeline);
        }
    }, [timeline, onTimelineUpdate]);

    useEffect(() => {
        const saveGeneratedPlan = async () => {
            if (wasGeneratingRef.current && !isGenerating && !wasCancelled && lastTimelineRef.current && selectedPlan) {
                try {
                    const updatedPlan = {
                        ...selectedPlan,
                        timeline: typeof lastTimelineRef.current === 'string'
                            ? lastTimelineRef.current
                            : JSON.stringify(lastTimelineRef.current)
                    };

                    const { default: axiosInstance } = await import('../../services/api/axiosConfig');
                    await axiosInstance.post('/api/plans', updatedPlan);

                    message.success('План успешно сохранен!');

                    if (onPlanSaved) {
                        onPlanSaved(updatedPlan);
                    }
                } catch (err) {
                    console.error('Ошибка сохранения плана:', err);
                    message.error('Не удалось сохранить план: ' + (err.message || 'Неизвестная ошибка'));
                }
            } else if (wasGeneratingRef.current && !isGenerating && wasCancelled) {
                console.log('Генерация отменена, план НЕ сохраняем');
            }

            wasGeneratingRef.current = isGenerating;
        };

        saveGeneratedPlan();
    }, [isGenerating, wasCancelled, selectedPlan, onPlanSaved]);

    const handleGenerate = async () => {
        if (!selectedPlan) {
            message.warning('Выберите план для генерации');
            return;
        }

        lastTimelineRef.current = null;

        try {
            await generatePlan(project, selectedPlan);
        } catch (err) {
            console.error('Generation error:', err);
        }
    };

    const handleCancel = () => {
        cancelGeneration();
        message.info('Генерация отменена');
    };

    return (
        <Card
            // className="flux-generation-panel"
            // title={
            //     <span>
            //         <ThunderboltOutlined style={{ marginRight: 8 }} />
            //         Автоматическая оптимизация плана ТО
            //     </span>
            // }
            // size="small"
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Space>
                    <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        onClick={handleGenerate}
                        loading={isGenerating}
                        disabled={!selectedPlan || isGenerating}
                    >
                        {isGenerating ? 'Генерация...' : 'Сгенерировать план ТО'}
                    </Button>

                    {isGenerating && (
                        <Button
                            danger
                            icon={<StopOutlined />}
                            onClick={handleCancel}
                        >
                            Остановить
                        </Button>
                    )}
                </Space>
                {error && (
                    <Alert
                        message="Ошибка генерации"
                        description={error}
                        type="error"
                        closable
                        onClose={clearError}
                        showIcon
                    />
                )}
                <OptimizationInfoDisplay
                    optimizationInfo={optimizationInfo}
                    optimizationHistory={optimizationHistory}
                />
                {!selectedPlan && (
                    <Alert
                        message="Выберите план"
                        description="Для генерации плана ТО необходимо выбрать план из таблицы выше"
                        type="warning"
                        showIcon
                    />
                )}
            </Space>
        </Card>
    );
};

export default FluxGenerationPanel;