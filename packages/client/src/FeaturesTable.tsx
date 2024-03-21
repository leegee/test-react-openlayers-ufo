// FeatureTable.tsx
/**
 * Some place names are very long on smaller screns, forcing controls out of the table
 * Could float the controls over and on the right of the locatino_text.
 */
import React, { useEffect, useState } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import config from '@ufo-monorepo-test/config/src';
import { RootState } from './redux/store';
import { EVENT_SHOW_POINT, ShowPointEventType, showPointByCoords } from './custom-events/point-show';
import { setPanel } from './redux/guiSlice';

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
    const dispatch = useDispatch();
    const featureCollection = useSelector((state: any) => state.map.featureCollection);
    const [localFeatures, setLocalFeatures] = useState<any[]>([]);
    const { q } = useSelector((state: RootState) => state.map);
    const { panel } = useSelector((state: RootState) => state.gui);

    const addEscListener = () => document.addEventListener('keyup', onEscCloseFullReport);
    const removeEscListener = () => document.removeEventListener('keyup', onEscCloseFullReport);

    function onEscCloseFullReport(e: KeyboardEvent) {
        if (e.key === 'Escape') {
            dispatch(setPanel(''));
        }
    }

    // Might be easier or better to re-render reactively
    function handleShowPoint(e: ShowPointEventType) {
        if (!e.detail.id) {
            console.log("Heard EVENT_SHOW_POINT but got no e.detail.id", e.detail);
            console.trace();
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
    };

    useEffect(() => {
        if (featureCollection) {
            setLocalFeatures(featureCollection.features);
        }
    }, [featureCollection]);

    useEffect(() => {
        document.addEventListener(EVENT_SHOW_POINT, handleShowPoint as EventListener);

        return () => {
            document.removeEventListener(EVENT_SHOW_POINT, handleShowPoint as EventListener);
        }
    }, []);

    function showPointOnMap(feature: any /* GeoJSON Feature */) {
        dispatch(setPanel('narrow'));
        showPointByCoords(feature.geometry.coordinates);
    }

    function gotoFulLReport(_id: string) {
        dispatch(setPanel('full'));
        // todo highlgiht row with EVENT_SHOW_POINT or directly
    }

    return (
        <table className='feature-table'>
            <thead>
                <tr>
                    <th className='datetime'>{get('feature_table.date')}</th>
                    <th className='location_text'>{get('feature_table.location')}</th>
                    <th className='report_text'>{get('feature_table.report')}</th>
                    <th className='ctrls'>
                        <span className='close-full-width' onClick={() => dispatch(setPanel('narrow'))} title={get('feature_table.close')} aria-label={get('feature_table.close')} />
                        <span className='open-full-width' onClick={() => dispatch(setPanel('full'))} title={get('feature_table.open')} aria-label={get('feature_table.open')} />
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
                        <tr key={index} id={getRowId(feature.properties.id)} title={
                            (feature.properties.search_score ? feature.properties.search_score : 'unscored')
                            + ' ' + feature.properties.datetime
                        }>
                            <td className='datetime'>
                                {feature.properties.datetime_original}
                                <span className='our-datetime'>{
                                    new Intl.DateTimeFormat(config.locale).format(new Date(feature.properties.datetime))
                                }</span>
                            </td>
                            <td className='location_text'>{highlightText(q, feature.properties.location_text)}</td>
                            <td className='report_text'>{highlightText(q, feature.properties.report_text)}</td>
                            <td className='ctrls'>
                                <span className='ctrl row-goto-full-report' onClick={() => gotoFulLReport(feature.properties.id)} />
                                <Link className='ctrl row-goto-details' to={'/sighting/' + feature.properties.id} />
                                <span className='ctrl row-goto-map' onClick={() => showPointOnMap(feature)} />
                            </td>
                        </tr>
                    ))}
            </tbody>
        </table>
    );
};

export default FeatureTable;

