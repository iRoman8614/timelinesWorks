import React, { useMemo } from 'react';
import { Row, Col } from 'antd';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import './OptimizationInfoDisplay.css';

const OptimizationInfoDisplay = React.memo(({ optimizationInfo, optimizationHistory = [] }) => {
    const formatNumber = (num) => {
        if (num === undefined || num === null) return '0';
        if (num >= 1e9) return `${(num / 1e9).toFixed(2)}B`;
        if (num >= 1e6) return `${(num / 1e6).toFixed(2)}M`;
        if (num >= 1e3) return `${(num / 1e3).toFixed(2)}K`;
        if (num < 0.01 && num > 0) return num.toExponential(2);
        return num.toFixed(2);
    };

    const info = optimizationInfo || {
        best: { isValid: false, hardPenalty: 0, softPenalty: 0 },
        current: { isValid: false, hardPenalty: 0, softPenalty: 0 },
        currentTemperature: 0,
        currentIteration: 0
    };

    const { best, current, currentTemperature, currentIteration } = info;

    const { chartData, maxValues } = useMemo(() => {
        if (optimizationHistory.length <= 1) {
            return { chartData: [], maxValues: { temp: 1, soft: 1, hard: 1 } };
        }

        let data = optimizationHistory;
        if (data.length > 50) {
            const step = Math.ceil(data.length / 50);
            const result = [];
            for (let i = 0; i < data.length; i += step) {
                result.push(data[i]);
            }
            if (result[result.length - 1] !== data[data.length - 1]) {
                result.push(data[data.length - 1]);
            }
            data = result;
        }

        const maxTemp = Math.max(...data.map(d => d.temperature || 0), 1);
        const maxSoft = Math.max(...data.map(d => d.currentSoftPenalty || 0), 1);
        const maxHard = Math.max(...data.map(d => d.currentHardPenalty || 0), 1);

        const normalizedData = data.map(d => ({
            iteration: d.iteration,
            realTemp: d.temperature,
            realSoft: d.currentSoftPenalty,
            realHard: d.currentHardPenalty,
            temperature: (d.temperature / maxTemp) * 100,
            softPenalty: (d.currentSoftPenalty / maxSoft) * 100,
            hardPenalty: (d.currentHardPenalty / maxHard) * 100,
        }));

        return {
            chartData: normalizedData,
            maxValues: { temp: maxTemp, soft: maxSoft, hard: maxHard }
        };
    }, [optimizationHistory]);

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            const data = payload[0]?.payload;
            return (
                <div style={{
                    backgroundColor: 'white',
                    padding: '8px 12px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    fontSize: '12px'
                }}>
                    <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
                        Итерация: {Math.round(label)}
                    </div>
                    <div style={{ color: '#1890ff' }}>
                        Температура: {formatNumber(data?.realTemp)}
                    </div>
                    <div style={{ color: '#faad14' }}>
                        Soft Penalty: {formatNumber(data?.realSoft)}
                    </div>
                    <div style={{ color: '#ff4d4f' }}>
                        Hard Penalty: {formatNumber(data?.realHard)}
                    </div>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="optimization-display">
            <Row gutter={16}>
                <Col span={8}>
                    <div className="optimization-stats">
                        <div className="stat-item">
                            <span className="stat-label">Итерация:</span>
                            <span className="stat-value"># {formatNumber(currentIteration)}</span>
                        </div>

                        <div className="stat-item">
                            <span className="stat-label">Температура:</span>
                            <span className="stat-value">{formatNumber(currentTemperature)}°</span>
                        </div>

                        <div className="stat-divider" />

                        <div className="stat-section-title">Лучшее решение</div>
                        {/*<div className="stat-item">*/}
                        {/*    <span className="stat-label">Статус:</span>*/}
                        {/*    {best?.isValid ? (*/}
                        {/*        <Tag icon={<CheckCircleOutlined />} color="success" size="small">Валидно</Tag>*/}
                        {/*    ) : (*/}
                        {/*        <Tag icon={<CloseCircleOutlined />} color="error" size="small">Невалидно</Tag>*/}
                        {/*    )}*/}
                        {/*</div>*/}
                        <div className="stat-item">
                            <span className="stat-label">Hard Penalty:</span>
                            <span className="stat-value penalty-hard">{formatNumber(best?.hardPenalty)}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Soft Penalty:</span>
                            <span className="stat-value penalty-soft">{formatNumber(best?.softPenalty)}</span>
                        </div>

                        <div className="stat-divider" />

                        <div className="stat-section-title">Текущее решение</div>
                        {/*<div className="stat-item">*/}
                        {/*    <span className="stat-label">Статус:</span>*/}
                        {/*    {current?.isValid ? (*/}
                        {/*        <Tag icon={<CheckCircleOutlined />} color="success" size="small">Валидно</Tag>*/}
                        {/*    ) : (*/}
                        {/*        <Tag icon={<CloseCircleOutlined />} color="error" size="small">Невалидно</Tag>*/}
                        {/*    )}*/}
                        {/*</div>*/}
                        <div className="stat-item">
                            <span className="stat-label">Hard Penalty:</span>
                            <span className="stat-value penalty-hard">{formatNumber(current?.hardPenalty)}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Soft Penalty:</span>
                            <span className="stat-value penalty-soft">{formatNumber(current?.softPenalty)}</span>
                        </div>
                    </div>
                </Col>
                <Col span={16}>
                    <div className="optimization-chart">
                        {chartData.length > 1 ? (
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 10 }}>
                                    <XAxis
                                        dataKey="iteration"
                                        tick={{ fontSize: 10 }}
                                        tickFormatter={(val) => Math.round(val)}
                                        interval="preserveStartEnd"
                                    />
                                    <YAxis
                                        tick={{ fontSize: 10 }}
                                        tickFormatter={(val) => `${Math.round(val)}%`}
                                        domain={[0, 100]}
                                        width={40}
                                    />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Legend
                                        wrapperStyle={{ fontSize: '11px' }}
                                        formatter={(value) => {
                                            if (value === 'temperature') return 'Температура';
                                            if (value === 'softPenalty') return 'Soft Penalty';
                                            if (value === 'hardPenalty') return 'Hard Penalty';
                                            return value;
                                        }}
                                    />

                                    <Line
                                        type="monotone"
                                        dataKey="temperature"
                                        stroke="#1890ff"
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                        name="temperature"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="softPenalty"
                                        stroke="#faad14"
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                        name="softPenalty"
                                    />
                                    <Line
                                        type="monotone"
                                        dataKey="hardPenalty"
                                        stroke="#ff4d4f"
                                        strokeWidth={2}
                                        dot={false}
                                        isAnimationActive={false}
                                        name="hardPenalty"
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="chart-placeholder">
                                <span>График появится после начала оптимизации</span>
                            </div>
                        )}
                    </div>
                </Col>
            </Row>
        </div>
    );
});

OptimizationInfoDisplay.displayName = 'OptimizationInfoDisplay';

export default OptimizationInfoDisplay;