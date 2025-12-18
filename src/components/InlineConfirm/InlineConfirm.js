import React, { useState } from 'react';
import { Button, Tooltip } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import './InlineConfirm.css';

/**
 * Компонент для inline подтверждения действий
 * Заменяет кнопку на две кнопки: подтвердить (✓) и отменить (✗)
 */
const InlineConfirm = ({
                           children,
                           onConfirm,
                           confirmText = 'Подтвердить',
                           cancelText = 'Отменить',
                           danger = false,
                       }) => {
    const [confirming, setConfirming] = useState(false);

    const handleTrigger = (e) => {
        e.stopPropagation();
        setConfirming(true);
    };

    const handleConfirm = (e) => {
        e.stopPropagation();
        setConfirming(false);
        onConfirm();
    };

    const handleCancel = (e) => {
        e.stopPropagation();
        setConfirming(false);
    };

    if (confirming) {
        return (
            <div className="inline-confirm-buttons" onClick={(e) => e.stopPropagation()}>
                <Tooltip title={confirmText}>
                    <Button
                        type="text"
                        size="small"
                        danger={danger}
                        icon={<CheckOutlined />}
                        onClick={handleConfirm}
                        className="inline-confirm-yes"
                    />
                </Tooltip>
                <Tooltip title={cancelText}>
                    <Button
                        type="text"
                        size="small"
                        icon={<CloseOutlined />}
                        onClick={handleCancel}
                        className="inline-confirm-no"
                    />
                </Tooltip>
            </div>
        );
    }

    return React.cloneElement(children, {
        onClick: (e) => {
            handleTrigger(e);
            children.props.onClick?.(e);
        }
    });
};

export default InlineConfirm;