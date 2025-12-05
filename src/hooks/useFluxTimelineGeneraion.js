import { useState, useCallback, useEffect, useRef } from 'react';
import { fluxService } from '../services/fluxService';

export const useFluxTimelineGeneration = () => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState(null);
    const [timeline, setTimeline] = useState(null);
    const [timelineVersion, setTimelineVersion] = useState(0);
    const [retryCount, setRetryCount] = useState(0);

    const isMountedRef = useRef(true);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            fluxService.disconnect();
        };
    }, []);

    const generatePlan = useCallback(async (project, activePlan) => {
        const safeSet = (fn) => (...args) => {
            if (isMountedRef.current) fn(...args);
        };

        const _setIsGenerating = safeSet(setIsGenerating);
        const _setProgress = safeSet(setProgress);
        const _setError = safeSet(setError);
        const _setTimeline = safeSet(setTimeline);
        const _setTimelineVersion = safeSet(setTimelineVersion);
        const _setRetryCount = safeSet(setRetryCount);

        _setIsGenerating(true);
        _setProgress('Инициализация генерации плана...');
        _setError(null);
        _setTimeline(null);
        _setRetryCount(0);

        try {
            await fluxService.generatePlanWithFlux(project, activePlan, {
                onProgress: (message) => {
                    _setProgress(typeof message === 'string' ? message : 'Обработка...');
                },

                // ✅ КРИТИЧЕСКИ ВАЖНО: НЕ async, НЕ await внутри!
                onTimelineUpdate: (timelineData) => {
                    console.log('📊 Timeline update получен');
                    _setTimeline(timelineData);
                    _setTimelineVersion(v => v + 1);
                    _setProgress(`Обновление ${timelineData.maintenanceEvents?.length || 0} событий ТО...`);

                    // ✅ НЕ СОХРАНЯЕМ В ПРОЕКТ!
                    // Только локальное обновление стейта
                    // Сохранение в план будет по кнопке "Сохранить план"
                },

                onComplete: (finalData) => {
                    console.log('✅ Flux генерация завершена');
                    const tl = finalData?.timeline || finalData;
                    _setTimeline(tl);
                    _setTimelineVersion(v => v + 1);
                    _setProgress('Генерация завершена');
                    _setIsGenerating(false);
                },

                onError: (err) => {
                    console.error('❌ Flux error:', err);
                    _setError(err?.message || 'Ошибка при генерации плана');
                    _setProgress('');
                    _setIsGenerating(false);
                },

                onRetry: (count) => {
                    console.log(`🔄 Retry #${count}`);
                    _setRetryCount(count);
                    _setProgress(`Переподключение... (попытка ${count})`);
                },
            });
        } catch (err) {
            console.error('❌ Generate plan error:', err);
            _setError(err?.message || 'Ошибка при генерации плана');
            _setProgress('');
            _setIsGenerating(false);
        }
    }, []);

    const cancelGeneration = useCallback(() => {
        console.log('✋ Отмена генерации');
        fluxService.disconnect();
        setIsGenerating(false);
        setProgress('Отменено');
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return {
        isGenerating,
        progress,
        error,
        timeline,
        timelineVersion,
        retryCount,
        generatePlan,
        cancelGeneration,
        clearError,
        isConnected: fluxService.isConnected(),
    };
};