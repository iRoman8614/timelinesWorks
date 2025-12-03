import { useState, useCallback, useEffect, useRef } from 'react';
import { fluxService } from '../services/fluxService';
import { serverProjectsApi } from '../services/apiService';

export const useFluxTimelineGeneration = (baseUrl = '/api') => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState(null);
    const [timeline, setTimeline] = useState(null);

    const [timelineVersion, setTimelineVersion] = useState(0);

    const isMountedRef = useRef(true);
    const projectRef = useRef(null);
    const projectIdRef = useRef(null);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            fluxService.disconnect();
        };
    }, []);

    const generatePlan = useCallback(async (project, activePlan, onComplete) => {
        projectRef.current = project || null;
        projectIdRef.current = project?.id || null;

        const safeSet = (fn) => (...args) => {
            if (isMountedRef.current) fn(...args);
        };

        const _setIsGenerating = safeSet(setIsGenerating);
        const _setProgress = safeSet(setProgress);
        const _setError = safeSet(setError);
        const _setTimeline = safeSet(setTimeline);

        _setIsGenerating(true);
        _setProgress('Инициализация генерации плана...');
        _setError(null);
        _setTimeline(null);

        try {
            await fluxService.generatePlanWithFlux(project, activePlan, {
                onProgress: (message) => {
                    _setProgress(typeof message === 'string' ? message : 'Обработка...');
                },

                onTimelineUpdate: async (timelineData) => {
                    _setTimeline(timelineData);
                    setTimelineVersion(v => v + 1);
                    _setProgress('Обновление таймлайна...');

                    try {
                        const pid = projectIdRef.current;
                        const base = projectRef.current || {};
                        if (pid) {
                            await serverProjectsApi.save({
                                ...base,
                                timeline: timelineData,
                            });
                        }
                    } catch (e) {
                        console.warn('Не удалось сохранить промежуточный таймлайн в localStorage:', e);
                    }
                },

                onComplete: async (finalData) => {
                    const tl = finalData?.timeline || finalData;
                    _setTimeline(tl);
                    setTimelineVersion(v => v + 1);
                    _setProgress('Генерация завершена');

                    try {
                        const pid = projectIdRef.current;
                        const base = projectRef.current || {};
                        if (pid) {
                            await serverProjectsApi.save({
                                ...base,
                                timeline: tl,
                            });
                        }
                    } catch (e) {
                        console.warn('Не удалось сохранить финальный таймлайн в localStorage:', e);
                    }

                    if (typeof onComplete === 'function') {
                        onComplete(tl);
                    }
                },

                onError: (err) => {
                    _setError(err?.message || 'Ошибка при генерации плана');
                    _setProgress('');
                },
            });
        } catch (err) {
            _setError(err?.message || 'Ошибка при генерации плана');
            _setProgress('');
        } finally {
            _setIsGenerating(false);
        }
    }, []);

    const cancelGeneration = useCallback(() => {
        fluxService.disconnect();
        setIsGenerating(false);
        setProgress('');
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    const bumpTimelineVersion = () => {
        setTimelineVersion(prev => prev + 1);
    };

    return {
        isGenerating,
        progress,
        error,
        timeline,
        timelineVersion,
        generatePlan,
        cancelGeneration,
        bumpTimelineVersion,
        clearError,
        isConnected: fluxService.isConnected(),
    };
};

export default useFluxTimelineGeneration;
