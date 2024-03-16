// FeatureTable.tsx
import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';
import { RootState } from './redux/types';

import './FeatureTable.css';

import { EVENT_FULL_WIDTH } from './ResultsPanel';

export const EVENT_SHOW_ROW = 'ufo-show-row';
export interface ShowReportRowEventType extends CustomEvent {
    detail: {
        id: string;
    };
}

function getRowId(id: number | string) {
    return 'fid_' + id;
}

const FeatureTable: React.FC = () => {
    const featureCollection = useSelector((state: any) => state.map.featureCollection);
    const [features, setFeatures] = useState<any[]>([]);
    const { q } = useSelector((state: RootState) => state.map);

    useEffect(() => {
        if (featureCollection) {
            setFeatures(featureCollection.features);
        }
    }, [featureCollection]);

    useEffect(() => {
        window.document.addEventListener(
            EVENT_SHOW_ROW,
            ((e: ShowReportRowEventType) => {
                const element = document.getElementById(getRowId(e.detail.id));
                if (element) {
                    window.document.dispatchEvent(new CustomEvent(EVENT_FULL_WIDTH));
                    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
                    setTimeout(() => {
                        element.classList.add('flash');
                        element.addEventListener('animationend', () => element.classList.remove('flash'));
                    }, 500);
                }
            }) as EventListener
        );
    }, []);

    if (!features || !features.length) {
        return (<p className='no_data'>{get('report.no_data')}</p>);
    }

    const highlightText = (text: string) => {
        if (!text) return;
        if (typeof q === 'undefined' || q.trim() === '') {
            return text;
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

    return (
        <table className='feature-table'>
            <thead>
                <tr>
                    <th className='datetime'>{get('report.date')}</th>
                    <th className='location_text'>{get('report.location')}</th>
                    <th className='report_text'>{get('report.report')}</th>
                </tr>
            </thead>
            <tbody>
                {features.map((feature: any) => (
                    <tr key={feature.properties.id} id={getRowId(feature.properties.id)}>
                        <td className='datetime'>{feature.properties.datetime_original}</td>
                        <td className='location_text'>{highlightText(feature.properties.location_text)}</td>
                        <td className='report_text'>{highlightText(feature.properties.report_text)}</td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default FeatureTable;
