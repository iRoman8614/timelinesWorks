import { useState, useCallback, useEffect, useRef } from 'react';
import { fluxService } from '../services/fluxService';

export const useFluxTimelineGeneration = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState(null);
    const [timeline, setTimeline] = useState(null);
    const [optimizationInfo, setOptimizationInfo] = useState(null);
    const [optimizationHistory, setOptimizationHistory] = useState([]);
    const [timelineVersion, setTimelineVersion] = useState(0);
    const [retryCount, setRetryCount] = useState(0);
    const historyBufferRef = useRef([]);
    const lastHistoryUpdateRef = useRef(0);
    const historyUpdateTimerRef = useRef(null);
    useEffect(() => {
        if (!optimizationInfo || !optimizationInfo.currentIteration) return;

        const newPoint = {
            iteration: optimizationInfo.currentIteration,
            temperature: optimizationInfo.currentTemperature || 0,
            bestHardPenalty: optimizationInfo.best?.hardPenalty || 0,
            bestSoftPenalty: optimizationInfo.best?.softPenalty || 0,
            currentHardPenalty: optimizationInfo.current?.hardPenalty || 0,
            currentSoftPenalty: optimizationInfo.current?.softPenalty || 0,
        };

        historyBufferRef.current.push(newPoint);

        if (historyBufferRef.current.length > 300) {
            historyBufferRef.current = historyBufferRef.current.slice(-300);
        }

        const now = Date.now();
        const timeSinceLastUpdate = now - lastHistoryUpdateRef.current;

        if (timeSinceLastUpdate >= 500) {
            lastHistoryUpdateRef.current = now;
            setOptimizationHistory([...historyBufferRef.current]);
        } else if (!historyUpdateTimerRef.current) {
            historyUpdateTimerRef.current = setTimeout(() => {
                lastHistoryUpdateRef.current = Date.now();
                setOptimizationHistory([...historyBufferRef.current]);
                historyUpdateTimerRef.current = null;
            }, 500 - timeSinceLastUpdate);
        }
    }, [optimizationInfo]);

    useEffect(() => {
        return () => {
            if (historyUpdateTimerRef.current) {
                clearTimeout(historyUpdateTimerRef.current);
            }
            fluxService.disconnect();
        };
    }, []);

    const generatePlan = useCallback(async (project, activePlan) => {
        setIsGenerating(true);
        setProgress('Инициализация генерации плана...');
        setError(null);
        setTimeline(null);
        setOptimizationInfo(null);
        setOptimizationHistory([]);
        historyBufferRef.current = [];
        lastHistoryUpdateRef.current = 0;
        setRetryCount(0);

        try {
            await fluxService.generatePlanWithFlux(project, activePlan, {
                onProgress: (message) => {
                    setProgress(typeof message === 'string' ? message : 'Обработка...');
                },

                onTimelineUpdate: (timelineData) => {
                    setTimeline(timelineData);
                    setTimelineVersion(v => v + 1);
                },

                onOptimizationInfo: (info) => {
                    setOptimizationInfo(info);
                },

                onComplete: (finalData) => {
                    const tl = finalData?.timeline || finalData;
                    const validations = finalData?.optimizationInformation?.best?.validations;
                    if (tl && validations) {
                        const timelineWithValidations = {
                            ...tl,
                            validations: validations
                        };
                        setTimeline(timelineWithValidations);
                    } else {
                        setTimeline(tl);
                    }

                    if (finalData?.optimizationInformation) {
                        setOptimizationInfo(finalData.optimizationInformation);
                    }

                    setTimelineVersion(v => v + 1);
                    setProgress('Генерация завершена');
                    setIsGenerating(false);

                    if (historyBufferRef.current.length > 0) {
                        setOptimizationHistory([...historyBufferRef.current]);
                    }
                },

                onError: (err) => {
                    console.error('Flux error:', err);
                    setError(err?.message || 'Ошибка при генерации плана');
                    setProgress('');
                    setIsGenerating(false);
                },

                onRetry: (count) => {
                    setRetryCount(count);
                    setProgress(`Переподключение... (попытка ${count})`);
                },
            });
        } catch (err) {
            console.error('Generate plan error:', err);
            setError(err?.message || 'Ошибка при генерации плана');
            setProgress('');
            setIsGenerating(false);
        }
    }, []);

    const [wasCancelled, setWasCancelled] = useState(false);

    const cancelGenerationWithFlag = useCallback(() => {
        setWasCancelled(true);
        fluxService.disconnect();
        setIsGenerating(false);
        setProgress('Отменено');
    }, []);

    const generatePlanWrapper = useCallback(async (project, activePlan) => {
        setWasCancelled(false);
        return generatePlan(project, activePlan);
    }, [generatePlan]);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isGenerating,
        progress,
        error,
        timeline,
        optimizationInfo,
        optimizationHistory,
        timelineVersion,
        retryCount,
        wasCancelled,
        generatePlan: generatePlanWrapper,
        cancelGeneration: cancelGenerationWithFlag,
        clearError,
        isConnected: fluxService.isConnected(),
    };
};