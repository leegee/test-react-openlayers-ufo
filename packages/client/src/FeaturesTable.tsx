import React, { useEffect, useRef, useState } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from 'react-router-dom';

import config from '@ufo-monorepo-test/config/src';
import { RootState } from './redux/store';
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
    const { q } = useSelector((state: RootState) => state.map);
    const [localFeatures, setLocalFeatures] = useState<any[]>([]);
    const selectedRowRef = useRef<HTMLDivElement>(null);

    // Scroll the selected row into view when user selectionchanges, if it is not already visible
    useEffect(() => {
        if (selectedRowRef.current) {
            const rect = selectedRowRef.current.getBoundingClientRect();
            if (rect.top < 0 || rect.bottom > window.innerHeight) {
                selectedRowRef.current.scrollIntoView({ behavior: 'smooth', block: 'center', inline: 'nearest' });
            }
        }
    }, [selectionId]);

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
        dispatch(setSelectionId(feature.properties.id));
    }

    return (
        <div id='feature-table'>
            <div className='thead'>
                <div className='tr'>
                    <div className='th datetime'>{get('feature_table.date')}</div>
                    <div className='th location_text'>{get('feature_table.location')}</div>
                    <div className='th hideable report_text'>{get('feature_table.report')}</div>
                    <div className='th hideable shape'>{get('feature_table.shape')}</div>
                    <div className='th hideable duration_seconds'>{get('feature_table.duration_seconds')}</div>
                    <div className='th ctrls'>
                        <span className='close-full-width' onClick={() => dispatch(setPanel('narrow'))} title={get('close')} aria-label={get('close')} />
                        <span className='open-full-width' onClick={() => dispatch(setPanel('full'))} title={get('open')} aria-label={get('open')} />
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
                            ref={feature.properties.id === selectionId ? selectedRowRef : null}
                            key={index} id={getRowId(feature.properties.id)}>
                            <div className='td datetime'>
                                {feature.properties.datetime_original}
                                <span className='our-datetime'>{
                                    new Intl.DateTimeFormat(config.locale).format(new Date(feature.properties.datetime))
                                }</span>
                            </div>
                            <div className='td location_text'>{highlightText(q, feature.properties.location_text)}</div>
                            <div className='td report_text hideable'>{highlightText(q, feature.properties.report_text)}</div>
                            <div className='td shape hideable'>{highlightText(q, feature.properties.shape)}</div>
                            <div className='td duration_seconds hideable'>{highlightText(q, feature.properties.duration_seconds)}</div>
                            <div className='td ctrls'>
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

