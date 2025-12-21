/**
 * Патч для русификации react-timelines
 */

const MONTHS_SHORT_RU = {
    'Jan': 'янв', 'Feb': 'фев', 'Mar': 'мар', 'Apr': 'апр',
    'May': 'май', 'Jun': 'июн', 'Jul': 'июл', 'Aug': 'авг',
    'Sep': 'сен', 'Oct': 'окт', 'Nov': 'ноя', 'Dec': 'дек'
};

/**
 * Заменяет английские месяцы на русские в тексте
 */
const replaceMonthsInText = (text) => {
    if (!text) return text;
    let result = text;
    Object.entries(MONTHS_SHORT_RU).forEach(([en, ru]) => {
        result = result.replace(new RegExp(en, 'g'), ru);
    });
    return result;
};

/**
 * Применить локализацию через MutationObserver
 */
export const applyDOMLocalization = () => {
    const localizeElement = (el) => {
        if (!el || !el.textContent) return;

        const text = el.textContent;
        if (text === 'Today') {
            el.textContent = 'Сегодня';
            return;
        }

        const newText = replaceMonthsInText(text);
        if (text !== newText) {
            el.textContent = newText;
        }
    };

    const localizeAll = () => {
        document.querySelectorAll('.rt-marker__content div, .rt-marker__label').forEach(localizeElement);
        document.querySelectorAll('.rt-timebar__cell, .rt-timebar-cell').forEach(localizeElement);
    };

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                if (node.nodeType === Node.ELEMENT_NODE) {
                    localizeElement(node);

                    if (node.querySelectorAll) {
                        node.querySelectorAll('.rt-marker__content div, .rt-marker__label, .rt-timebar__cell, .rt-timebar-cell').forEach(localizeElement);
                    }
                }
            });
        });
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true
    });

    localizeAll();
    setTimeout(localizeAll, 100);
    setTimeout(localizeAll, 300);
    setTimeout(localizeAll, 500);
    setTimeout(localizeAll, 1000);

    return observer;
};