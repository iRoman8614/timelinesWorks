import React, { useState } from 'react';
import { Card, DatePicker, Button, Space, Tag, message, Spin } from 'antd';
import { EyeOutlined, DeleteOutlined, CloseOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import axios from 'axios';

/**
 * Компонент для управления отображением наработки на timeline
 * Позволяет выбирать даты и запрашивать данные о наработке агрегатов
 */
const OperatingHoursDisplay = ({
                                   projectId,
                                   activeDates = [],
                                   onAddDate,
                                   onRemoveDate,
                                   onClearAll,
                                   apiBaseUrl = '/optimizer/api'
                                   //apiBaseUrl = '/api'
                               }) => {
    const [selectedDate, setSelectedDate] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleShowOperatingHours = async () => {
        if (!selectedDate) {
            message.warning('Выберите дату');
            return;
        }

        const dateStr = selectedDate.format('YYYY-MM-DDTHH:mm:ss');

        // Проверка на дубликат
        const isDuplicate = activeDates.some(d =>
            dayjs(d.date).format('YYYY-MM-DD') === selectedDate.format('YYYY-MM-DD')
        );

        if (isDuplicate) {
            message.warning('Наработка на эту дату уже отображается');
            return;
        }

        setIsLoading(true);

        try {
            // const planParam = activePlanId ? `&planId=${activePlanId}` : '';
            const url = `${apiBaseUrl}/operating-hours?projectId=${projectId}&dateTime=${dateStr}`;

            const response = await axios.get(url);

            if (response.data && Array.isArray(response.data)) {
                onAddDate({
                    date: dateStr,
                    data: response.data,
                    displayDate: selectedDate.format('DD.MM.YYYY')
                });

                message.success(`Наработка на ${selectedDate.format('DD.MM.YYYY')} добавлена`);
                setSelectedDate(null);
            } else {
                message.error('Некорректный ответ от сервера');
            }
        } catch (error) {
            console.error('Ошибка получения наработки:', error);
            message.error('Не удалось получить данные о наработке');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveDate = (dateStr) => {
        const dateData = activeDates.find(d => d.date === dateStr);
        if (dateData) {
            onRemoveDate(dateStr);
            message.info(`Наработка на ${dateData.displayDate} удалена`);
        }
    };

    const handleClearAll = () => {
        if (activeDates.length > 0) {
            onClearAll();
            message.info('Все маркеры наработки удалены');
        }
    };

    return (
        <Card
            size="small"
            style={{ marginBottom: 16 }}
            title={
                <Space>
                    <EyeOutlined />
                    <span>Отобразить наработку</span>
                </Space>
            }
        >
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Форма добавления */}
                <Space wrap>
                    <span>Дата:</span>
                    <DatePicker
                        value={selectedDate}
                        onChange={setSelectedDate}
                        format="DD.MM.YYYY"
                        placeholder="Выберите дату"
                        style={{ width: 150 }}
                    />
                    <Button
                        type="primary"
                        icon={<EyeOutlined />}
                        onClick={handleShowOperatingHours}
                        disabled={!selectedDate || isLoading}
                        loading={isLoading}
                    >
                        Показать
                    </Button>
                    {activeDates.length > 0 && (
                        <Button
                            danger
                            icon={<DeleteOutlined />}
                            onClick={handleClearAll}
                        >
                            Очистить всё
                        </Button>
                    )}
                </Space>

                {/* Список активных дат */}
                {activeDates.length > 0 && (
                    <div>
                        <Space size={[8, 8]} wrap>
                            <span style={{ fontWeight: 500 }}>Активные даты:</span>
                            {activeDates.map(dateData => (
                                <Tag
                                    key={dateData.date}
                                    closable
                                    onClose={(e) => {
                                        e.preventDefault();
                                        handleRemoveDate(dateData.date);
                                    }}
                                    color="blue"
                                    icon={<EyeOutlined />}
                                    style={{ fontSize: '13px', padding: '4px 8px' }}
                                >
                                    {dateData.displayDate}
                                </Tag>
                            ))}
                        </Space>
                    </div>
                )}

                {isLoading && (
                    <Space>
                        <Spin size="small" />
                        <span style={{ color: '#999' }}>Загрузка данных наработки...</span>
                    </Space>
                )}
            </Space>
        </Card>
    );
};

export default OperatingHoursDisplay;