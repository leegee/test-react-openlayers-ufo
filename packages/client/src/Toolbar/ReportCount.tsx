import React from 'react';
import { get } from 'react-intl-universal';
import { useSelector } from 'react-redux';

import config from '@ufo-monorepo-test/config/src';
import { type RootState } from '../redux/store';

import './ReportCount.css';

const Panel: React.FC = () => {
    const resultsCount = useSelector((state: RootState) => state.map.resultsCount);
    const clusterCount = useSelector((state: RootState) => state.map.featureCollection ? state.map.featureCollection.clusterCount : 0);

    return (
        <hgroup className='report-ctrl component'>
            {!clusterCount && resultsCount && resultsCount > 0 ? (
                <header>
                    <span>
                        {new Intl.NumberFormat(config.locale).format(resultsCount || 0)}
                        {' '}
                        {get('panel.results_count')}
                    </span>
                </header>
            ) : (
                <header>
                    {new Intl.NumberFormat(config.locale).format(clusterCount)}
                    {' '}
                    {get('panel.cluster_count')}
                </header>
            )}
        </hgroup>
    );
};

export default Panel;
