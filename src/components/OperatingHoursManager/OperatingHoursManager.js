import React, { useState } from 'react';
import { Button, DatePicker, Checkbox, Upload, message } from 'antd';
import { DownloadOutlined, UploadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import historyApi from '../../services/api/historyApi';
import './OperatingHoursManager.css';

const OperatingHoursManager = ({ projectId }) => {
    const [baseDate, setBaseDate] = useState(dayjs());
    const [calculateOperatingHours, setCalculateOperatingHours] = useState(true);
    const [downloading, setDownloading] = useState(false);
    const [uploading, setUploading] = useState(false);

    const handleDownloadTemplate = async () => {
        if (!projectId) {
            message.error('Проект не выбран');
            return;
        }

        setDownloading(true);
        try {
            const filename = `template_${projectId}_${baseDate.format('YYYY-MM-DD')}.xlsx`;

            await historyApi.downloadTemplateFile(
                projectId,
                baseDate.format('YYYY-MM-DD'),
                calculateOperatingHours,
                filename
            );

            message.success('Шаблон успешно скачан');
        } catch (error) {
            console.error('Download error:', error);
            message.error('Ошибка при скачивании шаблона');
        } finally {
            setDownloading(false);
        }
    };

    const handleUpload = async (file) => {
        if (!projectId) {
            message.error('Проект не выбран');
            return false;
        }

        setUploading(true);
        try {
            await historyApi.uploadHistory(projectId, file);
            message.success('Наработки успешно импортированы');
        } catch (error) {
            console.error('Upload error:', error);
            message.error('Ошибка при импорте наработок');
        } finally {
            setUploading(false);
        }

        return false;
    };

    return (
        <div className="operating-hours-manager">
            <h3>Управление наработками</h3>

            <div className="oh-controls">
                <div className="oh-control-group">
                    <label>Базовая дата:</label>
                    <DatePicker
                        value={baseDate}
                        onChange={(date) => setBaseDate(date || dayjs())}
                        format="DD.MM.YYYY"
                        style={{ width: '100%' }}
                    />
                </div>

                <div className="oh-control-group">
                    <Checkbox
                        checked={calculateOperatingHours}
                        onChange={(e) => setCalculateOperatingHours(e.target.checked)}
                    >
                        Рассчитать наработки
                    </Checkbox>
                </div>

                <div className="oh-actions">
                    <Button
                        type="primary"
                        icon={<DownloadOutlined />}
                        onClick={handleDownloadTemplate}
                        loading={downloading}
                        block
                    >
                        Скачать шаблон Excel
                    </Button>

                    <Upload
                        accept=".xlsx,.xls"
                        beforeUpload={handleUpload}
                        showUploadList={false}
                        disabled={uploading}
                    >
                        <Button
                            icon={<UploadOutlined />}
                            loading={uploading}
                            block
                        >
                            Импортировать наработки
                        </Button>
                    </Upload>
                </div>
            </div>

            <div className="oh-info">
                <p className="oh-info-text">
                    <strong>Инструкция:</strong>
                </p>
                <ol className="oh-info-list">
                    <li>Выберите базовую дату для расчета наработок</li>
                    <li>Скачайте шаблон Excel с текущей структурой агрегатов</li>
                    <li>Заполните наработки в скачанном файле</li>
                    <li>Импортируйте заполненный файл обратно</li>
                </ol>
            </div>
        </div>
    );
};

export default OperatingHoursManager;