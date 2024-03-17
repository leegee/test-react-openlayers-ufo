// FeatureTable.tsx
import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import { RootState } from './redux/types';
import { EVENT_SHOW_POINT, ShowPointEventType } from './custom-events/point-show';
import { setReportWidth } from './custom-events/report-width';

import './FeatureTable.css';

function getRowId(id: number | string) {
    return 'fid_' + id;
}

const highlightText = (q: string | undefined, text: string) => {
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
        document.addEventListener(
            EVENT_SHOW_POINT,
            ((e: ShowPointEventType) => {
                const element = document.getElementById(getRowId(e.detail.id));
                if (element) {
                    element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
                    setTimeout(() => {
                        element.classList.add('flash');
                        element.addEventListener('animationend', () => element.classList.remove('flash'));
                    }, 500);
                }
            }) as EventListener
        );
    }, []);

    return (
        <table className='feature-table'>
            <thead>
                <tr>
                    <th className='datetime'>{get('report.date')}</th>
                    <th className='location_text'>{get('report.location')}</th>
                    <th className='report_text'>{get('report.report')}</th>
                    <th className='cmd'></th>
                </tr>
            </thead>
            <tbody>
                {features.map((feature: any, index: number) => (
                    <tr key={index} id={getRowId(feature.properties.id)}>
                        <td className='datetime'>{feature.properties.datetime_original}</td>
                        <td className='location_text'>{highlightText(q, feature.properties.location_text)}</td>
                        <td className='report_text'>{highlightText(q, feature.properties.report_text)}</td>
                        <td className='cmd'>
                            <span className='goto-full-report' onClick={() => setReportWidth('full-width')}>R</span>
                            <span className='goto-map'>M</span>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    );
};

export default FeatureTable;
