/**
 * This chap handles the positioning of the results table, which is always set to fill avialable space
 */

import React, { useEffect } from 'react';
import { get } from 'react-intl-universal';
import { useDispatch, useSelector } from 'react-redux';
import { selectPointsCount } from './redux/mapSlice';
import { setPanel } from './redux/guiSlice';
import FeatureTable from './FeaturesTable';

import './ResultsPanel.css';

const Panel: React.FC = () => {
    const pointsCount = useSelector(selectPointsCount);
    const dispatch = useDispatch();

    const onEscCloseFullReport = (e: KeyboardEvent) => { if (e.key === 'Escape') { dispatch(setPanel('hidden')) } };

    useEffect(() => {
        document.addEventListener('keyup', onEscCloseFullReport);
        return () => document.removeEventListener('keyup', onEscCloseFullReport)
    }, [])

    return (
        <section className='panel'>
            {pointsCount ?
                <FeatureTable />
                : <p className='only_clusters_not_points'>
                    {get('panel.only_clusters_not_points')}
                </p>
            }
        </section>
    );
};

export default Panel;
