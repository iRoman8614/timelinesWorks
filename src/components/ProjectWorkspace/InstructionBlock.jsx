import React from 'react';
import { Collapse, Typography, Space } from 'antd';
import { InfoCircleOutlined } from '@ant-design/icons';

const { Panel } = Collapse;
const { Paragraph, Text } = Typography;

const InstructionBlock = () => {
    return (
        <Collapse
            ghost
            style={{
                background: '#fff',
                border: '1px solid #d9d9d9',
                borderRadius: '8px',
                marginBottom: '24px'
            }}
        >
            <Panel
                header={
                    <Space>
                        <InfoCircleOutlined style={{ fontSize: '18px' }} />
                        <Text strong style={{ fontSize: '16px' }}>
                            Инструкция по заполнению проекта
                        </Text>
                    </Space>
                }
                key="1"
            >
                <div style={{ display: 'grid', gap: '16px' }}>
                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                        <Space style={{ marginBottom: 8 }}>
                            <Text strong style={{ fontSize: '16px' }}>1. Типы компонентов</Text>
                        </Space>
                        <Paragraph style={{ marginBottom: 8, marginTop: 8 }}>
                            Создайте базовый справочник типов компонентов.
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 0 }}>
                            <Text>Примеры:</Text> Двигатель, Компрессор, Фильтр
                        </Paragraph>
                    </div>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                        <Space style={{ marginBottom: 8 }}>
                            <Text strong style={{ fontSize: '16px' }}>2. Агрегаты</Text>
                        </Space>
                        <Paragraph style={{ marginBottom: 8, marginTop: 8 }}>
                            1. Создайте тип агрегата (например, "ГПА-Тип-1")
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 0 }}>
                            2. Нажмите кнопку <Text strong>"Компоненты"</Text> и добавьте нужные компоненты к типу агрегата, выбирая их типы из списка
                        </Paragraph>
                    </div>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                        <Space style={{ marginBottom: 8 }}>
                            <Text strong style={{ fontSize: '16px' }}>3. Модели деталей</Text>
                        </Space>
                        <Paragraph style={{ marginBottom: 8, marginTop: 8 }}>
                            1. Создайте модель детали с UID и спецификацией
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 8 }}>
                            2. Нажмите <Text strong>"Работы"</Text> и добавьте типы технического обслуживания (продолжительность, приоритет, интервал)
                        </Paragraph>
                    </div>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                        <Space style={{ marginBottom: 8 }}>
                            <Text strong style={{ fontSize: '16px' }}>4. Структура узлов</Text>
                        </Space>
                        <Paragraph style={{ marginBottom: 8, marginTop: 8 }}>
                            1. Создайте корневой узел (например, "Цех №1")
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 8 }}>
                            2. Нажмите <Text strong>"Добавить"</Text> у узла для добавления дочерних узлов или агрегатов
                        </Paragraph>
                        <Paragraph style={{ marginBottom: 0 }}>
                            3. Нажмите <Text strong>"Условия"</Text> и задайте ограничения (макс. на ТО, мин. работающих)
                        </Paragraph>
                    </div>

                    <div style={{ background: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #d9d9d9' }}>
                        <Space style={{ marginBottom: 8 }}>
                            <Text strong style={{ fontSize: '16px' }}>5. Сохранение и отправка</Text>
                        </Space>
                        <Paragraph style={{ marginBottom: 0, marginTop: 8 }}>
                            После заполнения всех данных нажмите <Text strong>"Сохранить"</Text>, затем <Text strong>"Отправить на сервер"</Text> для получения оптимизированных таймлайнов ТО.
                        </Paragraph>
                    </div>
                </div>
            </Panel>
        </Collapse>
    );
};

export default InstructionBlock;