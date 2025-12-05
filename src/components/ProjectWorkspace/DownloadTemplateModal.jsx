import React, { useState } from 'react';
import { Modal, DatePicker, Button, message, Typography } from 'antd';
import { DownloadOutlined, CalendarOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

const { Text } = Typography;

/**
 * Модальное окно для выбора базовой даты перед скачиванием шаблона
 *
 * @param {Object} props
 * @param {boolean} props.visible - Видимость модального окна
 * @param {Function} props.onClose - Callback для закрытия
 * @param {Function} props.onDownload - Callback для скачивания с выбранной датой
 * @param {boolean} props.loading - Индикатор загрузки
 */
const DownloadTemplateModal = ({ visible, onClose, onDownload, loading = false }) => {
    // Дефолтная дата - сегодня
    const [baseDate, setBaseDate] = useState(dayjs());

    const handleDownload = () => {
        if (!baseDate) {
            message.warning('Выберите базовую дату');
            return;
        }

        // Передаем дату в формате YYYY-MM-DD
        onDownload(baseDate.format('YYYY-MM-DD'));
    };

    const handleClose = () => {
        // Сбросить дату при закрытии
        setBaseDate(dayjs());
        onClose();
    };

    return (
        <Modal
            title={
                <span>
                    <DownloadOutlined style={{ marginRight: 8 }} />
                    Скачать шаблон
                </span>
            }
            open={visible}
            onCancel={handleClose}
            width={500}
            footer={[
                <Button key="cancel" onClick={handleClose} disabled={loading}>
                    Отмена
                </Button>,
                <Button
                    key="download"
                    type="primary"
                    icon={<DownloadOutlined />}
                    onClick={handleDownload}
                    loading={loading}
                >
                    Скачать шаблон
                </Button>
            ]}
        >
            <div style={{ marginBottom: 16 }}>
                <Text type="secondary">
                    Выберите базовую дату для выгрузки наработок в шаблон
                </Text>
            </div>

            <div>
                <Text strong>Базовая дата:</Text>
                <DatePicker
                    value={baseDate}
                    onChange={setBaseDate}
                    format="YYYY-MM-DD"
                    style={{ width: '100%', marginTop: 8 }}
                    placeholder="Выберите дату"
                    suffixIcon={<CalendarOutlined />}
                    allowClear={false}
                />
            </div>

            <div style={{ marginTop: 16, padding: 12, backgroundColor: '#f0f5ff', borderRadius: 4 }}>
                <Text type="secondary" style={{ fontSize: 12 }}>
                    <strong>Примечание:</strong> Базовая дата используется для расчета наработок оборудования в шаблоне.
                </Text>
            </div>
        </Modal>
    );
};

export default DownloadTemplateModal;