// import { useState, useCallback, useEffect, useRef } from 'react';
// import { fluxService } from '../services/fluxService';
//
// export const useFluxTimelineGeneration = (baseUrl = '/api') => {
//     const [isGenerating, setIsGenerating] = useState(false);
//     const [progress, setProgress] = useState('');
//     const [error, setError] = useState(null);
//     const [timeline, setTimeline] = useState(null);
//
//     const isMountedRef = useRef(true);
//
//     useEffect(() => {
//         return () => {
//             isMountedRef.current = false;
//             fluxService.disconnect();
//         };
//     }, []);
//
//     const generatePlan = useCallback(async (project, onComplete) => {
//         // console.log('🚀 generatePlan вызван с проектом:', project);
//         //
//         // console.log('✅ Начинаем генерацию...');
//         // setIsGenerating(true);
//         // setProgress('Инициализация генерации плана...');
//         // setError(null);
//         // setTimeline(null);
//         //
//         // try {
//         //     console.log('📤 Вызываем fluxService.generatePlanWithFlux...');
//         //
//         //     // Убрали baseUrl из вызова
//         //     await fluxService.generatePlanWithFlux(project, {
//         //         onProgress: (message) => {
//         //             console.log('📊 onProgress:', message);
//         //             setProgress(message);
//         //         },
//         //         onTimelineUpdate: (timelineData) => {
//         //             console.log('🔄 onTimelineUpdate:', timelineData);
//         //             setTimeline(timelineData);
//         //             setProgress('Обновление таймлайна...');
//         //         },
//         //         onComplete: (finalData) => {
//         //             console.log('✅ onComplete:', finalData);
//         //             setTimeline(finalData.timeline || finalData);
//         //             setProgress('Генерация завершена');
//         //             setIsGenerating(false);
//         //
//         //             if (onComplete) {
//         //                 onComplete(finalData.timeline || finalData);
//         //             }
//         //         },
//         //         onError: (err) => {
//         //             console.error('❌ onError:', err);
//         //             setError(err.message || 'Ошибка при генерации плана');
//         //             setIsGenerating(false);
//         //             setProgress('');
//         //         }
//         //     }); // Убрали второй параметр baseUrl
//         //
//         //     console.log('✅ fluxService.generatePlanWithFlux завершен');
//         // } catch (err) {
//         //     console.error('❌ Ошибка в try-catch:', err);
//         //     setError(err.message || 'Ошибка при генерации плана');
//         //     setIsGenerating(false);
//         //     setProgress('');
//         // }
//
//         const safeSet = (fn) => (...args) => {
//             if (isMountedRef.current) fn(...args);
//         };
//
//         const _setIsGenerating = safeSet(setIsGenerating);
//         const _setProgress = safeSet(setProgress);
//         const _setError = safeSet(setError);
//         const _setTimeline = safeSet(setTimeline);
//
//         console.log('✅ Начинаем генерацию...');
//         _setIsGenerating(true);
//         _setProgress('Инициализация генерации плана...');
//         _setError(null);
//         _setTimeline(null);
//
//         try {
//             await fluxService.generatePlanWithFlux(project, {
//                 onProgress: (message) => {
//                     console.log('📊 onProgress:', message);
//                     _setProgress(message);
//                 },
//                 onTimelineUpdate: (timelineData) => {
//                     console.log('🔄 onTimelineUpdate:', timelineData);
//                     _setTimeline(timelineData);
//                     _setProgress('Обновление таймлайна...');
//                 },
//                 onComplete: (finalData) => {
//                     console.log('✅ onComplete:', finalData);
//                     _setTimeline(finalData.timeline || finalData);
//                     _setProgress('Генерация завершена');
//                 },
//                 onError: (err) => {
//                     console.error('❌ onError:', err);
//                     _setError(err.message || 'Ошибка при генерации плана');
//                     _setProgress('');
//                 }
//             });
//             console.log('✅ fluxService.generatePlanWithFlux завершен');
//         } catch (err) {
//             console.error('❌ Ошибка в try-catch:', err);
//             _setError(err.message || 'Ошибка при генерации плана');
//             _setProgress('');
//         } finally {
//             _setIsGenerating(false);
//         }
//
//
//     }, []); // Убрали baseUrl из зависимостей
//
//     const cancelGeneration = useCallback(() => {
//         console.log('🛑 Отмена генерации');
//         fluxService.disconnect();
//         setIsGenerating(false);
//         setProgress('');
//     }, []);
//
//     const clearError = useCallback(() => {
//         console.log('🧹 Очистка ошибки');
//         setError(null);
//     }, []);
//
//     return {
//         isGenerating,
//         progress,
//         error,
//         timeline,
//         generatePlan,
//         cancelGeneration,
//         clearError,
//         isConnected: fluxService.isConnected()
//     };
// };
//
// export default useFluxTimelineGeneration;

import { useState, useCallback, useEffect, useRef } from 'react';
import { fluxService } from '../services/fluxService';
import { dataService } from '../services/dataService';

/**
 * Хук генерации таймлайна через Flux (SSE)
 * - Безопасные setState (не обновляем после unmount)
 * - Стримим таймлайн в localStorage по onTimelineUpdate
 * - Финальный снапшот в localStorage по onComplete
 */
export const useFluxTimelineGeneration = (baseUrl = '/api') => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [progress, setProgress] = useState('');
    const [error, setError] = useState(null);
    const [timeline, setTimeline] = useState(null);

    const isMountedRef = useRef(true);

    // храним актуальный проект/ID для сохранений в localStorage
    const projectRef = useRef(null);
    const projectIdRef = useRef(null);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            fluxService.disconnect();
        };
    }, []);

    const generatePlan = useCallback(async (project, onComplete) => {
        // фиксируем проект для последующих сохранений
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
            await fluxService.generatePlanWithFlux(project, {
                onProgress: (message) => {
                    _setProgress(typeof message === 'string' ? message : 'Обработка...');
                },

                // ⚡️ потоковое обновление localStorage
                onTimelineUpdate: async (timelineData) => {
                    _setTimeline(timelineData);
                    _setProgress('Обновление таймлайна...');

                    try {
                        const pid = projectIdRef.current;
                        const base = projectRef.current || {};
                        if (pid) {
                            await dataService.saveProject(pid, { ...base, timeline: timelineData });
                        }
                    } catch (e) {
                        // не рушим UI, просто лог
                        console.warn('Не удалось сохранить промежуточный таймлайн в localStorage:', e);
                    }
                },

                // ✅ финальный снапшот + пользовательский колбэк
                onComplete: async (finalData) => {
                    const tl = finalData?.timeline || finalData;
                    _setTimeline(tl);
                    _setProgress('Генерация завершена');

                    try {
                        const pid = projectIdRef.current;
                        const base = projectRef.current || {};
                        if (pid) {
                            await dataService.saveProject(pid, { ...base, timeline: tl });
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
                }
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

    return {
        isGenerating,
        progress,
        error,
        timeline,
        generatePlan,
        cancelGeneration,
        clearError,
        isConnected: fluxService.isConnected()
    };
};

export default useFluxTimelineGeneration;
