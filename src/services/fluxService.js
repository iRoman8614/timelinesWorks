import { fetchEventSource } from '@microsoft/fetch-event-source';
import { message as antMessage } from 'antd';

const API_BASE = process.env.REACT_APP_API_BASE_URL || '';

class FluxService {
    constructor() {
        this.abortController = null;
        this.listeners = new Map();
        this.retryCount = 0;
        this.maxRetries = 3;
        this.retryDelay = 1000;
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
            onOptimizationInfo = () => {},
            onComplete = () => {},
            onError = () => {},
            onRetry = () => {},
        } = callbacks;

        this.disconnect();

        this.abortController = new AbortController();

        const url = `${API_BASE}/api/optimizer/flux?start=${startDate}&end=${endDate}&sampleIntervalMs=1000`;

        let lastTimeline = null;
        let lastOptimizationInfo = null;
        let messageCount = 0;
        let completionReceived = false;

        const normalizeAsTimeline = (obj) => {
            if (!obj || typeof obj !== 'object') return null;

            if (obj.timeline && typeof obj.timeline === 'object') {
                const tl = obj.timeline;
                return {
                    assemblyStates: tl.assemblyStates || [],
                    unitAssignments: tl.unitAssignments || [],
                    maintenanceEvents: tl.maintenanceEvents || [],
                    start: tl.start,
                    end: tl.end,
                };
            }

            const hasAny =
                'assemblyStates' in obj ||
                'unitAssignments' in obj ||
                'maintenanceEvents' in obj;

            if (hasAny) {
                return {
                    assemblyStates: obj.assemblyStates || [],
                    unitAssignments: obj.unitAssignments || [],
                    maintenanceEvents: obj.maintenanceEvents || [],
                    start: obj.start,
                    end: obj.end,
                };
            }

            return null;
        };

        try {
            await fetchEventSource(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(project),
                signal: this.abortController.signal,

                openWhenHidden: true,

                onopen: async (response) => {
                    console.log('SSE соединение открыто, статус:', response.status);

                    if (response.ok) {
                        this.retryCount = 0;
                        onProgress('Соединение установлено');
                        antMessage.success('Подключение к серверу оптимизации установлено');
                        return;
                    }

                    const errorText = await response.text();
                    console.error(`HTTP error ${response.status}:`, errorText);

                    if (response.status >= 400 && response.status < 500) {
                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                    }

                    throw new Error(`Server error ${response.status}`);
                },

                onmessage: (event) => {
                    messageCount++;
                    try {
                        let parsed;
                        try {
                            parsed = JSON.parse(event.data);
                        } catch {
                            parsed = event.data;
                        }
                        let payload = parsed;
                        if (
                            payload &&
                            typeof payload === 'object' &&
                            typeof payload.data === 'string'
                        ) {
                            try {
                                payload = JSON.parse(payload.data);
                            } catch (e) {
                                console.warn('Не удалось распарсить payload.data', e);
                            }
                        }

                        const eventType = event.event || payload?.event;
                        const isImplicitUpdate = !eventType && (payload?.plan || payload?.optimizationInformation);

                        if (eventType === 'progress') {
                            const msg =
                                typeof payload === 'object'
                                    ? payload.message || payload.status || event.data
                                    : String(payload);
                            onProgress(msg);
                            return;
                        }

                        if (eventType === 'timeline-update' || eventType === 'optimization-update' || isImplicitUpdate) {
                            const plan = payload.plan || payload;
                            const tl = plan.timeline
                                ? normalizeAsTimeline({ timeline: plan.timeline })
                                : normalizeAsTimeline(plan);

                            if (tl) {
                                const validations = payload.optimizationInformation?.best?.validations;
                                if (validations) {
                                    tl.validations = validations;
                                }

                                lastTimeline = tl;
                                console.log('Timeline update:', tl.maintenanceEvents?.length || 0, 'событий',
                                    tl.validations ? `(${tl.validations.length} validations)` : '');
                                onTimelineUpdate(tl);
                            }

                            if (payload.optimizationInformation) {
                                lastOptimizationInfo = payload.optimizationInformation;
                                onOptimizationInfo(payload.optimizationInformation);

                                const current = payload.optimizationInformation.current;
                                const iteration = payload.optimizationInformation.currentIteration;
                                if (iteration) {
                                    onProgress(`Итерация ${iteration}: penalty=${current?.hardPenalty?.toFixed(2) || 'N/A'}`);
                                }
                            }

                            return;
                        }

                        if (eventType === 'complete' || eventType === 'done') {
                            const plan = payload.plan || payload;
                            const tl = plan.timeline
                                ? normalizeAsTimeline({ timeline: plan.timeline })
                                : normalizeAsTimeline(plan);
                            if (tl) {
                                const validations = payload.optimizationInformation?.best?.validations;
                                if (validations) {
                                    tl.validations = validations;
                                }
                            }

                            lastTimeline = tl;

                            if (payload.optimizationInformation) {
                                lastOptimizationInfo = payload.optimizationInformation;
                                onOptimizationInfo(payload.optimizationInformation);
                            }

                            completionReceived = true;
                            antMessage.success('Оптимизация завершена успешно!');
                            onComplete({
                                timeline: tl || lastTimeline,
                                optimizationInformation: payload.optimizationInformation || lastOptimizationInfo
                            });
                            return;
                        }

                        const tl = normalizeAsTimeline(payload);
                        if (tl) {
                            lastTimeline = tl;
                            onTimelineUpdate(tl);
                            return;
                        }

                        onProgress(
                            typeof payload === 'object'
                                ? payload.message || payload.status || JSON.stringify(payload)
                                : String(payload)
                        );
                    } catch (error) {
                        console.error('Ошибка обработки SSE события:', error);
                    }
                },

                onerror: (err) => {
                    console.error('SSE onerror:', err);

                    if (err?.name === 'AbortError' || !this.abortController) {
                        console.log('Соединение прервано пользователем');
                        throw err;
                    }

                    this.retryCount++;

                    if (this.retryCount <= this.maxRetries) {
                        onRetry(this.retryCount);
                        onProgress(`Переподключение... (попытка ${this.retryCount}/${this.maxRetries})`);

                        antMessage.warning(`Переподключение (${this.retryCount}/${this.maxRetries})...`);

                        return;
                    } else {
                        console.error('Превышен лимит попыток переподключения');
                        const error = new Error('Не удалось подключиться к серверу после нескольких попыток');

                        antMessage.error('Не удалось подключиться к серверу оптимизации');
                        onError(error);

                        throw error;
                    }
                },

                onclose: () => {
                    if (!this.abortController) {
                        console.log('Соединение прервано пользователем, пропускаем обработку close');
                        return;
                    }
                    if (!completionReceived) {
                        if (lastTimeline && messageCount > 0) {
                            console.log('Соединение закрылось без события complete, используем последний таймлайн');
                            try {
                                antMessage.warning('Соединение закрыто преждевременно');
                                onComplete(lastTimeline);
                            } catch (e) {
                                console.error('Error in onComplete:', e);
                            }
                        } else if (messageCount > 0) {
                            console.error('Соединение закрылось без таймлайна');
                            antMessage.error('Соединение закрылось без получения данных');
                            onError(new Error('Соединение закрылось преждевременно'));
                        } else {
                            console.error('Соединение закрылось без данных');
                            antMessage.error('Соединение закрылось без получения данных');
                            onError(new Error('Соединение закрылось без получения данных'));
                        }
                    } else {
                        console.log('Соединение закрылось корректно после получения complete');
                    }
                }
            });

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('Error in connectToFlux:', error);
                antMessage.error(`Ошибка оптимизации: ${error.message}`);
                onError(error);
            } else {
                console.log('Flux соединение отменено пользователем');
                antMessage.info('Оптимизация отменена');
            }
        }

        this.listeners.set(projectId, callbacks);
    }

    /**
     * Генерирует план через Flux с POST SSE
     */
    async generatePlanWithFlux(project, activePlan, callbacks = {}) {
        try {
            const projectId = project.id;

            let startDate = activePlan.start || activePlan.startTime || '2024-01-01';
            let endDate = activePlan.end || activePlan.endTime || '2024-12-31';

            if (!startDate.includes('T')) {
                startDate = `${startDate}T00:00:00`;
            }
            if (!endDate.includes('T')) {
                endDate = `${endDate}T23:59:59`;
            }

            if (!activePlan.start && !activePlan.startTime) {
                throw new Error('У плана отсутствует дата начала');
            }
            if (!activePlan.end && !activePlan.endTime) {
                throw new Error('У плана отсутствует дата окончания');
            }

            let parsedStructure = {};
            if (project.structure) {
                try {
                    parsedStructure = typeof project.structure === 'string'
                        ? JSON.parse(project.structure)
                        : project.structure;
                } catch (e) {
                    console.error('Ошибка парсинга structure:', e);
                }
            }

            const requestBody = {
                id: project.id,
                name: project.name,
                historyUpdatedAt: project.historyUpdatedAt,
                assemblyTypes: parsedStructure.assemblyTypes || [],
                componentTypes: parsedStructure.componentTypes || [],
                partModels: parsedStructure.partModels || [],
                nodes: parsedStructure.nodes || [],
                timeline: parsedStructure.timeline || {}
            };

            await this.connectToFlux(projectId, startDate, endDate, requestBody, callbacks);
        } catch (error) {
            console.error('Error in generatePlanWithFlux:', error);
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
        console.log('Отключение Flux соединения');
        if (this.abortController) {
            this.abortController.abort();
            this.abortController = null;
        }
        this.listeners.clear();
        this.retryCount = 0;
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