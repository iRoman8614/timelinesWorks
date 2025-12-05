import { fetchEventSource } from '@microsoft/fetch-event-source';

const API_BASE = process.env.REACT_APP_API_BASE_URL;

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
            onComplete = () => {},
            onError = () => {},
            onRetry = () => {},
        } = callbacks;

        // Отключаем предыдущее соединение
        this.disconnect();

        // Создаём новый AbortController для отмены
        this.abortController = new AbortController();

        const url = `${API_BASE}/api/optimizer/flux?start=${startDate}&end=${endDate}`;

        let lastTimeline = null;
        let messageCount = 0;
        let completionReceived = false;  // ✅ ФЛАГ ДЛЯ ОТСЛЕЖИВАНИЯ ЗАВЕРШЕНИЯ

        // Функция нормализации таймлайна
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

                // ✅ КРИТИЧЕСКИ ВАЖНО: не закрывать при переключении вкладки
                openWhenHidden: true,

                onopen: async (response) => {
                    console.log('✅ SSE соединение открыто, статус:', response.status);

                    if (response.ok) {
                        // Успешное подключение - сбрасываем счетчик
                        this.retryCount = 0;
                        onProgress('Соединение установлено');
                        return;
                    }

                    // Обработка ошибок
                    const errorText = await response.text();
                    console.error(`❌ HTTP error ${response.status}:`, errorText);

                    if (response.status >= 400 && response.status < 500) {
                        // Клиентская ошибка - не ретраим
                        throw new Error(`HTTP ${response.status}: ${errorText}`);
                    }

                    // Серверная ошибка - можем попробовать снова
                    throw new Error(`Server error ${response.status}`);
                },

                // ✅ КРИТИЧЕСКИ ВАЖНО: НЕ async - не блокируем поток!
                onmessage: (event) => {
                    messageCount++;
                    console.log(`📨 SSE событие #${messageCount}`);

                    try {
                        let parsed;
                        try {
                            parsed = JSON.parse(event.data);
                        } catch {
                            parsed = event.data;
                        }

                        let payload = parsed;

                        // Двойной парсинг если нужно
                        if (
                            payload &&
                            typeof payload === 'object' &&
                            typeof payload.data === 'string'
                        ) {
                            try {
                                payload = JSON.parse(payload.data);
                            } catch (e) {
                                console.warn('⚠️ Не удалось распарсить payload.data', e);
                            }
                        }

                        const eventType = event.event || payload?.event;
                        console.log('📋 eventType:', eventType);

                        // 1️⃣ Progress events
                        if (eventType === 'progress') {
                            const msg =
                                typeof payload === 'object'
                                    ? payload.message || payload.status || event.data
                                    : String(payload);
                            onProgress(msg);
                            return;
                        }

                        // 2️⃣ Timeline updates
                        if (eventType === 'timeline-update' || eventType === 'optimization-update') {
                            const tl = normalizeAsTimeline(payload);
                            if (tl) {
                                lastTimeline = tl;
                                console.log('📊 Timeline update:', tl.maintenanceEvents?.length || 0, 'событий');
                                // ✅ НЕ БЛОКИРУЮЩИЙ вызов
                                onTimelineUpdate(tl);
                            } else {
                                console.warn('⚠️ optimization-update без валидного таймлайна', payload);
                            }
                            return;
                        }

                        // 3️⃣ Completion - ✅ УСТАНАВЛИВАЕМ ФЛАГ
                        if (eventType === 'complete' || eventType === 'done') {
                            const tl = normalizeAsTimeline(payload) || payload;
                            lastTimeline = tl;
                            completionReceived = true;  // ✅ ФЛАГ
                            console.log(`✅ Получено событие complete после ${messageCount} сообщений`);
                            onComplete(tl);
                            return;
                        }

                        // 4️⃣ Fallback: может быть таймлайн без типа
                        const tl = normalizeAsTimeline(payload);
                        if (tl) {
                            lastTimeline = tl;
                            onTimelineUpdate(tl);
                            return;
                        }

                        // 5️⃣ Остальное - прогресс
                        onProgress(
                            typeof payload === 'object'
                                ? payload.message || payload.status || JSON.stringify(payload)
                                : String(payload)
                        );
                    } catch (error) {
                        console.error('❌ Ошибка обработки SSE события:', error);
                        // ✅ НЕ прерываем поток - просто логируем
                    }
                },

                onerror: (err) => {
                    console.error('❌ SSE onerror:', err);

                    // Инкрементируем счетчик
                    this.retryCount++;

                    if (this.retryCount <= this.maxRetries) {
                        const delay = this.retryDelay * this.retryCount;
                        console.log(`🔄 Попытка переподключения ${this.retryCount}/${this.maxRetries} через ${delay}ms`);

                        onRetry(this.retryCount);
                        onProgress(`Переподключение... (попытка ${this.retryCount}/${this.maxRetries})`);

                        // ✅ КРИТИЧЕСКИ ВАЖНО: НЕ бросаем ошибку
                        // fetchEventSource автоматически попытается переподключиться
                        return;
                    } else {
                        console.error('❌ Превышен лимит попыток переподключения');
                        const error = new Error('Не удалось подключиться к серверу после нескольких попыток');
                        onError(error);

                        // Теперь можно бросить, чтобы окончательно остановить
                        throw error;
                    }
                },

                // ✅ ИСПРАВЛЕННЫЙ onclose - НЕ ВЫЗЫВАЕТ onComplete ЕСЛИ УЖЕ БЫЛ
                onclose: () => {
                    console.log('🔌 SSE соединение закрыто');
                    //console.log("❗❗ onclose вызван — это значит СЕРВЕР закрыл соединение, а не фронт");
                    console.log(`📊 Всего получено сообщений: ${messageCount}`);
                    console.log(`📋 completionReceived: ${completionReceived}`);

                    // ✅ Вызываем onComplete ТОЛЬКО если НЕ получили событие 'complete'
                    if (!completionReceived) {
                        if (lastTimeline && messageCount > 0) {
                            console.log('⚠️ Соединение закрылось без события complete, используем последний таймлайн');
                            try {
                                onComplete(lastTimeline);
                            } catch (e) {
                                console.error('❌ Error in onComplete:', e);
                            }
                        } else if (messageCount > 0) {
                            // Были сообщения, но нет таймлайна
                            console.error('❌ Соединение закрылось без таймлайна');
                            onError(new Error('Соединение закрылось преждевременно'));
                        } else {
                            // Вообще не было сообщений
                            console.error('❌ Соединение закрылось без данных');
                            onError(new Error('Соединение закрылось без получения данных'));
                        }
                    } else {
                        console.log('✅ Соединение закрылось корректно после получения complete');
                    }
                }
            });

        } catch (error) {
            if (error.name !== 'AbortError') {
                console.error('❌ Error in connectToFlux:', error);
                onError(error);
            } else {
                console.log('✋ Flux соединение отменено пользователем');
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

            // ✅ Берём даты из плана (поддержка обоих вариантов: start/end и startTime/endTime)
            let startDate = activePlan.start || activePlan.startTime || '2024-01-01';
            let endDate = activePlan.end || activePlan.endTime || '2024-12-31';

            // Преобразуем в ISO формат с временем, если нужно
            if (!startDate.includes('T')) {
                startDate = `${startDate}T00:00:00`;
            }
            if (!endDate.includes('T')) {
                endDate = `${endDate}T23:59:59`;
            }

            console.log('🚀 Запуск Flux генерации');
            console.log('📅 Период:', { start: startDate, end: endDate });
            console.log('📋 План:', activePlan.name || activePlan.id);

            // Проверяем наличие дат
            if (!activePlan.start && !activePlan.startTime) {
                throw new Error('У плана отсутствует дата начала');
            }
            if (!activePlan.end && !activePlan.endTime) {
                throw new Error('У плана отсутствует дата окончания');
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
        console.log('🛑 Отключение Flux соединения');
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