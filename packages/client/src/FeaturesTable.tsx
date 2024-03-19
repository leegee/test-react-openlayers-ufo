// FeatureTable.tsx
import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import { RootState } from './redux/store';
import { EVENT_SHOW_POINT, ShowPointEventType, showPointByCoords } from './custom-events/point-show';
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
    const [localFeatures, setLocalFeatures] = useState<any[]>([]);
    const { q } = useSelector((state: RootState) => state.map);

    useEffect(() => {
        if (featureCollection) {
            setLocalFeatures(featureCollection.features);
        }
    }, [featureCollection]);

    useEffect(() => {
        document.addEventListener(EVENT_SHOW_POINT, ((e: ShowPointEventType) => {
            if (!e.detail.id) {
                console.log("Heard EVENT_SHOW_POINT but got no e.detail.id")
                return;
            }
            const element = document.getElementById(getRowId(e.detail.id));
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'start', inline: 'start' });
                setTimeout(() => {
                    element.classList.add('flash', 'selected');
                    element.addEventListener('animationend', () => element.classList.remove('flash'));
                }, 500);
            }
        }) as EventListener);
    }, []);

    function showPointOnMap(feature: any /* GeoJSON Feature */) {
        setReportWidth('narrow');
        showPointByCoords(feature.geometry.coordinates);
    }

    function gotoFulLReport(_id: string) {
        setReportWidth('full-width');
        // todo highlgiht row with EVENT_SHOW_POINT or directly
    }

    return (
        <table className='feature-table'>
            <thead>
                <tr>
                    <th className='datetime'>{get('report.date')}</th>
                    <th className='location_text'>{get('report.location')}</th>
                    <th className='report_text'>{get('report.report')}</th>
                    <th className='ctrls'>
                        <span className='close-full-width' onClick={() => setReportWidth('narrow')} />
                        <span className='open-full-width' onClick={() => setReportWidth('full-width')} />
                    </th>
                </tr>
            </thead>
            <tbody>
                {localFeatures
                    .slice() // Create a copy of the array to avoid mutating the original array
                    .sort((a, b) => {
                        if (a.search_score) {
                            if (a.search_score < b.search_score) return -1; // Sort a before b
                            if (a.search_score > b.search_score) return 1;
                        }
                        if (a.datetime < b.datetime) return -1;
                        if (a.datetime > b.datetime) return 1;
                        return 0; // Leave them unchanged in order
                    })
                    .map((feature: any, index: number) => (
                        <tr key={index} id={getRowId(feature.properties.id)} title={feature.properties.search_score ? feature.properties.search_score : 'unscored'}>
                            <td className='datetime'>{feature.properties.datetime_original}</td>
                            <td className='location_text'>{highlightText(q, feature.properties.location_text)}</td>
                            <td className='report_text'>{highlightText(q, feature.properties.report_text)}</td>
                            <td className='ctrls'>
                                <span className='ctrl row-goto-full-report' onClick={() => gotoFulLReport(feature.properties.id)} />
                                <span className='ctrl row-goto-map' onClick={() => showPointOnMap(feature)} />
                            </td>
                        </tr>
                    ))}
            </tbody>
        </table>
    );
};

export default FeatureTable;
