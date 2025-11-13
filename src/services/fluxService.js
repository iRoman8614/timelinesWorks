import { fetchEventSource } from '@microsoft/fetch-event-source';

class FluxService {
    constructor() {
        this.abortController = null;
        this.listeners = new Map();
    }

    /**
     * Подключается к Flux потоку через POST с SSE
     * @param {string} projectId - ID проекта
     * @param {string} startDate - Дата начала (ISO format)
     * @param {string} endDate - Дата окончания (ISO format)
     * @param {Object} project - Полный объект проекта для body
     * @param {Object} callbacks - Колбэки для обработки событий
     */
    async connectToFlux(projectId, startDate, endDate, project, callbacks = {}) {
        const {
            onProgress = () => {},
            onTimelineUpdate = () => {},
            onComplete = () => {},
            onError = () => {}
        } = callbacks;

        // Отключаем предыдущее соединение
        this.disconnect();

        // Создаём новый AbortController для отмены
        this.abortController = new AbortController();

        const url = `http://192.168.31.89:5000/api/optimizer/flux?start=${startDate}&end=${endDate}`;

        console.log('🔌 Подключение к Flux через POST SSE');
        console.log('🔗 URL:', url);
        console.log('📅 Период: с', startDate, 'по', endDate);
        console.log('📦 Body:', project);

        let lastTimeline = null;

        try {
            // await fetchEventSource(url, {
            //     method: 'POST', // FIX: Changed from 'get' to 'POST'
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(project), // FIX: Added body to the request
            //     signal: this.abortController.signal,
            //
            //     onopen(response) {
            //         console.log('✅ Соединение открыто, статус:', response.status);
            //         if (response.ok) {
            //             return; // всё ок, продолжаем
            //         } else if (response.status >= 400 && response.status < 500 && response.status !== 429) {
            //             throw new Error(`HTTP error! status: ${response.status}`);
            //         } else {
            //             throw new Error(`HTTP error! status: ${response.status}`);
            //         }
            //     },
            //
            //     onmessage(event) {
            //         console.log('📨 Получено SSE событие:', event);
            //
            //         try {
            //             // Обрабатываем разные типы событий
            //             if (event.event === 'progress') {
            //                 const data = JSON.parse(event.data);
            //                 console.log('📊 Progress:', data);
            //                 onProgress(data.message || data.status || event.data);
            //             }
            //             else if (event.event === 'timeline-update') {
            //                 const timelineData = JSON.parse(event.data);
            //                 console.log('🔄 Timeline update:', timelineData);
            //                 onTimelineUpdate(timelineData);
            //             }
            //             else if (event.event === 'complete' || event.event === 'done') {
            //                 const finalData = JSON.parse(event.data);
            //                 console.log('✅ Complete:', finalData);
            //                 onComplete(finalData);
            //             }
            //             else {
            //                 // Событие без типа или неизвестный тип
            //                 console.log('📨 Default event:', event.data);
            //                 try {
            //                     const data = JSON.parse(event.data);
            //                     // Пытаемся определить тип по содержимому
            //                     if (data.assemblyStates || data.unitAssignments || data.maintenanceEvents) {
            //                         onTimelineUpdate(data);
            //                     } else if (data.message || data.status) {
            //                         onProgress(data.message || data.status);
            //                     }
            //                 } catch {
            //                     onProgress(event.data);
            //                 }
            //             }
            //         } catch (error) {
            //             console.error('❌ Ошибка обработки события:', error);
            //             onError(error);
            //         }
            //     },
            //
            //     onerror(err) {
            //         console.error('❌ SSE error:', err);
            //         onError(err);
            //         throw err; // rethrow to stop the operation
            //     },
            //
            //     onclose() {
            //         console.log('🔌 Соединение закрыто');
            //     }
            // });

            await fetchEventSource(url, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(project),
                    signal: this.abortController.signal,

                onopen(response) {
                    console.log('✅ Соединение открыто, статус:', response.status);
                    if (response.ok) return;
                    throw new Error(`HTTP error! status: ${response.status}`);
                },

                async onmessage(event) {
                    console.log('📨 Получено SSE событие:', event);

                    // helper: пытаемся привести payload к таймлайну
                    const normalizeAsTimeline = (obj) => {
                        if (!obj || typeof obj !== 'object') return null;
                        if (obj.timeline && typeof obj.timeline === 'object') {
                            const tl = obj.timeline;
                            return {
                                assemblyStates: tl.assemblyStates || [],
                                unitAssignments: tl.unitAssignments || [],
                                maintenanceEvents: tl.maintenanceEvents || []
                            };
                        }
                        const hasAny =
                            'assemblyStates' in obj || 'unitAssignments' in obj || 'maintenanceEvents' in obj;
                        if (hasAny) {
                            return {
                                assemblyStates: obj.assemblyStates || [],
                                unitAssignments: obj.unitAssignments || [],
                                maintenanceEvents: obj.maintenanceEvents || []
                            };
                        }
                        return null;
                    };

                    try {
                        const parsed = (() => {
                            try { return JSON.parse(event.data); } catch { return event.data; }
                        })();

                        // 1) именованные события
                        if (event.event === 'progress') {
                            const msg = typeof parsed === 'object'
                                ? (parsed.message || parsed.status || event.data)
                                : String(parsed);
                            onProgress(msg);
                            return;
                        }
                        if (event.event === 'timeline-update') {
                            const tl = normalizeAsTimeline(parsed);
                            if (tl) {
                                lastTimeline = tl;            // ← см. объявление ниже
                                onTimelineUpdate(tl);
                            }
                            return;
                        }
                        if (event.event === 'complete' || event.event === 'done') {
                            const tl = normalizeAsTimeline(parsed) || parsed;
                            lastTimeline = tl;
                            onComplete(tl);
                            return;
                        }

                        // 2) дефолтные (без типа)
                        const tl = normalizeAsTimeline(parsed);
                        if (tl) {
                            lastTimeline = tl;
                            onTimelineUpdate(tl);
                            return;
                        }

                        // 3) иначе считаем прогрессом
                        onProgress(typeof parsed === 'object'
                            ? (parsed.message || parsed.status || JSON.stringify(parsed))
                            : String(parsed)
                        );
                    } catch (error) {
                        console.error('❌ Ошибка обработки события:', error);
                        onError(error);
                    }
                },

                onerror(err) {
                    console.error('❌ SSE error:', err);
                    onError(err);
                    throw err;
                },

                onclose() {
                    console.log('🔌 Соединение закрыто');
                    // если сервер закрыл поток без "complete", но у нас был валидный таймлайн — считаем это завершением
                    if (lastTimeline) {
                        try { onComplete(lastTimeline); } catch {}
                    }
                }
            });

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Error in connectToFlux:', error);
                onError(error);
            }
        }

        this.listeners.set(projectId, callbacks);
    }

    /**
     * Генерирует план через Flux с POST SSE
     */
    async generatePlanWithFlux(project, callbacks = {}) {
        try {
            const projectId = project.id;

            // Берём даты из проекта или используем дефолтные
            let startDate = project.start || '2024-01-01';
            let endDate = project.end || '2024-12-31';

            // Преобразуем в ISO формат с временем, если нужно
            if (!startDate.includes('T')) {
                startDate = `${startDate}T00:00:00`;
            }
            if (!endDate.includes('T')) {
                endDate = `${endDate}T00:00:00`;
            }

            console.log('📤 Запуск генерации плана через Flux POST SSE');
            console.log('📦 Проект:', project);
            console.log('📅 Даты: start =', startDate, ', end =', endDate);

            // Проверяем наличие дат
            if (!project.start || !project.end) {
                throw new Error('У проекта отсутствуют даты start или end');
            }

            // Подключаемся к Flux через POST с телом проекта
            await this.connectToFlux(projectId, startDate, endDate, project, callbacks);

        } catch (error) {
            console.error('❌ Error in generatePlanWithFlux:', error);
            if (callbacks.onError) {
                callbacks.onError(error);
            }
            throw error;
        }
    }

    /**
     * Отключается от Flux потока
     */
    disconnect() {
        if (this.abortController) {
            console.log('🔌 Отключение от Flux (abort)');
            this.abortController.abort();
            this.abortController = null;
        }
        this.listeners.clear();
    }

    /**
     * Проверяет, подключен ли сейчас к потоку
     */
    isConnected() {
        return this.abortController !== null;
    }
}

export const fluxService = new FluxService();
export default FluxService;
