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
import { showPointByCoords } from './custom-events/point-show';
import { setPanel, setSelectionId } from './redux/guiSlice';

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
    const featureCollection = useSelector((state: RootState) => state.map.featureCollection);
    const { selectionId } = useSelector((state: RootState) => state.gui);
    const [localFeatures, setLocalFeatures] = useState<any[]>([]);
    const { q } = useSelector((state: RootState) => state.map);

    useEffect(() => {
        if (featureCollection) {
            setLocalFeatures(featureCollection.features);
        }
    }, [featureCollection]);

    function getRowClass(id: number | string) {
        return selectionId && selectionId === Number(id) ? 'tr selected' : 'tr';
    }

    function showPointOnMap(feature: any /* GeoJSON Feature */) {
        dispatch(setPanel('narrow'));
        showPointByCoords(feature.geometry.coordinates);
        dispatch(setSelectionId(feature.properties.id));
    }

    return (
        <div id='feature-table'>
            <div className='thead'>
                <div className='tr'>
                    <div className='th datetime'>{get('feature_table.date')}</div>
                    <div className='th location_text'>{get('feature_table.location')}</div>
                    <div className='th report_text'>{get('feature_table.report')}</div>
                    <div className='th ctrls'>
                        <span className='close-full-width' onClick={() => dispatch(setPanel('narrow'))} title={get('feature_table.close')} aria-label={get('feature_table.close')} />
                        <span className='open-full-width' onClick={() => dispatch(setPanel('full'))} title={get('feature_table.open')} aria-label={get('feature_table.open')} />
                    </div>
                </div>
            </div>

            <div className='tbody'>
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

                        <div className={getRowClass(feature.properties.id)}
                            key={index} id={getRowId(feature.properties.id)} title={
                                (feature.properties.search_score ? feature.properties.search_score : 'unscored')
                                + ' ' + feature.properties.datetime
                            }>
                            <div className='td datetime'>
                                {feature.properties.datetime_original}
                                <span className='our-datetime'>{
                                    new Intl.DateTimeFormat(config.locale).format(new Date(feature.properties.datetime))
                                }</span>
                            </div>
                            <div className='td location_text'>{highlightText(q, feature.properties.location_text)}</div>
                            <div className='td report_text'>{highlightText(q, feature.properties.report_text)}</div>
                            <div className='td ctrls'>
                                {/* <span className='ctrl row-goto-full-report' onClick={() => gotoFulLReport(feature.properties.id)} /> */}
                                <span className='ctrl row-goto-map' onClick={() => showPointOnMap(feature)} />
                                <Link className='ctrl row-goto-details' to={'/sighting/' + feature.properties.id} />
                            </div>
                        </div>
                    ))}
            </div>
        </div>
    );
};

export default FeatureTable;

