/* cell-renderers.ts */
import React from 'react';
import { get } from 'react-intl-universal';

import config from '@ufo-monorepo-test/config';

export const highlightRenderer = ({ q, text }: { q: string, text: string }) => {
    if (!text || !q || q.trim() === '') {
        return <>{text}</>;
    }
    const parts = text.split(new RegExp(`(${q})`, 'gi'));
    return parts.map((part, index) =>
        part.toLowerCase() === q.toLowerCase() ? (
            <mark key={index}>{part}</mark>
        ) : (
            <React.Fragment key={index}>{part}</React.Fragment>
        )
    );
};

export const secondsRenderer = ({ seconds }: { seconds: number | null }) => {
    if (seconds === null) {
        return '';
    }
    const hours = Math.floor(Number(seconds) / 3600);
    const minutes = Math.floor((Number(seconds) % 3600) / 60);
    const remainingSeconds = Number(seconds) % 60;

    const formattedHours = hours ? new Intl.NumberFormat(config.locale,).format(hours) + get('hours') + ' ' : '';
    const formattedMinutes = minutes ? new Intl.NumberFormat(config.locale, { minimumIntegerDigits: 1 }).format(minutes) + get('minutes') + ' ' : '';
    const formattedSeconds = remainingSeconds ? new Intl.NumberFormat(config.locale, { minimumIntegerDigits: 2 }).format(remainingSeconds) + get('seconds') : '';

    return `${formattedHours}${formattedMinutes}${formattedSeconds}`;
}

